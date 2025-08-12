import { Actor } from 'apify';
import { PlaywrightCrawler, log, RequestQueue } from 'apify';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

type Input = {
  startUrl: string;
  crawlId: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  storageBucket?: string;
};

function isInternalLink(base: URL, href: string): string | null {
  try {
    const url = new URL(href, base);
    if (url.hostname !== base.hostname) return null;
    if (['mailto:', 'tel:'].includes(url.protocol)) return null as any;
    return url.toString();
  } catch {
    return null;
  }
}

function extractTextFromHtml(html: string): { title: string; text: string } {
  const $ = cheerio.load(html);
  const title = $('title').first().text().trim();
  $('script,style,noscript,nav,footer,header').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return { title, text };
}

function urlToStoragePath(crawlId: string, url: string, ext: string): string {
  const u = new URL(url);
  const safePath = (u.pathname === '/' ? 'index' : u.pathname.replace(/\/$/, ''))
    .replace(/[^a-zA-Z0-9/_-]/g, '_');
  const filename = safePath.endsWith(ext) ? safePath : `${safePath}${ext}`;
  return `ayuntamientos/${crawlId}${filename}`;
}

async function embed(genAI: GoogleGenerativeAI, text: string): Promise<number[] | null> {
  if (!text) return null;
  const content = text.slice(0, 100000);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const res = await model.embedContent(content);
  return (res?.embedding?.values as number[]) ?? null;
}

function getPdfJsAssetUrl(subdir: 'standard_fonts' | 'cmaps'): string {
  const require = createRequire(import.meta.url);
  const pkgPath = require.resolve('pdfjs-dist/package.json');
  const baseDir = path.dirname(pkgPath);
  const dirPath = path.join(baseDir, subdir);
  const url = pathToFileURL(dirPath).toString();
  return url.endsWith('/') ? url : `${url}/`;
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const loadingTask = getDocument({
    data: bytes,
    // Ensure PDF.js can load built-in fonts and CMaps in Node
    standardFontDataUrl: getPdfJsAssetUrl('standard_fonts'),
    cMapUrl: getPdfJsAssetUrl('cmaps'),
    cMapPacked: true,
    // Node-friendly flags
    isEvalSupported: false,
    useWorkerFetch: false,
    useSystemFonts: false,
    disableFontFace: true,
  } as any);
  const pdf = await (loadingTask as any).promise;
  let combined = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map((it: any) => (typeof it.str === 'string' ? it.str : '')).join(' ');
    combined += strings + '\n';
  }
  if (typeof pdf.cleanup === 'function') await pdf.cleanup();
  return combined.replace(/\s+/g, ' ').trim();
}

async function run() {
  await Actor.init();
  const input = (await Actor.getInput()) as Input;
  const { startUrl, crawlId, supabaseUrl, supabaseServiceRoleKey, storageBucket = 'ayuntamientos' } = input;

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const base = new URL(startUrl);
  const queue = await RequestQueue.open();
  await queue.addRequest({ url: startUrl });

  let pagesCrawled = 0;
  let pdfsDownloaded = 0;
  let docsIndexed = 0;
  let errorsCount = 0;

  await supabase.from('crawls').update({ status: 'processing', stats: { pagesCrawled, pdfsDownloaded, docsIndexed, errorsCount } }).eq('id', crawlId);

  const crawler = new PlaywrightCrawler({
    requestQueue: queue,
    maxConcurrency: 5,
    launchContext: { launchOptions: { headless: true } },
    navigationTimeoutSecs: 45,
    requestHandlerTimeoutSecs: 120,
    async requestHandler({ request, page, enqueueLinks, log: logger }) {
      try {
        logger.info(`Processing ${request.url}`);
        await page.goto(request.url, { waitUntil: 'networkidle' });

        // Attempt to surface dynamic content
        await page.mouse.wheel(0, 2000);
        await page.waitForTimeout(1000);

        const html = await page.content();
        const { title, text } = extractTextFromHtml(html);

        // Upload HTML
        const htmlPath = urlToStoragePath(crawlId, request.url, request.url.endsWith('.html') ? '' : '.html');
        const htmlBlob = new Blob([html], { type: 'text/html' });
        await supabase.storage.from(storageBucket).upload(htmlPath, htmlBlob, { upsert: true, contentType: 'text/html' });

        // Create doc row with embedding
        const embedding = await embed(genAI, text);
        await supabase.from('documents').insert({
          crawl_id: crawlId,
          url: request.url,
          title,
          doc_type: 'html',
          storage_path: htmlPath,
          content: text,
          embedding
        });
        pagesCrawled += 1;
        docsIndexed += 1;

        // Enqueue internal links; capture PDFs
        const anchors = await page.$$eval('a', (as) => as.map((a) => (a as HTMLAnchorElement).href || (a as HTMLAnchorElement).getAttribute('href') || ''));
        const toEnqueue: string[] = [];
        const pdfs: string[] = [];
        for (const href of anchors) {
          if (!href) continue;
          const absolute = isInternalLink(base, href);
          if (!absolute) continue;
          if (/\.pdf($|\?|#)/i.test(absolute)) pdfs.push(absolute);
          else toEnqueue.push(absolute);
        }
        await enqueueLinks({ urls: toEnqueue });

        // Download and index PDFs
        for (const pdfUrl of pdfs) {
          try {
            const res = await fetch(pdfUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const array = new Uint8Array(await res.arrayBuffer());
            const text = await extractPdfText(array);
            const path = urlToStoragePath(crawlId, pdfUrl, '');
            await supabase.storage.from(storageBucket).upload(path, array, { upsert: true, contentType: 'application/pdf' });
            const embedding = await embed(genAI, text);
            await supabase.from('documents').insert({
              crawl_id: crawlId,
              url: pdfUrl,
              title: pdfUrl.split('/').pop() || 'Documento PDF',
              doc_type: 'pdf',
              storage_path: path,
              content: text,
              embedding
            });
            pdfsDownloaded += 1;
            docsIndexed += 1;
          } catch (err) {
            errorsCount += 1;
            log.warning(`PDF error ${pdfUrl}: ${err}`);
          }
        }

        // Update stats periodically
        if ((pagesCrawled + pdfsDownloaded) % 5 === 0) {
          await supabase.from('crawls').update({ stats: { pagesCrawled, pdfsDownloaded, docsIndexed, errorsCount } }).eq('id', crawlId);
        }
      } catch (err) {
        errorsCount += 1;
        logger.exception(err as Error, 'Handler failed');
      }
    },
  });

  try {
    await crawler.run();
    await supabase.from('crawls').update({ status: 'completed', stats: { pagesCrawled, pdfsDownloaded, docsIndexed, errorsCount } }).eq('id', crawlId);
  } catch (err) {
    await supabase.from('crawls').update({ status: 'error', error_message: String(err), stats: { pagesCrawled, pdfsDownloaded, docsIndexed, errorsCount } }).eq('id', crawlId);
  } finally {
    await Actor.exit();
  }
}

run();



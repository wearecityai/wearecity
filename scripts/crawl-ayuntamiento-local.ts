/*
 Local dev crawler using Playwright. Usage:
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... OPENAI_API_KEY=... bun run crawl:local --start https://www.ayuntamiento.es --crawl-id <uuid>
*/
import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import pdf from 'pdf-parse';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

type Args = { start: string; crawlId: string };

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const startIdx = argv.indexOf('--start');
  const idIdx = argv.indexOf('--crawl-id');
  if (startIdx === -1 || idIdx === -1) throw new Error('Missing --start and --crawl-id');
  return { start: argv[startIdx + 1], crawlId: argv[idIdx + 1] };
}

function isInternal(base: URL, href: string): string | null {
  try {
    const u = new URL(href, base);
    if (u.hostname !== base.hostname) return null;
    return u.toString();
  } catch { return null; }
}

function extractText(html: string) {
  const $ = cheerio.load(html);
  const title = $('title').first().text().trim();
  $('script,style,noscript,nav,footer,header').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return { title, text };
}

function urlToPath(crawlId: string, url: string, ext: string): string {
  const u = new URL(url);
  const safe = (u.pathname === '/' ? 'index' : u.pathname.replace(/\/$/, '')).replace(/[^a-zA-Z0-9/_-]/g, '_');
  return `ayuntamientos/${crawlId}${safe}${ext}`;
}

async function embed(openai: OpenAI, text: string) {
  if (!text) return null;
  const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text.slice(0, 100000) });
  return res.data[0]?.embedding ?? null;
}

async function main() {
  const { start, crawlId } = parseArgs();
  const base = new URL(start);
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const queue = new Set<string>([start]);
  const visited = new Set<string>();
  let pagesCrawled = 0, pdfsDownloaded = 0, docsIndexed = 0, errorsCount = 0;
  await supabase.from('crawls').update({ status: 'processing', stats: { pagesCrawled, pdfsDownloaded, docsIndexed, errorsCount } }).eq('id', crawlId);

  while (queue.size) {
    const url = queue.values().next().value as string;
    queue.delete(url);
    if (visited.has(url)) continue;
    visited.add(url);
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.mouse.wheel(0, 2000);
      await page.waitForTimeout(800);
      const html = await page.content();
      const { title, text } = extractText(html);
      const htmlPath = urlToPath(crawlId, url, url.endsWith('.html') ? '' : '.html');
      await supabase.storage.from('ayuntamientos').upload(htmlPath, new Blob([html], { type: 'text/html' }), { upsert: true, contentType: 'text/html' });
      const embedding = await embed(openai, text);
      await supabase.from('documents').insert({ crawl_id: crawlId, url, title, doc_type: 'html', storage_path: htmlPath, content: text, embedding });
      pagesCrawled++; docsIndexed++;

      const anchors: string[] = await page.$$eval('a', (as) => as.map(a => (a as HTMLAnchorElement).href || (a as HTMLAnchorElement).getAttribute('href') || ''));
      for (const href of anchors) {
        if (!href) continue;
        const abs = isInternal(base, href);
        if (!abs) continue;
        if (/\.pdf($|\?|#)/i.test(abs)) {
          try {
            const res = await fetch(abs);
            if (!res.ok) throw new Error(String(res.status));
            const bytes = new Uint8Array(await res.arrayBuffer());
            const parsed = await pdf(bytes);
            const text = parsed.text?.replace(/\s+/g, ' ').trim() || '';
            const path = urlToPath(crawlId, abs, '');
            await supabase.storage.from('ayuntamientos').upload(path, bytes, { upsert: true, contentType: 'application/pdf' });
            const embedding = await embed(openai, text);
            await supabase.from('documents').insert({ crawl_id: crawlId, url: abs, title: abs.split('/').pop() || 'PDF', doc_type: 'pdf', storage_path: path, content: text, embedding });
            pdfsDownloaded++; docsIndexed++;
          } catch { errorsCount++; }
        } else {
          if (!visited.has(abs)) queue.add(abs);
        }
      }
      if ((pagesCrawled + pdfsDownloaded) % 5 === 0) {
        await supabase.from('crawls').update({ stats: { pagesCrawled, pdfsDownloaded, docsIndexed, errorsCount } }).eq('id', crawlId);
      }
    } catch {
      errorsCount++;
    }
  }

  await supabase.from('crawls').update({ status: 'completed', stats: { pagesCrawled, pdfsDownloaded, docsIndexed, errorsCount } }).eq('id', crawlId);
  await browser.close();
}

main().catch(async (e) => {
  console.error(e);
  process.exitCode = 1;
});



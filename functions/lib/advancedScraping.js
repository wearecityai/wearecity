"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedCrawling = exports.advancedScraping = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firecrawl_js_1 = require("@mendable/firecrawl-js");
// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Extraer enlaces a documentos de una lista de enlaces
 */
function extractDocumentLinks(links) {
    const documentExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    const documentLinks = [];
    links.forEach(link => {
        if (link.href) {
            const href = link.href.toLowerCase();
            if (documentExtensions.some(ext => href.includes(ext))) {
                documentLinks.push(link.href);
            }
        }
    });
    return [...new Set(documentLinks)]; // Eliminar duplicados
}
/**
 * Limpiar y procesar el contenido extraído
 */
function processContent(content, url) {
    // Extraer título del contenido o usar la URL
    const titleMatch = content.match(/^#\s*(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;
    // Limpiar contenido
    let cleanContent = content
        .replace(/^#.*$/gm, '') // Remover títulos markdown
        .replace(/!\[.*?\]\(.*?\)/g, '') // Remover imágenes
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convertir enlaces a texto
        .replace(/\n{3,}/g, '\n\n') // Limitar saltos de línea
        .trim();
    return { title, cleanContent };
}
/**
 * Firebase Function para scraping avanzado con Firecrawl
 */
exports.advancedScraping = functions.https.onCall(async (data, context) => {
    // Verificar autenticación
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { url, mode, options, userId, citySlug } = data;
    console.log('🕷️ Starting advanced scraping for:', { url, userId, citySlug });
    try {
        // Inicializar Firecrawl
        const firecrawl = new firecrawl_js_1.FirecrawlApp({
            apiKey: process.env.FIRECRAWL_API_KEY || 'fc-your-api-key-here'
        });
        // Configurar opciones de scraping
        const scrapeOptions = {
            formats: ['markdown', 'html'],
            onlyMainContent: true,
            includeTags: ['a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span'],
            excludeTags: ['script', 'style', 'nav', 'footer', 'header', 'aside'],
            waitFor: 2000, // Esperar 2 segundos para contenido dinámico
        };
        // Realizar scraping
        console.log('🌐 Scraping URL with Firecrawl...');
        const scrapeResult = await firecrawl.scrapeUrl(url, scrapeOptions);
        if (!scrapeResult.success) {
            throw new Error(`Scraping failed: ${scrapeResult.error}`);
        }
        const scrapedData = scrapeResult.data;
        console.log('✅ Scraping completed, content length:', scrapedData.markdown?.length || 0);
        // Procesar contenido
        const { title, cleanContent } = processContent(scrapedData.markdown || '', url);
        // Extraer enlaces a documentos si está habilitado
        const documentLinks = options.extractDocumentLinks
            ? extractDocumentLinks(scrapedData.links || [])
            : [];
        console.log('📄 Document links found:', documentLinks.length);
        // Guardar en Firestore
        const docRef = await db.collection('library_sources_enhanced').add({
            userId,
            citySlug,
            type: 'url',
            title,
            originalUrl: url,
            content: cleanContent,
            documentLinks,
            processingStatus: 'scraped',
            embedding: null,
            metadata: {
                wordCount: cleanContent.split(/\s+/).length,
                language: 'es',
                tags: [],
                extractedText: cleanContent,
                scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
                originalMetadata: {
                    title: scrapedData.metadata?.title,
                    description: scrapedData.metadata?.description,
                    image: scrapedData.metadata?.image,
                    author: scrapedData.metadata?.author
                }
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log('💾 Source saved with ID:', docRef.id);
        return {
            success: true,
            sourceId: docRef.id,
            documentLinks,
            contentLength: cleanContent.length
        };
    }
    catch (error) {
        console.error('❌ Scraping error:', error);
        // Guardar error en Firestore para debugging
        await db.collection('library_sources_enhanced').add({
            userId,
            citySlug,
            type: 'url',
            title: `Error scraping: ${url}`,
            originalUrl: url,
            content: `Error al procesar la URL: ${error.message}`,
            documentLinks: [],
            processingStatus: 'error',
            embedding: null,
            metadata: {
                wordCount: 0,
                language: 'es',
                tags: ['error'],
                extractedText: '',
                error: error.message,
                errorTimestamp: admin.firestore.FieldValue.serverTimestamp()
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            success: false,
            error: error.message
        };
    }
});
/**
 * Firebase Function para procesar múltiples URLs (crawling)
 */
exports.advancedCrawling = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { startUrl, maxPages = 10, userId, citySlug } = data;
    try {
        const firecrawl = new firecrawl_js_1.FirecrawlApp({
            apiKey: process.env.FIRECRAWL_API_KEY || 'fc-your-api-key-here'
        });
        console.log('🕷️ Starting crawling from:', startUrl);
        const crawlResult = await firecrawl.crawlUrl(startUrl, {
            crawlerOptions: {
                includes: ['**'],
                excludes: ['**/admin/**', '**/login/**', '**/private/**'],
                maxCrawledLinks: maxPages,
                limit: maxPages
            },
            pageOptions: {
                onlyMainContent: true,
                formats: ['markdown']
            }
        });
        if (!crawlResult.success) {
            throw new Error(`Crawling failed: ${crawlResult.error}`);
        }
        const results = [];
        // Procesar cada página encontrada
        for (const page of crawlResult.data || []) {
            const { title, cleanContent } = processContent(page.markdown || '', page.metadata?.sourceURL || '');
            const documentLinks = extractDocumentLinks(page.links || []);
            const docRef = await db.collection('library_sources_enhanced').add({
                userId,
                citySlug,
                type: 'url',
                title,
                originalUrl: page.metadata?.sourceURL || '',
                content: cleanContent,
                documentLinks,
                processingStatus: 'scraped',
                embedding: null,
                metadata: {
                    wordCount: cleanContent.split(/\s+/).length,
                    language: 'es',
                    tags: [],
                    extractedText: cleanContent,
                    crawledFrom: startUrl,
                    scrapedAt: admin.firestore.FieldValue.serverTimestamp()
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            results.push({
                sourceId: docRef.id,
                url: page.metadata?.sourceURL,
                title,
                contentLength: cleanContent.length,
                documentLinks: documentLinks.length
            });
        }
        return {
            success: true,
            pagesProcessed: results.length,
            results
        };
    }
    catch (error) {
        console.error('❌ Crawling error:', error);
        return {
            success: false,
            error: error.message
        };
    }
});
//# sourceMappingURL=advancedScraping.js.map
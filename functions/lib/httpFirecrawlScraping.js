"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpFirecrawlScraping = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
const { Firecrawl } = require("@mendable/firecrawl-js");

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const corsHandler = cors({ origin: true });

/**
 * Crear chunks de contenido para embeddings
 */
function createContentChunks(content, sourceId) {
    const chunks = [];
    const maxChunkSize = 1000; // 1KB por chunk
    
    if (!content || content.length === 0) {
        return chunks;
    }
    
    // Si el contenido es pequeño, crear un solo chunk
    if (content.length <= maxChunkSize) {
        chunks.push({
            content: content.trim(),
            chunkIndex: 0,
            sourceId
        });
        return chunks;
    }
    
    // Dividir en chunks más inteligentemente por párrafos
    const paragraphs = content.split(/\n\s*\n/);
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const paragraph of paragraphs) {
        const trimmedParagraph = paragraph.trim();
        if (!trimmedParagraph) continue;
        
        // Si añadir este párrafo excede el tamaño máximo, guardar el chunk actual
        if (currentChunk.length + trimmedParagraph.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.trim(),
                chunkIndex: chunkIndex++,
                sourceId
            });
            currentChunk = trimmedParagraph;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph;
        }
    }
    
    // Añadir el último chunk si no está vacío
    if (currentChunk.trim()) {
        chunks.push({
            content: currentChunk.trim(),
            chunkIndex: chunkIndex,
            sourceId
        });
    }
    
    return chunks;
}

/**
 * Procesar contenido extraído
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
 * Firebase HTTP Function para scraping con Firecrawl
 */
exports.httpFirecrawlScraping = functions.https.onRequest((req, res) => {
    return corsHandler(req, res, async () => {
        try {
            console.log('🕷️ HTTP Firecrawl scraping function called');
            
            if (req.method !== 'POST') {
                res.status(405).json({ error: 'Method not allowed' });
                return;
            }
            
            const { url, userId, citySlug, title: customTitle } = req.body;
            
            if (!url) {
                res.status(400).json({ error: 'URL is required' });
                return;
            }
            
            console.log('🌐 Starting Firecrawl scraping for:', url);
            
            // Inicializar Firecrawl
            const firecrawl = new Firecrawl({
                apiKey: process.env.FIRECRAWL_API_KEY || 'fc-c15523719ae0413ba544a44860415613'
            });
            
            // Configurar opciones de scraping
            const scrapeOptions = {
                formats: ['markdown', 'html'],
                onlyMainContent: true,
                includeTags: ['a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span'],
                excludeTags: ['script', 'style', 'nav', 'footer', 'header', 'aside'],
                waitFor: 2000,
            };
            
            // Realizar scraping con timeout
            let scrapeResult;
            try {
                scrapeResult = await Promise.race([
                    firecrawl.v1.scrapeUrl(url, scrapeOptions),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Scraping timeout after 30 seconds')), 30000)
                    )
                ]);
            } catch (firecrawlError) {
                console.error('🔥 Firecrawl error:', firecrawlError.message);
                res.status(500).json({
                    success: false,
                    error: `Firecrawl scraping failed: ${firecrawlError.message}`
                });
                return;
            }
            
            if (!scrapeResult || !scrapeResult.success) {
                console.error('❌ Scraping failed:', scrapeResult);
                res.status(500).json({
                    success: false,
                    error: `Scraping failed: ${scrapeResult?.error || 'Unknown error'}`
                });
                return;
            }
            
            console.log('🔍 Full scrape result:', JSON.stringify(scrapeResult, null, 2));
            
            // Firecrawl devuelve los datos directamente, no en .data
            const scrapedData = scrapeResult;
            if (!scrapedData || !scrapedData.markdown) {
                console.error('❌ No markdown content in scrape result');
                res.status(500).json({
                    success: false,
                    error: 'No markdown content returned from scraping'
                });
                return;
            }
            
            console.log('✅ Scraping completed, content length:', scrapedData.markdown?.length || 0);
            
            // Procesar contenido
            const { title, cleanContent } = processContent(scrapedData.markdown || '', url);
            const finalTitle = customTitle || title;
            
            // Guardar en Firestore
            const docRef = await db.collection('library_sources_enhanced').add({
                userId: userId || 'anonymous',
                citySlug: citySlug || 'default',
                type: 'url',
                title: finalTitle,
                originalUrl: url,
                content: cleanContent,
                documentLinks: [],
                processingStatus: 'scraped',
                embedding: null,
                metadata: {
                    wordCount: cleanContent.split(/\s+/).length,
                    language: 'es',
                    tags: [],
                    extractedText: cleanContent,
                    scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
                    originalMetadata: {
                        title: scrapedData.metadata?.title || null,
                        description: scrapedData.metadata?.description || null,
                        image: scrapedData.metadata?.image || null,
                        author: scrapedData.metadata?.author || null
                    }
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            
            console.log('💾 Source saved with ID:', docRef.id);
            
            // Generar chunks del contenido para embeddings
            const chunks = createContentChunks(cleanContent, docRef.id);
            console.log('📝 Created', chunks.length, 'content chunks');
            
            // Guardar chunks en Firestore
            const batch = db.batch();
            chunks.forEach((chunk, index) => {
                const chunkRef = db.collection('document_chunks').doc();
                batch.set(chunkRef, {
                    sourceId: docRef.id,
                    content: chunk.content,
                    chunkIndex: index,
                    chunkSize: chunk.content.length,
                    userId: userId || 'anonymous',
                    citySlug: citySlug || 'default',
                    embedding: null, // Se generará después
                    metadata: {
                        extractedAt: admin.firestore.FieldValue.serverTimestamp(),
                        chunkType: 'text',
                        wordCount: chunk.content.split(/\s+/).length
                    },
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            });
            
            await batch.commit();
            console.log('📄 Chunks saved to Firestore');
            
            res.status(200).json({
                success: true,
                sourceId: docRef.id,
                contentLength: cleanContent.length,
                chunksCreated: chunks.length,
                message: 'URL scraped successfully with Firecrawl',
                data: {
                    title: finalTitle,
                    url: url,
                    wordCount: cleanContent.split(/\s+/).length
                }
            });
            
        } catch (error) {
            console.error('❌ HTTP Firecrawl scraping error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
});

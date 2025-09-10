#!/usr/bin/env node

/**
 * Script de prueba para el sistema RAG completo
 * Prueba: Scraping -> Chunking -> Embeddings -> Vector Search
 */

// Usar fetch nativo de Node.js (disponible desde v18)

const BASE_URL = 'https://us-central1-wearecity-2ab89.cloudfunctions.net';
const TEST_URL = 'https://www.villajoyosa.com/evento/';
const USER_ID = 'test-user';
const CITY_SLUG = 'la-vila-joiosa';

async function testRAGSystem() {
    console.log('🧪 Iniciando prueba del sistema RAG completo...\n');
    
    try {
        // Paso 1: Scraping con Firecrawl
        console.log('📡 Paso 1: Scraping con Firecrawl...');
        const scrapingResponse = await fetch(`${BASE_URL}/httpFirecrawlScrapingFunction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: TEST_URL,
                userId: USER_ID,
                citySlug: CITY_SLUG,
                title: 'Eventos de La Vila Joiosa'
            })
        });
        
        if (!scrapingResponse.ok) {
            const errorText = await scrapingResponse.text();
            throw new Error(`Scraping failed: ${scrapingResponse.status} - ${errorText}`);
        }
        
        const scrapingResult = await scrapingResponse.json();
        console.log('✅ Scraping exitoso:', {
            success: scrapingResult.success,
            sourceId: scrapingResult.sourceId,
            contentLength: scrapingResult.contentLength,
            chunksCreated: scrapingResult.chunksCreated
        });
        
        if (!scrapingResult.success || !scrapingResult.sourceId) {
            throw new Error('Scraping no devolvió sourceId válido');
        }
        
        const sourceId = scrapingResult.sourceId;
        
        // Esperar un momento para que se procesen los chunks
        console.log('⏳ Esperando 3 segundos para procesamiento...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Paso 2: Generar embeddings
        console.log('\n🧠 Paso 2: Generando embeddings...');
        const embeddingsResponse = await fetch(`${BASE_URL}/httpGenerateEmbeddingsFunction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceId: sourceId,
                userId: USER_ID,
                citySlug: CITY_SLUG
            })
        });
        
        if (!embeddingsResponse.ok) {
            const errorText = await embeddingsResponse.text();
            throw new Error(`Embeddings failed: ${embeddingsResponse.status} - ${errorText}`);
        }
        
        const embeddingsResult = await embeddingsResponse.json();
        console.log('✅ Embeddings generados:', {
            success: embeddingsResult.success,
            chunksProcessed: embeddingsResult.chunksProcessed,
            mainContentEmbedded: embeddingsResult.mainContentEmbedded
        });
        
        if (!embeddingsResult.success) {
            throw new Error('Generación de embeddings falló');
        }
        
        // Paso 3: Probar búsqueda vectorial
        console.log('\n🔍 Paso 3: Probando búsqueda vectorial...');
        const searchResponse = await fetch(`${BASE_URL}/httpVectorSearchFunction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: 'eventos culturales',
                userId: USER_ID,
                citySlug: CITY_SLUG,
                limit: 5
            })
        });
        
        if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            throw new Error(`Vector search failed: ${searchResponse.status} - ${errorText}`);
        }
        
        const searchResult = await searchResponse.json();
        console.log('✅ Búsqueda vectorial exitosa:', {
            success: searchResult.success,
            resultsCount: searchResult.results?.length || 0,
            query: searchResult.query
        });
        
        if (searchResult.results && searchResult.results.length > 0) {
            console.log('📄 Primer resultado encontrado:');
            console.log('  - Título:', searchResult.results[0].title);
            console.log('  - Contenido:', searchResult.results[0].content?.substring(0, 100) + '...');
            console.log('  - Score:', searchResult.results[0].score);
        }
        
        console.log('\n🎉 ¡Sistema RAG funcionando correctamente!');
        console.log('📊 Resumen:');
        console.log(`  - URL scraped: ${TEST_URL}`);
        console.log(`  - Source ID: ${sourceId}`);
        console.log(`  - Chunks creados: ${scrapingResult.chunksCreated}`);
        console.log(`  - Chunks con embeddings: ${embeddingsResult.chunksProcessed}`);
        console.log(`  - Resultados de búsqueda: ${searchResult.results?.length || 0}`);
        
    } catch (error) {
        console.error('❌ Error en la prueba del sistema RAG:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Ejecutar la prueba
testRAGSystem();

#!/usr/bin/env node

/**
 * Script de prueba para el sistema híbrido RAG + Router original
 */

const BASE_URL = 'https://us-central1-wearecity-2ab89.cloudfunctions.net';
const USER_ID = 'test-user';
const CITY_SLUG = 'la-vila-joiosa';

async function testHybridSystem() {
    console.log('🧪 Iniciando prueba del sistema híbrido RAG + Router...\n');
    
    try {
        // Primero, asegurémonos de que tenemos contenido en el RAG
        console.log('📡 Paso 1: Verificando contenido RAG...');
        const scrapingResponse = await fetch(`${BASE_URL}/httpFirecrawlScrapingFunction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: 'https://www.villajoyosa.com/evento/',
                userId: USER_ID,
                citySlug: CITY_SLUG,
                title: 'Eventos de La Vila Joiosa'
            })
        });
        
        if (scrapingResponse.ok) {
            const scrapingResult = await scrapingResponse.json();
            console.log('✅ RAG content available:', {
                sourceId: scrapingResult.sourceId,
                chunksCreated: scrapingResult.chunksCreated
            });
            
            // Generar embeddings
            console.log('🧠 Generando embeddings...');
            const embeddingsResponse = await fetch(`${BASE_URL}/httpGenerateEmbeddingsFunction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceId: scrapingResult.sourceId,
                    userId: USER_ID,
                    citySlug: CITY_SLUG
                })
            });
            
            if (embeddingsResponse.ok) {
                console.log('✅ Embeddings generated');
            }
        }
        
        console.log('\n🔍 Paso 2: Probando consultas híbridas...\n');
        
        // Prueba 1: Consulta que debería encontrar en RAG
        console.log('--- Prueba 1: Consulta sobre eventos (debería usar RAG) ---');
        await testQuery('¿Qué eventos hay en La Vila Joiosa?', 'Debería encontrar información en RAG');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Prueba 2: Consulta que NO está en RAG (debería usar router original)
        console.log('\n--- Prueba 2: Consulta sobre trámites (debería usar router original) ---');
        await testQuery('¿Cómo puedo renovar mi DNI en La Vila Joiosa?', 'Debería usar 2.5 Pro + Google Search');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Prueba 3: Consulta general (debería usar router original)
        console.log('\n--- Prueba 3: Consulta general (debería usar router original) ---');
        await testQuery('¿Qué tiempo hace hoy?', 'Debería usar router original');
        
        console.log('\n🎉 ¡Pruebas completadas!');
        
    } catch (error) {
        console.error('❌ Error en la prueba del sistema híbrido:', error.message);
        process.exit(1);
    }
}

async function testQuery(query, expectedBehavior) {
    try {
        console.log(`📤 Enviando consulta: "${query}"`);
        console.log(`🎯 Comportamiento esperado: ${expectedBehavior}`);
        
        const response = await fetch(`${BASE_URL}/processAIChat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                citySlug: CITY_SLUG,
                cityContext: 'La Vila Joiosa',
                conversationHistory: []
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Chat failed: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            console.log('✅ Respuesta exitosa:');
            console.log(`   📊 Modelo usado: ${data.modelUsed}`);
            console.log(`   🎯 Complejidad: ${data.complexity}`);
            console.log(`   🔍 Búsqueda realizada: ${data.searchPerformed ? 'Sí' : 'No'}`);
            console.log(`   🧠 RAG usado: ${data.ragUsed ? 'Sí' : 'No'}`);
            
            if (data.ragUsed) {
                console.log(`   📄 Resultados RAG: ${data.ragResultsCount}`);
                console.log(`   🔎 Tipo búsqueda: ${data.ragSearchType}`);
            }
            
            console.log(`   💬 Respuesta: ${data.response.substring(0, 150)}...`);
        } else {
            console.log('❌ Error en la respuesta:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Error en la consulta:', error.message);
    }
}

// Ejecutar la prueba
testHybridSystem();

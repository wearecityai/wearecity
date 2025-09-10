#!/usr/bin/env node

/**
 * Prueba específica del RAG con consulta sobre eventos
 */

const BASE_URL = 'https://us-central1-wearecity-2ab89.cloudfunctions.net';
const USER_ID = 'test-user';
const CITY_SLUG = 'la-vila-joiosa';

async function testRAGSpecific() {
    console.log('🧪 Prueba específica del RAG sobre eventos...\n');
    
    try {
        // Prueba directa del RAG
        console.log('🔍 Probando búsqueda RAG directa...');
        const ragResponse = await fetch(`${BASE_URL}/httpVectorSearchFunction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: 'eventos culturales festivales',
                userId: USER_ID,
                citySlug: CITY_SLUG,
                limit: 5,
                threshold: 0.5 // Umbral más bajo
            })
        });
        
        if (ragResponse.ok) {
            const ragResult = await ragResponse.json();
            console.log('✅ RAG Response:', {
                success: ragResult.success,
                resultsCount: ragResult.results?.length || 0,
                totalChunks: ragResult.totalChunks
            });
            
            if (ragResult.results && ragResult.results.length > 0) {
                console.log('📄 Primer resultado:');
                console.log('   Contenido:', ragResult.results[0].content?.substring(0, 200) + '...');
                console.log('   Similitud:', ragResult.results[0].similarity);
            }
        } else {
            const errorText = await ragResponse.text();
            console.log('❌ RAG Error:', errorText);
        }
        
        console.log('\n🤖 Probando chat híbrido...');
        
        // Prueba del chat híbrido
        const chatResponse = await fetch(`${BASE_URL}/processAIChat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: 'eventos culturales festivales',
                citySlug: CITY_SLUG,
                cityContext: 'La Vila Joiosa',
                conversationHistory: []
            })
        });
        
        if (chatResponse.ok) {
            const chatResult = await chatResponse.json();
            console.log('✅ Chat Response:', {
                success: chatResult.success,
                modelUsed: chatResult.data?.modelUsed,
                ragUsed: chatResult.data?.ragUsed,
                ragResultsCount: chatResult.data?.ragResultsCount
            });
            
            console.log('💬 Respuesta:', chatResult.data?.response?.substring(0, 300) + '...');
        } else {
            const errorText = await chatResponse.text();
            console.log('❌ Chat Error:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testRAGSpecific();

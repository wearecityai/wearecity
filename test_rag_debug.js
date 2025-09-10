#!/usr/bin/env node

/**
 * Debug del RAG para entender por qué no encuentra resultados
 */

const BASE_URL = 'https://us-central1-wearecity-2ab89.cloudfunctions.net';
const USER_ID = 'test-user';
const CITY_SLUG = 'la-vila-joiosa';

async function debugRAG() {
    console.log('🔍 Debug del RAG...\n');
    
    try {
        // Probar diferentes consultas específicas
        const queries = [
            'eventos',
            'festival',
            'cultura',
            'villajoyosa',
            'actividades'
        ];
        
        for (const query of queries) {
            console.log(`\n--- Probando: "${query}" ---`);
            
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
            
            if (response.ok) {
                const result = await response.json();
                console.log('📊 Resultado:', {
                    modelUsed: result.data?.modelUsed,
                    ragUsed: result.data?.ragUsed || false,
                    ragResultsCount: result.data?.ragResultsCount || 0
                });
                
                if (result.data?.ragUsed) {
                    console.log('🎉 ¡RAG activado!');
                    console.log('💬 Respuesta:', result.data.response.substring(0, 200) + '...');
                } else {
                    console.log('❌ RAG no activado');
                }
            } else {
                console.log('❌ Error:', response.status);
            }
            
            // Pausa entre consultas
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugRAG();

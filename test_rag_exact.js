#!/usr/bin/env node

/**
 * Prueba con contenido exacto del RAG
 */

const BASE_URL = 'https://us-central1-wearecity-2ab89.cloudfunctions.net';
const USER_ID = 'test-user';
const CITY_SLUG = 'la-vila-joiosa';

async function testExactContent() {
    console.log('🧪 Probando con contenido exacto del RAG...\n');
    
    // Palabras que sabemos que están en el contenido
    const exactQueries = [
        'ESCAPE ROOM Olympia',
        'Teatro Auditori',
        'COLDPLAY tributo',
        'Centro Social Llar',
        'Hitchcock espiral',
        'Baby Esferic teatro',
        'Sempere Otradanza'
    ];
    
    for (const query of exactQueries) {
        console.log(`\n--- Probando: "${query}" ---`);
        
        try {
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
                const data = result.data;
                
                console.log('📊 Resultado:');
                console.log(`   🤖 Modelo: ${data.modelUsed}`);
                console.log(`   🧠 RAG usado: ${data.ragUsed ? '✅ SÍ' : '❌ NO'}`);
                
                if (data.ragUsed) {
                    console.log(`   📄 Resultados RAG: ${data.ragResultsCount}`);
                    console.log(`   🔎 Tipo búsqueda: ${data.ragSearchType}`);
                    console.log(`   💬 Respuesta: ${data.response.substring(0, 200)}...`);
                    console.log('🎉 ¡RAG ACTIVADO EXITOSAMENTE!');
                    break; // Si encontramos uno que funciona, podemos parar
                } else {
                    console.log(`   💬 Respuesta: ${data.response.substring(0, 100)}...`);
                }
            } else {
                console.log('❌ Error HTTP:', response.status);
            }
            
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
        
        // Pausa entre consultas
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

testExactContent();

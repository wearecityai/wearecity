// Using native fetch

async function testSpecificQueries() {
    try {
        console.log('🧪 Testing Specific Queries...');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        const testQueries = [
            {
                query: '¿dónde está el ayuntamiento?',
                expected: 'Router (no RAG)',
                description: 'Consulta de ubicación'
            },
            {
                query: 'empadronamiento',
                expected: 'RAG Dinámico',
                description: 'Palabra clave directa'
            },
            {
                query: '¿cómo hacer un trámite?',
                expected: 'RAG Dinámico',
                description: 'Consulta genérica sobre trámites'
            },
            {
                query: '¿qué documentos necesito?',
                expected: 'RAG Dinámico',
                description: 'Consulta sobre documentos'
            }
        ];
        
        for (const test of testQueries) {
            console.log(`\n📝 === ${test.description} ===`);
            console.log(`Query: "${test.query}"`);
            console.log(`Expected: ${test.expected}`);
            
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: test.query,
                    userId: userId,
                    citySlug: citySlug,
                    cityContext: {
                        name: 'La Vila Joiosa',
                        slug: citySlug
                    },
                    conversationHistory: []
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            console.log('✅ Response received:');
            console.log('📊 Success:', result.success);
            console.log('🗄️ RAG used:', result.data?.ragUsed);
            console.log('🔄 Dynamic RAG:', result.data?.isDynamicRAG);
            console.log('📈 RAG results count:', result.data?.ragResultsCount);
            console.log('🔍 RAG search type:', result.data?.ragSearchType);
            console.log('🤖 Model used:', result.data?.modelUsed);
            console.log('🔍 Search performed:', result.data?.searchPerformed);
            console.log('📝 Response preview:', result.data?.response?.substring(0, 150) + '...');
            
            // Verificar si el comportamiento es el esperado
            if (test.expected.includes('RAG Dinámico')) {
                if (result.data?.ragUsed && result.data?.isDynamicRAG) {
                    console.log('✅ CORRECT: RAG Dinámico activated as expected');
                } else {
                    console.log('❌ ERROR: Expected RAG Dinámico but got different behavior');
                }
            } else if (test.expected.includes('Router (no RAG)')) {
                if (!result.data?.ragUsed) {
                    console.log('✅ CORRECT: Router activated without RAG as expected');
                } else {
                    console.log('❌ ERROR: Expected Router without RAG but got RAG activation');
                }
            }
            
            // Esperar un momento entre consultas
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('\n🎯 === RESUMEN DEL TEST ===');
        console.log('El sistema debería activar RAG solo para consultas realmente relevantes');
        
    } catch (error) {
        console.error('❌ Error testing specific queries:', error);
    }
}

testSpecificQueries();

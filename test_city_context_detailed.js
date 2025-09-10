// Using native fetch

async function testCityContextDetailed() {
    try {
        console.log('🔍 Testing City Context in Detail...');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        const testCases = [
            {
                query: '¿en qué ciudad estoy?',
                description: 'Consulta directa sobre ciudad',
                expectedRAG: false
            },
            {
                query: '¿cómo empadronarme?',
                description: 'Consulta que debería usar RAG',
                expectedRAG: true
            },
            {
                query: '¿dónde está el ayuntamiento?',
                description: 'Consulta de ubicación',
                expectedRAG: false
            },
            {
                query: '¿qué eventos hay?',
                description: 'Consulta sobre eventos',
                expectedRAG: false
            }
        ];
        
        for (const testCase of testCases) {
            console.log(`\n📝 === ${testCase.description} ===`);
            console.log(`Query: "${testCase.query}"`);
            console.log(`Expected RAG: ${testCase.expectedRAG}`);
            
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: testCase.query,
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
            console.log('🤖 Model used:', result.data?.modelUsed);
            console.log('🔍 Search performed:', result.data?.searchPerformed);
            console.log('📝 Response preview:', result.data?.response?.substring(0, 200) + '...');
            
            // Verificar si la respuesta menciona la ciudad
            const responseText = result.data?.response?.toLowerCase() || '';
            const mentionsCity = responseText.includes('vila joiosa') || 
                               responseText.includes('la vila') ||
                               responseText.includes('vila-joiosa');
            
            if (mentionsCity) {
                console.log('✅ Response mentions city correctly');
            } else {
                console.log('❌ Response does NOT mention city');
                console.log('Full response:', result.data?.response);
            }
            
            // Verificar si RAG se activó como esperado
            if (testCase.expectedRAG) {
                if (result.data?.ragUsed) {
                    console.log('✅ RAG activated as expected');
                } else {
                    console.log('❌ RAG should have been activated but was not');
                }
            } else {
                if (!result.data?.ragUsed) {
                    console.log('✅ RAG not activated as expected');
                } else {
                    console.log('❌ RAG should not have been activated but was');
                }
            }
            
            // Esperar un momento entre consultas
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
    } catch (error) {
        console.error('❌ Error testing city context:', error);
    }
}

testCityContextDetailed();

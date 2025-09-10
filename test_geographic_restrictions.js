// Using native fetch

async function testGeographicRestrictions() {
    try {
        console.log('🌍 Testing Geographic Restrictions...');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        const testQueries = [
            {
                query: '¿qué eventos hay en Madrid?',
                description: 'Consulta sobre eventos en otra ciudad',
                expectedBehavior: 'Should NOT include Madrid events, only La Vila Joiosa'
            },
            {
                query: '¿dónde puedo comer en Barcelona?',
                description: 'Consulta sobre restaurantes en otra ciudad',
                expectedBehavior: 'Should NOT include Barcelona restaurants, only La Vila Joiosa'
            },
            {
                query: '¿qué eventos hay?',
                description: 'Consulta general sobre eventos',
                expectedBehavior: 'Should only include La Vila Joiosa events'
            },
            {
                query: '¿dónde puedo comer?',
                description: 'Consulta general sobre restaurantes',
                expectedBehavior: 'Should only include La Vila Joiosa restaurants'
            }
        ];
        
        for (const test of testQueries) {
            console.log(`\n📝 === ${test.description} ===`);
            console.log(`Query: "${test.query}"`);
            console.log(`Expected: ${test.expectedBehavior}`);
            
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
            console.log('🤖 Model used:', result.data?.modelUsed);
            console.log('🔍 Search performed:', result.data?.searchPerformed);
            console.log('📝 Response:', result.data?.response);
            
            // Verificar si menciona otras ciudades
            const responseText = result.data?.response?.toLowerCase() || '';
            const mentionsMadrid = responseText.includes('madrid');
            const mentionsBarcelona = responseText.includes('barcelona');
            const mentionsVilaJoiosa = responseText.includes('vila joiosa') || responseText.includes('la vila');
            
            if (mentionsMadrid) {
                console.log('❌ ERROR: Response mentions Madrid (should be restricted)');
            }
            if (mentionsBarcelona) {
                console.log('❌ ERROR: Response mentions Barcelona (should be restricted)');
            }
            if (mentionsVilaJoiosa) {
                console.log('✅ GOOD: Response mentions La Vila Joiosa');
            }
            
            // Esperar un momento entre consultas
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
    } catch (error) {
        console.error('❌ Error testing geographic restrictions:', error);
    }
}

testGeographicRestrictions();

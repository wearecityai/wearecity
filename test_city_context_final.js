// Using native fetch

async function testCityContextFinal() {
    try {
        console.log('🔍 Testing City Context Final...');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        const testQueries = [
            'hola',
            '¿en qué ciudad estoy?',
            '¿dónde me encuentro?'
        ];
        
        for (const query of testQueries) {
            console.log(`\n📝 === Query: "${query}" ===`);
            
            const requestBody = {
                query: query,
                citySlug: citySlug,
                cityContext: {
                    name: 'La Vila Joiosa',
                    slug: citySlug
                },
                conversationHistory: []
            };
            
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            console.log('✅ Response received:');
            console.log('📊 Success:', result.success);
            console.log('🤖 Model used:', result.data?.modelUsed);
            console.log('📋 Complexity:', result.data?.complexity);
            console.log('📝 Response:', result.data?.response);
            
            // Análisis detallado
            const responseText = result.data?.response?.toLowerCase() || '';
            
            console.log('\n🔍 ANÁLISIS DETALLADO:');
            console.log('✅ Menciona La Vila Joiosa:', responseText.includes('vila joiosa') || responseText.includes('la vila'));
            console.log('✅ Menciona España:', responseText.includes('españa'));
            console.log('❌ Menciona [object Object]:', responseText.includes('[object object]'));
            console.log('❌ Menciona "ciudad de España":', responseText.includes('ciudad de españa'));
            
            // Esperar un momento entre consultas
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
    } catch (error) {
        console.error('❌ Error testing city context final:', error);
    }
}

testCityContextFinal();

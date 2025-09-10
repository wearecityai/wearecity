// Using native fetch

async function debugCityContext() {
    try {
        console.log('🔍 Debugging City Context...');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        const testQueries = [
            '¿en qué ciudad estoy?',
            '¿dónde me encuentro?',
            '¿cuál es mi ubicación?',
            'hola'
        ];
        
        for (const query of testQueries) {
            console.log(`\n📝 === Query: "${query}" ===`);
            
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
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
            
            // Verificar si la respuesta menciona la ciudad
            if (result.data?.response?.toLowerCase().includes('vila joiosa') || 
                result.data?.response?.toLowerCase().includes('la vila')) {
                console.log('✅ Response mentions city correctly');
            } else {
                console.log('❌ Response does NOT mention city');
            }
            
            // Esperar un momento entre consultas
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
    } catch (error) {
        console.error('❌ Error debugging city context:', error);
    }
}

debugCityContext();

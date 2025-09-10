// Using native fetch

async function testCityContextFix() {
    try {
        console.log('🧪 Testing City Context Fix...');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        // Consulta que debería mostrar el nombre correcto de la ciudad
        console.log('\n📝 === CONSULTA: Verificar nombre de ciudad ===');
        const query = '¿Cuáles son los horarios de atención del ayuntamiento?';
        
        console.log(`Query: "${query}"`);
        
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
        console.log('📝 Response preview:', result.data?.response?.substring(0, 300) + '...');
        
        // Verificar si aparece [object Object] en la respuesta
        if (result.data?.response?.includes('[object Object]')) {
            console.log('❌ ERROR: [object Object] still appears in response');
        } else if (result.data?.response?.includes('La Vila Joiosa')) {
            console.log('✅ SUCCESS: City name appears correctly in response');
        } else {
            console.log('⚠️ WARNING: City name not clearly visible in response');
        }
        
    } catch (error) {
        console.error('❌ Error testing city context fix:', error);
    }
}

testCityContextFix();

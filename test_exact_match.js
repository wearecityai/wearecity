// Using native fetch

async function testExactMatch() {
    try {
        console.log('🧪 Testing Exact Match in Dynamic RAG...');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        // Usar una consulta exacta que ya está almacenada
        console.log('\n📝 === CONSULTA EXACTA ===');
        const query = '¿cómo empadronarme?';
        
        console.log(`Query: "${query}"`);
        console.log('This query should already be in the dynamic RAG...');
        
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
        console.log('📈 RAG results count:', result.data?.ragResultsCount);
        console.log('🔍 RAG search type:', result.data?.ragSearchType);
        console.log('🤖 Model used:', result.data?.modelUsed);
        console.log('🔍 Search performed:', result.data?.searchPerformed);
        console.log('📝 Response preview:', result.data?.response?.substring(0, 200) + '...');
        
        if (result.data?.ragUsed && result.data?.isDynamicRAG) {
            console.log('🎉 SUCCESS: Dynamic RAG activated!');
        } else if (result.data?.ragUsed) {
            console.log('✅ Static RAG activated');
        } else {
            console.log('❌ RAG not activated - using Router instead');
        }
        
    } catch (error) {
        console.error('❌ Error testing exact match:', error);
    }
}

testExactMatch();

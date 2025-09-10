// Using native fetch

async function testRAGDebugQuery() {
    try {
        console.log('🧪 Testing RAG with debug query...');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        
        const testQuery = 'por que no usa el rag en este caso?';
        
        console.log(`📝 Testing query: "${testQuery}"`);
        
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: testQuery,
                userId: 'anonymous',
                citySlug: 'la-vila-joiosa',
                cityContext: {
                    name: 'La Vila Joiosa',
                    slug: 'la-vila-joiosa'
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
        console.log('📝 Response text:', result.data?.response?.substring(0, 300) + '...');
        console.log('🤖 Model used:', result.data?.modelUsed);
        console.log('🔍 Search performed:', result.data?.searchPerformed);
        console.log('🗄️ RAG used:', result.data?.ragUsed);
        console.log('📈 RAG results count:', result.data?.ragResultsCount);
        console.log('🔍 RAG search type:', result.data?.ragSearchType);
        
        if (result.data?.ragUsed) {
            console.log('✅ RAG ACTIVATED! 🎉');
            console.log('📋 RAG is using local database information');
        } else {
            console.log('❌ RAG NOT ACTIVATED - Using router fallback');
            console.log('📋 Router is using Google Search grounding');
        }
        
        // Mostrar respuesta completa
        console.log('\n📄 FULL RESPONSE:');
        console.log('='.repeat(50));
        console.log(result.data?.response);
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('❌ Error testing debug query:', error);
    }
}

testRAGDebugQuery();

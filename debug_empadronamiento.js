// Using native fetch

async function debugEmpadronamiento() {
    try {
        console.log('🔍 Debugging empadronamiento query...');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        const query = '¿cómo empadronarme?';
        
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
        console.log('📈 RAG results count:', result.data?.ragResultsCount);
        console.log('🔍 RAG search type:', result.data?.ragSearchType);
        console.log('🤖 Model used:', result.data?.modelUsed);
        console.log('🔍 Search performed:', result.data?.searchPerformed);
        console.log('📝 Response preview:', result.data?.response?.substring(0, 200) + '...');
        
        // Verificar si la respuesta contiene información sobre empadronamiento
        if (result.data?.response?.toLowerCase().includes('empadronar') || 
            result.data?.response?.toLowerCase().includes('padrón') ||
            result.data?.response?.toLowerCase().includes('ayuntamiento')) {
            console.log('✅ Response contains empadronamiento information');
        } else {
            console.log('❌ Response does not contain empadronamiento information');
        }
        
    } catch (error) {
        console.error('❌ Error debugging empadronamiento:', error);
    }
}

debugEmpadronamiento();

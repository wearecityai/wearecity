// Using native fetch

async function testDynamicRAGCompletelyNew() {
    try {
        console.log('🧪 Testing Dynamic RAG with COMPLETELY NEW topic...');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        // Consulta completamente nueva que NO esté en el RAG estático
        console.log('\n📝 === CONSULTA COMPLETAMENTE NUEVA (Router + Almacenamiento) ===');
        const query1 = '¿Cuál es la temperatura actual en La Vila Joiosa?';
        
        console.log(`Query: "${query1}"`);
        
        const response1 = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query1,
                userId: userId,
                citySlug: citySlug,
                cityContext: {
                    name: 'La Vila Joiosa',
                    slug: citySlug
                },
                conversationHistory: []
            })
        });
        
        if (!response1.ok) {
            throw new Error(`HTTP error! status: ${response1.status}`);
        }
        
        const result1 = await response1.json();
        
        console.log('✅ Response 1 received:');
        console.log('📊 Success:', result1.success);
        console.log('🗄️ RAG used:', result1.data?.ragUsed);
        console.log('🔄 Dynamic RAG:', result1.data?.isDynamicRAG);
        console.log('🤖 Model used:', result1.data?.modelUsed);
        console.log('🔍 Search performed:', result1.data?.searchPerformed);
        console.log('📝 Response preview:', result1.data?.response?.substring(0, 200) + '...');
        
        if (result1.data?.ragUsed && result1.data?.isDynamicRAG) {
            console.log('✅ RAG Dinámico activado (primera vez - imposible)');
        } else if (result1.data?.searchPerformed) {
            console.log('🎉 Router activado - respuesta almacenada en RAG dinámico');
        } else if (result1.data?.ragUsed) {
            console.log('❌ RAG Estático activado (no debería pasar)');
        } else {
            console.log('✅ RAG Estático activado');
        }
        
        // Esperar un momento para que se procese
        console.log('\n⏳ Esperando 5 segundos para procesamiento...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Segunda consulta similar - debería usar RAG dinámico
        console.log('\n📝 === SEGUNDA CONSULTA (RAG Dinámico) ===');
        const query2 = '¿Qué tiempo hace en Villajoyosa?';
        
        console.log(`Query: "${query2}"`);
        
        const response2 = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query2,
                userId: userId,
                citySlug: citySlug,
                cityContext: {
                    name: 'La Vila Joiosa',
                    slug: citySlug
                },
                conversationHistory: []
            })
        });
        
        if (!response2.ok) {
            throw new Error(`HTTP error! status: ${response2.status}`);
        }
        
        const result2 = await response2.json();
        
        console.log('✅ Response 2 received:');
        console.log('📊 Success:', result2.success);
        console.log('🗄️ RAG used:', result2.data?.ragUsed);
        console.log('🔄 Dynamic RAG:', result2.data?.isDynamicRAG);
        console.log('📈 RAG results count:', result2.data?.ragResultsCount);
        console.log('🔍 RAG search type:', result2.data?.ragSearchType);
        console.log('🤖 Model used:', result2.data?.modelUsed);
        console.log('🔍 Search performed:', result2.data?.searchPerformed);
        console.log('📝 Response preview:', result2.data?.response?.substring(0, 200) + '...');
        
        if (result2.data?.ragUsed && result2.data?.isDynamicRAG) {
            console.log('🎉 RAG Dinámico activado - usando respuesta previa!');
        } else if (result2.data?.ragUsed) {
            console.log('❌ RAG Estático activado (no debería pasar)');
        } else if (result2.data?.searchPerformed) {
            console.log('✅ Router activado - nueva respuesta');
        } else {
            console.log('✅ RAG Estático activado');
        }
        
        console.log('\n🎯 === RESUMEN DEL TEST ===');
        console.log('1. Primera consulta: Router + Almacenamiento (tema completamente nuevo)');
        console.log('2. Segunda consulta: RAG Dinámico (si funciona)');
        
    } catch (error) {
        console.error('❌ Error testing dynamic RAG:', error);
    }
}

testDynamicRAGCompletelyNew();

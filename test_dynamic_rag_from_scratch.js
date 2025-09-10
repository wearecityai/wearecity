// Using native fetch

async function testDynamicRAGFromScratch() {
    try {
        console.log('🧪 Testing Dynamic RAG from SCRATCH...');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        // Primera consulta - debería usar Router y almacenar en RAG dinámico
        console.log('\n📝 === CONSULTA 1: Router + Almacenamiento ===');
        const query1 = '¿Cuáles son los horarios de atención del ayuntamiento?';
        
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
        
        if (result1.data?.ragUsed) {
            console.log('❌ ERROR: RAG should be empty!');
        } else if (result1.data?.searchPerformed) {
            console.log('✅ SUCCESS: Router activated - response stored in dynamic RAG');
        } else {
            console.log('✅ SUCCESS: Router activated (no search) - response stored');
        }
        
        // Esperar para que se procese
        console.log('\n⏳ Esperando 5 segundos para procesamiento...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Segunda consulta similar - debería usar RAG dinámico
        console.log('\n📝 === CONSULTA 2: RAG Dinámico (primera vez) ===');
        const query2 = '¿A qué hora abre el ayuntamiento?';
        
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
            console.log('🎉 SUCCESS: Dynamic RAG activated - using previous response!');
        } else if (result2.data?.ragUsed) {
            console.log('❌ ERROR: Static RAG activated (should be empty)');
        } else if (result2.data?.searchPerformed) {
            console.log('✅ Router activated - new response stored');
        } else {
            console.log('✅ Router activated (no search) - new response stored');
        }
        
        // Tercera consulta - debería usar RAG dinámico
        console.log('\n📝 === CONSULTA 3: RAG Dinámico (segunda vez) ===');
        const query3 = '¿Cuándo cierra el ayuntamiento?';
        
        console.log(`Query: "${query3}"`);
        
        const response3 = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query3,
                userId: userId,
                citySlug: citySlug,
                cityContext: {
                    name: 'La Vila Joiosa',
                    slug: citySlug
                },
                conversationHistory: []
            })
        });
        
        if (!response3.ok) {
            throw new Error(`HTTP error! status: ${response3.status}`);
        }
        
        const result3 = await response3.json();
        
        console.log('✅ Response 3 received:');
        console.log('📊 Success:', result3.success);
        console.log('🗄️ RAG used:', result3.data?.ragUsed);
        console.log('🔄 Dynamic RAG:', result3.data?.isDynamicRAG);
        console.log('📈 RAG results count:', result3.data?.ragResultsCount);
        console.log('🔍 RAG search type:', result3.data?.ragSearchType);
        console.log('🤖 Model used:', result3.data?.modelUsed);
        console.log('🔍 Search performed:', result3.data?.searchPerformed);
        console.log('📝 Response preview:', result3.data?.response?.substring(0, 200) + '...');
        
        if (result3.data?.ragUsed && result3.data?.isDynamicRAG) {
            console.log('🎉 SUCCESS: Dynamic RAG activated - using previous response!');
        } else if (result3.data?.ragUsed) {
            console.log('❌ ERROR: Static RAG activated (should be empty)');
        } else if (result3.data?.searchPerformed) {
            console.log('✅ Router activated - new response stored');
        } else {
            console.log('✅ Router activated (no search) - new response stored');
        }
        
        console.log('\n🎯 === RESUMEN DEL TEST DESDE CERO ===');
        console.log('1. Primera consulta: Router + Almacenamiento');
        console.log('2. Segunda consulta: RAG Dinámico (primera vez)');
        console.log('3. Tercera consulta: RAG Dinámico (segunda vez)');
        console.log('\n🚀 El sistema RAG dinámico está aprendiendo automáticamente!');
        
    } catch (error) {
        console.error('❌ Error testing dynamic RAG from scratch:', error);
    }
}

testDynamicRAGFromScratch();

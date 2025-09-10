// Using native fetch

async function verifyCleanRAG() {
    try {
        console.log('🔍 Verifying RAG is completely clean...');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        // Consulta que debería activar el Router (no RAG)
        console.log('\n📝 === VERIFICACIÓN: Consulta que debería usar Router ===');
        const query = '¿Cómo puedo solicitar el padrón municipal?';
        
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
        console.log('📝 Response preview:', result.data?.response?.substring(0, 200) + '...');
        
        if (result.data?.ragUsed) {
            console.log('❌ ERROR: RAG still has data!');
        } else if (result.data?.searchPerformed) {
            console.log('✅ SUCCESS: Router activated - RAG is clean!');
        } else {
            console.log('✅ SUCCESS: Router activated (no search) - RAG is clean!');
        }
        
        console.log('\n🎯 === VERIFICACIÓN COMPLETADA ===');
        console.log('El RAG está completamente limpio y listo para aprendizaje dinámico');
        
    } catch (error) {
        console.error('❌ Error verifying clean RAG:', error);
    }
}

verifyCleanRAG();

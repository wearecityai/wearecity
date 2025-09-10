// Using native fetch

async function testFrontendFix() {
    try {
        console.log('🧪 Testing Frontend Fix...');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        // Simular exactamente lo que envía el frontend ahora
        const cityContext = {
            name: citySlug === 'la-vila-joiosa' ? 'La Vila Joiosa' : citySlug,
            slug: citySlug
        };
        
        const requestBody = {
            query: 'hola',
            citySlug: citySlug,
            cityContext: cityContext,
            conversationHistory: []
        };
        
        console.log('📤 Request body (simulando frontend):');
        console.log(JSON.stringify(requestBody, null, 2));
        
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
        
        console.log('\n✅ Response received:');
        console.log('📊 Success:', result.success);
        console.log('🤖 Model used:', result.data?.modelUsed);
        console.log('📋 Complexity:', result.data?.complexity);
        console.log('📝 Response:', result.data?.response);
        
        // Verificar si ahora menciona correctamente La Vila Joiosa
        const responseText = result.data?.response?.toLowerCase() || '';
        const mentionsVilaJoiosa = responseText.includes('vila joiosa') || responseText.includes('la vila');
        const mentionsSpain = responseText.includes('españa');
        
        console.log('\n🔍 ANÁLISIS:');
        console.log('✅ Menciona La Vila Joiosa:', mentionsVilaJoiosa);
        console.log('✅ Menciona España:', mentionsSpain);
        
        if (mentionsVilaJoiosa && mentionsSpain) {
            console.log('🎉 ¡ÉXITO! La IA ahora sabe correctamente en qué ciudad está');
        } else {
            console.log('❌ PROBLEMA: La IA aún no sabe en qué ciudad está');
        }
        
    } catch (error) {
        console.error('❌ Error testing frontend fix:', error);
    }
}

testFrontendFix();

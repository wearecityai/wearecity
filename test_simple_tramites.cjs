// Script simple para probar una consulta de trámites

async function testSimpleTramites() {
    try {
        console.log('🧪 Testing Simple Tramites Query...\n');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        const query = 'quiero solicitar una licencia de vado';
        
        console.log(`📝 Query: "${query}"`);
        
        const requestBody = {
            query: query,
            citySlug: citySlug,
            cityContext: {
                name: 'La Vila Joiosa',
                slug: citySlug
            },
            conversationHistory: []
        };
        
        console.log('📤 Sending request...');
        
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
        console.log('🔍 Search performed:', result.data?.searchPerformed);
        console.log('📝 Response length:', result.data?.response?.length || 0, 'chars');
        
        if (result.data?.response) {
            console.log('📝 Response preview:', result.data.response.substring(0, 200) + '...');
        }
        
        // Análisis
        console.log('\n🔍 ANÁLISIS:');
        console.log('🎯 Expected: 2.5 Pro + Google Search');
        console.log('🤖 Actual model:', result.data?.modelUsed);
        console.log('🔍 Search performed:', result.data?.searchPerformed);
        
        if (result.data?.modelUsed === 'gemini-2.5-pro' && result.data?.searchPerformed) {
            console.log('✅ CORRECTO: Using 2.5 Pro + Google Search');
        } else {
            console.log('❌ ERROR: Should use 2.5 Pro + Google Search');
        }
        
    } catch (error) {
        console.error('❌ Error testing simple tramites:', error);
    }
}

testSimpleTramites();

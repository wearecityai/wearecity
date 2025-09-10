// Test para verificar el formato Streamdown enriquecido

async function testStreamdownFormat() {
    try {
        console.log('🎨 Testing Streamdown Enhanced Format...\n');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        const query = '¿cómo me empadrono en La Vila Joiosa?';
        
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
        console.log('🔍 Search performed:', result.data?.searchPerformed);
        console.log('📝 Response length:', result.data?.response?.length || 0, 'chars');
        
        if (result.data?.response) {
            console.log('\n📝 STREAMDOWN FORMATTED RESPONSE:');
            console.log('=====================================');
            console.log(result.data.response);
            console.log('=====================================');
            
            // Análisis del formato
            const response = result.data.response;
            console.log('\n🔍 STREAMDOWN FEATURES ANALYSIS:');
            console.log('✅ H1 Titles (#):', response.includes('# ') ? 'YES' : 'NO');
            console.log('✅ H2 Sections (##):', response.includes('## ') ? 'YES' : 'NO');
            console.log('✅ H3 Subsections (###):', response.includes('### ') ? 'YES' : 'NO');
            console.log('✅ Tables (|):', response.includes('|') ? 'YES' : 'NO');
            console.log('✅ Code blocks (```):', response.includes('```') ? 'YES' : 'NO');
            console.log('✅ Blockquotes (>):', response.includes('> ') ? 'YES' : 'NO');
            console.log('✅ Separators (---):', response.includes('---') ? 'YES' : 'NO');
            console.log('✅ Bold (**text**):', response.includes('**') ? 'YES' : 'NO');
            console.log('✅ Italic (*text*):', response.includes('*') && !response.includes('**') ? 'YES' : 'NO');
            console.log('✅ Emojis:', /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(response) ? 'YES' : 'NO');
        }
        
    } catch (error) {
        console.error('❌ Error testing Streamdown format:', error);
    }
}

testStreamdownFormat();

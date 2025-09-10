// Script para probar la prioridad de trámites con 2.5 Pro + Google Search

async function testTramitesPriority() {
    try {
        console.log('🧪 Testing Tramites Priority with 2.5 Pro + Google Search...\n');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        const testQueries = [
            // Consultas de trámites (deberían usar 2.5 Pro + Google Search)
            'quiero solicitar una licencia de vado',
            '¿cómo me empadrono?',
            'necesito un certificado de empadronamiento',
            '¿dónde puedo solicitar el bono de transporte?',
            '¿qué documentos necesito para una licencia?',
            
            // Consultas NO de trámites (deberían usar RAG o 2.5 Flash)
            'hola',
            '¿qué tiempo hace?',
            '¿qué eventos hay este fin de semana?'
        ];
        
        for (const query of testQueries) {
            console.log(`📝 === Query: "${query}" ===`);
            
            const requestBody = {
                query: query,
                citySlug: citySlug,
                cityContext: {
                    name: 'La Vila Joiosa',
                    slug: citySlug
                },
                conversationHistory: []
            };
            
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
            
            console.log('✅ Response received:');
            console.log('📊 Success:', result.success);
            console.log('🤖 Model used:', result.data?.modelUsed);
            console.log('📋 Complexity:', result.data?.complexity);
            console.log('🔍 Search performed:', result.data?.searchPerformed);
            console.log('📝 Response length:', result.data?.response?.length || 0, 'chars');
            console.log('📝 Response preview:', result.data?.response?.substring(0, 150) + '...');
            
            // Análisis
            const isTramitesQuery = query.toLowerCase().includes('licencia') || 
                                  query.toLowerCase().includes('empadron') || 
                                  query.toLowerCase().includes('certificado') || 
                                  query.toLowerCase().includes('bono') || 
                                  query.toLowerCase().includes('documentos');
            
            console.log('\n🔍 ANÁLISIS:');
            console.log('🎯 Is tramites query:', isTramitesQuery);
            console.log('🤖 Model used:', result.data?.modelUsed);
            console.log('🔍 Search performed:', result.data?.searchPerformed);
            
            if (isTramitesQuery) {
                if (result.data?.modelUsed === 'gemini-2.5-pro' && result.data?.searchPerformed) {
                    console.log('✅ CORRECTO: Trámites query using 2.5 Pro + Google Search');
                } else {
                    console.log('❌ ERROR: Trámites query should use 2.5 Pro + Google Search');
                }
            } else {
                console.log('ℹ️ INFO: Non-tramites query, using appropriate model');
            }
            
            console.log('   ---\n');
            
            // Esperar un momento entre consultas
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
    } catch (error) {
        console.error('❌ Error testing tramites priority:', error);
    }
}

testTramitesPriority();

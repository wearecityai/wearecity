// Using native fetch

async function debugCityDataFlow() {
    try {
        console.log('🔍 Debugging City Data Flow...');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        console.log('📊 Datos que se envían al backend:');
        console.log('  - userId:', userId);
        console.log('  - citySlug:', citySlug);
        console.log('  - cityContext:', {
            name: 'La Vila Joiosa',
            slug: citySlug
        });
        
        const testQueries = [
            '¿en qué ciudad estoy?',
            '¿dónde me encuentro?',
            '¿cuál es mi ubicación?',
            'hola'
        ];
        
        for (const query of testQueries) {
            console.log(`\n📝 === Query: "${query}" ===`);
            
            const requestBody = {
                query: query,
                userId: userId,
                citySlug: citySlug,
                cityContext: {
                    name: 'La Vila Joiosa',
                    slug: citySlug
                },
                conversationHistory: []
            };
            
            console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
            
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
            console.log('📝 Response:', result.data?.response);
            
            // Análisis específico de conocimiento de ciudad
            const responseText = result.data?.response?.toLowerCase() || '';
            
            console.log('\n🔍 ANÁLISIS DE CONOCIMIENTO DE CIUDAD:');
            
            // Verificar si la IA sabe en qué ciudad está
            const knowsCity = responseText.includes('vila joiosa') || 
                            responseText.includes('la vila') ||
                            responseText.includes('villajoyosa');
            console.log('✅ IA sabe la ciudad:', knowsCity);
            
            // Verificar si menciona específicamente "La Vila Joiosa"
            const mentionsFullCityName = responseText.includes('la vila joiosa');
            console.log('✅ Menciona "La Vila Joiosa":', mentionsFullCityName);
            
            // Verificar si menciona España
            const mentionsSpain = responseText.includes('españa') || responseText.includes('spain');
            console.log('✅ Menciona España:', mentionsSpain);
            
            // Verificar si da información específica de la ciudad
            const givesSpecificInfo = responseText.includes('ayuntamiento') ||
                                    responseText.includes('municipio') ||
                                    responseText.includes('costa') ||
                                    responseText.includes('alicante');
            console.log('✅ Da información específica:', givesSpecificInfo);
            
            // Verificar si parece confundida o genérica
            const seemsConfused = responseText.includes('no sé') ||
                                 responseText.includes('no tengo') ||
                                 responseText.includes('no puedo') ||
                                 responseText.includes('información') && responseText.includes('ciudad');
            console.log('❌ Parece confundida:', seemsConfused);
            
            // Esperar un momento entre consultas
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('\n🎯 === DIAGNÓSTICO ===');
        console.log('Si la IA no sabe en qué ciudad está, puede ser que:');
        console.log('1. El cityContext no se esté pasando correctamente al backend');
        console.log('2. El cityContext se pierde en el procesamiento');
        console.log('3. Los systemPrompts no están recibiendo la variable de ciudad');
        console.log('4. Hay un problema en la interpolación de variables');
        
    } catch (error) {
        console.error('❌ Error debugging city data flow:', error);
    }
}

debugCityDataFlow();

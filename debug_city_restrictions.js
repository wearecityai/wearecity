// Using native fetch

async function debugCityRestrictions() {
    try {
        console.log('🔍 Debugging City Restrictions Deep Analysis...');
        
        const functionUrl = 'https://processaichat-7gaozpdiza-uc.a.run.app';
        const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
        const citySlug = 'la-vila-joiosa';
        
        const testQueries = [
            {
                query: '¿en qué ciudad estoy?',
                description: 'Consulta directa sobre ubicación',
                expectedModel: 'gemini-2.5-flash-lite'
            },
            {
                query: '¿qué eventos hay en Madrid?',
                description: 'Consulta sobre otra ciudad (debería ser rechazada)',
                expectedModel: 'gemini-2.5-pro'
            },
            {
                query: '¿dónde puedo comer en Barcelona?',
                description: 'Consulta sobre restaurantes en otra ciudad',
                expectedModel: 'gemini-2.5-flash-lite'
            },
            {
                query: 'hola',
                description: 'Saludo simple',
                expectedModel: 'gemini-2.5-flash-lite'
            }
        ];
        
        for (const test of testQueries) {
            console.log(`\n📝 === ${test.description} ===`);
            console.log(`Query: "${test.query}"`);
            console.log(`Expected Model: ${test.expectedModel}`);
            
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: test.query,
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
            console.log('📋 Complexity:', result.data?.complexity);
            console.log('📝 Response:', result.data?.response);
            
            // Análisis detallado de la respuesta
            const responseText = result.data?.response?.toLowerCase() || '';
            
            console.log('\n🔍 ANÁLISIS DETALLADO:');
            
            // Verificar si menciona la ciudad correcta
            const mentionsVilaJoiosa = responseText.includes('vila joiosa') || responseText.includes('la vila');
            console.log('✅ Menciona La Vila Joiosa:', mentionsVilaJoiosa);
            
            // Verificar si menciona otras ciudades (no debería)
            const mentionsMadrid = responseText.includes('madrid');
            const mentionsBarcelona = responseText.includes('barcelona');
            const mentionsValencia = responseText.includes('valencia');
            const mentionsAlicante = responseText.includes('alicante');
            
            console.log('❌ Menciona Madrid:', mentionsMadrid);
            console.log('❌ Menciona Barcelona:', mentionsBarcelona);
            console.log('❌ Menciona Valencia:', mentionsValencia);
            console.log('❌ Menciona Alicante:', mentionsAlicante);
            
            // Verificar si rechaza consultas sobre otras ciudades
            const rejectsOtherCities = responseText.includes('solo puedo ayudar') || 
                                     responseText.includes('solo proporciona') ||
                                     responseText.includes('no puedo proporcionar') ||
                                     responseText.includes('mi enfoque está exclusivamente') ||
                                     responseText.includes('solo puedo ayudarte con');
            console.log('✅ Rechaza otras ciudades:', rejectsOtherCities);
            
            // Verificar si el modelo usado es el esperado
            const correctModel = result.data?.modelUsed === test.expectedModel;
            console.log('✅ Modelo correcto:', correctModel, `(esperado: ${test.expectedModel}, actual: ${result.data?.modelUsed})`);
            
            // Verificar si las restricciones están funcionando
            let restrictionsWorking = false;
            if (test.query.includes('Madrid') || test.query.includes('Barcelona')) {
                restrictionsWorking = rejectsOtherCities && !mentionsMadrid && !mentionsBarcelona;
            } else {
                restrictionsWorking = mentionsVilaJoiosa;
            }
            console.log('🎯 Restricciones funcionando:', restrictionsWorking);
            
            // Esperar un momento entre consultas
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        console.log('\n🎯 === RESUMEN DEL ANÁLISIS ===');
        console.log('Si las restricciones no funcionan, puede ser que:');
        console.log('1. Los systemPrompts no se estén aplicando correctamente');
        console.log('2. El cityContext no se esté pasando bien');
        console.log('3. Los modelos no estén siguiendo las instrucciones');
        console.log('4. Hay un problema en la clasificación de complejidad');
        
    } catch (error) {
        console.error('❌ Error debugging city restrictions:', error);
    }
}

debugCityRestrictions();

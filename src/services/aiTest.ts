import { testVertexAI, classifyQuery, processWithVertexAI } from './vertexAIService';

// Test function to verify the entire AI system
export const testCompleteAISystem = async () => {
  console.log('🧪 Testing complete AI system...');

  try {
    // Test 1: Classification
    console.log('\n1️⃣ Testing query classification...');
    const simpleClassification = await classifyQuery('Hola, ¿cómo estás?');
    const complexClassification = await classifyQuery('Busca información actual sobre eventos en Madrid');
    
    console.log('Simple query classification:', simpleClassification);
    console.log('Complex query classification:', complexClassification);

    // Test 2: Simple query processing
    console.log('\n2️⃣ Testing simple query processing...');
    const simpleResponse = await processWithVertexAI(
      'Hola, ¿cómo funciona este asistente?',
      'Ciudad de Prueba'
    );
    console.log('Simple response:', simpleResponse);

    // Test 3: Complex query processing
    console.log('\n3️⃣ Testing complex query processing...');
    const complexResponse = await processWithVertexAI(
      'Busca información sobre los trámites municipales más solicitados',
      'Ciudad de Prueba'
    );
    console.log('Complex response:', complexResponse);

    // Test 4: Conversation context
    console.log('\n4️⃣ Testing conversation context...');
    const contextResponse = await processWithVertexAI(
      '¿Podrías darme más detalles?',
      'Ciudad de Prueba',
      [
        { role: 'user', content: 'Hola', timestamp: new Date() },
        { role: 'assistant', content: 'Hola, soy tu asistente municipal', timestamp: new Date() }
      ]
    );
    console.log('Context response:', contextResponse);

    console.log('\n✅ AI system test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ AI system test failed:', error);
    return false;
  }
};

// Simplified test for quick verification
export const quickAITest = async (): Promise<boolean> => {
  try {
    const result = await testVertexAI();
    console.log('Quick AI test result:', result);
    return result.success;
  } catch (error) {
    console.error('Quick AI test failed:', error);
    return false;
  }
};
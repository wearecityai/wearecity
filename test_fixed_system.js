const processAIChatURL = 'https://processaichat-7gaozpdiza-uc.a.run.app';

async function testFixedSystem() {
  try {
    console.log('🧪 Testing fixed RAG + Router system...');
    
    const testQuery = 'eventos esta semana';
    
    const response = await fetch(processAIChatURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery,
        userId: 'anonymous',
        citySlug: 'la-vila-joiosa',
        cityContext: {
          name: 'La Vila Joiosa',
          slug: 'la-vila-joiosa'
        },
        conversationHistory: []
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Response received:');
    console.log('📊 Full response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing system:', error);
  }
}

testFixedSystem();

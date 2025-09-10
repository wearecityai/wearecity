const processAIChatURL = 'https://processaichat-7gaozpdiza-uc.a.run.app';

async function testRAGActivation() {
  try {
    console.log('🧪 Testing RAG activation with different queries...');
    
    const testQueries = [
      'eventos esta semana',
      'eventos',
      'Baby Esferic teatro',
      'ayuntamiento',
      'vila joiosa eventos'
    ];
    
    for (const query of testQueries) {
      console.log(`\n🔍 Testing query: "${query}"`);
      
      const response = await fetch(processAIChatURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
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
        console.log('❌ HTTP error:', response.status);
        continue;
      }
      
      const result = await response.json();
      
      console.log('📊 RAG used:', result.data?.ragUsed || false);
      console.log('📈 RAG results:', result.data?.ragResultsCount || 0);
      console.log('🤖 Model:', result.data?.modelUsed);
      console.log('💬 Response preview:', result.data?.response?.substring(0, 100) + '...');
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('❌ Error testing RAG activation:', error);
  }
}

testRAGActivation();

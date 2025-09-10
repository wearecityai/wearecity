const processAIChatURL = 'https://processaichat-7gaozpdiza-uc.a.run.app';

async function testSpecificEvents() {
  try {
    console.log('🧪 Testing RAG with specific event queries...');
    
    const testQueries = [
      'Baby Esferic teatro',
      'ESCAPE ROOM Olympia Metropolitana',
      'COLDPLACE tributo Coldplay',
      'inscripciones deportes septiembre',
      'exposición punto y seguimos',
      'teatro segarem ortigues',
      'eventos septiembre 2025',
      'eventos octubre 2025',
      'eventos esta semana',
      'eventos este mes'
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
      console.log('💬 Response preview:', result.data?.response?.substring(0, 150) + '...');
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('❌ Error testing specific events:', error);
  }
}

testSpecificEvents();

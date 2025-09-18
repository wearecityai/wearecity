const admin = require('firebase-admin');
const { ragQuery } = require('./lib/ragRetrieval');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'wearecity-2ab89'
  });
}

async function testRAGQuery() {
  try {
    console.log('🔍 Testing RAG query for events...');
    
    // Probar búsqueda de eventos
    const queries = [
      'eventos de música en Villajoyosa',
      'festival navidad diciembre',
      'concierto año nuevo',
      'exposición arte local'
    ];
    
    for (const query of queries) {
      console.log(`\n🎯 Query: "${query}"`);
      
      try {
        const result = await ragQuery({
          query: `eventos ${query} en Villajoyosa`,
          userId: 'city-villa-joyosa',
          limit: 5,
          filters: { sourceType: 'event', cityId: 'villa-joyosa' }
        }, { auth: { uid: 'system' } });
        
        console.log(`✅ Found ${result.results?.length || 0} results`);
        
        if (result.results && result.results.length > 0) {
          result.results.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.metadata?.eventTitle || 'Título no disponible'}`);
            console.log(`      📅 ${item.metadata?.eventDate || 'Fecha no disponible'}`);
            console.log(`      📍 ${item.metadata?.eventLocation || 'Ubicación no disponible'}`);
          });
        } else {
          console.log('   ❌ No results found');
        }
        
      } catch (queryError) {
        console.error(`❌ Error in query "${query}":`, queryError.message);
      }
    }
    
    // Verificar que los eventos existen en la base de datos
    console.log('\n📊 Checking events in database...');
    const db = admin.firestore();
    
    const eventsQuery = await db.collection('library_sources_enhanced')
      .where('userId', '==', 'city-villa-joyosa')
      .where('sourceType', '==', 'event')
      .get();
    
    console.log(`✅ Found ${eventsQuery.size} events in database:`);
    eventsQuery.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`   ${index + 1}. ${data.metadata?.eventTitle || 'Título no disponible'}`);
      console.log(`      📅 ${data.metadata?.eventDate || 'Fecha no disponible'}`);
    });
    
  } catch (error) {
    console.error('❌ Error in RAG test:', error);
  } finally {
    process.exit(0);
  }
}

testRAGQuery();
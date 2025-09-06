// Script de debugging para métricas
import admin from 'firebase-admin';

// Inicializar Firebase Admin SDK
const serviceAccount = {
  // Configuración mínima para propósitos de debugging
  projectId: 'wearecity-2ab89'
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'wearecity-2ab89'
  });
}

const db = admin.firestore();

async function debugMetrics() {
  console.log('🔍 Debugging WeAreCity Metrics...\n');
  
  try {
    // Verificar categorías
    console.log('📂 Checking categories:');
    const categoriesSnapshot = await db.collection('chat_categories').get();
    console.log(`Found ${categoriesSnapshot.size} categories`);
    
    categoriesSnapshot.docs.forEach(doc => {
      console.log(`  - ${doc.id}: ${JSON.stringify(doc.data())}`);
    });
    
    console.log('\n📊 Checking analytics data:');
    const analyticsSnapshot = await db.collection('chat_analytics').limit(10).get();
    console.log(`Found ${analyticsSnapshot.size} analytics records`);
    
    analyticsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${doc.id}: city=${data.city_id}, category=${data.category_id}, type=${data.message_type}`);
    });
    
    // Verificar por ciudad específica
    console.log('\n🏙️ Checking for la-vila-joiosa:');
    const cityAnalytics = await db.collection('chat_analytics')
      .where('city_id', '==', 'la-vila-joiosa')
      .get();
    console.log(`Found ${cityAnalytics.size} records for la-vila-joiosa`);
    
    cityAnalytics.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - Category: ${data.category_id}, Type: ${data.message_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('\n✅ Debug complete');
  process.exit(0);
}

debugMetrics();
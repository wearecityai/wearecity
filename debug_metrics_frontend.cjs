const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'wearecity-2ab89'
  });
}

const db = admin.firestore();

async function debugMetrics() {
  try {
    console.log('🔍 === DEBUG MÉTRICAS FRONTEND ===\n');

    // 1. Verificar datos en chat_analytics
    console.log('📊 1. Verificando chat_analytics...');
    const analyticsSnapshot = await db.collection('chat_analytics').get();
    console.log(`   Total documentos: ${analyticsSnapshot.size}`);
    
    if (analyticsSnapshot.size > 0) {
      const sampleDoc = analyticsSnapshot.docs[0];
      console.log('   Documento de muestra:');
      console.log('   - ID:', sampleDoc.id);
      console.log('   - Datos:', JSON.stringify(sampleDoc.data(), null, 2));
    }

    // 2. Verificar datos por ciudad
    console.log('\n🏙️ 2. Verificando datos por ciudad...');
    const cityIds = new Set();
    analyticsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.city_id) {
        cityIds.add(data.city_id);
      }
    });
    
    console.log('   Ciudades encontradas:', Array.from(cityIds));
    
    for (const cityId of cityIds) {
      const cityData = analyticsSnapshot.docs.filter(doc => doc.data().city_id === cityId);
      console.log(`   - ${cityId}: ${cityData.length} documentos`);
      
      if (cityData.length > 0) {
        const sampleCityDoc = cityData[0];
        console.log(`     Muestra: ${sampleCityDoc.data().message_content} (${sampleCityDoc.data().message_type})`);
      }
    }

    // 3. Verificar categorías
    console.log('\n📂 3. Verificando categorías...');
    const categoriesSnapshot = await db.collection('chat_categories').get();
    console.log(`   Total categorías: ${categoriesSnapshot.size}`);
    
    categoriesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${doc.id}: ${data.name} (${data.description})`);
    });

    // 4. Verificar mapeo de categorías en analytics
    console.log('\n🔗 4. Verificando mapeo de categorías...');
    const categoryIds = new Set();
    analyticsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.category_id) {
        categoryIds.add(data.category_id);
      }
    });
    
    console.log('   Category IDs en analytics:', Array.from(categoryIds));
    
    // Verificar si las categorías coinciden
    const categoryNames = categoriesSnapshot.docs.map(doc => doc.id);
    console.log('   Category IDs en categories:', categoryNames);
    
    const missingCategories = Array.from(categoryIds).filter(id => !categoryNames.includes(id));
    if (missingCategories.length > 0) {
      console.log('   ⚠️  Categorías faltantes:', missingCategories);
    }

    // 5. Simular la consulta del frontend
    console.log('\n🎯 5. Simulando consulta del frontend...');
    const testCityId = 'la-vila-joiosa';
    
    const frontendQuery = db.collection('chat_analytics')
      .where('city_id', '==', testCityId);
    
    const frontendSnapshot = await frontendQuery.get();
    console.log(`   Consulta para ${testCityId}: ${frontendSnapshot.size} documentos`);
    
    if (frontendSnapshot.size > 0) {
      const frontendData = frontendSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('   Datos procesados:');
      console.log('   - Total mensajes:', frontendData.length);
      console.log('   - Usuarios únicos:', new Set(frontendData.map(a => a.user_id).filter(Boolean)).size);
      console.log('   - Sesiones únicas:', new Set(frontendData.map(a => a.session_id)).size);
      
      // Verificar categorías
      const categoryStats = {};
      frontendData.forEach(item => {
        if (item.category_id) {
          categoryStats[item.category_id] = (categoryStats[item.category_id] || 0) + 1;
        }
      });
      
      console.log('   - Estadísticas por categoría:', categoryStats);
    }

    // 6. Verificar estructura de datos
    console.log('\n📋 6. Verificando estructura de datos...');
    if (analyticsSnapshot.size > 0) {
      const sampleData = analyticsSnapshot.docs[0].data();
      console.log('   Campos disponibles:', Object.keys(sampleData));
      
      // Verificar campos críticos
      const criticalFields = ['city_id', 'user_id', 'session_id', 'message_content', 'message_type', 'category_id', 'created_at'];
      criticalFields.forEach(field => {
        const hasField = sampleData.hasOwnProperty(field);
        console.log(`   - ${field}: ${hasField ? '✅' : '❌'}`);
        if (hasField) {
          console.log(`     Valor: ${JSON.stringify(sampleData[field])}`);
        }
      });
    }

    console.log('\n✅ Debug completado');

  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
}

debugMetrics();

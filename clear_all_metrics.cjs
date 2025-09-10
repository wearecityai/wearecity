const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'wearecity-app'
  });
}

const db = admin.firestore();

async function clearAllMetrics() {
  console.log('🗑️ === BORRANDO TODAS LAS MÉTRICAS ===\n');
  
  try {
    // 1. Contar documentos antes de borrar
    console.log('1️⃣ Contando documentos en chat_analytics...');
    const beforeSnapshot = await db.collection('chat_analytics').get();
    console.log(`📊 Documentos encontrados: ${beforeSnapshot.size}`);
    
    if (beforeSnapshot.size === 0) {
      console.log('✅ No hay documentos para borrar.');
      return;
    }
    
    // 2. Borrar todos los documentos en lotes
    console.log('\n2️⃣ Iniciando borrado en lotes...');
    const batchSize = 500;
    let deletedCount = 0;
    
    while (true) {
      const snapshot = await db.collection('chat_analytics').limit(batchSize).get();
      
      if (snapshot.size === 0) {
        break;
      }
      
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      deletedCount += snapshot.size;
      console.log(`🗑️ Borrados ${deletedCount} documentos...`);
    }
    
    // 3. Verificar que se borraron todos
    console.log('\n3️⃣ Verificando borrado...');
    const afterSnapshot = await db.collection('chat_analytics').get();
    console.log(`📊 Documentos restantes: ${afterSnapshot.size}`);
    
    if (afterSnapshot.size === 0) {
      console.log('✅ Todos los documentos de chat_analytics han sido borrados exitosamente.');
    } else {
      console.log('⚠️ Algunos documentos no se pudieron borrar.');
    }
    
    console.log(`\n📈 RESUMEN:`);
    console.log(`   Documentos iniciales: ${beforeSnapshot.size}`);
    console.log(`   Documentos borrados: ${deletedCount}`);
    console.log(`   Documentos restantes: ${afterSnapshot.size}`);
    
    console.log('\n🎯 SIGUIENTE PASO:');
    console.log('• Ahora puedes hacer consultas en el chat para generar nuevas métricas');
    console.log('• Verifica que las métricas se registren correctamente en tiempo real');
    console.log('• Revisa el dashboard de AdminMetrics para confirmar que se populan los datos');
    
  } catch (error) {
    console.error('❌ Error borrando métricas:', error);
  }
}

clearAllMetrics().catch(console.error);

const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'wearecity-2ab89'
  });
}

const db = admin.firestore();

async function clearRAGData() {
  console.log('🧹 Starting RAG data cleanup...');
  
  try {
    const collections = [
      'document_chunks',
      'rag_conversations', 
      'library_sources_enhanced'
    ];
    
    let totalDeleted = 0;
    
    // Limpiar cada colección
    for (const collectionName of collections) {
      console.log(`🗑️ Clearing collection: ${collectionName}`);
      
      const collectionRef = db.collection(collectionName);
      const snapshot = await collectionRef.get();
      
      if (snapshot.empty) {
        console.log(`✅ Collection ${collectionName} is already empty`);
        continue;
      }
      
      // Eliminar documentos en lotes
      const batch = db.batch();
      let batchCount = 0;
      
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        batchCount++;
      });
      
      if (batchCount > 0) {
        await batch.commit();
        console.log(`✅ Deleted ${batchCount} documents from ${collectionName}`);
        totalDeleted += batchCount;
      }
    }
    
    // Limpiar configuración RAG
    console.log('🗑️ Clearing RAG configuration...');
    try {
      await db.collection('_config').doc('rag').delete();
      console.log('✅ RAG configuration cleared');
      totalDeleted += 1;
    } catch (error) {
      console.log('ℹ️ RAG configuration was already empty or doesn\'t exist');
    }
    
    console.log(`🎉 RAG cleanup completed! Total documents deleted: ${totalDeleted}`);
    
  } catch (error) {
    console.error('❌ Error clearing RAG data:', error);
    throw error;
  }
}

// Ejecutar la limpieza
clearRAGData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });


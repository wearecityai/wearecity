import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const clearAllMetrics = functions.https.onRequest(async (req, res) => {
  try {
    console.log('🗑️ Starting to clear all metrics...');
    
    // Verificar método HTTP
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed. Use POST.');
      return;
    }
    
    // 1. Contar documentos antes de borrar
    const beforeSnapshot = await db.collection('chat_analytics').get();
    const initialCount = beforeSnapshot.size;
    console.log(`📊 Documents found: ${initialCount}`);
    
    if (initialCount === 0) {
      res.json({
        success: true,
        message: 'No documents to delete',
        deletedCount: 0,
        initialCount: 0
      });
      return;
    }
    
    // 2. Borrar todos los documentos en lotes
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
      console.log(`🗑️ Deleted ${deletedCount} documents...`);
    }
    
    // 3. Verificar que se borraron todos
    const afterSnapshot = await db.collection('chat_analytics').get();
    const remainingCount = afterSnapshot.size;
    
    console.log(`📈 Summary: ${initialCount} initial, ${deletedCount} deleted, ${remainingCount} remaining`);
    
    res.json({
      success: true,
      message: remainingCount === 0 ? 'All documents deleted successfully' : 'Some documents could not be deleted',
      initialCount,
      deletedCount,
      remainingCount
    });
    
  } catch (error) {
    console.error('❌ Error clearing metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

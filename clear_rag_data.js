import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function clearRAGData() {
  try {
    console.log('🗑️ Clearing all RAG data...');
    
    // 1. Delete all document chunks
    console.log('📄 Deleting document chunks...');
    const chunksSnapshot = await db.collection('document_chunks').get();
    console.log(`Found ${chunksSnapshot.size} chunks to delete`);
    
    const chunkBatch = db.batch();
    chunksSnapshot.docs.forEach(doc => {
      chunkBatch.delete(doc.ref);
    });
    await chunkBatch.commit();
    console.log('✅ Document chunks deleted');
    
    // 2. Delete all library sources
    console.log('📚 Deleting library sources...');
    const sourcesSnapshot = await db.collection('library_sources_enhanced').get();
    console.log(`Found ${sourcesSnapshot.size} sources to delete`);
    
    const sourceBatch = db.batch();
    sourcesSnapshot.docs.forEach(doc => {
      sourceBatch.delete(doc.ref);
    });
    await sourceBatch.commit();
    console.log('✅ Library sources deleted');
    
    // 3. Verify deletion
    const finalChunksSnapshot = await db.collection('document_chunks').get();
    const finalSourcesSnapshot = await db.collection('library_sources_enhanced').get();
    
    console.log('📊 Final counts:');
    console.log(`- Document chunks: ${finalChunksSnapshot.size}`);
    console.log(`- Library sources: ${finalSourcesSnapshot.size}`);
    
    console.log('🎉 RAG data cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing RAG data:', error);
  }
}

clearRAGData();

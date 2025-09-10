import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function checkRAGData() {
  try {
    console.log('🔍 Checking RAG data...');
    
    // Check library_sources_enhanced
    const sourcesSnapshot = await db.collection('library_sources_enhanced').get();
    console.log('📊 library_sources_enhanced:', sourcesSnapshot.size, 'documents');
    
    if (sourcesSnapshot.size > 0) {
      sourcesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('📄 Source:', data.title, '- City:', data.citySlug, '- User:', data.userId);
      });
    }
    
    // Check document_chunks
    const chunksSnapshot = await db.collection('document_chunks').get();
    console.log('📊 document_chunks:', chunksSnapshot.size, 'documents');
    
    if (chunksSnapshot.size > 0) {
      chunksSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('📄 Chunk:', data.sourceId, '- Index:', data.chunkIndex, '- Has embedding:', !!data.embedding);
      });
    }
    
    // Check if we have any data for La Vila Joiosa
    const vilaJoiosaSources = await db.collection('library_sources_enhanced')
      .where('citySlug', '==', 'la-vila-joiosa')
      .get();
    console.log('🏛️ La Vila Joiosa sources:', vilaJoiosaSources.size);
    
    if (vilaJoiosaSources.size > 0) {
      vilaJoiosaSources.forEach(doc => {
        const data = doc.data();
        console.log('📄 Vila Joiosa Source:', data.title, '- URL:', data.url);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRAGData();

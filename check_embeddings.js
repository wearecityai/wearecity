import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function checkEmbeddings() {
  try {
    console.log('🔍 Checking embeddings in sources...');
    
    const sourcesSnapshot = await db.collection('library_sources_enhanced')
        .where('citySlug', '==', 'la-vila-joiosa')
        .where('userId', '==', 'anonymous')
        .get();
    
    console.log('📊 Total sources for anonymous user:', sourcesSnapshot.size);
    
    let withEmbedding = 0;
    let withoutEmbedding = 0;
    
    sourcesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.embedding && data.embedding.length > 0) {
        withEmbedding++;
        console.log('✅ Source with embedding:', data.title);
      } else {
        withoutEmbedding++;
        console.log('❌ Source without embedding:', data.title);
      }
    });
    
    console.log('📊 Sources with embedding:', withEmbedding);
    console.log('📊 Sources without embedding:', withoutEmbedding);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkEmbeddings();

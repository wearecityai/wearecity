import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function testRAGSearch() {
  try {
    console.log('🔍 Testing RAG search...');
    
    const query = 'eventos esta semana';
    const userId = 'anonymous'; // This is likely the issue
    const citySlug = 'la-vila-joiosa';
    
    console.log('📊 Query:', query);
    console.log('👤 User ID:', userId);
    console.log('🏛️ City Slug:', citySlug);
    
    // 1. Retrieve relevant sources based on citySlug and userId
    let sourcesRef = db.collection('library_sources_enhanced')
        .where('citySlug', '==', citySlug)
        .where('userId', '==', userId);

    const sourceDocs = await sourcesRef.get();
    console.log('📊 Sources found:', sourceDocs.size);
    
    if (sourceDocs.empty) {
        console.log('ℹ️ No sources found for this user and city.');
        
        // Let's check what users exist
        const allSources = await db.collection('library_sources_enhanced')
            .where('citySlug', '==', citySlug)
            .get();
        
        console.log('📊 All sources for city:', allSources.size);
        const userIds = new Set();
        allSources.forEach(doc => {
            const data = doc.data();
            userIds.add(data.userId);
        });
        console.log('👥 Available user IDs:', Array.from(userIds));
        
        return;
    }
    
    console.log('✅ Found sources, proceeding with search...');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testRAGSearch();

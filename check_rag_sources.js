import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'wearecity-2ab89'
    });
}

const db = admin.firestore();

async function checkRAGSources() {
    try {
        console.log('🔍 Checking RAG sources in database...');
        
        // Get all sources
        const sourcesSnapshot = await db.collection('library_sources_enhanced')
            .where('citySlug', '==', 'la-vila-joiosa')
            .get();
        
        console.log(`📊 Found ${sourcesSnapshot.size} sources for la-vila-joiosa:`);
        
        sourcesSnapshot.forEach((doc, index) => {
            const data = doc.data();
            console.log(`\n--- SOURCE ${index + 1} ---`);
            console.log(`ID: ${doc.id}`);
            console.log(`Title: ${data.title}`);
            console.log(`URL: ${data.url}`);
            console.log(`User: ${data.userId}`);
            console.log(`Content length: ${data.content?.length || 0} characters`);
            console.log(`Content preview: ${data.content?.substring(0, 200)}...`);
            
            // Check if it has chunks
            console.log(`Has chunks: ${data.hasChunks || false}`);
        });
        
        // Check chunks for each source
        console.log('\n🔍 Checking chunks for each source...');
        
        for (const doc of sourcesSnapshot.docs) {
            const sourceId = doc.id;
            const chunksSnapshot = await db.collection('document_chunks')
                .where('sourceId', '==', sourceId)
                .limit(3)
                .get();
            
            console.log(`\n📄 Source "${doc.data().title}" has ${chunksSnapshot.size} chunks:`);
            
            chunksSnapshot.forEach((chunkDoc, index) => {
                const chunkData = chunkDoc.data();
                console.log(`  Chunk ${index + 1}: ${chunkData.content?.substring(0, 100)}...`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error checking RAG sources:', error);
    }
}

checkRAGSources();

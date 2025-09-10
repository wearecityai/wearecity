import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'wearecity-2ab89'
    });
}

const db = admin.firestore();

async function debugSourceContent() {
    try {
        console.log('🔍 Debugging source content...');
        
        // Get the specific source
        const sourceDoc = await db.collection('library_sources_enhanced')
            .doc('5VcNi3N4yaVpAStnoEvk')
            .get();
        
        if (!sourceDoc.exists) {
            console.log('❌ Source not found');
            return;
        }
        
        const data = sourceDoc.data();
        console.log('📄 Source data:');
        console.log('Title:', data.title);
        console.log('URL:', data.url);
        console.log('Content length:', data.content?.length || 0);
        console.log('\n📝 Full content:');
        console.log('='.repeat(80));
        console.log(data.content);
        console.log('='.repeat(80));
        
        // Check chunks
        console.log('\n🔍 Checking all chunks:');
        const chunksSnapshot = await db.collection('document_chunks')
            .where('sourceId', '==', '5VcNi3N4yaVpAStnoEvk')
            .orderBy('chunkIndex')
            .get();
        
        console.log(`Found ${chunksSnapshot.size} chunks:`);
        
        chunksSnapshot.forEach((chunkDoc, index) => {
            const chunkData = chunkDoc.data();
            console.log(`\n--- CHUNK ${chunkData.chunkIndex} ---`);
            console.log(`Content: ${chunkData.content}`);
            console.log(`Length: ${chunkData.content?.length || 0} characters`);
        });
        
    } catch (error) {
        console.error('❌ Error debugging source content:', error);
    }
}

debugSourceContent();

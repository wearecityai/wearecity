import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'wearecity-2ab89'
    });
}

const db = admin.firestore();

async function debugChunks() {
    try {
        console.log('🔍 Debugging chunks content...');
        
        // Get all chunks for the source
        const chunksSnapshot = await db.collection('document_chunks')
            .where('sourceId', '==', '5VcNi3N4yaVpAStnoEvk')
            .limit(5)
            .get();
        
        console.log(`📄 Found ${chunksSnapshot.size} chunks:`);
        
        chunksSnapshot.forEach((chunkDoc, index) => {
            const chunkData = chunkDoc.data();
            console.log(`\n--- CHUNK ${index + 1} ---`);
            console.log(`Index: ${chunkData.chunkIndex}`);
            console.log(`Content: ${chunkData.content.substring(0, 200)}...`);
            
            // Test keyword matching
            const query = 'como darme de alta en el padron?';
            const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
            console.log(`Query words: ${queryWords.join(', ')}`);
            
            const content = chunkData.content.toLowerCase();
            const matches = queryWords.filter(word => content.includes(word));
            console.log(`Matches: ${matches.join(', ')}`);
        });
        
        // Test the exact search logic
        console.log('\n🔍 Testing search logic:');
        const query = 'como darme de alta en el padron?';
        const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
        console.log(`Query: "${query}"`);
        console.log(`Query words: [${queryWords.join(', ')}]`);
        
        const allChunks = [];
        chunksSnapshot.forEach(chunkDoc => {
            const chunkData = chunkDoc.data();
            allChunks.push({
                content: chunkData.content,
                sourceId: chunkDoc.id,
                chunkIndex: chunkData.chunkIndex
            });
        });
        
        const relevantChunks = allChunks.filter(chunk => {
            const content = chunk.content.toLowerCase();
            return queryWords.some(word => content.includes(word));
        });
        
        console.log(`\n📊 Results:`);
        console.log(`Total chunks: ${allChunks.length}`);
        console.log(`Relevant chunks: ${relevantChunks.length}`);
        
        if (relevantChunks.length === 0) {
            console.log('\n❌ No relevant chunks found. Let\'s check what words are in the content:');
            allChunks.forEach((chunk, index) => {
                const content = chunk.content.toLowerCase();
                const words = content.split(/\s+/).filter(word => word.length > 2);
                console.log(`Chunk ${index + 1} words: ${words.slice(0, 20).join(', ')}...`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error debugging chunks:', error);
    }
}

debugChunks();

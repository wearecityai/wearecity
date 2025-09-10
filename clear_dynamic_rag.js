// Using Firebase Admin

import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'wearecity-2ab89'
    });
}

const db = admin.firestore();

async function clearDynamicRAG() {
    try {
        console.log('🗑️ Clearing Dynamic RAG data...');
        
        // Eliminar todas las respuestas de RAG dinámico
        console.log('🔄 Clearing rag_dynamic_responses...');
        const dynamicResponsesSnapshot = await db.collection('rag_dynamic_responses').get();
        const dynamicResponseBatch = db.batch();
        dynamicResponsesSnapshot.docs.forEach(doc => {
            dynamicResponseBatch.delete(doc.ref);
        });
        await dynamicResponseBatch.commit();
        console.log(`✅ Deleted ${dynamicResponsesSnapshot.size} responses from rag_dynamic_responses`);
        
        // Eliminar todos los chunks de RAG dinámico
        console.log('📄 Clearing rag_dynamic_chunks...');
        const dynamicChunksSnapshot = await db.collection('rag_dynamic_chunks').get();
        const dynamicChunkBatch = db.batch();
        dynamicChunksSnapshot.docs.forEach(doc => {
            dynamicChunkBatch.delete(doc.ref);
        });
        await dynamicChunkBatch.commit();
        console.log(`✅ Deleted ${dynamicChunksSnapshot.size} chunks from rag_dynamic_chunks`);
        
        console.log('\n🎉 DYNAMIC RAG DATA CLEARED SUCCESSFULLY!');
        console.log('📊 Summary:');
        console.log(`   - Dynamic responses deleted: ${dynamicResponsesSnapshot.size}`);
        console.log(`   - Dynamic chunks deleted: ${dynamicChunksSnapshot.size}`);
        
        console.log('\n🚀 The RAG system is now completely clean and ready for fresh dynamic learning!');
        
    } catch (error) {
        console.error('❌ Error clearing dynamic RAG data:', error);
    }
}

clearDynamicRAG();

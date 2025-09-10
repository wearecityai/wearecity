// Using native fetch and Firebase Admin

import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'wearecity-2ab89'
    });
}

const db = admin.firestore();

async function clearAllRAGData() {
    try {
        console.log('🗑️ Clearing ALL RAG data...');
        
        // 1. Eliminar todas las fuentes de RAG estático
        console.log('📚 Clearing library_sources_enhanced...');
        const sourcesSnapshot = await db.collection('library_sources_enhanced').get();
        const sourceBatch = db.batch();
        sourcesSnapshot.docs.forEach(doc => {
            sourceBatch.delete(doc.ref);
        });
        await sourceBatch.commit();
        console.log(`✅ Deleted ${sourcesSnapshot.size} sources from library_sources_enhanced`);
        
        // 2. Eliminar todos los chunks de RAG estático
        console.log('📄 Clearing document_chunks...');
        const chunksSnapshot = await db.collection('document_chunks').get();
        const chunkBatch = db.batch();
        chunksSnapshot.docs.forEach(doc => {
            chunkBatch.delete(doc.ref);
        });
        await chunkBatch.commit();
        console.log(`✅ Deleted ${chunksSnapshot.size} chunks from document_chunks`);
        
        // 3. Eliminar todas las respuestas de RAG dinámico
        console.log('🔄 Clearing rag_dynamic_responses...');
        const dynamicResponsesSnapshot = await db.collection('rag_dynamic_responses').get();
        const dynamicResponseBatch = db.batch();
        dynamicResponsesSnapshot.docs.forEach(doc => {
            dynamicResponseBatch.delete(doc.ref);
        });
        await dynamicResponseBatch.commit();
        console.log(`✅ Deleted ${dynamicResponsesSnapshot.size} responses from rag_dynamic_responses`);
        
        // 4. Eliminar todos los chunks de RAG dinámico
        console.log('📄 Clearing rag_dynamic_chunks...');
        const dynamicChunksSnapshot = await db.collection('rag_dynamic_chunks').get();
        const dynamicChunkBatch = db.batch();
        dynamicChunksSnapshot.docs.forEach(doc => {
            dynamicChunkBatch.delete(doc.ref);
        });
        await dynamicChunkBatch.commit();
        console.log(`✅ Deleted ${dynamicChunksSnapshot.size} chunks from rag_dynamic_chunks`);
        
        console.log('\n🎉 ALL RAG DATA CLEARED SUCCESSFULLY!');
        console.log('📊 Summary:');
        console.log(`   - Sources deleted: ${sourcesSnapshot.size}`);
        console.log(`   - Static chunks deleted: ${chunksSnapshot.size}`);
        console.log(`   - Dynamic responses deleted: ${dynamicResponsesSnapshot.size}`);
        console.log(`   - Dynamic chunks deleted: ${dynamicChunksSnapshot.size}`);
        
        console.log('\n🚀 The RAG system is now completely clean and ready for dynamic learning!');
        
    } catch (error) {
        console.error('❌ Error clearing RAG data:', error);
    }
}

clearAllRAGData();

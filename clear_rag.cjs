// Script para borrar toda la información del RAG dinámico

const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'wearecity-2ab89'
    });
}

const db = admin.firestore();

async function clearRAG() {
    try {
        console.log('🗑️ Borrando toda la información del RAG dinámico...\n');
        
        // Borrar todas las respuestas del RAG dinámico
        console.log('📊 Borrando respuestas del RAG dinámico...');
        const responsesSnapshot = await db.collection('rag_dynamic_responses').get();
        console.log(`📈 Encontradas ${responsesSnapshot.size} respuestas para borrar`);
        
        const batch1 = db.batch();
        responsesSnapshot.docs.forEach(doc => {
            batch1.delete(doc.ref);
        });
        await batch1.commit();
        console.log('✅ Respuestas del RAG dinámico borradas');
        
        // Borrar todos los chunks del RAG dinámico
        console.log('\n📊 Borrando chunks del RAG dinámico...');
        const chunksSnapshot = await db.collection('rag_dynamic_chunks').get();
        console.log(`📈 Encontrados ${chunksSnapshot.size} chunks para borrar`);
        
        const batch2 = db.batch();
        chunksSnapshot.docs.forEach(doc => {
            batch2.delete(doc.ref);
        });
        await batch2.commit();
        console.log('✅ Chunks del RAG dinámico borrados');
        
        // Verificar que se borró todo
        console.log('\n🔍 Verificando que se borró todo...');
        const finalResponsesSnapshot = await db.collection('rag_dynamic_responses').get();
        const finalChunksSnapshot = await db.collection('rag_dynamic_chunks').get();
        
        console.log(`📊 Respuestas restantes: ${finalResponsesSnapshot.size}`);
        console.log(`📊 Chunks restantes: ${finalChunksSnapshot.size}`);
        
        if (finalResponsesSnapshot.size === 0 && finalChunksSnapshot.size === 0) {
            console.log('\n🎉 ¡RAG dinámico completamente limpio!');
            console.log('✅ El sistema empezará a aprender desde cero');
        } else {
            console.log('\n⚠️ Aún quedan datos en el RAG');
        }
        
    } catch (error) {
        console.error('❌ Error borrando RAG:', error);
    }
}

clearRAG();

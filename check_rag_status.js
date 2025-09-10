// Using Firebase Admin

import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'wearecity-2ab89'
    });
}

const db = admin.firestore();

async function checkRAGStatus() {
    try {
        console.log('🔍 Checking RAG status...');
        
        // Verificar RAG estático
        console.log('\n📚 Checking library_sources_enhanced...');
        const sourcesSnapshot = await db.collection('library_sources_enhanced').get();
        console.log(`   Sources found: ${sourcesSnapshot.size}`);
        
        console.log('\n📄 Checking document_chunks...');
        const chunksSnapshot = await db.collection('document_chunks').get();
        console.log(`   Chunks found: ${chunksSnapshot.size}`);
        
        // Verificar RAG dinámico
        console.log('\n🔄 Checking rag_dynamic_responses...');
        const dynamicResponsesSnapshot = await db.collection('rag_dynamic_responses').get();
        console.log(`   Dynamic responses found: ${dynamicResponsesSnapshot.size}`);
        
        console.log('\n📄 Checking rag_dynamic_chunks...');
        const dynamicChunksSnapshot = await db.collection('rag_dynamic_chunks').get();
        console.log(`   Dynamic chunks found: ${dynamicChunksSnapshot.size}`);
        
        // Mostrar detalles si hay datos
        if (sourcesSnapshot.size > 0) {
            console.log('\n📚 Sources details:');
            sourcesSnapshot.docs.forEach((doc, index) => {
                const data = doc.data();
                console.log(`   ${index + 1}. ${data.title || 'No title'} (${data.userId})`);
            });
        }
        
        if (dynamicResponsesSnapshot.size > 0) {
            console.log('\n🔄 Dynamic responses details:');
            dynamicResponsesSnapshot.docs.forEach((doc, index) => {
                const data = doc.data();
                console.log(`   ${index + 1}. Query: "${data.query}" (${data.userId})`);
            });
        }
        
        const totalData = sourcesSnapshot.size + chunksSnapshot.size + dynamicResponsesSnapshot.size + dynamicChunksSnapshot.size;
        
        if (totalData === 0) {
            console.log('\n✅ RAG is completely clean!');
        } else {
            console.log(`\n❌ RAG still has ${totalData} items!`);
        }
        
    } catch (error) {
        console.error('❌ Error checking RAG status:', error);
    }
}

checkRAGStatus();

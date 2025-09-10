// Script para revisar qué está almacenado en el RAG dinámico

const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'wearecity-2ab89'
    });
}

const db = admin.firestore();

async function checkRAGContent() {
    try {
        console.log('🔍 Revisando contenido del RAG dinámico...\n');
        
        // Revisar respuestas almacenadas
        console.log('📊 === RESPUESTAS ALMACENADAS ===');
        const responsesSnapshot = await db.collection('rag_dynamic_responses')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        
        console.log(`📈 Total de respuestas almacenadas: ${responsesSnapshot.size}\n`);
        
        responsesSnapshot.forEach((doc, index) => {
            const data = doc.data();
            console.log(`📝 Respuesta ${index + 1}:`);
            console.log(`   Query: "${data.query}"`);
            console.log(`   Model: ${data.modelUsed}`);
            console.log(`   Search: ${data.searchPerformed}`);
            console.log(`   City: ${data.citySlug}`);
            console.log(`   User: ${data.userId}`);
            console.log(`   Timestamp: ${data.timestamp?.toDate?.() || data.timestamp}`);
            console.log(`   Response length: ${data.response?.length || 0} chars`);
            console.log(`   Response preview: "${data.response?.substring(0, 100)}..."`);
            console.log('   ---');
        });
        
        // Revisar chunks almacenados
        console.log('\n📊 === CHUNKS ALMACENADOS ===');
        const chunksSnapshot = await db.collection('rag_dynamic_chunks')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        
        console.log(`📈 Total de chunks almacenados: ${chunksSnapshot.size}\n`);
        
        chunksSnapshot.forEach((doc, index) => {
            const data = doc.data();
            console.log(`📄 Chunk ${index + 1}:`);
            console.log(`   City: ${data.citySlug}`);
            console.log(`   User: ${data.userId}`);
            console.log(`   Response ID: ${data.responseId}`);
            console.log(`   Chunk Index: ${data.chunkIndex}`);
            console.log(`   Content length: ${data.content?.length || 0} chars`);
            console.log(`   Content preview: "${data.content?.substring(0, 100)}..."`);
            console.log('   ---');
        });
        
        // Revisar qué se está almacenando vs qué no
        console.log('\n📊 === ANÁLISIS DE ALMACENAMIENTO ===');
        
        const allResponses = await db.collection('rag_dynamic_responses').get();
        const relevantResponses = allResponses.docs.filter(doc => {
            const data = doc.data();
            return data.query && data.response && data.response.length > 100;
        });
        
        console.log(`✅ Respuestas relevantes almacenadas: ${relevantResponses.length}`);
        console.log(`❌ Respuestas no relevantes: ${allResponses.size - relevantResponses.length}`);
        
        // Mostrar ejemplos de qué se almacena
        console.log('\n📝 === EJEMPLOS DE QUÉ SE ALMACENA ===');
        relevantResponses.slice(0, 5).forEach((doc, index) => {
            const data = doc.data();
            console.log(`${index + 1}. Query: "${data.query}"`);
            console.log(`   Almacenado: ${data.response.length > 100 ? 'SÍ' : 'NO'}`);
            console.log(`   Razón: ${data.response.length > 100 ? 'Respuesta larga y detallada' : 'Respuesta muy corta'}`);
            console.log('   ---');
        });
        
    } catch (error) {
        console.error('❌ Error revisando contenido del RAG:', error);
    }
}

checkRAGContent();

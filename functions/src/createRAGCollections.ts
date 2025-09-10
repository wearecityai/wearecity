import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import cors from 'cors';

// Configure CORS
const corsHandler = cors({ origin: true });

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Crear las colecciones RAG necesarias con documentos de ejemplo
 */
export const createRAGCollectionsData = async () => {
  console.log('🔧 Creating RAG collections...');
  
  try {
    // Crear documento ejemplo en document_chunks
    await db.collection('document_chunks').doc('example-chunk').set({
      sourceId: 'library_sources_enhanced/example',
      chunkIndex: 0,
      text: 'Este es un ejemplo de contenido para testing del sistema RAG.',
      embedding: null, // Se llenará cuando se generen los embeddings
      metadata: {
        startIndex: 0,
        endIndex: 58,
        wordCount: 12,
        language: 'es'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ document_chunks collection created');

    // Crear documento ejemplo en rag_conversations  
    await db.collection('rag_conversations').doc('example-conversation').set({
      userId: 'example-user',
      citySlug: 'example-city',
      messages: [
        {
          role: 'user',
          content: '¿Qué información tienes disponible?',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          role: 'assistant',
          content: 'Tengo información sobre testing del sistema RAG.',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          sourcesUsed: ['library_sources_enhanced/example']
        }
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ rag_conversations collection created');

    // Crear documento de configuración RAG
    await db.collection('_config').doc('rag').set({
      initialized: true,
      version: '1.0.0',
      features: {
        webScraping: true,
        documentProcessing: true,
        embeddingGeneration: true,
        vectorSearch: true,
        hybridSearch: true
      },
      vectorSearchConfig: {
        embeddingModel: 'textembedding-gecko@003',
        dimensions: 768,
        similarity: 'cosine'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('✅ RAG configuration created');

    return {
      success: true,
      message: 'RAG collections created successfully',
      collections: ['document_chunks', 'rag_conversations', '_config/rag']
    };
    
  } catch (error) {
    console.error('❌ Error creating RAG collections:', error);
    throw error;
  }
};

/**
 * Firebase Function para crear colecciones RAG
 */
export const createRAGCollections = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      console.log('🚀 Creating RAG collections...');
      
      const result = await createRAGCollectionsData();
      
      res.status(200).json({
        success: true,
        message: 'RAG collections created successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ Error creating RAG collections:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create RAG collections',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
});

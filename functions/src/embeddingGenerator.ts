import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface EmbeddingRequest {
  sourceId: string;
  userId: string;
  citySlug: string;
}

interface EmbeddingResult {
  success: boolean;
  chunksProcessed?: number;
  mainContentEmbedded?: boolean;
  error?: string;
}

/**
 * Generar embedding usando Google Gemini Embedding API
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found in environment or config');
    }
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generar embeddings en lotes para optimizar rendimiento
 */
async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found in environment or config');
    }
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    // Procesar en lotes de 5 para evitar límites de API
    const batchSize = 5;
    const results: number[][] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)}`);
      
      const batchPromises = batch.map(text => model.embedContent(text));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults.map(result => result.embedding.values));
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error generating batch embeddings:', error);
    throw error;
  }
}

/**
 * Firebase Function para generar embeddings de una fuente
 */
export const generateEmbeddings = functions.https.onCall(async (data: EmbeddingRequest, context): Promise<EmbeddingResult> => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { sourceId, userId, citySlug } = data;
  
  console.log('🧠 Generating embeddings for source:', sourceId);
  
  try {
    // Obtener fuente principal
    const sourceDoc = await db.collection('library_sources_enhanced').doc(sourceId).get();
    
    if (!sourceDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Source not found');
    }
    
    const sourceData = sourceDoc.data();
    if (!sourceData) {
      throw new functions.https.HttpsError('not-found', 'Source data not found');
    }
    
    // Obtener chunks de la fuente
    const chunksSnapshot = await db
      .collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .orderBy('chunkIndex')
      .get();
    
    console.log(`📊 Found ${chunksSnapshot.size} chunks to process`);
    
    const batch = db.batch();
    let chunksProcessed = 0;
    let mainContentEmbedded = false;
    
    // Generar embedding para contenido principal si existe
    const mainContent = sourceData.content;
    if (mainContent && mainContent.length > 0) {
      console.log('🧠 Generating embedding for main content...');
      const mainEmbedding = await generateEmbedding(mainContent);
      
      batch.update(sourceDoc.ref, {
        embedding: mainEmbedding,
        processingStatus: 'embedded',
        metadata: {
          ...sourceData.metadata,
          embeddingGenerated: true,
          embeddingLength: mainEmbedding.length,
          embeddedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      mainContentEmbedded = true;
      console.log('✅ Main content embedding generated');
    }
    
    // Generar embeddings para chunks
    if (chunksSnapshot.size > 0) {
      console.log('🧠 Generating embeddings for chunks...');
      
      const chunkTexts = chunksSnapshot.docs.map(doc => doc.data().content);
      const chunkEmbeddings = await generateBatchEmbeddings(chunkTexts);
      
      // Actualizar chunks con embeddings
      chunksSnapshot.docs.forEach((chunkDoc, index) => {
        batch.update(chunkDoc.ref, {
          embedding: chunkEmbeddings[index],
          metadata: {
            ...chunkDoc.data().metadata,
            embeddingGenerated: true,
            embeddingLength: chunkEmbeddings[index].length,
            embeddedAt: admin.firestore.FieldValue.serverTimestamp()
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        chunksProcessed++;
      });
      
      console.log(`✅ ${chunksProcessed} chunk embeddings generated`);
    }
    
    // Confirmar todos los cambios
    await batch.commit();
    console.log('💾 All embeddings saved to Firestore');
    
    return { 
      success: true, 
      chunksProcessed,
      mainContentEmbedded
    };
    
  } catch (error) {
    console.error('❌ Embedding generation error:', error);
    
    // Actualizar estado de error
    try {
      await db.collection('library_sources_enhanced').doc(sourceId).update({
        processingStatus: 'error',
        metadata: {
          ...(await db.collection('library_sources_enhanced').doc(sourceId).get()).data()?.metadata,
          embeddingError: error.message,
          embeddingErrorTimestamp: admin.firestore.FieldValue.serverTimestamp()
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (updateError) {
      console.error('❌ Error updating error status:', updateError);
    }
    
    return { 
      success: false, 
      error: error.message 
    };
  }
});

/**
 * Firebase Function para generar embeddings de múltiples fuentes
 */
export const generateBatchEmbeddings = functions.https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { sourceIds, userId, citySlug } = data;
  
  console.log('🧠 Generating batch embeddings for', sourceIds.length, 'sources');
  
  const results = [];
  
  for (const sourceId of sourceIds) {
    try {
      const result = await generateEmbeddings({ sourceId, userId, citySlug }, context);
      results.push({
        sourceId,
        success: result.success,
        chunksProcessed: result.chunksProcessed,
        mainContentEmbedded: result.mainContentEmbedded,
        error: result.error
      });
    } catch (error) {
      console.error(`❌ Error processing source ${sourceId}:`, error);
      results.push({
        sourceId,
        success: false,
        error: error.message
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;
  
  console.log(`✅ Batch processing completed: ${successCount} success, ${errorCount} errors`);
  
  return {
    success: true,
    totalProcessed: sourceIds.length,
    successCount,
    errorCount,
    results
  };
});

/**
 * Firebase Function para regenerar embeddings (útil para actualizaciones)
 */
export const regenerateEmbeddings = functions.https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, citySlug } = data;
  
  try {
    // Obtener todas las fuentes del usuario
    const sourcesSnapshot = await db
      .collection('library_sources_enhanced')
      .where('userId', '==', userId)
      .where('citySlug', '==', citySlug)
      .get();
    
    console.log(`🔄 Regenerating embeddings for ${sourcesSnapshot.size} sources`);
    
    const sourceIds = sourcesSnapshot.docs.map(doc => doc.id);
    
    return await generateBatchEmbeddings({ sourceIds, userId, citySlug }, context);
    
  } catch (error) {
    console.error('❌ Regeneration error:', error);
    throw new functions.https.HttpsError('internal', `Regeneration failed: ${error.message}`);
  }
});

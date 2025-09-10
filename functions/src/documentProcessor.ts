import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = new Storage();

interface DocumentProcessingRequest {
  documentUrl: string;
  sourceId: string;
  userId: string;
  citySlug: string;
}

interface DocumentChunk {
  content: string;
  metadata: {
    wordCount: number;
    chunkIndex: number;
    pageNumber?: number;
    section?: string;
  };
}

/**
 * Descargar documento desde URL
 */
async function downloadDocument(url: string): Promise<Buffer> {
  try {
    console.log('📥 Downloading document from:', url);
    
    // Para URLs de Firebase Storage
    if (url.includes('firebasestorage.googleapis.com')) {
      const bucket = storage.bucket();
      const fileName = url.split('/o/')[1]?.split('?')[0];
      if (fileName) {
        const file = bucket.file(decodeURIComponent(fileName));
        const [buffer] = await file.download();
        return buffer;
      }
    }
    
    // Para URLs externas
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('❌ Error downloading document:', error);
    throw error;
  }
}

/**
 * Extraer texto de PDF usando una librería simple
 * En producción se podría usar Document AI de Google Cloud
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Por ahora, simular extracción de texto
    // En producción, usar pdf-parse o Document AI
    console.log('📄 Extracting text from PDF...');
    
    // Simulación de extracción
    const mockText = `
    DOCUMENTO PDF PROCESADO
    
    Este es el contenido extraído del documento PDF.
    En una implementación real, aquí aparecería el texto real del PDF.
    
    SECCIÓN 1: INFORMACIÓN GENERAL
    Este documento contiene información importante sobre trámites municipales.
    
    SECCIÓN 2: REQUISITOS
    Los requisitos necesarios para realizar el trámite son:
    - Documento de identidad
    - Comprobante de domicilio
    - Formulario correspondiente
    
    SECCIÓN 3: PROCEDIMIENTO
    El procedimiento a seguir es:
    1. Presentar la documentación
    2. Pagar las tasas correspondientes
    3. Esperar la resolución
    
    Para más información, contactar con el ayuntamiento.
    `;
    
    return mockText.trim();
  } catch (error) {
    console.error('❌ Error extracting text from PDF:', error);
    throw error;
  }
}

/**
 * Dividir documento en chunks para procesamiento
 */
function chunkDocument(text: string, chunkSize: number = 1000): DocumentChunk[] {
  console.log('✂️ Chunking document...');
  
  const sentences = text.split(/[.!?]+/);
  const chunks: DocumentChunk[] = [];
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;
    
    // Si agregar esta oración excede el tamaño del chunk
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          wordCount: currentChunk.split(/\s+/).length,
          chunkIndex: chunkIndex++
        }
      });
      currentChunk = sentence + '. ';
    } else {
      currentChunk += sentence + '. ';
    }
  }
  
  // Agregar el último chunk si tiene contenido
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        wordCount: currentChunk.split(/\s+/).length,
        chunkIndex: chunkIndex++
      }
    });
  }
  
  console.log(`✅ Document chunked into ${chunks.length} pieces`);
  return chunks;
}

/**
 * Firebase Function para procesar documentos PDF
 */
export const processDocument = functions.https.onCall(async (data: DocumentProcessingRequest, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { documentUrl, sourceId, userId, citySlug } = data;
  
  console.log('📄 Processing document:', { documentUrl, sourceId });
  
  try {
    // 1. Descargar documento
    const documentBuffer = await downloadDocument(documentUrl);
    console.log('✅ Document downloaded, size:', documentBuffer.length);
    
    // 2. Extraer texto
    const extractedText = await extractTextFromPdf(documentBuffer);
    console.log('✅ Text extracted, length:', extractedText.length);
    
    // 3. Dividir en chunks
    const chunks = chunkDocument(extractedText);
    console.log('✅ Document chunked into', chunks.length, 'pieces');
    
    // 4. Guardar en Firestore usando batch
    const batch = db.batch();
    
    // Actualizar fuente principal
    const sourceRef = db.collection('library_sources_enhanced').doc(sourceId);
    batch.update(sourceRef, {
      content: extractedText,
      processingStatus: 'processed',
      metadata: {
        ...(await sourceRef.get()).data()?.metadata,
        extractedText,
        wordCount: extractedText.split(/\s+/).length,
        chunksCount: chunks.length,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Guardar chunks
    chunks.forEach((chunk) => {
      const chunkRef = db.collection('document_chunks').doc();
      batch.set(chunkRef, {
        sourceId,
        chunkIndex: chunk.metadata.chunkIndex,
        content: chunk.content,
        embedding: null, // Se generará después
        metadata: chunk.metadata,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    
    await batch.commit();
    console.log('💾 Document and chunks saved to Firestore');
    
    return { 
      success: true, 
      chunksCount: chunks.length,
      textLength: extractedText.length,
      message: 'Document processed successfully'
    };
    
  } catch (error) {
    console.error('❌ Document processing error:', error);
    
    // Actualizar estado de error en la fuente
    await db.collection('library_sources_enhanced').doc(sourceId).update({
      processingStatus: 'error',
      metadata: {
        ...(await db.collection('library_sources_enhanced').doc(sourceId).get()).data()?.metadata,
        error: error.message,
        errorTimestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    throw new functions.https.HttpsError('internal', `Document processing failed: ${error.message}`);
  }
});

/**
 * Firebase Function para procesar texto manual
 */
export const processManualText = functions.https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { title, content, userId, citySlug } = data;
  
  try {
    console.log('📝 Processing manual text:', { title, contentLength: content.length });
    
    // Dividir texto en chunks
    const chunks = chunkDocument(content);
    
    // Guardar fuente principal
    const docRef = await db.collection('library_sources_enhanced').add({
      userId,
      citySlug,
      type: 'text',
      title,
      originalUrl: '',
      content,
      documentLinks: [],
      processingStatus: 'processed',
      embedding: null,
      metadata: {
        wordCount: content.split(/\s+/).length,
        language: 'es',
        tags: [],
        extractedText: content,
        chunksCount: chunks.length,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Guardar chunks
    const batch = db.batch();
    chunks.forEach((chunk) => {
      const chunkRef = db.collection('document_chunks').doc();
      batch.set(chunkRef, {
        sourceId: docRef.id,
        chunkIndex: chunk.metadata.chunkIndex,
        content: chunk.content,
        embedding: null,
        metadata: chunk.metadata,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    
    await batch.commit();
    
    return {
      success: true,
      sourceId: docRef.id,
      chunksCount: chunks.length,
      textLength: content.length
    };
    
  } catch (error) {
    console.error('❌ Manual text processing error:', error);
    throw new functions.https.HttpsError('internal', `Text processing failed: ${error.message}`);
  }
});

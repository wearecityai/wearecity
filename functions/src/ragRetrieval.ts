import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface RAGRequest {
  query: string;
  userId: string;
  citySlug: string;
  conversationHistory?: Array<{ role: string; content: string; timestamp?: any }>;
  useHybridSearch?: boolean;
  maxSources?: number;
}

interface RAGResponse {
  success: boolean;
  response?: string;
  sourcesUsed?: number;
  modelUsed?: string;
  relevantSources?: any[];
  error?: string;
}

/**
 * Construir contexto RAG a partir de resultados de búsqueda
 */
function buildRAGContext(searchResults: any[]): string {
  if (!searchResults || searchResults.length === 0) {
    return 'No hay información relevante disponible en la biblioteca de conocimiento.';
  }
  
  const contextParts = searchResults.map((result, index) => {
    const source = result.source;
    const sourceInfo = source ? `Fuente: ${source.title}${source.originalUrl ? ` (${source.originalUrl})` : ''}` : 'Fuente desconocida';
    const similarity = result.similarity ? ` (Relevancia: ${Math.round(result.similarity * 100)}%)` : '';
    
    return `${index + 1}. ${result.content}\n   ${sourceInfo}${similarity}`;
  });
  
  return contextParts.join('\n\n');
}

/**
 * Construir prompt del sistema para RAG
 */
function buildSystemPrompt(citySlug: string, ragContext: string): string {
  return `Eres WeAreCity, el asistente inteligente de ${citySlug || 'la ciudad'}. 
Tienes acceso a información específica de la biblioteca de conocimiento local.

CONTEXTO DISPONIBLE DE LA BIBLIOTECA:
${ragContext}

INSTRUCCIONES CRÍTICAS:
- Usa SOLO la información proporcionada en el contexto de arriba
- Si no tienes información suficiente en el contexto, di claramente: "No tengo esa información específica en mi biblioteca de conocimiento"
- Cita las fuentes cuando uses información específica
- Responde de manera útil, precisa y profesional
- Si encuentras enlaces a documentos PDFs en el contexto, menciónalos como recursos adicionales
- Mantén un tono amigable y servicial
- Si la consulta es sobre trámites, proporciona información detallada paso a paso
- Si la consulta es sobre eventos, proporciona fechas, horarios y ubicaciones específicas
- Si la consulta es sobre lugares, proporciona direcciones y información práctica

FORMATO DE RESPUESTA:
- Responde directamente la pregunta del usuario
- Incluye información específica del contexto cuando sea relevante
- Menciona las fuentes utilizadas al final de tu respuesta
- Si hay documentos PDFs disponibles, inclúyelos como recursos adicionales

IMPORTANTE: Solo usa la información del contexto proporcionado. No inventes información que no esté en el contexto.`;
}

/**
 * Firebase Function para consulta RAG
 */
export const ragQuery = functions.https.onCall(async (data: RAGRequest, context): Promise<RAGResponse> => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { 
    query, 
    userId, 
    citySlug, 
    conversationHistory = [], 
    useHybridSearch = true,
    maxSources = 3 
  } = data;
  
  console.log('🤖 RAG query:', query.substring(0, 50) + '...');
  
  try {
    // 1. Búsqueda de información relevante
    let searchResults: any[] = [];
    
    if (useHybridSearch) {
      // Usar búsqueda híbrida
      const hybridSearch = functions.https.onCall(require('./vectorSearch').hybridSearch);
      const hybridResult = await hybridSearch({ query, userId, citySlug, limit: maxSources }, context);
      
      if (hybridResult.success) {
        searchResults = hybridResult.results || [];
        console.log(`🔍 Hybrid search found ${searchResults.length} relevant sources`);
      }
    } else {
      // Usar solo búsqueda vectorial
      const vectorSearch = functions.https.onCall(require('./vectorSearch').vectorSearch);
      const vectorResult = await vectorSearch({ query, userId, citySlug, limit: maxSources }, context);
      
      if (vectorResult.success) {
        searchResults = vectorResult.results || [];
        console.log(`🔍 Vector search found ${searchResults.length} relevant sources`);
      }
    }
    
    // 2. Construir contexto RAG
    const ragContext = buildRAGContext(searchResults);
    console.log('📚 RAG context built, length:', ragContext.length);
    
    // 3. Generar respuesta con Gemini 2.5 Flash-Lite
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const systemPrompt = buildSystemPrompt(citySlug, ragContext);
    
    // Construir historial de conversación si existe
    const conversationContext = conversationHistory.length > 0 
      ? `\n\nHISTORIAL DE CONVERSACIÓN:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
      : '';
    
    const fullPrompt = `${systemPrompt}${conversationContext}\n\nConsulta del usuario: ${query}`;
    
    console.log('🧠 Generating response with Gemini 2.5 Flash-Lite...');
    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();
    
    console.log('✅ Response generated, length:', response.length);
    
    // 4. Guardar conversación RAG
    const conversationRef = await db.collection('rag_conversations').add({
      userId,
      citySlug,
      messages: [
        ...conversationHistory,
        { 
          role: 'user', 
          content: query, 
          timestamp: admin.firestore.FieldValue.serverTimestamp() 
        },
        { 
          role: 'assistant', 
          content: response, 
          timestamp: admin.firestore.FieldValue.serverTimestamp() 
        }
      ],
      sourcesUsed: searchResults.map(result => result.sourceId),
      searchResults: searchResults.map(result => ({
        sourceId: result.sourceId,
        similarity: result.similarity,
        content: result.content.substring(0, 200) + '...'
      })),
      modelUsed: 'gemini-2.5-flash-lite',
      searchType: useHybridSearch ? 'hybrid' : 'vectorial',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('💾 RAG conversation saved with ID:', conversationRef.id);
    
    return { 
      success: true, 
      response,
      sourcesUsed: searchResults.length,
      modelUsed: 'gemini-2.5-flash-lite',
      relevantSources: searchResults.map(result => ({
        sourceId: result.sourceId,
        title: result.source?.title,
        url: result.source?.originalUrl,
        similarity: result.similarity,
        contentPreview: result.content.substring(0, 150) + '...'
      }))
    };
    
  } catch (error) {
    console.error('❌ RAG query error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

/**
 * Firebase Function para obtener historial de conversaciones RAG
 */
export const getRAGConversations = functions.https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, citySlug, limit = 10 } = data;
  
  try {
    const conversationsSnapshot = await db
      .collection('rag_conversations')
      .where('userId', '==', userId)
      .where('citySlug', '==', citySlug)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    const conversations = conversationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    }));
    
    return {
      success: true,
      conversations,
      count: conversations.length
    };
    
  } catch (error) {
    console.error('❌ Error getting RAG conversations:', error);
    throw new functions.https.HttpsError('internal', `Failed to get conversations: ${error.message}`);
  }
});

/**
 * Firebase Function para obtener estadísticas de RAG
 */
export const getRAGStats = functions.https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, citySlug } = data;
  
  try {
    // Estadísticas de fuentes
    const sourcesSnapshot = await db
      .collection('library_sources_enhanced')
      .where('userId', '==', userId)
      .where('citySlug', '==', citySlug)
      .get();
    
    const sourcesStats = {
      total: sourcesSnapshot.size,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      withEmbeddings: 0
    };
    
    sourcesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      sourcesStats.byType[data.type] = (sourcesStats.byType[data.type] || 0) + 1;
      sourcesStats.byStatus[data.processingStatus] = (sourcesStats.byStatus[data.processingStatus] || 0) + 1;
      if (data.embedding) sourcesStats.withEmbeddings++;
    });
    
    // Estadísticas de chunks
    const chunksSnapshot = await db
      .collection('document_chunks')
      .where('sourceId', 'in', sourcesSnapshot.docs.map(doc => doc.id))
      .get();
    
    // Estadísticas de conversaciones
    const conversationsSnapshot = await db
      .collection('rag_conversations')
      .where('userId', '==', userId)
      .where('citySlug', '==', citySlug)
      .get();
    
    return {
      success: true,
      stats: {
        sources: sourcesStats,
        chunks: {
          total: chunksSnapshot.size,
          withEmbeddings: chunksSnapshot.docs.filter(doc => doc.data().embedding).length
        },
        conversations: {
          total: conversationsSnapshot.size
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Error getting RAG stats:', error);
    throw new functions.https.HttpsError('internal', `Failed to get stats: ${error.message}`);
  }
});

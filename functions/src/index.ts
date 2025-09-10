import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
import { processUserQuery, processMultimodalQuery, classifyQueryComplexity } from './vertexAIService';

// Importar nuevas funciones RAG
import { setupRAGSystem } from './firestoreSetup';
import { createRAGCollections } from './createRAGCollections';
import { advancedScraping, advancedCrawling } from './advancedScraping';
import { processDocument, processManualText } from './documentProcessor';
import { generateEmbeddings, generateBatchEmbeddings, regenerateEmbeddings } from './embeddingGenerator';
import { vectorSearch, hybridSearch } from './vectorSearch';
import { ragQuery, getRAGConversations, getRAGStats } from './ragRetrieval';

// Inicializar Firebase Admin
admin.initializeApp();

// Configure CORS
const corsHandler = cors({ origin: true });

// Basic health check function
export const healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'WeAreCity Functions with Vertex AI are running'
  });
});

// Main AI chat endpoint
export const processAIChat = functions.https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        // For testing, allow unauthenticated access
        // TODO: Re-enable authentication in production
        let userId = 'test-user';
        
        // Verify authentication (commented out for testing)
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
          try {
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            if (decodedToken) {
              userId = decodedToken.uid;
            }
          } catch (authError) {
            console.log('Auth error, using test user:', authError);
          }
        }

        // Extract request data
        const { query, citySlug, cityContext: directCityContext, conversationHistory, mediaUrl, mediaType } = req.body;

        if (!query) {
          return res.status(400).json({ error: 'Query is required' });
        }

        // Get city context - either from direct parameter or citySlug lookup
        let cityContext = directCityContext || '';
        if (!cityContext && citySlug) {
          const cityDoc = await admin.firestore()
            .collection('cities')
            .where('slug', '==', citySlug)
            .limit(1)
            .get();

          if (!cityDoc.empty) {
            const cityData = cityDoc.docs[0].data();
            cityContext = cityData.name || '';
          }
        }

        let result;

        // Handle multimodal queries (images/documents)
        if (mediaUrl && mediaType) {
          console.log('🖼️ Processing multimodal query');
          const multimodalResult = await processMultimodalQuery(query, mediaUrl, mediaType, cityContext);
          result = {
            response: multimodalResult.text,
            events: multimodalResult.events,
            places: multimodalResult.places,
            modelUsed: 'gemini-2.5-pro',
            complexity: 'complex',
            searchPerformed: false,
            multimodal: true
          };
        } else {
          // Handle text queries
          console.log('💬 Processing text query');
          
          // 🎯 PASO 1: Intentar RAG primero
          console.log('🔍 Step 1: Trying RAG first...');
          const ragResult = await tryRAGFirst(query, userId, citySlug, cityContext);
          
          if (ragResult) {
            // RAG encontró información suficiente
            console.log('✅ RAG: Found sufficient information, using RAG response');
            result = ragResult;
          } else {
            // RAG no encontró suficiente información, usar router original
            console.log('🔄 RAG: Insufficient information, falling back to original router');
            result = await processUserQuery(query, cityContext, conversationHistory);
          }
        }

        // Log usage for monitoring
        await logAIUsage(userId, result.modelUsed, result.complexity, citySlug);

        return res.status(200).json({
          success: true,
          data: result
        });

      } catch (error) {
        console.error('Error in processAIChat:', error);
        return res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  });

// Query complexity classification endpoint
export const classifyQuery = functions
  .https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        const { query } = req.body;
        
        if (!query) {
          return res.status(400).json({ error: 'Query is required' });
        }

        const complexity = classifyQueryComplexity(query);
        
        return res.status(200).json({
          success: true,
          data: {
            query,
            complexity,
            modelRecommended: 'gemini-2.5-flash-lite'
          }
        });

      } catch (error) {
        console.error('Error in classifyQuery:', error);
        return res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  });

// Usage logging for monitoring and costs
const logAIUsage = async (
  userId: string,
  modelUsed: string,
  complexity: string,
  citySlug?: string
) => {
  try {
    const usageLog = {
      userId,
      modelUsed,
      complexity,
      citySlug: citySlug || null,
      timestamp: new Date(),
      region: 'us-central1'
    };

    await admin.firestore()
      .collection('ai_usage_logs')
      .add(usageLog);

  } catch (error) {
    console.error('Error logging AI usage:', error);
    // Don't fail the main request if logging fails
  }
};

// Export metrics functions
export { 
  initializeCategories, 
  recordChatMetric,
  getCityMetrics,
  cleanupOldMetrics,
  debugMetrics,
  migrateMetricsData,
  setupAndFixMetrics
} from './metricsService';

// Export clear metrics function
export { clearAllMetrics } from './clearMetrics';

// ===== NUEVAS FUNCIONES RAG =====

// Configuración inicial de RAG
export { setupRAGSystem };
export { createRAGCollections };

// Scraping avanzado
export const advancedScrapingFunction = functions.https.onCall(advancedScraping);
export const advancedCrawlingFunction = functions.https.onCall(advancedCrawling);

// Procesamiento de documentos
export const processDocumentFunction = functions.https.onCall(processDocument);
export const processManualTextFunction = functions.https.onCall(processManualText);

// Generación de embeddings
export const generateEmbeddingsFunction = functions.https.onCall(generateEmbeddings);
export const generateBatchEmbeddingsFunction = functions.https.onCall(generateBatchEmbeddings);
export const regenerateEmbeddingsFunction = functions.https.onCall(regenerateEmbeddings);

// Búsqueda vectorial
export const vectorSearchFunction = functions.https.onCall(vectorSearch);
export const hybridSearchFunction = functions.https.onCall(hybridSearch);

// RAG completo
export const ragQueryFunction = functions.https.onCall(ragQuery);
export const getRAGConversationsFunction = functions.https.onCall(getRAGConversations);
export const getRAGStatsFunction = functions.https.onCall(getRAGStats);

// Función de integración RAG híbrida
async function tryRAGFirst(query: string, userId: string, citySlug: string, cityContext: any): Promise<any | null> {
  try {
    console.log('🔍 RAG: Starting search for query:', query.substring(0, 50) + '...');
    
    // Buscar fuentes en Firestore directamente
    const db = admin.firestore();
    
    // Buscar fuentes para el usuario y ciudad
    const sourcesSnapshot = await db.collection('library_sources_enhanced')
      .where('userId', '==', userId)
      .where('citySlug', '==', citySlug)
      .limit(5)
      .get();
    
    if (sourcesSnapshot.empty) {
      console.log('❌ RAG: No sources found for user and city');
      return null;
    }
    
    console.log(`📊 RAG: Found ${sourcesSnapshot.size} sources`);
    
    // Buscar chunks relacionados
    const allChunks: any[] = [];
    
    for (const sourceDoc of sourcesSnapshot.docs) {
      const sourceId = sourceDoc.id;
      const chunksSnapshot = await db.collection('document_chunks')
        .where('sourceId', '==', sourceId)
        .limit(3)
        .get();
      
      chunksSnapshot.forEach(chunkDoc => {
        const chunkData = chunkDoc.data();
        allChunks.push({
          content: chunkData.content,
          sourceId: sourceId,
          chunkIndex: chunkData.chunkIndex
        });
      });
    }
    
    if (allChunks.length === 0) {
      console.log('❌ RAG: No chunks found');
      return null;
    }
    
    console.log(`📄 RAG: Found ${allChunks.length} chunks`);
    
    // Búsqueda simple por palabras clave
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const relevantChunks = allChunks.filter(chunk => {
      const content = chunk.content.toLowerCase();
      return queryWords.some(word => content.includes(word));
    });
    
    if (relevantChunks.length === 0) {
      console.log('❌ RAG: No relevant chunks found');
      return null;
    }
    
    console.log(`✅ RAG: Found ${relevantChunks.length} relevant chunks`);
    
    // Generar respuesta usando la información RAG
    const genAI = new (await import('@google/generative-ai')).GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const relevantContent = relevantChunks
      .map(chunk => chunk.content)
      .join('\n\n');
    
    const systemInstruction = `Eres un asistente virtual para ${cityContext || 'la ciudad'}. 
    
Responde a la consulta del usuario usando ÚNICAMENTE la información proporcionada a continuación.
Si la información no es suficiente para responder completamente, indica que tienes información parcial.

INFORMACIÓN DISPONIBLE:
${relevantContent}

INSTRUCCIONES:
- Responde de manera natural y conversacional
- Usa solo la información proporcionada
- Si necesitas más información, sugiere que el usuario haga una consulta más específica
- Mantén un tono amable y profesional`;

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: systemInstruction }] },
        { role: "user", parts: [{ text: query }] }
      ]
    });
    
    const response = result.response;
    const text = response.text();
    
    return {
      response: text,
      events: [],
      places: [],
      modelUsed: 'gemini-2.5-flash-lite',
      searchPerformed: false,
      ragUsed: true,
      ragResultsCount: relevantChunks.length,
      ragSearchType: 'text'
    };
    
  } catch (error) {
    console.error('❌ RAG: Error in tryRAGFirst:', error);
    return null;
  }
}
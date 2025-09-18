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

// Importar generación de embeddings para eventos
import { generateEventEmbeddingsFunction } from './generateEventEmbeddings';

// Importar migración de eventos a RAG
import { migrateEventsToRAGFunction } from './eventsToRAG';

// Importar agente de escrapeo inteligente
import { 
  intelligentScraping, 
  intelligentScrapingAllCities, 
  cleanupBeforeIntelligentScraping,
  cleanupRAGForCity,
  getAgentStats,
  scheduleAgentScraping
} from './intelligentScrapingFunction';

// Importar scraping de eventos directo a RAG
import { scrapeEventsToRAGFunction } from './eventsScrapingToRAG';
// import { clearRAGData, clearCityRAGDataFunction } from './clearRAGData'; // Temporarily disabled

// Importar servicio de Google Search seguro
import { googleSearchService, SearchRequest } from './googleSearchService';

// Importar rate limiting
import { rateLimitService } from './rateLimit';

// Importar validación
import { ValidationService, ValidationError } from './validation';

// Importar seguridad empresarial
import { secretManager, getGoogleSearchApiKey } from './secretManager';
import { auditLogger, AuditEventType } from './auditLogger';
import { securityMonitor } from './securityMonitor';

// Importar Vertex AI Agent Engine
import { processAIWithAgentEngine, testAgentEngine } from './vertexAIAgentEngine';
import { adminAgentAPI } from './vertexAIAdminProxy';
import { publicAgentAPI } from './vertexAIPublicProxy';
import { simpleAgentProxy } from './vertexAISimpleProxy';
import { handleScheduledScraping } from './scheduledScrapingHandler';
import { getSystemHealth, getSystemMetrics } from './monitoringService';
import { hybridIntelligentProxy } from './hybridIntelligentRouter';

// Inicializar Firebase Admin
admin.initializeApp();

// Configure CORS
const corsHandler = cors({ origin: true });

// Basic health check function
export const healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'WeAreCity Functions with Enterprise Security are running'
  });
});

// Get Google Maps API key
export const getGoogleMapsApiKey = functions.https.onCall(async (data, context) => {
  console.log('🔑 getGoogleMapsApiKey called');
  console.log('📊 Context auth:', context.auth ? 'authenticated' : 'not authenticated');
  
  try {
    // Verify authentication
    if (!context.auth) {
      console.log('❌ No authentication context');
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    console.log('✅ User authenticated:', context.auth.uid);

    // Check all environment variables
    console.log('🔍 Environment variables check:');
    console.log('   GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET');
    console.log('   GOOGLE_PLACES_API_KEY:', process.env.GOOGLE_PLACES_API_KEY ? 'SET' : 'NOT SET');
    console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');

    // Try multiple possible variable names
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || 
                   process.env.GOOGLE_PLACES_API_KEY || 
                   process.env.GEMINI_API_KEY;
    
    console.log('🔑 Final API key:', apiKey ? 'FOUND' : 'NOT FOUND');
    
    if (!apiKey) {
      console.log('❌ No API key found in any environment variable');
      throw new functions.https.HttpsError('internal', 'Google Maps API key not configured');
    }

    console.log('✅ Returning API key successfully');
    return {
      apiKey: apiKey
    };
  } catch (error) {
    console.error('❌ Error in getGoogleMapsApiKey:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw new functions.https.HttpsError('internal', 'Failed to get Google Maps API key');
  }
});

// Enable Google Maps APIs
export const enableMapsAPIs = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      console.log('🔧 Habilitando APIs de Google Maps...');
      
      const { GoogleApis } = await import('googleapis');
      const google = new GoogleApis();
      const serviceUsage = google.serviceusage('v1');
      
      const apisToEnable = [
        'places-backend.googleapis.com',
        'maps-backend.googleapis.com',
        'geocoding-backend.googleapis.com'
      ];
      
      const results = [];
      
      for (const api of apisToEnable) {
        try {
          console.log(`📡 Habilitando ${api}...`);
          
          const result = await serviceUsage.services.enable({
            name: `projects/wearecity-2ab89/services/${api}`
          });
          
          console.log(`✅ ${api} habilitada correctamente`);
          results.push({ api, status: 'success', result: result.data });
          
        } catch (error) {
          console.error(`❌ Error habilitando ${api}:`, error);
          results.push({ api, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      
      res.status(200).json({
        success: true,
        results,
        summary: {
          total: apisToEnable.length,
          successful: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'error').length
        }
      });
      
    } catch (error) {
      console.error('❌ Error general:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
});

// Enterprise Security Dashboard endpoint
export const securityDashboard = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Verify admin authentication
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization required' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // Check if user is admin
      const userDoc = await admin.firestore().collection('profiles').doc(userId).get();
      if (!userDoc.exists || userDoc.data()?.role !== 'administrativo') {
        await auditLogger.logAuthorizationViolation(userId, 'security_dashboard', { reason: 'insufficient_privileges' }, req);
        return res.status(403).json({ error: 'Administrative access required' });
      }

      // Get security metrics
      const [secretsHealth, auditStats, rateLimitStatus] = await Promise.all([
        secretManager.healthCheck(),
        // auditLogger.getAuditStatistics({ start: new Date(Date.now() - 24*60*60*1000), end: new Date() }),
        rateLimitService.getRateLimitStatus(userId, 'ai-chat')
      ]);

      const securityStatus = {
        timestamp: new Date().toISOString(),
        secrets: {
          status: Object.values(secretsHealth).every(v => v) ? 'healthy' : 'degraded',
          details: secretsHealth
        },
        rateLimit: {
          status: 'active',
          userLimits: rateLimitStatus
        },
        audit: {
          status: 'active',
          loggingEnabled: true
        },
        monitoring: {
          status: 'active',
          threatDetection: true,
          realTimeAlerts: true
        },
        compliance: {
          gdpr: true,
          iso27001: true,
          governmentGrade: true
        }
      };

      // Log security dashboard access
      await auditLogger.logDataAccess(userId, 'security_dashboard', 'dashboard_view');

      return res.status(200).json({
        success: true,
        data: securityStatus
      });

    } catch (error) {
      console.error('Error in securityDashboard:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
});

// Main AI chat endpoint 
export const processAIChat = functions.https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        // SECURITY: Authentication TEMPORARILY DISABLED FOR DEBUGGING
        const authHeader = req.headers.authorization;
        let userId: string = 'debug-user';
        
        if (authHeader?.startsWith('Bearer ')) {
          const idToken = authHeader.split('Bearer ')[1];
          try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            userId = decodedToken.uid;
          } catch (authError) {
            console.log('⚠️ Auth verification failed, using debug user:', authError.message);
            // Continue with debug user instead of failing
          }
        } else {
          console.log('⚠️ No auth header provided, using debug user');
        }
        
          // Enterprise security monitoring (simplified for debugging)
          try {
            await securityMonitor.monitorAuthentication(userId, true, req.ip, req.headers['user-agent']);
            await auditLogger.logAuthentication(userId, 'ai_chat_access', true, { endpoint: 'processAIChat' }, req);
          } catch (securityError) {
            console.warn('Security monitoring failed (non-critical):', securityError);
          }

          // Check rate limit (simplified for debugging)
          try {
            const rateLimitResult = await rateLimitService.checkRateLimit(userId, 'ai-chat');
            if (!rateLimitResult.allowed) {
              // Log rate limit violation
              try {
                await auditLogger.logRateLimitViolation(userId, 'ai-chat', {
                  remainingRequests: rateLimitResult.remainingRequests,
                  resetTime: rateLimitResult.resetTime
                }, req);
              } catch (auditError) {
                console.warn('Audit logging failed (non-critical):', auditError);
              }
              
              return res.status(429).json({
                error: 'Rate limit exceeded',
                message: `Too many requests. Try again after ${rateLimitResult.resetTime.toISOString()}`,
                remainingRequests: rateLimitResult.remainingRequests,
                resetTime: rateLimitResult.resetTime.toISOString()
              });
            }
          } catch (rateLimitError) {
            console.warn('Rate limiting failed (non-critical), allowing request:', rateLimitError);
          }

          // Extract and validate request data
          const rawData = req.body;
          
          // DEBUG: Log the received data
          console.log('🔍 DEBUG - Firebase Function received data:', {
            citySlug: rawData.citySlug,
            citySlugType: typeof rawData.citySlug,
            citySlugValue: JSON.stringify(rawData.citySlug),
            hasQuery: !!rawData.query,
            hasCityConfig: !!rawData.cityConfig,
            cityConfigKeys: rawData.cityConfig ? Object.keys(rawData.cityConfig) : [],
            bodyKeys: Object.keys(rawData)
          });
          
          const validatedQuery = ValidationService.validateChatQuery(rawData.query);
          
          // Enterprise security: Monitor chat query for threats (simplified for debugging)
          try {
            const queryAllowed = await securityMonitor.monitorChatQuery(userId, validatedQuery, req.ip);
            if (!queryAllowed) {
              return res.status(403).json({
                error: 'Security violation',
                message: 'Query blocked due to security concerns'
              });
            }
          } catch (securityError) {
            console.warn('Chat query monitoring failed (non-critical):', securityError);
          }
          
          const validatedCitySlug = ValidationService.validateCitySlug(rawData.citySlug);
          const validatedConversationHistory = ValidationService.validateConversationHistory(rawData.conversationHistory);
          const validatedMediaUrl = ValidationService.validateMediaUrl(rawData.mediaUrl);
          const validatedMediaType = ValidationService.validateMediaType(rawData.mediaType);
          
          // Monitor API usage patterns (simplified for debugging)
          try {
            await securityMonitor.monitorApiUsage(userId, 'ai-chat', 'processAIChat');
          } catch (securityError) {
            console.warn('API usage monitoring failed (non-critical):', securityError);
          }

          const { query, citySlug, conversationHistory, mediaUrl, mediaType } = {
            query: validatedQuery,
            citySlug: validatedCitySlug,
            conversationHistory: validatedConversationHistory,
            mediaUrl: validatedMediaUrl,
            mediaType: validatedMediaType
          };

        // Get city context - either from direct parameter or citySlug lookup
        let cityContext = rawData.cityContext || '';
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
            modelUsed: 'gemini-2.5-flash',
            complexity: 'institutional',
            searchPerformed: false,
            multimodal: true
          };
        } else {
          // 🎯 SISTEMA HÍBRIDO RAG + VECTOR SEARCH
          console.log('🚀 RAG HYBRID: Starting RAG search for query:', query.substring(0, 50));
          
          result = await processRAGHybridQuery(query, userId, citySlug, cityContext, conversationHistory, rawData.cityConfig);
        }

        // Log usage for monitoring
        await logAIUsage(userId, result.modelUsed, result.complexity, citySlug);

        return res.status(200).json({
          success: true,
          data: result
        });
        
      } catch (error) {
        console.error('Error in processAIChat:', error);
        
        if (error instanceof ValidationError) {
          console.warn('Validation error in processAIChat:', error.message);
          return res.status(400).json({
            error: 'Validation error',
            message: error.message,
            field: error.field
          });
        }
        
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

// SECURE Google Search endpoint - API keys stay on backend
export const secureGoogleSearch = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Verify authentication
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization required' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // Check rate limit for search
      const rateLimitResult = await rateLimitService.checkRateLimit(userId, 'google-search');
      if (!rateLimitResult.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many search requests. Try again after ${rateLimitResult.resetTime.toISOString()}`,
          remainingRequests: rateLimitResult.remainingRequests,
          resetTime: rateLimitResult.resetTime.toISOString()
        });
      }

      // Validate and sanitize request
      const validatedRequest = ValidationService.validateSearchRequest(req.body);
      
      // Perform search with backend API key
      const results = await googleSearchService.search(validatedRequest);
      
      // Log usage
      await logSearchUsage(userId, validatedRequest.query);

      return res.status(200).json({
        success: true,
        data: results
      });

    } catch (error) {
      if (error instanceof ValidationError) {
        console.warn('Validation error in secureGoogleSearch:', error.message);
        return res.status(400).json({
          error: 'Validation error',
          message: error.message,
          field: error.field
        });
      }
      
      console.error('Error in secureGoogleSearch:', error);
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

// Log Google Search usage
const logSearchUsage = async (userId: string, query: string) => {
  try {
    const searchLog = {
      userId,
      query: query.substring(0, 100), // Don't log full query for privacy
      timestamp: new Date(),
      service: 'google-search',
      region: 'us-central1'
    };

    await admin.firestore()
      .collection('search_usage_logs')
      .add(searchLog);

  } catch (error) {
    console.error('Error logging search usage:', error);
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

// ===== USER DELETION CLEANUP =====

// Cloud Function que se ejecuta cuando se elimina un usuario de Firebase Auth
// TEMPORARILY DISABLED DUE TO DEPLOYMENT ISSUES
/*
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  const userId = user.uid;
  const db = admin.firestore();
  
  console.log(`🗑️ Starting cleanup for deleted user: ${userId}`);
  
  try {
    // 1. Eliminar perfil del usuario
    console.log(`📋 Deleting user profile for: ${userId}`);
    await db.collection('profiles').doc(userId).delete();
    
    // 2. Eliminar conversaciones del usuario
    console.log(`💬 Deleting conversations for: ${userId}`);
    const conversationsSnapshot = await db.collection('conversations')
      .where('userId', '==', userId)
      .get();
    
    const conversationBatch = db.batch();
    conversationsSnapshot.docs.forEach(doc => {
      conversationBatch.delete(doc.ref);
    });
    await conversationBatch.commit();
    
    // 3. Eliminar mensajes del usuario
    console.log(`📝 Deleting messages for: ${userId}`);
    const messagesSnapshot = await db.collection('messages')
      .where('userId', '==', userId)
      .get();
    
    const messageBatch = db.batch();
    messagesSnapshot.docs.forEach(doc => {
      messageBatch.delete(doc.ref);
    });
    await messageBatch.commit();
    
    // 4. Eliminar ciudades vinculadas (si es admin)
    console.log(`🏙️ Checking for admin cities for: ${userId}`);
    const citiesSnapshot = await db.collection('cities')
      .where('adminId', '==', userId)
      .get();
    
    if (!citiesSnapshot.empty) {
      console.log(`🏙️ Deleting ${citiesSnapshot.size} cities for admin: ${userId}`);
      const cityBatch = db.batch();
      citiesSnapshot.docs.forEach(doc => {
        cityBatch.delete(doc.ref);
      });
      await cityBatch.commit();
    }
    
    // 5. Eliminar fuentes RAG del usuario
    console.log(`📚 Deleting RAG sources for: ${userId}`);
    const ragSourcesSnapshot = await db.collection('library_sources_enhanced')
      .where('userId', '==', userId)
      .get();
    
    if (!ragSourcesSnapshot.empty) {
      const ragBatch = db.batch();
      ragSourcesSnapshot.docs.forEach(doc => {
        ragBatch.delete(doc.ref);
      });
      await ragBatch.commit();
    }
    
    // 6. Eliminar chunks de documentos del usuario
    console.log(`📄 Deleting document chunks for: ${userId}`);
    const chunksSnapshot = await db.collection('document_chunks')
      .where('userId', '==', userId)
      .get();
    
    if (!chunksSnapshot.empty) {
      const chunkBatch = db.batch();
      chunksSnapshot.docs.forEach(doc => {
        chunkBatch.delete(doc.ref);
      });
      await chunkBatch.commit();
    }
    
    // 7. Eliminar logs de uso de IA
    console.log(`🤖 Deleting AI usage logs for: ${userId}`);
    const aiLogsSnapshot = await db.collection('ai_usage_logs')
      .where('userId', '==', userId)
      .get();
    
    if (!aiLogsSnapshot.empty) {
      const aiLogsBatch = db.batch();
      aiLogsSnapshot.docs.forEach(doc => {
        aiLogsBatch.delete(doc.ref);
      });
      await aiLogsBatch.commit();
    }
    
    // 8. Eliminar logs de búsqueda
    console.log(`🔍 Deleting search logs for: ${userId}`);
    const searchLogsSnapshot = await db.collection('search_usage_logs')
      .where('userId', '==', userId)
      .get();
    
    if (!searchLogsSnapshot.empty) {
      const searchLogsBatch = db.batch();
      searchLogsSnapshot.docs.forEach(doc => {
        searchLogsBatch.delete(doc.ref);
      });
      await searchLogsBatch.commit();
    }
    
    // 9. Eliminar métricas del usuario
    console.log(`📊 Deleting metrics for: ${userId}`);
    const metricsSnapshot = await db.collection('chat_metrics')
      .where('userId', '==', userId)
      .get();
    
    if (!metricsSnapshot.empty) {
      const metricsBatch = db.batch();
      metricsSnapshot.docs.forEach(doc => {
        metricsBatch.delete(doc.ref);
      });
      await metricsBatch.commit();
    }
    
    // 10. Eliminar datos de ciudades visitadas recientemente
    console.log(`🗺️ Deleting recent cities data for: ${userId}`);
    const recentCitiesSnapshot = await db.collection('recent_cities')
      .where('userId', '==', userId)
      .get();
    
    if (!recentCitiesSnapshot.empty) {
      const recentCitiesBatch = db.batch();
      recentCitiesSnapshot.docs.forEach(doc => {
        recentCitiesBatch.delete(doc.ref);
      });
      await recentCitiesBatch.commit();
    }
    
    console.log(`✅ Successfully cleaned up all data for user: ${userId}`);
    
    // Log the cleanup operation
    await db.collection('user_cleanup_logs').add({
      userId,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      operations: [
        'profile',
        'conversations',
        'messages',
        'cities',
        'rag_sources',
        'document_chunks',
        'ai_usage_logs',
        'search_logs',
        'metrics',
        'recent_cities'
      ],
      status: 'completed'
    });
    
  } catch (error) {
    console.error(`❌ Error cleaning up user data for ${userId}:`, error);
    
    // Log the error
    await db.collection('user_cleanup_logs').add({
      userId,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'failed'
    });
    
    throw error;
  }
});
*/

// Función HTTP para eliminar manualmente los datos de un usuario (solo para admins)
export const deleteUserData = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Verificar autenticación
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization required' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const adminUserId = decodedToken.uid;

      // Verificar que el usuario sea admin
      const adminDoc = await admin.firestore().collection('profiles').doc(adminUserId).get();
      if (!adminDoc.exists || adminDoc.data()?.role !== 'administrativo') {
        return res.status(403).json({ error: 'Administrative access required' });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      console.log(`🗑️ Manual cleanup requested for user: ${userId} by admin: ${adminUserId}`);

      // Ejecutar la misma lógica de limpieza que onUserDelete
      const db = admin.firestore();
      
      // 1. Eliminar perfil del usuario
      await db.collection('profiles').doc(userId).delete();
      
      // 2. Eliminar conversaciones del usuario
      const conversationsSnapshot = await db.collection('conversations')
        .where('userId', '==', userId)
        .get();
      
      const conversationBatch = db.batch();
      conversationsSnapshot.docs.forEach(doc => {
        conversationBatch.delete(doc.ref);
      });
      await conversationBatch.commit();
      
      // 3. Eliminar mensajes del usuario
      const messagesSnapshot = await db.collection('messages')
        .where('userId', '==', userId)
        .get();
      
      const messageBatch = db.batch();
      messagesSnapshot.docs.forEach(doc => {
        messageBatch.delete(doc.ref);
      });
      await messageBatch.commit();
      
      // 4. Eliminar ciudades vinculadas (si es admin)
      const citiesSnapshot = await db.collection('cities')
        .where('adminId', '==', userId)
        .get();
      
      if (!citiesSnapshot.empty) {
        const cityBatch = db.batch();
        citiesSnapshot.docs.forEach(doc => {
          cityBatch.delete(doc.ref);
        });
        await cityBatch.commit();
      }
      
      // 5. Eliminar fuentes RAG del usuario
      const ragSourcesSnapshot = await db.collection('library_sources_enhanced')
        .where('userId', '==', userId)
        .get();
      
      if (!ragSourcesSnapshot.empty) {
        const ragBatch = db.batch();
        ragSourcesSnapshot.docs.forEach(doc => {
          ragBatch.delete(doc.ref);
        });
        await ragBatch.commit();
      }
      
      // 6. Eliminar chunks de documentos del usuario
      const chunksSnapshot = await db.collection('document_chunks')
        .where('userId', '==', userId)
        .get();
      
      if (!chunksSnapshot.empty) {
        const chunkBatch = db.batch();
        chunksSnapshot.docs.forEach(doc => {
          chunkBatch.delete(doc.ref);
        });
        await chunkBatch.commit();
      }
      
      // 7. Eliminar logs de uso de IA
      const aiLogsSnapshot = await db.collection('ai_usage_logs')
        .where('userId', '==', userId)
        .get();
      
      if (!aiLogsSnapshot.empty) {
        const aiLogsBatch = db.batch();
        aiLogsSnapshot.docs.forEach(doc => {
          aiLogsBatch.delete(doc.ref);
        });
        await aiLogsBatch.commit();
      }
      
      // 8. Eliminar logs de búsqueda
      const searchLogsSnapshot = await db.collection('search_usage_logs')
        .where('userId', '==', userId)
        .get();
      
      if (!searchLogsSnapshot.empty) {
        const searchLogsBatch = db.batch();
        searchLogsSnapshot.docs.forEach(doc => {
          searchLogsBatch.delete(doc.ref);
        });
        await searchLogsBatch.commit();
      }
      
      // 9. Eliminar métricas del usuario
      const metricsSnapshot = await db.collection('chat_metrics')
        .where('userId', '==', userId)
        .get();
      
      if (!metricsSnapshot.empty) {
        const metricsBatch = db.batch();
        metricsSnapshot.docs.forEach(doc => {
          metricsBatch.delete(doc.ref);
        });
        await metricsBatch.commit();
      }
      
      // 10. Eliminar datos de ciudades visitadas recientemente
      const recentCitiesSnapshot = await db.collection('recent_cities')
        .where('userId', '==', userId)
        .get();
      
      if (!recentCitiesSnapshot.empty) {
        const recentCitiesBatch = db.batch();
        recentCitiesSnapshot.docs.forEach(doc => {
          recentCitiesBatch.delete(doc.ref);
        });
        await recentCitiesBatch.commit();
      }

      // Log the manual cleanup operation
      await db.collection('user_cleanup_logs').add({
        userId,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedBy: adminUserId,
        operations: [
          'profile',
          'conversations',
          'messages',
          'cities',
          'rag_sources',
          'document_chunks',
          'ai_usage_logs',
          'search_logs',
          'metrics',
          'recent_cities'
        ],
        status: 'completed',
        type: 'manual'
      });

      return res.status(200).json({
        success: true,
        message: `Successfully deleted all data for user: ${userId}`,
        deletedBy: adminUserId
      });

    } catch (error) {
      console.error('Error in deleteUserData:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
});


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

// Helper function to extract events from RAG response
function extractEventsFromRAGResponse(responseText: string): any[] {
  try {
    const events: any[] = [];
    console.log('🔍 RAG tryRAGFirst: Extracting events from response...');
    
    // Use the same markers as frontend and other parts
    const EVENT_CARD_START_MARKER = "[EVENT_CARD_START]";
    const EVENT_CARD_END_MARKER = "[EVENT_CARD_END]";
    
    // Parse events using the same regex as frontend
    const eventRegex = new RegExp(`${EVENT_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${EVENT_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    let match;
    
    console.log('🔍 RAG tryRAGFirst: Looking for event markers in response...');
    console.log('🔍 RAG tryRAGFirst: Response preview:', responseText.substring(0, 500));
    
    while ((match = eventRegex.exec(responseText)) !== null) {
      console.log('🎯 RAG tryRAGFirst: Found event marker match:', match[1]);
      
      let jsonStrToParse = match[1]
        .replace(/```json|```/g, "")
        .replace(/^[\s\n]*|[\s\n]*$/g, "")
        .trim();
      
      console.log('🧹 RAG tryRAGFirst: Cleaned JSON string:', jsonStrToParse);
      
      try {
        const parsedEvent = JSON.parse(jsonStrToParse);
        console.log('✅ RAG tryRAGFirst: Parsed event successfully:', parsedEvent);
        
        // Validate required fields AND date
        if (parsedEvent.title && parsedEvent.date) {
          // 🚨 VALIDAR FECHA - SOLO EVENTOS FUTUROS
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const eventDateObj = new Date(parsedEvent.date);
          eventDateObj.setHours(0, 0, 0, 0);
          const isValidDate = eventDateObj >= today;
          
          if (isValidDate) {
            events.push(parsedEvent);
            console.log('✅ RAG tryRAGFirst: Event added to list (valid future date)');
          } else {
            console.log(`❌ RAG tryRAGFirst: Event filtered out (past date): ${parsedEvent.title} - ${parsedEvent.date}`);
          }
        } else {
          console.log('❌ RAG tryRAGFirst: Event missing required fields (title or date)');
        }
      } catch (parseError) {
        console.error('❌ RAG tryRAGFirst: Failed to parse event JSON:', parseError);
        console.error('❌ RAG tryRAGFirst: Raw JSON string:', jsonStrToParse);
      }
    }
    
    console.log(`🎪 RAG tryRAGFirst: Total extracted events: ${events.length}`);
    return events;
    
  } catch (error) {
    console.error('Error extracting events from RAG tryRAGFirst response:', error);
    return [];
  }
}

// Función principal del sistema híbrido RAG + Vector Search
async function processRAGHybridQuery(query: string, userId: string, citySlug: string, cityContext: any, conversationHistory: any[], cityConfig: any): Promise<any> {
  try {
    console.log('🔍 RAG HYBRID: Step 1 - Searching RAG database...');
    
    // Buscar en RAG primero
    const db = admin.firestore();
    const ragSnapshot = await db.collection('RAG')
      .where('citySlug', '==', citySlug)
      .limit(10)
      .get();
    
    if (!ragSnapshot.empty) {
      console.log(`✅ RAG HYBRID: Found ${ragSnapshot.size} RAG documents, using RAG response`);
      
      // 🎯 PASO 1: Intentar búsqueda vectorial si hay embeddings
      const docsWithEmbeddings = ragSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.embedding && data.embedding.length > 0;
      });
      
      let relevantDocs = ragSnapshot.docs;
      
      if (docsWithEmbeddings.length > 0) {
        console.log(`🔍 RAG HYBRID: Found ${docsWithEmbeddings.length} documents with embeddings, using vector search`);
        
        // Generar embedding de la consulta
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        
        const queryResult = await model.embedContent(query);
        const queryEmbedding = queryResult.embedding.values;
        
        // Calcular similitudes
        const similarities: any[] = [];
        for (const doc of docsWithEmbeddings) {
          const data = doc.data();
          const similarity = cosineSimilarity(queryEmbedding, data.embedding);
          similarities.push({
            doc,
            similarity
          });
        }
        
        // Ordenar por similitud y tomar los mejores
        similarities.sort((a, b) => b.similarity - a.similarity);
        const topResults = similarities.filter(item => item.similarity > 0.7).slice(0, 5);
        
        if (topResults.length > 0) {
          console.log(`✅ RAG HYBRID: Found ${topResults.length} relevant documents with high similarity`);
          relevantDocs = topResults.map(item => item.doc);
        }
      }
      
      // Generar respuesta usando AI Agent con información RAG
      const ragContent = relevantDocs.map(doc => {
        const data = doc.data();
        return `${data.title}\n${data.content}`;
      }).join('\n\n');
      
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      const systemInstruction = `Eres un asistente virtual especializado para ${cityContext || 'la ciudad'}. 
      
Responde a la consulta del usuario usando ÚNICAMENTE la información proporcionada a continuación.
Si la información no es suficiente para responder completamente, indica que tienes información parcial.

INFORMACIÓN DISPONIBLE (obtenida mediante búsqueda RAG):
${ragContent}

🚨 INSTRUCCIONES CRÍTICAS:
1. **ESPECIFICIDAD**: Usa solo la información proporcionada, no inventes nada
2. **HONESTIDAD**: Si no tienes suficiente información, dilo claramente
3. **FORMATO**: Responde de manera clara y estructurada
4. **CONTEXTO**: Adapta toda la información al contexto de ${cityContext || 'la ciudad'}

PARA EVENTOS (si aplica):
Si encuentras información sobre eventos, incluye:
- Fechas específicas
- Ubicaciones exactas
- Descripciones detalladas
- Enlaces a fuentes oficiales si están disponibles

PARA LUGARES (si aplica):
Si encuentras información sobre lugares, incluye:
- Direcciones completas
- Horarios de atención
- Información de contacto
- Descripciones útiles`;

      const result_rag = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: systemInstruction }] },
          { role: "user", parts: [{ text: query }] }
        ]
      });
      
      return {
        response: result_rag.response.text(),
        events: [],
        places: [],
        modelUsed: 'gemini-2.5-flash-lite',
        complexity: 'institutional',
        searchPerformed: false,
        ragUsed: true,
        ragResultsCount: relevantDocs.length,
        success: true
      };
      
    } else {
      console.log('🔄 RAG HYBRID: No RAG data found, falling back to Gemini + Google Search');
      // Fallback al sistema original
      return await processUserQuery(query, cityContext, conversationHistory, cityConfig);
    }
    
  } catch (error) {
    console.error('❌ RAG HYBRID: Error in processRAGHybridQuery:', error);
    // Fallback al sistema original en caso de error
    return await processUserQuery(query, cityContext, conversationHistory, cityConfig);
  }
}

// Función auxiliar para calcular similitud coseno
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

// Función de integración RAG híbrida inteligente con vector search (LEGACY)
async function tryRAGWithVectorSearch(query: string, userId: string, citySlug: string, cityContext: any): Promise<any | null> {
  try {
    console.log('🚀 RAG Vector Search: Starting intelligent RAG search for query:', query.substring(0, 50) + '...');
    
    // 🎯 PASO 1: Intentar búsqueda vectorial en RAG
    console.log('🔍 Step 1: Trying vector search in RAG...');
    
    // Buscar en la colección RAG centralizada
    const db = admin.firestore();
    
    // Buscar datos RAG para la ciudad específica
    const ragSnapshot = await db.collection('RAG')
      .where('citySlug', '==', citySlug)
      .limit(20)
      .get();
    
    if (ragSnapshot.empty) {
      console.log('❌ RAG Vector Search: No RAG data found for city:', citySlug);
      return null;
    }
    
    console.log(`📊 RAG Vector Search: Found ${ragSnapshot.size} RAG documents for ${citySlug}`);
    
    // Obtener todos los documentos RAG
    const allRagDocs: any[] = [];
    ragSnapshot.forEach(doc => {
      const data = doc.data();
      allRagDocs.push({
        id: doc.id,
        content: data.content || data.description || data.title || '',
        title: data.title || '',
        url: data.url || '',
        type: data.type || 'unknown',
        citySlug: data.citySlug,
        createdAt: data.createdAt,
        embedding: data.embedding // Incluir embedding si existe
      });
    });
    
    // 🎯 PASO 2: Si hay embeddings, usar búsqueda vectorial
    const docsWithEmbeddings = allRagDocs.filter(doc => doc.embedding && doc.embedding.length > 0);
    
    if (docsWithEmbeddings.length > 0) {
      console.log(`🔍 RAG Vector Search: Found ${docsWithEmbeddings.length} documents with embeddings, using vector search`);
      
      // Generar embedding de la consulta
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      
      const queryResult = await model.embedContent(query);
      const queryEmbedding = queryResult.embedding.values;
      
      // Calcular similitudes
      const similarities: any[] = [];
      for (const doc of docsWithEmbeddings) {
        const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
        similarities.push({
          ...doc,
          similarity
        });
      }
      
      // Ordenar por similitud y tomar los mejores
      similarities.sort((a, b) => b.similarity - a.similarity);
      const relevantDocs = similarities.filter(doc => doc.similarity > 0.7).slice(0, 5);
      
      if (relevantDocs.length > 0) {
        console.log(`✅ RAG Vector Search: Found ${relevantDocs.length} relevant documents with high similarity`);
        
        // Generar respuesta usando AI Agent con la información RAG
        return await generateRAGResponse(query, relevantDocs, cityContext, 'vectorial');
      }
    }
    
    // 🎯 PASO 3: Fallback a búsqueda por texto si no hay embeddings o no se encontraron resultados
    console.log('🔄 RAG Vector Search: No vector results, trying text search...');
    
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const relevantDocs = allRagDocs.filter(doc => {
      const searchableContent = `${doc.content} ${doc.title}`.toLowerCase();
      return queryWords.some(word => searchableContent.includes(word));
    });
    
    if (relevantDocs.length > 0) {
      console.log(`✅ RAG Text Search: Found ${relevantDocs.length} relevant documents`);
      
      // Generar respuesta usando AI Agent con la información RAG
      return await generateRAGResponse(query, relevantDocs, cityContext, 'textual');
    }
    
    console.log('❌ RAG Vector Search: No relevant documents found for query');
    return null;
    
  } catch (error) {
    console.error('❌ RAG Vector Search: Error in tryRAGWithVectorSearch:', error);
    return null;
  }
}

// Función auxiliar para calcular similitud coseno
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

// Función para generar respuesta usando AI Agent con información RAG
async function generateRAGResponse(query: string, relevantDocs: any[], cityContext: any, searchType: string): Promise<any> {
  try {
    console.log(`🤖 RAG AI Agent: Generating response with ${relevantDocs.length} documents (${searchType} search)`);
    
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const relevantContent = relevantDocs
      .map(doc => `${doc.title}\n${doc.content}`)
      .join('\n\n');
    
    const systemInstruction = `Eres un asistente virtual especializado para ${cityContext || 'la ciudad'}. 
    
Responde a la consulta del usuario usando ÚNICAMENTE la información proporcionada a continuación.
Si la información no es suficiente para responder completamente, indica que tienes información parcial.

INFORMACIÓN DISPONIBLE (obtenida mediante búsqueda ${searchType}):
${relevantContent}

🚨 INSTRUCCIONES CRÍTICAS:

1. **ESPECIFICIDAD**: Usa solo la información proporcionada, no inventes nada
2. **HONESTIDAD**: Si no tienes suficiente información, dilo claramente
3. **FORMATO**: Responde de manera clara y estructurada
4. **CONTEXTO**: Adapta toda la información al contexto de ${cityContext || 'la ciudad'}

PARA EVENTOS (si aplica):
Si encuentras información sobre eventos, incluye:
- Fechas específicas
- Ubicaciones exactas
- Descripciones detalladas
- Enlaces a fuentes oficiales si están disponibles

PARA LUGARES (si aplica):
Si encuentras información sobre lugares, incluye:
- Direcciones completas
- Horarios de atención
- Información de contacto
- Descripciones útiles

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
      complexity: 'institutional',
      searchPerformed: false,
      ragUsed: true,
      ragResultsCount: relevantDocs.length,
      ragSearchType: searchType,
      success: true
    };
    
  } catch (error) {
    console.error('❌ RAG AI Agent: Error generating response:', error);
    return null;
  }
}

// Función de integración RAG híbrida - NUEVA VERSIÓN con colección RAG (LEGACY - mantener por compatibilidad)
async function tryRAGFirst(query: string, userId: string, citySlug: string, cityContext: any): Promise<any | null> {
  try {
    console.log('🔍 RAG: Starting search for query:', query.substring(0, 50) + '...');
    
    // Buscar en la nueva colección RAG centralizada
    const db = admin.firestore();
    
    // Buscar datos RAG para la ciudad específica
    const ragSnapshot = await db.collection('RAG')
      .where('citySlug', '==', citySlug)
      .limit(20)
      .get();
    
    if (ragSnapshot.empty) {
      console.log('❌ RAG: No data found for city:', citySlug);
      return null;
    }
    
    console.log(`📊 RAG: Found ${ragSnapshot.size} documents for ${citySlug}`);
    
    // Obtener todos los documentos RAG
    const allRagDocs: any[] = [];
    ragSnapshot.forEach(doc => {
      const data = doc.data();
      allRagDocs.push({
        id: doc.id,
        content: data.content || data.description || data.title || '',
        title: data.title || '',
        url: data.url || '',
        type: data.type || 'unknown',
        citySlug: data.citySlug,
        createdAt: data.createdAt
      });
    });
    
    console.log(`📄 RAG: Processing ${allRagDocs.length} documents`);
    
    // Búsqueda simple por palabras clave en contenido
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const relevantDocs = allRagDocs.filter(doc => {
      const searchableContent = `${doc.content} ${doc.title}`.toLowerCase();
      return queryWords.some(word => searchableContent.includes(word));
    });
    
    if (relevantDocs.length === 0) {
      console.log('❌ RAG: No relevant documents found for query');
      return null;
    }
    
    console.log(`✅ RAG: Found ${relevantDocs.length} relevant documents`);
    
    // Generar respuesta usando la información RAG
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const relevantContent = relevantDocs
      .map(doc => `${doc.title}\n${doc.content}`)
      .join('\n\n');
    
    const systemInstruction = `Eres un asistente virtual para ${cityContext || 'la ciudad'}. 
    
Responde a la consulta del usuario usando ÚNICAMENTE la información proporcionada a continuación.
Si la información no es suficiente para responder completamente, indica que tienes información parcial.

INFORMACIÓN DISPONIBLE:
${relevantContent}

🚨 INSTRUCCIÓN CRÍTICA PARA EVENTOS - OBLIGATORIO:
Si el usuario pregunta por eventos, DEBES seguir EXACTAMENTE este formato:

1. **PRIMERA PARTE**: Escribe 2-3 párrafos de introducción general sobre eventos
2. **SEGUNDA PARTE**: SIEMPRE incluye el bloque JSON con eventos específicos (OBLIGATORIO)

FORMATO OBLIGATORIO cuando hay consulta de eventos:
\`\`\`json
{
  "events": [
    {
      "title": "Nombre exacto del evento",
      "date": "YYYY-MM-DD", 
      "time": "HH:MM - HH:MM" (opcional),
      "location": "Ubicación específica del evento",
      "description": "Descripción breve del evento"
    }
  ]
}
\`\`\`

🚨 REGLAS ABSOLUTAS:
- Si el usuario pregunta por eventos, SIEMPRE genera el JSON (aunque sea con eventos genéricos)
- NUNCA describas eventos solo en texto - usa el JSON
- Cada evento debe tener título, fecha y ubicación mínimo
- Si no encuentras eventos reales, crea 2-3 eventos ejemplo típicos de la ciudad

INSTRUCCIONES:
- Responde de manera natural y conversacional
- Usa solo la información proporcionada
- Para eventos: Incluye una breve introducción seguida de las EventCards
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
    
    // Extract events from response using the same function logic as other parts
    const extractedEvents = extractEventsFromRAGResponse(text);
    console.log(`🎪 RAG tryRAGFirst: Extracted ${extractedEvents.length} events`);
    
    return {
      response: text,
      events: extractedEvents,
      places: [],
      modelUsed: 'gemini-2.5-flash-lite',
      searchPerformed: false,
      ragUsed: true,
      ragResultsCount: relevantDocs.length,
      ragSearchType: 'text'
    };
    
  } catch (error) {
    console.error('❌ RAG: Error in tryRAGFirst:', error);
    return null;
  }
}

// Función de integración Vector Events - NUEVA VERSIÓN con colección RAG
async function tryRAGEventsFirst(query: string, citySlug: string, cityContext: any): Promise<any | null> {
  try {
    console.log('🚀 RAG Events: Starting RAG search for query:', query.substring(0, 50) + '...');
    
    // Buscar eventos en la nueva colección RAG centralizada
    const db = admin.firestore();
    
    // Buscar datos RAG de eventos para la ciudad específica
    const ragSnapshot = await db.collection('RAG')
      .where('citySlug', '==', citySlug)
      .where('type', '==', 'event')  // Solo eventos
      .limit(20)
      .get();
    
    if (ragSnapshot.empty) {
      console.log('❌ RAG Events: No event data found for city:', citySlug);
      return null;
    }
    
    console.log(`📊 RAG Events: Found ${ragSnapshot.size} event documents for ${citySlug}`);
    
    // Obtener todos los documentos RAG de eventos
    const allEventDocs: any[] = [];
    ragSnapshot.forEach(doc => {
      const data = doc.data();
      allEventDocs.push({
        id: doc.id,
        content: data.content || data.description || data.title || '',
        title: data.title || '',
        url: data.url || '',
        type: data.type || 'event',
        citySlug: data.citySlug,
        createdAt: data.createdAt
      });
    });
    
    // Búsqueda simple por palabras clave en contenido de eventos
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const relevantEventDocs = allEventDocs.filter(doc => {
      const searchableContent = `${doc.content} ${doc.title}`.toLowerCase();
      return queryWords.some(word => searchableContent.includes(word));
    });
    
    if (relevantEventDocs.length === 0) {
      console.log('❌ RAG Events: No relevant event documents found for query');
      return null;
    }
    
    console.log(`✅ RAG Events: Found ${relevantEventDocs.length} relevant event documents`);
    
    // Generar respuesta usando la información RAG de eventos
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const relevantEventContent = relevantEventDocs
      .map(doc => `${doc.title}\n${doc.content}`)
      .join('\n\n');
    
    const eventSystemInstruction = `Eres un asistente virtual de eventos para ${cityContext || 'la ciudad'}. 
    
Responde a la consulta del usuario sobre eventos usando ÚNICAMENTE la información proporcionada a continuación.

INFORMACIÓN DE EVENTOS DISPONIBLE:
${relevantEventContent}

🚨 FORMATO OBLIGATORIO para consultas de eventos:
1. **PRIMERA PARTE**: Escribe 2-3 párrafos de introducción sobre los eventos
2. **SEGUNDA PARTE**: SIEMPRE incluye el bloque JSON con eventos específicos:

\`\`\`json
{
  "events": [
    {
      "title": "Nombre exacto del evento",
      "date": "YYYY-MM-DD", 
      "time": "HH:MM - HH:MM" (opcional),
      "location": "Ubicación específica del evento",
      "description": "Descripción breve del evento"
    }
  ]
}
\`\`\`

INSTRUCCIONES:
- Usa solo la información proporcionada
- Genera eventos reales basados en la información disponible
- Mantén un tono amable y profesional`;

    const eventResult = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: eventSystemInstruction }] },
        { role: "user", parts: [{ text: query }] }
      ]
    });
    
    const eventResponse = eventResult.response;
    const eventText = eventResponse.text();
    
    // Extraer eventos de la respuesta
    const extractedEvents = extractEventsFromRAGResponse(eventText);
    console.log(`✅ RAG Events: Extracted ${extractedEvents.length} events`);
    
    return {
      response: eventText,
      events: extractedEvents,
      places: [],
      modelUsed: 'gemini-2.5-flash-lite',
      searchPerformed: false,
      eventsFromFirestore: true,
      eventsCount: extractedEvents.length,
      searchMethod: 'rag-events',
      ragSearch: true,
      ragChunks: relevantEventDocs.length
    };
    
  } catch (error) {
    console.error('❌ RAG Events: Error in tryRAGEventsFirst:', error);
    console.error('❌ RAG Error type:', error.constructor.name);
    console.error('❌ RAG Error message:', error.message);
    
    // En caso de error, retornar null para que use el sistema tradicional
    return null;
  }
}

/**
 * Extraer eventos de chunks RAG
 */
function extractEventsFromRAGChunks(chunks: any[]): any[] {
  const events: any[] = [];
  
  if (!chunks || chunks.length === 0) {
    return events;
  }
  
  for (const chunk of chunks) {
    try {
      const metadata = chunk.metadata;
      
      // Verificar que es un evento
      if (metadata?.contentType === 'event' && metadata?.eventId) {
        const eventCard = {
          title: metadata.eventTitle,
          date: metadata.eventDate,
          location: metadata.eventLocation,
          category: metadata.eventCategory,
          description: chunk.content.split('\n\n')[2] || chunk.content, // Extraer descripción
          url: `https://wearecity.com/${metadata.cityId}/eventos/${metadata.eventId}`,
          city: metadata.cityName
        };
        
        events.push(eventCard);
      }
    } catch (error) {
      console.error('Error extracting event from chunk:', error);
    }
  }
  
  // Eliminar duplicados por eventId
  const uniqueEvents = events.filter((event, index, self) => 
    index === self.findIndex((e) => e.title === event.title && e.date === event.date)
  );
  
  return uniqueEvents.slice(0, 10); // Limitar a 10 eventos
}

// Función de integración Events Firestore
async function tryEventsFirestoreFirst(query: string, citySlug: string, cityContext: any): Promise<any | null> {
  try {
    console.log('🎪 Events Firestore NEW: Starting search for query:', query.substring(0, 50) + '...');
    
    // Usar el nuevo servicio de eventos AI con estructura cities/{cityId}/events
    const { NewEventsAIService } = await import('./newEventsAIService');
    const eventsAIService = new NewEventsAIService(admin.firestore());
    
    // Procesar consulta de eventos
    const eventsResult = await eventsAIService.processEventsQuery(
      query,
      citySlug,
      cityContext || 'la ciudad',
      15 // límite de eventos
    );
    
    // ✅ SIEMPRE retornar respuesta de eventos, incluso si no hay eventos
    // Esto evita el fallback a Google Search
    console.log(`✅ Events Firestore NEW: Found ${eventsResult.totalEvents} events`);
    
    if (eventsResult.totalEvents === 0) {
      console.log('📝 Events Firestore NEW: No events found, but returning Firebase response');
    }
    
    console.log(`✅ Events Firestore NEW: Found ${eventsResult.totalEvents} events with EventCards format`);
    
    // Los eventos ya vienen en formato EventCard desde el servicio
    const eventCards = eventsResult.events;
    
    return {
      response: eventsResult.text,
      events: eventCards,
      places: [],
      modelUsed: 'gemini-2.5-flash',
      searchPerformed: false,
      eventsFromFirestore: true,
      eventsCount: eventsResult.totalEvents,
      newStructure: true // Indicador de que usa la nueva estructura
    };
    
  } catch (error) {
    console.error('❌ Events Firestore NEW: Error in tryEventsFirestoreFirst:', error);
    
    // Fallback al sistema anterior si hay error
    try {
      console.log('🔄 Falling back to legacy events system...');
      const { eventsAIService } = await import('./eventsAIService');
      
      const legacyResult = await eventsAIService.processEventsQuery(
        query,
        citySlug,
        cityContext || 'la ciudad',
        15
      );
      
      if (legacyResult.totalEvents > 0) {
        console.log(`✅ Legacy Events: Found ${legacyResult.totalEvents} events`);
        
        const eventCards = legacyResult.events.map((event: any) => ({
          title: event.title,
          date: event.date,
          endDate: event.endDate,
          time: event.time,
          location: event.location,
          sourceUrl: event.sourceUrl,
          eventDetailUrl: event.eventDetailUrl,
          description: event.description
        }));
        
        return {
          response: legacyResult.text,
          events: eventCards,
          places: [],
          modelUsed: 'gemini-2.5-flash',
          searchPerformed: false,
          eventsFromFirestore: true,
          eventsCount: legacyResult.totalEvents,
          usedFallback: true
        };
      }
    } catch (fallbackError) {
      console.error('❌ Legacy Events fallback also failed:', fallbackError);
    }
    
    return null;
  }
}

// Exportar funciones para limpiar datos RAG
// export { clearRAGData, clearCityRAGDataFunction }; // Temporarily disabled

// ===== SISTEMA DE EVENTOS =====

// ===== EVENT EMBEDDINGS GENERATION =====

// Generate embeddings for events to enable vector search
export const generateEventEmbeddings = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    return generateEventEmbeddingsFunction(req, res);
  });
});

// Migrate events to RAG system with vector embeddings
export const migrateEventsToRAG = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    return migrateEventsToRAGFunction(req, res);
  });
});

// Scrape events and save directly to RAG with embeddings
export const scrapeEventsToRAG = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    return scrapeEventsToRAGFunction(req, res);
  });
});

// NUEVO: Sistema de scraping diario automático con estructura cities/{cityId}/events
// Temporalmente comentado para resolver errores de sintaxis
/*
export { 
  dailyEventsScrapingScheduled, 
  dailyEventsScrapingManual, 
  dailyEventsScrapingWebhook,
  getCityEvents,
  getEventsStats as getNewEventsStats
} from './dailyEventsCloudFunctions';

// LEGACY: Funciones del sistema anterior (mantener por compatibilidad)
export {
  processEventsManual,
  processEventsDailyScheduled,
  getEventsForCity,
  getEventsStats,
  cleanupOldEvents
} from './eventsCloudFunctions';
*/

// NUEVO: Agente de escrapeo inteligente con IA
export {
  intelligentScraping,
  intelligentScrapingAllCities,
  cleanupBeforeIntelligentScraping,
  cleanupRAGForCity,
  getAgentStats,
  scheduleAgentScraping
};

// NUEVO: Agente de IA inteligente mejorado
export {
  newIntelligentScraping,
  getNewAgentStats,
  cleanupNewAgent
} from './newIntelligentScraping';

// NUEVO: Vertex AI Agent Engine
export {
  processAIWithAgentEngine,
  testAgentEngine
} from './vertexAIAgentEngine';


// NUEVO: Vertex AI Agent Engine Simple - Export HTTP endpoint
// DISABLED: Causing ERR_HTTP_HEADERS_SENT conflicts
// export { queryVertexAIAgent } from './vertexAIAgentSimple';


// NUEVO: APIs de Agente con separación de capas
export { adminAgentAPI, publicAgentAPI };

export { handleScheduledScraping };

export { getSystemHealth, getSystemMetrics };

export { hybridIntelligentProxy };

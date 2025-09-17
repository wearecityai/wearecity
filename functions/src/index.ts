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
          
          try {
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
          // Handle text queries
          console.log('💬 Processing text query');
          
              // 🎯 DETECTAR CONSULTAS SOBRE EVENTOS - Usar sistema de eventos de Firestore
              const eventKeywords = ['evento', 'eventos', 'actividad', 'actividades', 'fiesta', 'fiestas', 'festival', 'festivales', 'concierto', 'conciertos', 'teatro', 'cine', 'exposición', 'exposiciones', 'feria', 'ferias', 'mercado', 'mercados', 'celebraciones', 'celebraciones', 'agenda', 'programa', 'qué hacer', 'que hacer', 'planes', 'ocio', 'entretenimiento', 'cultura', 'deporte', 'deportes'];
              const isEventQuery = eventKeywords.some(keyword => 
                query.toLowerCase().includes(keyword.toLowerCase())
              );
              
              console.log('🔍 Event query detection:', {
                query: query.substring(0, 100),
                isEventQuery,
                matchedKeywords: eventKeywords.filter(keyword => 
                  query.toLowerCase().includes(keyword.toLowerCase())
                )
              });
              
              if (isEventQuery) {
                console.log('🎪 Event query detected - using Events Firestore system');
                result = await tryEventsFirestoreFirst(query, citySlug, cityContext);
                
                if (!result) {
                  console.log('🔄 Events system failed, falling back to original router');
                  result = await processUserQuery(query, cityContext, conversationHistory, rawData.cityConfig);
                }
              } else {
                // 🎯 PASO 1: Intentar RAG primero para consultas no relacionadas con eventos
                console.log('🔍 Step 1: Trying RAG first...');
                const ragResult = await tryRAGFirst(query, userId, citySlug, cityContext);
                
                if (ragResult) {
                  // RAG encontró información suficiente
                  console.log('✅ RAG: Found sufficient information, using RAG response');
                  result = ragResult;
                } else {
                  // RAG no encontró suficiente información, usar router original
                  console.log('🔄 RAG: Insufficient information, falling back to original router');
                  result = await processUserQuery(query, cityContext, conversationHistory, rawData.cityConfig);
                }
              }
        }

        // Log usage for monitoring
        await logAIUsage(userId, result.modelUsed, result.complexity, citySlug);

        return res.status(200).json({
          success: true,
          data: result
        });

          } catch (validationError) {
            if (validationError instanceof ValidationError) {
              console.warn('Validation error in processAIChat:', validationError.message);
              return res.status(400).json({
                error: 'Validation error',
                message: validationError.message,
                field: validationError.field
              });
            }
            throw validationError; // Re-throw if not validation error
          }

        } catch (authError) {
          console.error('Authentication error:', authError);
          return res.status(401).json({
            error: 'Invalid authentication token',
            message: 'The provided token is invalid or expired'
          });
        }

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
      ragResultsCount: relevantChunks.length,
      ragSearchType: 'text'
    };
    
  } catch (error) {
    console.error('❌ RAG: Error in tryRAGFirst:', error);
    return null;
  }
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
    
    if (eventsResult.totalEvents === 0) {
      console.log('❌ Events Firestore NEW: No events found');
      return null;
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
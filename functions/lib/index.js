"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRAGStatsFunction = exports.getRAGConversationsFunction = exports.ragQueryFunction = exports.hybridSearchFunction = exports.vectorSearchFunction = exports.regenerateEmbeddingsFunction = exports.generateBatchEmbeddingsFunction = exports.generateEmbeddingsFunction = exports.processManualTextFunction = exports.processDocumentFunction = exports.advancedCrawlingFunction = exports.advancedScrapingFunction = exports.createRAGCollections = exports.setupRAGSystem = exports.deleteUserData = exports.setupAndFixMetrics = exports.migrateMetricsData = exports.debugMetrics = exports.cleanupOldMetrics = exports.getCityMetrics = exports.recordChatMetric = exports.initializeCategories = exports.secureGoogleSearch = exports.classifyQuery = exports.processAIChat = exports.securityDashboard = exports.getGoogleMapsApiKey = exports.healthCheck = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
const vertexAIService_1 = require("./vertexAIService");
// Importar nuevas funciones RAG
const firestoreSetup_1 = require("./firestoreSetup");
Object.defineProperty(exports, "setupRAGSystem", { enumerable: true, get: function () { return firestoreSetup_1.setupRAGSystem; } });
const createRAGCollections_1 = require("./createRAGCollections");
Object.defineProperty(exports, "createRAGCollections", { enumerable: true, get: function () { return createRAGCollections_1.createRAGCollections; } });
const advancedScraping_1 = require("./advancedScraping");
const documentProcessor_1 = require("./documentProcessor");
const embeddingGenerator_1 = require("./embeddingGenerator");
const vectorSearch_1 = require("./vectorSearch");
const ragRetrieval_1 = require("./ragRetrieval");
// Importar servicio de Google Search seguro
const googleSearchService_1 = require("./googleSearchService");
// Importar rate limiting
const rateLimit_1 = require("./rateLimit");
// Importar validación
const validation_1 = require("./validation");
// Importar seguridad empresarial
const secretManager_1 = require("./secretManager");
const auditLogger_1 = require("./auditLogger");
const securityMonitor_1 = require("./securityMonitor");
// Inicializar Firebase Admin
admin.initializeApp();
// Configure CORS
const corsHandler = (0, cors_1.default)({ origin: true });
// Basic health check function
exports.healthCheck = functions.https.onRequest((req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'WeAreCity Functions with Enterprise Security are running'
    });
});
// Get Google Maps API key
exports.getGoogleMapsApiKey = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // Return the Google Maps API key from environment variables
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
            throw new functions.https.HttpsError('internal', 'Google Maps API key not configured');
        }
        return {
            apiKey: apiKey
        };
    }
    catch (error) {
        console.error('Error getting Google Maps API key:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get Google Maps API key');
    }
});
// Enterprise Security Dashboard endpoint
exports.securityDashboard = functions.https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
        var _a;
        try {
            // Verify admin authentication
            const authHeader = req.headers.authorization;
            if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
                return res.status(401).json({ error: 'Authorization required' });
            }
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;
            // Check if user is admin
            const userDoc = await admin.firestore().collection('profiles').doc(userId).get();
            if (!userDoc.exists || ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'administrativo') {
                await auditLogger_1.auditLogger.logAuthorizationViolation(userId, 'security_dashboard', { reason: 'insufficient_privileges' }, req);
                return res.status(403).json({ error: 'Administrative access required' });
            }
            // Get security metrics
            const [secretsHealth, auditStats, rateLimitStatus] = await Promise.all([
                secretManager_1.secretManager.healthCheck(),
                // auditLogger.getAuditStatistics({ start: new Date(Date.now() - 24*60*60*1000), end: new Date() }),
                rateLimit_1.rateLimitService.getRateLimitStatus(userId, 'ai-chat')
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
            await auditLogger_1.auditLogger.logDataAccess(userId, 'security_dashboard', 'dashboard_view');
            return res.status(200).json({
                success: true,
                data: securityStatus
            });
        }
        catch (error) {
            console.error('Error in securityDashboard:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
// Main AI chat endpoint
exports.processAIChat = functions.https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
        try {
            // SECURITY: Authentication is now REQUIRED
            const authHeader = req.headers.authorization;
            if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
                return res.status(401).json({
                    error: 'Authorization required',
                    message: 'Must provide valid authentication token'
                });
            }
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;
            // Enterprise security monitoring
            await securityMonitor_1.securityMonitor.monitorAuthentication(userId, true, req.ip, req.headers['user-agent']);
            await auditLogger_1.auditLogger.logAuthentication(userId, 'ai_chat_access', true, { endpoint: 'processAIChat' }, req);
            // Check rate limit
            const rateLimitResult = await rateLimit_1.rateLimitService.checkRateLimit(userId, 'ai-chat');
            if (!rateLimitResult.allowed) {
                // Log rate limit violation
                await auditLogger_1.auditLogger.logRateLimitViolation(userId, 'ai-chat', {
                    remainingRequests: rateLimitResult.remainingRequests,
                    resetTime: rateLimitResult.resetTime
                }, req);
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    message: `Too many requests. Try again after ${rateLimitResult.resetTime.toISOString()}`,
                    remainingRequests: rateLimitResult.remainingRequests,
                    resetTime: rateLimitResult.resetTime.toISOString()
                });
            }
            // Extract and validate request data
            const rawData = req.body;
            try {
                const validatedQuery = validation_1.ValidationService.validateChatQuery(rawData.query);
                // Enterprise security: Monitor chat query for threats
                const queryAllowed = await securityMonitor_1.securityMonitor.monitorChatQuery(userId, validatedQuery, req.ip);
                if (!queryAllowed) {
                    return res.status(403).json({
                        error: 'Security violation',
                        message: 'Query blocked due to security concerns'
                    });
                }
                const validatedCitySlug = validation_1.ValidationService.validateCitySlug(rawData.citySlug);
                const validatedConversationHistory = validation_1.ValidationService.validateConversationHistory(rawData.conversationHistory);
                const validatedMediaUrl = validation_1.ValidationService.validateMediaUrl(rawData.mediaUrl);
                const validatedMediaType = validation_1.ValidationService.validateMediaType(rawData.mediaType);
                // Monitor API usage patterns
                await securityMonitor_1.securityMonitor.monitorApiUsage(userId, 'ai-chat', 'processAIChat');
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
                    const multimodalResult = await (0, vertexAIService_1.processMultimodalQuery)(query, mediaUrl, mediaType, cityContext);
                    result = {
                        response: multimodalResult.text,
                        events: multimodalResult.events,
                        places: multimodalResult.places,
                        modelUsed: 'gemini-2.5-pro',
                        complexity: 'complex',
                        searchPerformed: false,
                        multimodal: true
                    };
                }
                else {
                    // Handle text queries
                    console.log('💬 Processing text query');
                    // 🎯 PASO 1: Intentar RAG primero
                    console.log('🔍 Step 1: Trying RAG first...');
                    const ragResult = await tryRAGFirst(query, userId, citySlug, cityContext);
                    if (ragResult) {
                        // RAG encontró información suficiente
                        console.log('✅ RAG: Found sufficient information, using RAG response');
                        result = ragResult;
                    }
                    else {
                        // RAG no encontró suficiente información, usar router original
                        console.log('🔄 RAG: Insufficient information, falling back to original router');
                        result = await (0, vertexAIService_1.processUserQuery)(query, cityContext, conversationHistory);
                    }
                }
                // Log usage for monitoring
                await logAIUsage(userId, result.modelUsed, result.complexity, citySlug);
                return res.status(200).json({
                    success: true,
                    data: result
                });
            }
            catch (validationError) {
                if (validationError instanceof validation_1.ValidationError) {
                    console.warn('Validation error in processAIChat:', validationError.message);
                    return res.status(400).json({
                        error: 'Validation error',
                        message: validationError.message,
                        field: validationError.field
                    });
                }
                throw validationError; // Re-throw if not validation error
            }
        }
        catch (error) {
            console.error('Error in processAIChat:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
// Query complexity classification endpoint
exports.classifyQuery = functions
    .https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
        try {
            const { query } = req.body;
            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }
            const complexity = (0, vertexAIService_1.classifyQueryComplexity)(query);
            return res.status(200).json({
                success: true,
                data: {
                    query,
                    complexity,
                    modelRecommended: 'gemini-2.5-flash-lite'
                }
            });
        }
        catch (error) {
            console.error('Error in classifyQuery:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
// SECURE Google Search endpoint - API keys stay on backend
exports.secureGoogleSearch = functions.https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
        try {
            // Verify authentication
            const authHeader = req.headers.authorization;
            if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
                return res.status(401).json({ error: 'Authorization required' });
            }
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;
            // Check rate limit for search
            const rateLimitResult = await rateLimit_1.rateLimitService.checkRateLimit(userId, 'google-search');
            if (!rateLimitResult.allowed) {
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    message: `Too many search requests. Try again after ${rateLimitResult.resetTime.toISOString()}`,
                    remainingRequests: rateLimitResult.remainingRequests,
                    resetTime: rateLimitResult.resetTime.toISOString()
                });
            }
            // Validate and sanitize request
            const validatedRequest = validation_1.ValidationService.validateSearchRequest(req.body);
            // Perform search with backend API key
            const results = await googleSearchService_1.googleSearchService.search(validatedRequest);
            // Log usage
            await logSearchUsage(userId, validatedRequest.query);
            return res.status(200).json({
                success: true,
                data: results
            });
        }
        catch (error) {
            if (error instanceof validation_1.ValidationError) {
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
const logAIUsage = async (userId, modelUsed, complexity, citySlug) => {
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
    }
    catch (error) {
        console.error('Error logging AI usage:', error);
        // Don't fail the main request if logging fails
    }
};
// Log Google Search usage
const logSearchUsage = async (userId, query) => {
    try {
        const searchLog = {
            userId,
            query: query.substring(0, 100),
            timestamp: new Date(),
            service: 'google-search',
            region: 'us-central1'
        };
        await admin.firestore()
            .collection('search_usage_logs')
            .add(searchLog);
    }
    catch (error) {
        console.error('Error logging search usage:', error);
    }
};
// Export metrics functions
var metricsService_1 = require("./metricsService");
Object.defineProperty(exports, "initializeCategories", { enumerable: true, get: function () { return metricsService_1.initializeCategories; } });
Object.defineProperty(exports, "recordChatMetric", { enumerable: true, get: function () { return metricsService_1.recordChatMetric; } });
Object.defineProperty(exports, "getCityMetrics", { enumerable: true, get: function () { return metricsService_1.getCityMetrics; } });
Object.defineProperty(exports, "cleanupOldMetrics", { enumerable: true, get: function () { return metricsService_1.cleanupOldMetrics; } });
Object.defineProperty(exports, "debugMetrics", { enumerable: true, get: function () { return metricsService_1.debugMetrics; } });
Object.defineProperty(exports, "migrateMetricsData", { enumerable: true, get: function () { return metricsService_1.migrateMetricsData; } });
Object.defineProperty(exports, "setupAndFixMetrics", { enumerable: true, get: function () { return metricsService_1.setupAndFixMetrics; } });
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
exports.deleteUserData = functions.https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
        var _a;
        try {
            // Verificar autenticación
            const authHeader = req.headers.authorization;
            if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
                return res.status(401).json({ error: 'Authorization required' });
            }
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const adminUserId = decodedToken.uid;
            // Verificar que el usuario sea admin
            const adminDoc = await admin.firestore().collection('profiles').doc(adminUserId).get();
            if (!adminDoc.exists || ((_a = adminDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'administrativo') {
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
        }
        catch (error) {
            console.error('Error in deleteUserData:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
// Scraping avanzado
exports.advancedScrapingFunction = functions.https.onCall(advancedScraping_1.advancedScraping);
exports.advancedCrawlingFunction = functions.https.onCall(advancedScraping_1.advancedCrawling);
// Procesamiento de documentos
exports.processDocumentFunction = functions.https.onCall(documentProcessor_1.processDocument);
exports.processManualTextFunction = functions.https.onCall(documentProcessor_1.processManualText);
// Generación de embeddings
exports.generateEmbeddingsFunction = functions.https.onCall(embeddingGenerator_1.generateEmbeddings);
exports.generateBatchEmbeddingsFunction = functions.https.onCall(embeddingGenerator_1.generateBatchEmbeddings);
exports.regenerateEmbeddingsFunction = functions.https.onCall(embeddingGenerator_1.regenerateEmbeddings);
// Búsqueda vectorial
exports.vectorSearchFunction = functions.https.onCall(vectorSearch_1.vectorSearch);
exports.hybridSearchFunction = functions.https.onCall(vectorSearch_1.hybridSearch);
// RAG completo
exports.ragQueryFunction = functions.https.onCall(ragRetrieval_1.ragQuery);
exports.getRAGConversationsFunction = functions.https.onCall(ragRetrieval_1.getRAGConversations);
exports.getRAGStatsFunction = functions.https.onCall(ragRetrieval_1.getRAGStats);
// Función de integración RAG híbrida
async function tryRAGFirst(query, userId, citySlug, cityContext) {
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
        const allChunks = [];
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
        const genAI = new (await Promise.resolve().then(() => __importStar(require('@google/generative-ai')))).GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
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
    }
    catch (error) {
        console.error('❌ RAG: Error in tryRAGFirst:', error);
        return null;
    }
}
//# sourceMappingURL=index.js.map
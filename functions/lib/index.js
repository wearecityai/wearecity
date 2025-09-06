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
exports.setupAndFixMetrics = exports.migrateMetricsData = exports.debugMetrics = exports.cleanupOldMetrics = exports.getCityMetrics = exports.recordChatMetric = exports.initializeCategories = exports.classifyQuery = exports.processAIChat = exports.healthCheck = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
const vertexAIService_1 = require("./vertexAIService");
// Inicializar Firebase Admin
admin.initializeApp();
// Configure CORS
const corsHandler = (0, cors_1.default)({ origin: true });
// Basic health check function
exports.healthCheck = functions.https.onRequest((req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'WeAreCity Functions with Vertex AI are running'
    });
});
// Main AI chat endpoint
exports.processAIChat = functions.https.onRequest(async (req, res) => {
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
                }
                catch (authError) {
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
                result = await (0, vertexAIService_1.processUserQuery)(query, cityContext, conversationHistory);
            }
            // Log usage for monitoring
            await logAIUsage(userId, result.modelUsed, result.complexity, citySlug);
            return res.status(200).json({
                success: true,
                data: result
            });
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
// Export metrics functions
var metricsService_1 = require("./metricsService");
Object.defineProperty(exports, "initializeCategories", { enumerable: true, get: function () { return metricsService_1.initializeCategories; } });
Object.defineProperty(exports, "recordChatMetric", { enumerable: true, get: function () { return metricsService_1.recordChatMetric; } });
Object.defineProperty(exports, "getCityMetrics", { enumerable: true, get: function () { return metricsService_1.getCityMetrics; } });
Object.defineProperty(exports, "cleanupOldMetrics", { enumerable: true, get: function () { return metricsService_1.cleanupOldMetrics; } });
Object.defineProperty(exports, "debugMetrics", { enumerable: true, get: function () { return metricsService_1.debugMetrics; } });
Object.defineProperty(exports, "migrateMetricsData", { enumerable: true, get: function () { return metricsService_1.migrateMetricsData; } });
Object.defineProperty(exports, "setupAndFixMetrics", { enumerable: true, get: function () { return metricsService_1.setupAndFixMetrics; } });
//# sourceMappingURL=index.js.map
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
import { processUserQuery, processMultimodalQuery, classifyQueryComplexity } from './vertexAIService';

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
          result = await processUserQuery(query, cityContext, conversationHistory);
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
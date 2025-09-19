import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import cors from 'cors';
import { processUserQuery, processMultimodalQuery } from './vertexAIService';

// Initialize Firebase Admin
admin.initializeApp();

// CORS configuration
const corsHandler = cors({
  origin: true,
  credentials: true,
});

// Main AI chat processing function
export const processAIChat = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
  })
  .https
  .onRequest(async (req, res) => {
    // CORS handling
    corsHandler(req, res, async () => {
      if (req.method === 'OPTIONS') {
        res.status(200).send();
        return;
      }

      try {
        const { query, citySlug, conversationHistory, isMultimodal, imageData, action } = req.body;

        console.log(`🔍 REQUEST DEBUG: action=${action}, query=${query?.substring(0, 20)}, citySlug=${citySlug}`);

        if (!query || query.trim() === '') {
          res.status(400).json({ error: 'Query parameter is required' });
          return;
        }

        let result;
        
        if (isMultimodal && imageData) {
          console.log(`🖼️ Processing multimodal query for city: ${citySlug}`);
          result = await processMultimodalQuery(query, imageData, 'image', citySlug);
        } else {
          console.log(`💬 Processing text query for city: ${citySlug}`);
          
          // Get basic city data
          const cityDoc = await admin.firestore().collection('cities').doc(citySlug).get();
          const cityData = cityDoc.exists ? cityDoc.data() : null;
          
          result = await processUserQuery(
            query, 
            cityData?.name || citySlug, // cityContext (nombre de la ciudad)
            conversationHistory, 
            cityData?.config // cityConfig
          );
        }

        res.status(200).json(result);

      } catch (error) {
        console.error('❌ Error in processAIChat:', error);
        res.status(500).json({ 
          error: 'Internal server error', 
          details: error.message 
        });
      }
    });
  });

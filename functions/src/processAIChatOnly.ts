import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Main AI chat function
export const processAIChat = functions.https.onCall(async (data, context) => {
    return processAIChatLogic(data, context);
  });

async function processAIChatLogic(data: any, context: any) {
  try {
    console.log('🔍 DEBUG - Firebase Function received data:', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      hasQuery: !!data?.query,
      hasCitySlug: !!data?.citySlug,
      hasCityContext: !!data?.cityContext
    });

    // Basic validation
    if (!data) {
      throw new Error('No data received');
    }

    if (!data.query || typeof data.query !== 'string') {
      throw new Error('Query is required and must be a string');
    }

    const query = data.query.trim();
    if (query.length === 0) {
      throw new Error('Query cannot be empty');
    }

    // Get user ID
    const userId = context.auth?.uid || 'anonymous';

    // Get city context
    let cityContext = data.cityContext || '';
    if (!cityContext && data.citySlug) {
      try {
        const cityDoc = await admin.firestore()
          .collection('cities')
          .where('slug', '==', data.citySlug)
          .limit(1)
          .get();
        if (!cityDoc.empty) {
          cityContext = cityDoc.docs[0].data().name;
        }
      } catch (error) {
        console.log('⚠️ Could not fetch city context:', error);
      }
    }

    // Simple response for now
    const result = {
      response: `Hola! Recibí tu consulta: "${query}" en ${cityContext || 'la ciudad'}. La función está funcionando correctamente.`,
      events: [],
      places: [],
      modelUsed: 'gemini-2.5-flash-lite',
      complexity: 'simple',
      searchPerformed: false
    };

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('❌ Error in processAIChat:', error);
    throw new functions.https.HttpsError('internal', `Error processing AI chat: ${error.message}`);
  }
}

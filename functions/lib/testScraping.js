"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testScraping = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Firebase Function de prueba sin Firecrawl
 */
exports.testScraping = functions.https.onCall(async (data, context) => {
    console.log('🧪 Test scraping function called with:', data);
    
    try {
        const { url, userId, citySlug } = data;
        
        console.log('✅ Function executed successfully');
        
        return {
            success: true,
            message: 'Test function works without Firecrawl',
            data: {
                url,
                userId,
                citySlug,
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('❌ Test function error:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

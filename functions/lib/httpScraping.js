"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpScraping = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}

const corsHandler = cors({ origin: true });

/**
 * Firebase Function HTTP (no callable) para scraping
 */
exports.httpScraping = functions.https.onRequest((req, res) => {
    return corsHandler(req, res, async () => {
        try {
            console.log('🧪 HTTP scraping function called');
            console.log('Request body:', req.body);
            console.log('Request method:', req.method);
            
            if (req.method !== 'POST') {
                res.status(405).json({ error: 'Method not allowed' });
                return;
            }
            
            const { url, userId, citySlug } = req.body;
            
            console.log('✅ HTTP Function executed successfully');
            
            res.status(200).json({
                success: true,
                message: 'HTTP function works without callable',
                data: {
                    url,
                    userId,
                    citySlug,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('❌ HTTP function error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
});

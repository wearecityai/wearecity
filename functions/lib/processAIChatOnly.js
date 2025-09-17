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
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAIChat = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
// Main AI chat function
exports.processAIChat = functions.https.onCall(async (data, context) => {
    return processAIChatLogic(data, context);
});
async function processAIChatLogic(data, context) {
    var _a;
    try {
        console.log('🔍 DEBUG - Firebase Function received data:', {
            hasData: !!data,
            dataKeys: data ? Object.keys(data) : [],
            hasQuery: !!(data === null || data === void 0 ? void 0 : data.query),
            hasCitySlug: !!(data === null || data === void 0 ? void 0 : data.citySlug),
            hasCityContext: !!(data === null || data === void 0 ? void 0 : data.cityContext)
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
        const userId = ((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid) || 'anonymous';
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
            }
            catch (error) {
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
    }
    catch (error) {
        console.error('❌ Error in processAIChat:', error);
        throw new functions.https.HttpsError('internal', `Error processing AI chat: ${error.message}`);
    }
}
//# sourceMappingURL=processAIChatOnly.js.map
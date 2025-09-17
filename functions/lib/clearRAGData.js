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
exports.clearCityRAGDataFunction = exports.clearRAGData = exports.clearCityRAGData = exports.clearAllRAGData = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const cors_1 = __importDefault(require("cors"));
// Configure CORS
const corsHandler = (0, cors_1.default)({ origin: true });
// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Limpiar todas las colecciones RAG
 */
const clearAllRAGData = async () => {
    console.log('🧹 Clearing all RAG data...');
    try {
        const collections = [
            'document_chunks',
            'rag_conversations',
            'library_sources_enhanced',
            'rag_dynamic_chunks',
            'rag_dynamic_responses'
        ];
        let totalDeleted = 0;
        const results = [];
        // Limpiar cada colección
        for (const collectionName of collections) {
            console.log(`🗑️ Clearing collection: ${collectionName}`);
            const collectionRef = db.collection(collectionName);
            const snapshot = await collectionRef.get();
            if (snapshot.empty) {
                console.log(`✅ Collection ${collectionName} is already empty`);
                results.push({ collection: collectionName, deleted: 0, status: 'empty' });
                continue;
            }
            // Eliminar documentos en lotes
            const batch = db.batch();
            let batchCount = 0;
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
                batchCount++;
            });
            if (batchCount > 0) {
                await batch.commit();
                console.log(`✅ Deleted ${batchCount} documents from ${collectionName}`);
                totalDeleted += batchCount;
                results.push({ collection: collectionName, deleted: batchCount, status: 'cleared' });
            }
        }
        // Limpiar configuración RAG
        console.log('🗑️ Clearing RAG configuration...');
        try {
            await db.collection('_config').doc('rag').delete();
            console.log('✅ RAG configuration cleared');
            results.push({ collection: '_config/rag', deleted: 1, status: 'cleared' });
            totalDeleted += 1;
        }
        catch (error) {
            console.log('ℹ️ RAG configuration was already empty or doesn\'t exist');
            results.push({ collection: '_config/rag', deleted: 0, status: 'not_found' });
        }
        console.log(`🎉 RAG cleanup completed! Total documents deleted: ${totalDeleted}`);
        return {
            success: true,
            message: 'All RAG data cleared successfully',
            totalDeleted,
            results
        };
    }
    catch (error) {
        console.error('❌ Error clearing RAG data:', error);
        throw error;
    }
};
exports.clearAllRAGData = clearAllRAGData;
/**
 * Limpiar datos RAG de una ciudad específica
 */
const clearCityRAGData = async (citySlug) => {
    console.log(`🧹 Clearing RAG data for city: ${citySlug}...`);
    try {
        const collections = [
            'document_chunks',
            'rag_conversations',
            'library_sources_enhanced',
            'rag_dynamic_chunks',
            'rag_dynamic_responses'
        ];
        let totalDeleted = 0;
        const results = [];
        for (const collectionName of collections) {
            console.log(`🗑️ Clearing collection: ${collectionName} for city: ${citySlug}`);
            const collectionRef = db.collection(collectionName);
            const snapshot = await collectionRef.get();
            if (snapshot.empty) {
                console.log(`✅ Collection ${collectionName} is already empty`);
                results.push({ collection: collectionName, deleted: 0, status: 'empty' });
                continue;
            }
            const batch = db.batch();
            let batchCount = 0;
            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                // Filtrar por citySlug (verificar diferentes campos posibles)
                if (data.citySlug === citySlug || data.city_slug === citySlug || data.city === citySlug) {
                    batch.delete(doc.ref);
                    batchCount++;
                }
            });
            if (batchCount > 0) {
                await batch.commit();
                console.log(`✅ Deleted ${batchCount} documents from ${collectionName} for city ${citySlug}`);
                totalDeleted += batchCount;
                results.push({ collection: collectionName, deleted: batchCount, status: 'cleared' });
            }
            else {
                console.log(`ℹ️ No documents found for city ${citySlug} in ${collectionName}`);
                results.push({ collection: collectionName, deleted: 0, status: 'no_matches' });
            }
        }
        console.log(`🎉 City RAG cleanup completed for ${citySlug}! Total documents deleted: ${totalDeleted}`);
        return {
            success: true,
            message: `RAG data cleared successfully for city: ${citySlug}`,
            citySlug,
            totalDeleted,
            results
        };
    }
    catch (error) {
        console.error(`❌ Error clearing RAG data for city ${citySlug}:`, error);
        throw error;
    }
};
exports.clearCityRAGData = clearCityRAGData;
/**
 * Firebase Function para limpiar todos los datos RAG
 */
exports.clearRAGData = functions.https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
        try {
            console.log('🚀 Starting RAG data cleanup...');
            const result = await (0, exports.clearAllRAGData)();
            res.status(200).json({
                success: true,
                message: 'RAG data cleared successfully',
                data: result
            });
        }
        catch (error) {
            console.error('❌ Error clearing RAG data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to clear RAG data',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
/**
 * Firebase Function para limpiar datos RAG de una ciudad específica
 */
exports.clearCityRAGDataFunction = functions.https.onRequest(corsHandler(async (req, res) => {
    try {
        const { citySlug } = req.body;
        if (!citySlug) {
            return res.status(400).json({
                success: false,
                error: 'City slug is required'
            });
        }
        console.log(`🚀 Starting RAG data cleanup for city: ${citySlug}...`);
        const result = await (0, exports.clearCityRAGData)(citySlug);
        res.status(200).json({
            success: true,
            message: `RAG data cleared successfully for city: ${citySlug}`,
            data: result
        });
    }
    catch (error) {
        console.error('❌ Error clearing city RAG data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear city RAG data',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
//# sourceMappingURL=clearRAGData.js.map
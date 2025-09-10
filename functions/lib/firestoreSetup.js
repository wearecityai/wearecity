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
exports.setupRAGSystem = exports.setupRAGCollections = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const cors_1 = __importDefault(require("cors"));
// Configure CORS
const corsHandler = (0, cors_1.default)({ origin: true });
/**
 * Script para configurar las nuevas colecciones de RAG en Firestore
 * Se ejecuta una sola vez para configurar la estructura de datos
 */
// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Configuración de índices necesarios para las nuevas colecciones
 */
const setupRAGCollections = async () => {
    console.log('🔧 Setting up RAG collections...');
    try {
        // Crear documento de configuración para índices
        const configRef = db.collection('_config').doc('rag_setup');
        await configRef.set({
            setupDate: admin.firestore.FieldValue.serverTimestamp(),
            collections: {
                library_sources_enhanced: {
                    description: 'Enhanced library sources with embeddings',
                    fields: ['userId', 'citySlug', 'processingStatus', 'createdAt'],
                    indexes: [
                        { fields: ['userId', 'citySlug'], order: ['userId', 'citySlug'] },
                        { fields: ['processingStatus'], order: ['processingStatus'] },
                        { fields: ['createdAt'], order: ['createdAt', 'desc'] }
                    ]
                },
                document_chunks: {
                    description: 'Document chunks with embeddings for vector search',
                    fields: ['sourceId', 'chunkIndex', 'embedding'],
                    indexes: [
                        { fields: ['sourceId'], order: ['sourceId'] },
                        { fields: ['sourceId', 'chunkIndex'], order: ['sourceId', 'chunkIndex'] }
                    ]
                },
                rag_conversations: {
                    description: 'RAG conversations with sources used',
                    fields: ['userId', 'citySlug', 'createdAt'],
                    indexes: [
                        { fields: ['userId', 'citySlug'], order: ['userId', 'citySlug'] },
                        { fields: ['createdAt'], order: ['createdAt', 'desc'] }
                    ]
                }
            },
            status: 'configured'
        });
        console.log('✅ RAG collections configuration saved');
        // Crear documento de ejemplo para testing
        const exampleSourceRef = db.collection('library_sources_enhanced').doc('example');
        await exampleSourceRef.set({
            userId: 'example-user',
            citySlug: 'example-city',
            type: 'text',
            title: 'Ejemplo de fuente RAG',
            originalUrl: '',
            content: 'Este es un ejemplo de contenido para testing del sistema RAG.',
            documentLinks: [],
            processingStatus: 'ready',
            embedding: null,
            metadata: {
                wordCount: 12,
                language: 'es',
                tags: ['ejemplo', 'test', 'rag'],
                extractedText: 'Este es un ejemplo de contenido para testing del sistema RAG.'
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Example source created');
        return { success: true, message: 'RAG collections configured successfully' };
    }
    catch (error) {
        console.error('❌ Error setting up RAG collections:', error);
        throw error;
    }
};
exports.setupRAGCollections = setupRAGCollections;
/**
 * Firebase Function para configurar RAG
 */
exports.setupRAGSystem = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            console.log('🚀 Setting up RAG system...');
            const result = await (0, exports.setupRAGCollections)();
            res.status(200).json({
                success: true,
                message: 'RAG system setup completed successfully',
                data: result
            });
        }
        catch (error) {
            console.error('❌ Error setting up RAG system:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to setup RAG system',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
//# sourceMappingURL=firestoreSetup.js.map
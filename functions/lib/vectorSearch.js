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
exports.hybridSearch = exports.vectorSearch = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Generar embedding de consulta usando Google Gemini Embedding API
 */
async function generateQueryEmbedding(query) {
    try {
        const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(query);
        return result.embedding.values;
    }
    catch (error) {
        console.error('❌ Error generating query embedding:', error);
        throw error;
    }
}
/**
 * Calcular similitud coseno entre dos vectores
 */
function cosineSimilarity(a, b) {
    if (a.length !== b.length) {
        throw new Error('Vectors must have the same length');
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    if (normA === 0 || normB === 0) {
        return 0;
    }
    return dotProduct / (normA * normB);
}
/**
 * Firebase Function para búsqueda vectorial
 */
exports.vectorSearch = functions.https.onCall(async (data, context) => {
    // Verificar autenticación
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { query, userId, citySlug, limit = 5, threshold = 0.7 } = data;
    console.log('🔍 Vector search for query:', query.substring(0, 50) + '...');
    try {
        // 1. Generar embedding de la consulta
        const queryEmbedding = await generateQueryEmbedding(query);
        console.log('✅ Query embedding generated, length:', queryEmbedding.length);
        // 2. Obtener todos los chunks con embeddings del usuario y ciudad
        const sourcesSnapshot = await db
            .collection('library_sources_enhanced')
            .where('userId', '==', userId)
            .where('citySlug', '==', citySlug)
            .where('embedding', '!=', null)
            .get();
        const sourceIds = sourcesSnapshot.docs.map(doc => doc.id);
        if (sourceIds.length === 0) {
            console.log('ℹ️ No sources with embeddings found');
            return {
                success: true,
                results: [],
                totalChunks: 0,
                queryEmbedding
            };
        }
        // 3. Obtener chunks de las fuentes encontradas
        const chunksSnapshot = await db
            .collection('document_chunks')
            .where('sourceId', 'in', sourceIds)
            .where('embedding', '!=', null)
            .get();
        console.log(`📊 Found ${chunksSnapshot.size} chunks with embeddings`);
        if (chunksSnapshot.size === 0) {
            return {
                success: true,
                results: [],
                totalChunks: 0,
                queryEmbedding
            };
        }
        // 4. Calcular similitudes
        const similarities = [];
        for (const chunkDoc of chunksSnapshot.docs) {
            const chunkData = chunkDoc.data();
            const chunkEmbedding = chunkData.embedding;
            if (!chunkEmbedding || chunkEmbedding.length === 0) {
                continue;
            }
            const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
            if (similarity >= threshold) {
                similarities.push({
                    id: chunkDoc.id,
                    sourceId: chunkData.sourceId,
                    content: chunkData.content,
                    similarity,
                    metadata: chunkData.metadata
                });
            }
        }
        // 5. Ordenar por similitud y tomar los mejores
        similarities.sort((a, b) => b.similarity - a.similarity);
        const topResults = similarities.slice(0, limit);
        console.log(`✅ Found ${topResults.length} relevant chunks above threshold ${threshold}`);
        // 6. Obtener información de las fuentes
        const uniqueSourceIds = [...new Set(topResults.map(r => r.sourceId))];
        const sourcesMap = new Map();
        for (const sourceId of uniqueSourceIds) {
            const sourceDoc = await db.collection('library_sources_enhanced').doc(sourceId).get();
            if (sourceDoc.exists) {
                sourcesMap.set(sourceId, Object.assign({ id: sourceDoc.id }, sourceDoc.data()));
            }
        }
        // 7. Combinar resultados con información de fuentes
        const results = topResults.map(result => (Object.assign(Object.assign({}, result), { source: sourcesMap.get(result.sourceId) })));
        return {
            success: true,
            results,
            totalChunks: chunksSnapshot.size,
            queryEmbedding
        };
    }
    catch (error) {
        console.error('❌ Vector search error:', error);
        return {
            success: false,
            error: error.message
        };
    }
});
/**
 * Firebase Function para búsqueda híbrida (vectorial + texto)
 */
exports.hybridSearch = functions.https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { query, userId, citySlug, limit = 5 } = data;
    try {
        console.log('🔍 Hybrid search for query:', query.substring(0, 50) + '...');
        // 1. Búsqueda vectorial
        const vectorResults = await (0, exports.vectorSearch)({ query, userId, citySlug, limit: limit * 2 }, context);
        // 2. Búsqueda por texto (palabras clave)
        const textResults = await db
            .collection('library_sources_enhanced')
            .where('userId', '==', userId)
            .where('citySlug', '==', citySlug)
            .get();
        const queryWords = query.toLowerCase().split(/\s+/);
        const textMatches = textResults.docs
            .map(doc => {
            const data = doc.data();
            const content = (data.content || '').toLowerCase();
            const title = (data.title || '').toLowerCase();
            const contentMatches = queryWords.filter(word => content.includes(word)).length;
            const titleMatches = queryWords.filter(word => title.includes(word)).length;
            const score = contentMatches + (titleMatches * 2); // Títulos tienen más peso
            return {
                id: doc.id,
                sourceId: doc.id,
                content: data.content,
                similarity: score / queryWords.length,
                metadata: data.metadata,
                source: Object.assign({ id: doc.id }, data)
            };
        })
            .filter(result => result.similarity > 0)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
        // 3. Combinar resultados (eliminar duplicados)
        const combinedResults = new Map();
        // Agregar resultados vectoriales
        (_a = vectorResults.results) === null || _a === void 0 ? void 0 : _a.forEach(result => {
            combinedResults.set(result.sourceId, Object.assign(Object.assign({}, result), { searchType: 'vectorial', vectorSimilarity: result.similarity }));
        });
        // Agregar resultados de texto (si no están ya)
        textMatches.forEach(result => {
            if (!combinedResults.has(result.sourceId)) {
                combinedResults.set(result.sourceId, Object.assign(Object.assign({}, result), { searchType: 'textual', textSimilarity: result.similarity }));
            }
            else {
                // Combinar si ya existe
                const existing = combinedResults.get(result.sourceId);
                combinedResults.set(result.sourceId, Object.assign(Object.assign({}, existing), { textSimilarity: result.similarity, searchType: 'hybrid' }));
            }
        });
        // 4. Ordenar por relevancia combinada
        const finalResults = Array.from(combinedResults.values())
            .sort((a, b) => {
            const scoreA = (a.vectorSimilarity || 0) + (a.textSimilarity || 0) * 0.5;
            const scoreB = (b.vectorSimilarity || 0) + (b.textSimilarity || 0) * 0.5;
            return scoreB - scoreA;
        })
            .slice(0, limit);
        console.log(`✅ Hybrid search completed: ${finalResults.length} results`);
        return {
            success: true,
            results: finalResults,
            vectorResults: ((_b = vectorResults.results) === null || _b === void 0 ? void 0 : _b.length) || 0,
            textResults: textMatches.length,
            totalCombined: finalResults.length
        };
    }
    catch (error) {
        console.error('❌ Hybrid search error:', error);
        throw new functions.https.HttpsError('internal', `Hybrid search failed: ${error.message}`);
    }
});
//# sourceMappingURL=vectorSearch.js.map
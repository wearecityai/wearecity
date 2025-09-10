const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const corsHandler = cors({ origin: true });

/**
 * Generar embedding de consulta usando Google Gemini Embedding API
 */
async function generateQueryEmbedding(query) {
    try {
        const genAI = new GoogleGenerativeAI("AIzaSyDksNTEkRDILZimpnX7vUc36u66SAAH5l0");
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(query);
        return result.embedding.values;
    } catch (error) {
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
 * Firebase HTTP Function para búsqueda vectorial
 */
exports.httpVectorSearch = functions.https.onRequest((req, res) => {
    return corsHandler(req, res, async () => {
        try {
            console.log('🔍 HTTP Vector search function called');
            
            if (req.method !== 'POST') {
                res.status(405).json({ error: 'Method not allowed' });
                return;
            }
            
            const { query, userId, citySlug, limit = 5, threshold = 0.7 } = req.body;
            
            if (!query) {
                res.status(400).json({ error: 'Query is required' });
                return;
            }
            
            console.log('🔍 Vector search for query:', query.substring(0, 50) + '...');
            
            // 1. Generar embedding de la consulta
            const queryEmbedding = await generateQueryEmbedding(query);
            console.log('✅ Query embedding generated, length:', queryEmbedding.length);
            
            // 2. Obtener todos los chunks con embeddings del usuario y ciudad
            const sourcesSnapshot = await db
                .collection('library_sources_enhanced')
                .where('userId', '==', userId || 'anonymous')
                .where('citySlug', '==', citySlug || 'default')
                .where('embedding', '!=', null)
                .get();
            
            const sourceIds = sourcesSnapshot.docs.map(doc => doc.id);
            
            if (sourceIds.length === 0) {
                console.log('ℹ️ No sources with embeddings found');
                return res.status(200).json({
                    success: true,
                    results: [],
                    totalChunks: 0,
                    queryEmbedding
                });
            }
            
            // 3. Obtener chunks de las fuentes encontradas
            const chunksSnapshot = await db
                .collection('document_chunks')
                .where('sourceId', 'in', sourceIds)
                .where('embedding', '!=', null)
                .get();
            
            console.log(`📊 Found ${chunksSnapshot.size} chunks with embeddings`);
            
            if (chunksSnapshot.size === 0) {
                return res.status(200).json({
                    success: true,
                    results: [],
                    totalChunks: 0,
                    queryEmbedding
                });
            }
            
            // 4. Calcular similitudes
            const similarities = [];
            
            for (const chunkDoc of chunksSnapshot.docs) {
                const chunkData = chunkDoc.data();
                const chunkEmbedding = chunkData.embedding;
                
                if (!chunkEmbedding || !Array.isArray(chunkEmbedding)) {
                    console.warn('⚠️ Invalid embedding for chunk:', chunkDoc.id);
                    continue;
                }
                
                const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
                
                if (similarity >= threshold) {
                    similarities.push({
                        id: chunkDoc.id,
                        sourceId: chunkData.sourceId,
                        content: chunkData.content,
                        similarity: similarity,
                        metadata: chunkData.metadata || {}
                    });
                }
            }
            
            // 5. Ordenar por similitud y limitar resultados
            similarities.sort((a, b) => b.similarity - a.similarity);
            const topResults = similarities.slice(0, limit);
            
            console.log(`✅ Vector search completed: ${topResults.length} results`);
            
            res.status(200).json({
                success: true,
                results: topResults,
                totalChunks: chunksSnapshot.size,
                queryEmbedding: queryEmbedding.slice(0, 5) // Solo primeros 5 valores para debug
            });
            
        } catch (error) {
            console.error('❌ Vector search error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpGenerateEmbeddings = void 0;

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");

// Configurar CORS
const corsHandler = cors({ origin: true });

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Generar embedding usando Google Gemini Embedding API
 */
async function generateEmbedding(text) {
    try {
        const genAI = new GoogleGenerativeAI("AIzaSyDksNTEkRDILZimpnX7vUc36u66SAAH5l0");
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('❌ Error generating embedding:', error);
        throw error;
    }
}

/**
 * Generar embeddings en lotes para optimizar rendimiento
 */
async function generateBatchEmbeddings(texts) {
    try {
        console.log(`🔄 Processing ${texts.length} texts in batch`);
        const embeddings = [];
        
        // Procesar en lotes de 10 para evitar límites de rate
        const batchSize = 10;
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            console.log(`📊 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);
            
            const batchPromises = batch.map(text => generateEmbedding(text));
            const batchEmbeddings = await Promise.all(batchPromises);
            embeddings.push(...batchEmbeddings);
            
            // Pequeña pausa entre lotes para respetar rate limits
            if (i + batchSize < texts.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        return embeddings;
    } catch (error) {
        console.error('❌ Error in batch embedding generation:', error);
        throw error;
    }
}

/**
 * Función HTTP para generar embeddings
 */
exports.httpGenerateEmbeddings = functions.https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
        console.log('🧠 HTTP Generate embeddings function called');
        
        // Verificar método
        if (req.method !== 'POST') {
            res.status(405).json({
                success: false,
                error: 'Method not allowed'
            });
            return;
        }
        
        const { sourceId, userId, citySlug } = req.body;
        
        if (!sourceId) {
            res.status(400).json({
                success: false,
                error: 'sourceId is required'
            });
            return;
        }
        
        console.log('🧠 Generating embeddings for source:', sourceId);
        
        try {
            // Obtener fuente principal
            const sourceDoc = await db.collection('library_sources_enhanced').doc(sourceId).get();
            if (!sourceDoc.exists) {
                res.status(404).json({
                    success: false,
                    error: 'Source not found'
                });
                return;
            }
            
            const sourceData = sourceDoc.data();
            if (!sourceData) {
                res.status(404).json({
                    success: false,
                    error: 'Source data not found'
                });
                return;
            }
            
            // Obtener chunks de la fuente
            const chunksSnapshot = await db
                .collection('document_chunks')
                .where('sourceId', '==', sourceId)
                .orderBy('chunkIndex')
                .get();
                
            console.log(`📊 Found ${chunksSnapshot.size} chunks to process`);
            
            const batch = db.batch();
            let chunksProcessed = 0;
            let mainContentEmbedded = false;
            
            // Generar embedding para contenido principal si existe
            const mainContent = sourceData.content;
            if (mainContent && mainContent.length > 0) {
                console.log('🧠 Generating embedding for main content...');
                const mainEmbedding = await generateEmbedding(mainContent);
                
                batch.update(sourceDoc.ref, {
                    embedding: mainEmbedding,
                    processingStatus: 'embedded',
                    metadata: {
                        ...sourceData.metadata,
                        embeddingGenerated: true,
                        embeddingLength: mainEmbedding.length,
                        embeddedAt: admin.firestore.FieldValue.serverTimestamp()
                    },
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                
                mainContentEmbedded = true;
                console.log('✅ Main content embedding generated');
            }
            
            // Generar embeddings para chunks
            if (chunksSnapshot.size > 0) {
                console.log('🧠 Generating embeddings for chunks...');
                const chunkTexts = chunksSnapshot.docs.map(doc => doc.data().content);
                const chunkEmbeddings = await generateBatchEmbeddings(chunkTexts);
                
                // Actualizar chunks con embeddings
                chunksSnapshot.docs.forEach((chunkDoc, index) => {
                    batch.update(chunkDoc.ref, {
                        embedding: chunkEmbeddings[index],
                        metadata: {
                            ...chunkDoc.data().metadata,
                            embeddingGenerated: true,
                            embeddingLength: chunkEmbeddings[index].length,
                            embeddedAt: admin.firestore.FieldValue.serverTimestamp()
                        },
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    chunksProcessed++;
                });
                
                console.log(`✅ Generated embeddings for ${chunksProcessed} chunks`);
            }
            
            // Ejecutar todas las actualizaciones
            await batch.commit();
            console.log('💾 All embeddings saved to Firestore');
            
            const response = {
                success: true,
                message: 'Embeddings generated successfully',
                data: {
                    sourceId,
                    mainContentEmbedded,
                    chunksProcessed,
                    totalProcessed: chunksProcessed + (mainContentEmbedded ? 1 : 0)
                }
            };
            
            console.log('✅ Embeddings generation completed:', response);
            res.status(200).json(response);
            
        } catch (error) {
            console.error('❌ Error generating embeddings:', error);
            res.status(500).json({
                success: false,
                error: `Error generating embeddings: ${error.message}`
            });
        }
    });
});

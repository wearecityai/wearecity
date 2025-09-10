const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");

if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const corsHandler = cors({ origin: true });

/**
 * Genera embedding para texto usando Google Gemini
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
 * Divide el texto en chunks para almacenamiento
 */
function createResponseChunks(responseText, maxChunkSize = 1000) {
    const chunks = [];
    const sentences = responseText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;
        
        // Si agregar esta oración excede el tamaño máximo, guardar el chunk actual
        if (currentChunk.length + trimmedSentence.length + 1 > maxChunkSize && currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.trim(),
                chunkIndex: chunkIndex++
            });
            currentChunk = trimmedSentence;
        } else {
            currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
        }
    }
    
    // Agregar el último chunk si tiene contenido
    if (currentChunk.trim().length > 0) {
        chunks.push({
            content: currentChunk.trim(),
            chunkIndex: chunkIndex
        });
    }
    
    return chunks;
}

/**
 * Almacena una respuesta del Router en el RAG dinámico
 */
async function storeRouterResponse(query, response, userId, citySlug, modelUsed, searchPerformed) {
    try {
        console.log('💾 Storing router response in dynamic RAG...');
        
        // Crear documento de respuesta
        const responseDoc = {
            query: query,
            response: response,
            userId: userId,
            citySlug: citySlug,
            modelUsed: modelUsed,
            searchPerformed: searchPerformed,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            source: 'router_response',
            isDynamic: true
        };
        
        // Guardar en colección de respuestas dinámicas
        const responseRef = await db.collection('rag_dynamic_responses').add(responseDoc);
        console.log(`✅ Response stored with ID: ${responseRef.id}`);
        
        // Crear chunks de la respuesta
        const chunks = createResponseChunks(response);
        console.log(`📄 Created ${chunks.length} chunks from response`);
        
        // Generar embeddings para cada chunk
        const chunksWithEmbeddings = [];
        for (const chunk of chunks) {
            try {
                const embedding = await generateEmbedding(chunk.content);
                chunksWithEmbeddings.push({
                    ...chunk,
                    embedding: embedding,
                    sourceId: responseRef.id,
                    userId: userId,
                    citySlug: citySlug,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            } catch (embeddingError) {
                console.error('❌ Error generating embedding for chunk:', embeddingError);
                // Continuar sin embedding para este chunk
                chunksWithEmbeddings.push({
                    ...chunk,
                    sourceId: responseRef.id,
                    userId: userId,
                    citySlug: citySlug,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        
        // Guardar chunks en Firestore
        const batch = db.batch();
        for (const chunk of chunksWithEmbeddings) {
            const chunkRef = db.collection('rag_dynamic_chunks').doc();
            batch.set(chunkRef, chunk);
        }
        
        await batch.commit();
        console.log(`✅ Stored ${chunksWithEmbeddings.length} chunks in dynamic RAG`);
        
        return {
            success: true,
            responseId: responseRef.id,
            chunksCreated: chunksWithEmbeddings.length
        };
        
    } catch (error) {
        console.error('❌ Error storing router response:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Busca en el RAG dinámico (respuestas previas)
 */
async function searchDynamicRAG(query, userId, citySlug, threshold = 0.5) {
    try {
        console.log('🔍 Searching in dynamic RAG...');
        
        // Generar embedding de la consulta
        const queryEmbedding = await generateEmbedding(query);
        
        // Buscar chunks dinámicos relevantes
        const chunksSnapshot = await db.collection('rag_dynamic_chunks')
            .where('userId', '==', userId)
            .where('citySlug', '==', citySlug)
            .where('embedding', '!=', null)
            .limit(20)
            .get();
        
        console.log(`📊 Found ${chunksSnapshot.size} dynamic chunks`);
        
        if (chunksSnapshot.empty) {
            console.log('❌ No dynamic chunks found');
            return null;
        }
        
        // Calcular similitud coseno
        const similarities = [];
        chunksSnapshot.forEach(doc => {
            const chunkData = doc.data();
            if (chunkData.embedding) {
                const similarity = cosineSimilarity(queryEmbedding, chunkData.embedding);
                if (similarity >= threshold) {
                    similarities.push({
                        chunk: chunkData,
                        similarity: similarity,
                        docId: doc.id
                    });
                }
            }
        });
        
        // Ordenar por similitud
        similarities.sort((a, b) => b.similarity - a.similarity);
        
        console.log(`✅ Found ${similarities.length} relevant dynamic chunks`);
        
        if (similarities.length === 0) {
            return null;
        }
        
        // Obtener las respuestas originales de los chunks más relevantes
        const responseIds = [...new Set(similarities.slice(0, 5).map(s => s.chunk.sourceId))];
        const responses = [];
        
        for (const responseId of responseIds) {
            const responseDoc = await db.collection('rag_dynamic_responses').doc(responseId).get();
            if (responseDoc.exists) {
                responses.push(responseDoc.data());
            }
        }
        
        return {
            responses: responses,
            chunksFound: similarities.length,
            searchType: 'dynamic_vector'
        };
        
    } catch (error) {
        console.error('❌ Error searching dynamic RAG:', error);
        return null;
    }
}

/**
 * Búsqueda de texto en RAG dinámico (fallback)
 */
async function searchDynamicRAGText(query, userId, citySlug) {
    try {
        console.log('🔍 Searching dynamic RAG with text search...');
        
        // Limpiar la consulta y extraer palabras clave
        const cleanQuery = query.toLowerCase()
            .replace(/[¿?¡!.,;:]/g, '') // Remover signos de puntuación
            .replace(/\s+/g, ' ') // Normalizar espacios
            .trim();
        
        const queryWords = cleanQuery.split(' ').filter(word => word.length > 2);
        
        // Filtrar palabras muy comunes que no deberían activar RAG
        const commonWords = ['hola', 'gracias', 'sí', 'no', 'ok', 'vale', 'buenos', 'días', 'tardes', 'noches', 'como', 'que', 'para', 'con', 'del', 'las', 'los', 'una', 'uno', 'estas', 'estos', 'esta', 'este', 'tiempo', 'hace', 'clima', 'temperatura', 'donde', 'esta', 'ubicacion', 'direccion', 'lugar'];
        const filteredQueryWords = queryWords.filter(word => !commonWords.includes(word));
        
        // Si no hay palabras significativas después del filtro, no buscar en RAG
        if (filteredQueryWords.length === 0) {
            console.log('❌ Query contains only common words, skipping dynamic RAG search');
            return null;
        }
        
        const chunksSnapshot = await db.collection('rag_dynamic_chunks')
            .where('userId', '==', userId)
            .where('citySlug', '==', citySlug)
            .limit(20)
            .get();
        
        console.log(`📊 Found ${chunksSnapshot.size} dynamic chunks for text search`);
        
        if (chunksSnapshot.empty) {
            return null;
        }
        
        const relevantChunks = [];
        chunksSnapshot.forEach(doc => {
            const chunkData = doc.data();
            const content = chunkData.content.toLowerCase();
            
            // Buscar coincidencias con palabras significativas (incluyendo variaciones)
            const matches = filteredQueryWords.filter(word => {
                // Búsqueda exacta
                if (content.includes(word)) return true;
                
                // Búsqueda de variaciones para palabras relacionadas con empadronamiento
                if (word.includes('empadron') || word.includes('padron')) {
                    return content.includes('empadron') || content.includes('padron') || 
                           content.includes('empadronar') || content.includes('empadronamiento');
                }
                
                // Búsqueda de variaciones para palabras relacionadas con trámites
                if (word.includes('tramit') || word.includes('procedim')) {
                    return content.includes('tramit') || content.includes('procedim') ||
                           content.includes('tramite') || content.includes('procedimiento');
                }
                
                return false;
            });
            
            // Requerir al menos 2 coincidencias o 50% de las palabras para considerar relevante
            const matchThreshold = Math.max(2, Math.ceil(filteredQueryWords.length * 0.5));
            
            if (matches.length >= matchThreshold) {
                relevantChunks.push({
                    chunk: chunkData,
                    matches: matches.length,
                    docId: doc.id
                });
            }
        });
        
        // Ordenar por número de coincidencias
        relevantChunks.sort((a, b) => b.matches - a.matches);
        
        console.log(`✅ Found ${relevantChunks.length} relevant dynamic chunks via text search`);
        
        if (relevantChunks.length === 0) {
            return null;
        }
        
        // Obtener las respuestas originales
        const responseIds = [...new Set(relevantChunks.slice(0, 5).map(c => c.chunk.sourceId))];
        const responses = [];
        
        for (const responseId of responseIds) {
            const responseDoc = await db.collection('rag_dynamic_responses').doc(responseId).get();
            if (responseDoc.exists) {
                responses.push(responseDoc.data());
            }
        }
        
        return {
            responses: responses,
            chunksFound: relevantChunks.length,
            searchType: 'dynamic_text'
        };
        
    } catch (error) {
        console.error('❌ Error in dynamic RAG text search:', error);
        return null;
    }
}

/**
 * Función de similitud coseno
 */
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = {
    storeRouterResponse,
    searchDynamicRAG,
    searchDynamicRAGText
};

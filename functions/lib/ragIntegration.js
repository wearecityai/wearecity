const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Generar embedding de consulta para RAG
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
 * Buscar información en RAG local
 */
async function searchInRAG(query, userId = 'anonymous', citySlug = 'default', threshold = 0.5) {
    try {
        console.log('🔍 RAG: Searching for query:', query.substring(0, 50) + '...');
        
        // 1. Generar embedding de la consulta
        const queryEmbedding = await generateQueryEmbedding(query);
        console.log('✅ RAG: Query embedding generated');
        
        // 2. Buscar fuentes con embeddings primero
        let sourcesSnapshot;
        try {
            sourcesSnapshot = await db
                .collection('library_sources_enhanced')
                .where('userId', '==', userId)
                .where('citySlug', '==', citySlug)
                .where('embedding', '!=', null)
                .limit(20) // Limitar para optimizar
                .get();
            
            console.log('📊 RAG: Found', sourcesSnapshot.size, 'sources with embeddings');
            
            // Si no hay suficientes fuentes con embeddings, buscar todas las fuentes
            if (sourcesSnapshot.size < 3) {
                console.log('⚠️ RAG: Not enough sources with embeddings, searching all sources');
                sourcesSnapshot = await db
                    .collection('library_sources_enhanced')
                    .where('userId', '==', userId)
                    .where('citySlug', '==', citySlug)
                    .limit(20)
                    .get();
                console.log('📊 RAG: Found', sourcesSnapshot.size, 'total sources');
            }
        } catch (indexError) {
            // Si el índice no está listo, buscar sin filtros de embedding
            console.log('⚠️ RAG: Index not ready, searching without embedding filter');
            sourcesSnapshot = await db
                .collection('library_sources_enhanced')
                .where('userId', '==', userId)
                .where('citySlug', '==', citySlug)
                .limit(20)
                .get();
            console.log('📊 RAG: Found', sourcesSnapshot.size, 'sources without embedding filter');
        }
        
        if (sourcesSnapshot.size === 0) {
            console.log('ℹ️ RAG: No sources found');
            return { found: false, results: [] };
        }
        
        const sourceIds = sourcesSnapshot.docs.map(doc => doc.id);
        console.log(`📊 RAG: Found ${sourceIds.length} sources to search`);
        
        // 3. Buscar chunks con embeddings
        let chunksSnapshot;
        try {
            chunksSnapshot = await db
                .collection('document_chunks')
                .where('sourceId', 'in', sourceIds.slice(0, 10)) // Limitar para evitar límites de Firestore
                .where('embedding', '!=', null)
                .limit(50)
                .get();
        } catch (error) {
            console.log('⚠️ RAG: Error searching chunks, trying without embedding filter');
            chunksSnapshot = await db
                .collection('document_chunks')
                .where('sourceId', 'in', sourceIds.slice(0, 10))
                .limit(20)
                .get();
        }
        
        if (chunksSnapshot.size === 0) {
            console.log('ℹ️ RAG: No chunks with embeddings found');
            return { found: false, results: [] };
        }
        
        console.log(`📊 RAG: Found ${chunksSnapshot.size} chunks to analyze`);
        
        // 4. Calcular similitudes (solo si tenemos embeddings)
        const similarities = [];
        
        for (const chunkDoc of chunksSnapshot.docs) {
            const chunkData = chunkDoc.data();
            const chunkEmbedding = chunkData.embedding;
            
            if (!chunkEmbedding || !Array.isArray(chunkEmbedding)) {
                // Si no hay embedding, usar búsqueda por texto simple
                const content = chunkData.content || '';
                const queryLower = query.toLowerCase();
                const contentLower = content.toLowerCase();
                
                // Buscar coincidencias de palabras clave (mejorada)
                const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
                const matches = queryWords.filter(word => contentLower.includes(word));
                const textSimilarity = matches.length / Math.max(queryWords.length, 1);
                
                // También buscar frases completas
                const queryPhrases = query.toLowerCase().split(/[,\.;!?]/);
                const phraseMatches = queryPhrases.filter(phrase => 
                    phrase.trim().length > 5 && contentLower.includes(phrase.trim())
                );
                const phraseSimilarity = phraseMatches.length / Math.max(queryPhrases.length, 1);
                
                // Buscar coincidencias parciales de palabras
                const partialMatches = queryWords.filter(word => 
                    contentLower.split(/\s+/).some(contentWord => 
                        contentWord.includes(word) || word.includes(contentWord)
                    )
                );
                const partialSimilarity = partialMatches.length / Math.max(queryWords.length, 1);
                
                const finalSimilarity = Math.max(textSimilarity, phraseSimilarity, partialSimilarity);
                
                if (finalSimilarity > 0.1) { // Umbral aún más bajo para búsqueda por texto
                    similarities.push({
                        id: chunkDoc.id,
                        sourceId: chunkData.sourceId,
                        content: content,
                        similarity: finalSimilarity,
                        searchType: 'text',
                        metadata: chunkData.metadata || {}
                    });
                }
                continue;
            }
            
            const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
            
            if (similarity >= threshold) {
                similarities.push({
                    id: chunkDoc.id,
                    sourceId: chunkData.sourceId,
                    content: chunkData.content,
                    similarity: similarity,
                    searchType: 'vector',
                    metadata: chunkData.metadata || {}
                });
            }
        }
        
        // 5. Ordenar por similitud y tomar los mejores
        similarities.sort((a, b) => b.similarity - a.similarity);
        const topResults = similarities.slice(0, 3); // Solo los 3 mejores
        
        console.log(`✅ RAG: Found ${topResults.length} relevant results`);
        
        if (topResults.length > 0) {
            return {
                found: true,
                results: topResults,
                totalChunks: chunksSnapshot.size,
                searchType: topResults[0].searchType
            };
        } else {
            return { found: false, results: [] };
        }
        
    } catch (error) {
        console.error('❌ RAG: Error searching:', error);
        return { found: false, results: [], error: error.message };
    }
}

/**
 * Extraer eventos de la información RAG
 */
function extractEventsFromRAGContent(content) {
    try {
        const events = [];
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Buscar patrones de eventos con fechas
            const datePattern = /(\d{1,2})\s+(sep|septiembre|oct|octubre|nov|noviembre|dic|diciembre|ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto)\s*(\d{4})?/i;
            const timePattern = /(\d{1,2}):(\d{2})\s*(am|pm|h)/i;
            
            if (datePattern.test(line)) {
                const event = {
                    title: line,
                    date: extractDateFromLine(line),
                    time: extractTimeFromLine(line),
                    location: extractLocationFromLine(line),
                    description: extractDescriptionFromLine(lines, i),
                    source: 'RAG'
                };
                
                if (event.title && event.title.length > 10) { // Solo eventos con títulos significativos
                    events.push(event);
                }
            }
        }
        
        return events;
    } catch (error) {
        console.error('❌ RAG: Error extracting events:', error);
        return [];
    }
}

function extractDateFromLine(line) {
    const dateMatch = line.match(/(\d{1,2})\s+(sep|septiembre|oct|octubre|nov|noviembre|dic|diciembre|ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto)\s*(\d{4})?/i);
    if (dateMatch) {
        const day = dateMatch[1];
        const month = dateMatch[2].toLowerCase();
        const year = dateMatch[3] || '2025';
        
        const monthMap = {
            'ene': '01', 'enero': '01',
            'feb': '02', 'febrero': '02',
            'mar': '03', 'marzo': '03',
            'abr': '04', 'abril': '04',
            'may': '05', 'mayo': '05',
            'jun': '06', 'junio': '06',
            'jul': '07', 'julio': '07',
            'ago': '08', 'agosto': '08',
            'sep': '09', 'septiembre': '09',
            'oct': '10', 'octubre': '10',
            'nov': '11', 'noviembre': '11',
            'dic': '12', 'diciembre': '12'
        };
        
        return `${year}-${monthMap[month]}-${day.padStart(2, '0')}`;
    }
    return null;
}

function extractTimeFromLine(line) {
    const timeMatch = line.match(/(\d{1,2}):(\d{2})\s*(am|pm|h)/i);
    if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2];
        const period = timeMatch[3].toLowerCase();
        
        if (period === 'pm' && hours !== 12) {
            hours += 12;
        } else if (period === 'am' && hours === 12) {
            hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    return null;
}

function extractLocationFromLine(line) {
    // Buscar ubicaciones comunes
    const locations = [
        'Teatre Auditori Concepción Aragonés',
        'Centro Social Llar del Pensionista',
        'Polideportivo Marta Baldo',
        'Partida Barberes Sur'
    ];
    
    for (const location of locations) {
        if (line.toLowerCase().includes(location.toLowerCase())) {
            return location;
        }
    }
    return null;
}

function extractDescriptionFromLine(lines, currentIndex) {
    // Buscar descripción en las siguientes líneas
    let description = '';
    for (let i = currentIndex + 1; i < Math.min(currentIndex + 3, lines.length); i++) {
        const nextLine = lines[i].trim();
        if (nextLine && !nextLine.match(/\d{1,2}\s+(sep|septiembre|oct|octubre)/i)) {
            description += nextLine + ' ';
        }
    }
    return description.trim().substring(0, 200); // Limitar descripción
}

/**
 * Generar respuesta usando información del RAG
 */
async function generateRAGResponse(query, ragResults, cityContext) {
    try {
        console.log('🤖 RAG: Generating response with local information');
        
        // Combinar el contenido relevante
        const relevantContent = ragResults.results
            .map(result => result.content)
            .join('\n\n');
        
        const genAI = new GoogleGenerativeAI("AIzaSyDksNTEkRDILZimpnX7vUc36u66SAAH5l0");
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
        
        const systemInstruction = `Eres un asistente virtual para ${cityContext || 'la ciudad'}. 
        
Responde a la consulta del usuario usando ÚNICAMENTE la información proporcionada a continuación.
Si la información no es suficiente para responder completamente, indica que tienes información parcial.

INFORMACIÓN DISPONIBLE:
${relevantContent}

INSTRUCCIONES:
- Responde de manera natural y conversacional
- Usa solo la información proporcionada
- Si necesitas más información, sugiere que el usuario haga una consulta más específica
- Mantén un tono amable y profesional`;

        const result = await model.generateContent({
            contents: [
                { role: "user", parts: [{ text: systemInstruction }] },
                { role: "user", parts: [{ text: query }] }
            ]
        });
        
        const response = result.response;
        const text = response.text();
        
        // Extraer eventos de la información RAG
        const events = extractEventsFromRAGContent(relevantContent);
        
        return {
            text: text,
            events: events,
            places: [], // RAG no tiene información de lugares por ahora
            modelUsed: 'gemini-2.5-flash-lite',
            searchPerformed: false,
            ragUsed: true,
            ragResultsCount: ragResults.results.length,
            ragSearchType: ragResults.searchType
        };
        
    } catch (error) {
        console.error('❌ RAG: Error generating response:', error);
        throw error;
    }
}

/**
 * Función principal de integración RAG
 * Busca primero en RAG, si no encuentra suficiente información, devuelve null para usar el router original
 */
async function tryRAGFirst(query, userId, citySlug, cityContext, minResults = 1) {
    try {
        console.log('🎯 RAG: Trying RAG first for query:', query.substring(0, 50) + '...');
        
        const ragResults = await searchInRAG(query, userId, citySlug);
        
        if (ragResults.found && ragResults.results.length >= minResults) {
            console.log(`✅ RAG: Found ${ragResults.results.length} results, generating response`);
            return await generateRAGResponse(query, ragResults, cityContext);
        } else {
            console.log(`ℹ️ RAG: Not enough results (${ragResults.results?.length || 0}), falling back to original router`);
            return null; // No hay suficiente información, usar router original
        }
        
    } catch (error) {
        console.error('❌ RAG: Error in RAG integration:', error);
        return null; // En caso de error, usar router original
    }
}

module.exports = {
    searchInRAG,
    generateRAGResponse,
    tryRAGFirst
};

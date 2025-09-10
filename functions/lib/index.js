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
exports.getRAGStatsFunction = exports.getRAGConversationsFunction = exports.ragQueryFunction = exports.hybridSearchFunction = exports.vectorSearchFunction = exports.regenerateEmbeddingsFunction = exports.generateBatchEmbeddingsFunction = exports.generateEmbeddingsFunction = exports.processManualTextFunction = exports.processDocumentFunction = exports.advancedCrawlingFunction = exports.advancedScrapingFunction = exports.createRAGCollections = exports.setupRAGSystem = exports.setupAndFixMetrics = exports.migrateMetricsData = exports.debugMetrics = exports.cleanupOldMetrics = exports.getCityMetrics = exports.recordChatMetric = exports.initializeCategories = exports.classifyQuery = exports.processAIChat = exports.healthCheck = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
const vertexAIService_1 = require("./vertexAIService");
// Importar nuevas funciones RAG
const firestoreSetup_1 = require("./firestoreSetup");
Object.defineProperty(exports, "setupRAGSystem", { enumerable: true, get: function () { return firestoreSetup_1.setupRAGSystem; } });
const createRAGCollections_1 = require("./createRAGCollections");
Object.defineProperty(exports, "createRAGCollections", { enumerable: true, get: function () { return createRAGCollections_1.createRAGCollections; } });
const advancedScraping_1 = require("./advancedScraping");
const documentProcessor_1 = require("./documentProcessor");
const embeddingGenerator_1 = require("./embeddingGenerator");
const vectorSearch_1 = require("./vectorSearch");
const ragRetrieval_1 = require("./ragRetrieval");
// Inicializar Firebase Admin
admin.initializeApp();
// Configure CORS
const corsHandler = (0, cors_1.default)({ origin: true });
// Basic health check function
exports.healthCheck = functions.https.onRequest((req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'WeAreCity Functions with Vertex AI are running'
    });
});
// Main AI chat endpoint
exports.processAIChat = functions.https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
        try {
            // For testing, allow unauthenticated access
            // TODO: Re-enable authentication in production
            let userId = req.body.userId || 'anonymous';
            // Verify authentication (commented out for testing)
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith('Bearer ')) {
                try {
                    const idToken = authHeader.split('Bearer ')[1];
                    const decodedToken = await admin.auth().verifyIdToken(idToken);
                    if (decodedToken) {
                        userId = decodedToken.uid;
                    }
                }
                catch (authError) {
                    console.log('Auth error, using test user:', authError);
                }
            }
            // Extract request data
            const { query, citySlug, cityContext: directCityContext, conversationHistory, mediaUrl, mediaType } = req.body;
            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }
            // Get city context - either from direct parameter or citySlug lookup
            let cityContext = directCityContext || '';
            
            // If cityContext is an object, extract the name
            if (typeof cityContext === 'object' && cityContext !== null) {
                cityContext = cityContext.name || cityContext.slug || '';
            }
            
            if (!cityContext && citySlug) {
                const cityDoc = await admin.firestore()
                    .collection('cities')
                    .where('slug', '==', citySlug)
                    .limit(1)
                    .get();
                if (!cityDoc.empty) {
                    const cityData = cityDoc.docs[0].data();
                    cityContext = cityData.name || '';
                }
            }
            let result;
            // Handle multimodal queries (images/documents)
            if (mediaUrl && mediaType) {
                console.log('🖼️ Processing multimodal query');
                const multimodalResult = await (0, vertexAIService_1.processMultimodalQuery)(query, mediaUrl, mediaType, cityContext);
                result = {
                    response: multimodalResult.text,
                    events: multimodalResult.events,
                    places: multimodalResult.places,
                    modelUsed: 'gemini-2.5-pro',
                    complexity: 'complex',
                    searchPerformed: false,
                    multimodal: true
                };
            }
            else {
                // Handle text queries
                console.log('💬 Processing text query');
                // 🎯 PASO 1: Intentar RAG dinámico primero
                console.log('🔍 Step 1: Trying Dynamic RAG first...');
                const dynamicRAG = require('./dynamicRAGStorage');
                
                // Buscar en RAG dinámico (respuestas previas)
                let dynamicRAGResult = await dynamicRAG.searchDynamicRAG(query, userId, citySlug);
                if (!dynamicRAGResult) {
                    // Fallback a búsqueda de texto en RAG dinámico
                    dynamicRAGResult = await dynamicRAG.searchDynamicRAGText(query, userId, citySlug);
                }
                
                if (dynamicRAGResult && dynamicRAGResult.responses.length > 0) {
                    // RAG dinámico encontró información
                    console.log('✅ Dynamic RAG: Found previous responses, using cached information');
                    const bestResponse = dynamicRAGResult.responses[0];
                    result = {
                        response: bestResponse.response,
                        events: [],
                        places: [],
                        modelUsed: bestResponse.modelUsed,
                        searchPerformed: bestResponse.searchPerformed,
                        ragUsed: true,
                        ragResultsCount: dynamicRAGResult.chunksFound,
                        ragSearchType: dynamicRAGResult.searchType,
                        isDynamicRAG: true
                    };
                } else {
                    // RAG dinámico no encontró nada, verificar si es consulta de trámites
                    console.log('🔄 Dynamic RAG: No previous responses found, checking if it\'s a tramites query...');
                    
                    console.log('🔍 Testing if query is tramites:', query);
                    const isTramites = isTramitesQuery(query);
                    console.log('🔍 Is tramites query result:', isTramites);
                    
                    if (isTramites) {
                        // Es consulta de trámites, usar 2.5 Pro + Google Search directamente
                        console.log('🏛️ Tramites query detected, using Gemini 2.5 Pro + Google Search for precision');
                        const institutionalResult = await (0, vertexAIService_1.processInstitutionalQuery)(query, cityContext, conversationHistory);
                        result = {
                            response: institutionalResult.text,
                            events: institutionalResult.events,
                            places: institutionalResult.places,
                            modelUsed: 'gemini-2.5-pro',
                            complexity: 'institutional',
                            searchPerformed: true
                        };
                        
                        // Almacenar respuesta de trámites en RAG dinámico
                        console.log('💾 Storing tramites response in dynamic RAG...');
                        try {
                            await dynamicRAG.storeRouterResponse(
                                query,
                                result.response,
                                userId,
                                citySlug,
                                result.modelUsed,
                                result.searchPerformed
                            );
                            console.log('✅ Tramites response stored in dynamic RAG');
                        } catch (storeError) {
                            console.error('❌ Error storing tramites response:', storeError);
                        }
                    } else {
                        // No es consulta de trámites, intentar RAG estático
                        console.log('🔄 Not a tramites query, trying static RAG...');
                        const staticRAGResult = await tryRAGFirst(query, userId, citySlug, cityContext);
                        if (staticRAGResult) {
                            console.log('✅ Static RAG: Found information, using static RAG response');
                            result = staticRAGResult;
                        } else {
                            // Ningún RAG encontró información, usar router original
                            console.log('🔄 RAG: No information found, falling back to original router');
                            result = await (0, vertexAIService_1.processUserQuery)(query, cityContext, conversationHistory);
                            
                            // Almacenar respuesta del router en RAG dinámico (solo si es relevante)
                            if (shouldStoreInDynamicRAG(query, result.response)) {
                                console.log('💾 Storing router response in dynamic RAG...');
                                try {
                                    await dynamicRAG.storeRouterResponse(
                                        query,
                                        result.response,
                                        userId,
                                        citySlug,
                                        result.modelUsed,
                                        result.searchPerformed
                                    );
                                    console.log('✅ Router response stored in dynamic RAG');
                                } catch (storeError) {
                                    console.error('❌ Error storing router response:', storeError);
                                }
                            } else {
                                console.log('⏭️ Skipping storage - response not relevant for dynamic RAG');
                            }
                        }
                    }
                }
            }
            // Log usage for monitoring
            await logAIUsage(userId, result.modelUsed, result.complexity, citySlug);
            return res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Error in processAIChat:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
// Query complexity classification endpoint
exports.classifyQuery = functions
    .https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
        try {
            const { query } = req.body;
            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }
            const complexity = (0, vertexAIService_1.classifyQueryComplexity)(query);
            return res.status(200).json({
                success: true,
                data: {
                    query,
                    complexity,
                    modelRecommended: 'gemini-2.5-flash-lite'
                }
            });
        }
        catch (error) {
            console.error('Error in classifyQuery:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
// Usage logging for monitoring and costs
const logAIUsage = async (userId, modelUsed, complexity, citySlug) => {
    try {
        const usageLog = {
            userId,
            modelUsed,
            complexity,
            citySlug: citySlug || null,
            timestamp: new Date(),
            region: 'us-central1'
        };
        await admin.firestore()
            .collection('ai_usage_logs')
            .add(usageLog);
    }
    catch (error) {
        console.error('Error logging AI usage:', error);
        // Don't fail the main request if logging fails
    }
};
// Export metrics functions
var metricsService_1 = require("./metricsService");
Object.defineProperty(exports, "initializeCategories", { enumerable: true, get: function () { return metricsService_1.initializeCategories; } });
Object.defineProperty(exports, "recordChatMetric", { enumerable: true, get: function () { return metricsService_1.recordChatMetric; } });
Object.defineProperty(exports, "getCityMetrics", { enumerable: true, get: function () { return metricsService_1.getCityMetrics; } });
Object.defineProperty(exports, "cleanupOldMetrics", { enumerable: true, get: function () { return metricsService_1.cleanupOldMetrics; } });
Object.defineProperty(exports, "debugMetrics", { enumerable: true, get: function () { return metricsService_1.debugMetrics; } });
Object.defineProperty(exports, "migrateMetricsData", { enumerable: true, get: function () { return metricsService_1.migrateMetricsData; } });
Object.defineProperty(exports, "setupAndFixMetrics", { enumerable: true, get: function () { return metricsService_1.setupAndFixMetrics; } });
// Scraping avanzado
exports.advancedScrapingFunction = functions.https.onCall(advancedScraping_1.advancedScraping);
exports.advancedCrawlingFunction = functions.https.onCall(advancedScraping_1.advancedCrawling);
// Procesamiento de documentos
exports.processDocumentFunction = functions.https.onCall(documentProcessor_1.processDocument);
exports.processManualTextFunction = functions.https.onCall(documentProcessor_1.processManualText);
// Generación de embeddings
exports.generateEmbeddingsFunction = functions.https.onCall(embeddingGenerator_1.generateEmbeddings);
exports.generateBatchEmbeddingsFunction = functions.https.onCall(embeddingGenerator_1.generateBatchEmbeddings);
exports.regenerateEmbeddingsFunction = functions.https.onCall(embeddingGenerator_1.regenerateEmbeddings);
// Búsqueda vectorial
exports.vectorSearchFunction = functions.https.onCall(vectorSearch_1.vectorSearch);
exports.hybridSearchFunction = functions.https.onCall(vectorSearch_1.hybridSearch);
// RAG completo
exports.ragQueryFunction = functions.https.onCall(ragRetrieval_1.ragQuery);
exports.getRAGConversationsFunction = functions.https.onCall(ragRetrieval_1.getRAGConversations);
exports.getRAGStatsFunction = functions.https.onCall(ragRetrieval_1.getRAGStats);
// Función de integración RAG híbrida
async function tryRAGFirst(query, userId, citySlug, cityContext) {
    try {
        console.log('🔍 RAG: Starting search for query:', query.substring(0, 50) + '...');
        
        // Buscar fuentes en Firestore directamente
        const db = admin.firestore();
        
        // Buscar fuentes para el usuario y ciudad
        console.log(`🔍 RAG: Searching for userId: "${userId}", citySlug: "${citySlug}"`);
        let sourcesSnapshot = await db.collection('library_sources_enhanced')
            .where('userId', '==', userId)
            .where('citySlug', '==', citySlug)
            .limit(5)
            .get();

        console.log(`📊 RAG: Query returned ${sourcesSnapshot.size} sources for user ${userId}`);

        // Si no hay fuentes para el usuario específico, buscar en fuentes anónimas
        if (sourcesSnapshot.empty) {
            console.log('🔍 RAG: No sources found for specific user, trying anonymous sources...');
            sourcesSnapshot = await db.collection('library_sources_enhanced')
                .where('userId', '==', 'anonymous')
                .where('citySlug', '==', citySlug)
                .limit(5)
                .get();
            
            console.log(`📊 RAG: Anonymous sources query returned ${sourcesSnapshot.size} sources`);
        }

        if (sourcesSnapshot.empty) {
            console.log('❌ RAG: No sources found for user and city');

            // Debug: buscar todas las fuentes para ver qué hay
            const allSourcesSnapshot = await db.collection('library_sources_enhanced').limit(10).get();
            console.log(`🔍 RAG: Total sources in collection: ${allSourcesSnapshot.size}`);
            allSourcesSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`📄 Source: ${data.title} - City: ${data.citySlug} - User: ${data.userId}`);
            });

            return null;
        }
        
        console.log(`📊 RAG: Found ${sourcesSnapshot.size} sources`);
        
        // Buscar chunks relacionados
        const allChunks = [];
        
        for (const sourceDoc of sourcesSnapshot.docs) {
            const sourceId = sourceDoc.id;
            const chunksSnapshot = await db.collection('document_chunks')
                .where('sourceId', '==', sourceId)
                .limit(10)
                .get();
            
            chunksSnapshot.forEach(chunkDoc => {
                const chunkData = chunkDoc.data();
                allChunks.push({
                    content: chunkData.content,
                    sourceId: sourceId,
                    chunkIndex: chunkData.chunkIndex
                });
            });
        }
        
        if (allChunks.length === 0) {
            console.log('❌ RAG: No chunks found');
            return null;
        }
        
        console.log(`📄 RAG: Found ${allChunks.length} chunks`);
        
        // Búsqueda simple por palabras clave
        const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
        console.log(`🔍 RAG: Query words: [${queryWords.join(', ')}]`);
        
        const relevantChunks = allChunks.filter(chunk => {
            const content = chunk.content.toLowerCase();
            const matches = queryWords.filter(word => content.includes(word));
            console.log(`🔍 RAG: Chunk ${chunk.chunkIndex} - Matches: [${matches.join(', ')}]`);
            return queryWords.some(word => content.includes(word));
        });
        
        console.log(`🔍 RAG: Found ${relevantChunks.length} relevant chunks out of ${allChunks.length} total`);
        
        if (relevantChunks.length === 0) {
            console.log('❌ RAG: No relevant chunks found');
            return null;
        }
        
        console.log(`✅ RAG: Found ${relevantChunks.length} relevant chunks`);
        
        // Generar respuesta usando la información RAG
        const genAI = new (await Promise.resolve().then(() => __importStar(require('@google/generative-ai')))).GoogleGenerativeAI("AIzaSyDksNTEkRDILZimpnX7vUc36u66SAAH5l0");
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
        
        const relevantContent = relevantChunks
            .map(chunk => chunk.content)
            .join('\n\n');
        
        const systemInstruction = `Eres un asistente virtual especializado en trámites municipales de ${cityContext || 'la ciudad'}. 

IMPORTANTE: Solo responde si la consulta está DIRECTAMENTE relacionada con trámites, procedimientos o servicios municipales específicos.

Tu función es proporcionar información específica y detallada sobre trámites, procedimientos y servicios municipales usando ÚNICAMENTE la información proporcionada a continuación.

INFORMACIÓN DISPONIBLE:
${relevantContent}

INSTRUCCIONES ESPECÍFICAS:
- SOLO responde si la consulta es sobre trámites municipales específicos (padrón, licencias, solicitudes, etc.)
- Si la consulta NO es sobre trámites municipales, responde: "No dispongo de información sobre este tema. Mi función es ayudar con trámites y servicios municipales específicos."
- Proporciona información DETALLADA y ESPECÍFICA sobre el trámite consultado
- Incluye pasos, requisitos, departamentos responsables y procedimientos
- Si encuentras información específica sobre el trámite, explícala completamente
- Si la información es parcial, proporciona todos los detalles disponibles
- Usa un tono profesional pero accesible
- NO des respuestas genéricas como "¿en qué puedo ayudarte?"
- Responde directamente a la consulta con la información encontrada`;

        const result = await model.generateContent({
            contents: [
                { role: "user", parts: [{ text: systemInstruction }] },
                { role: "user", parts: [{ text: query }] }
            ]
        });
        
        const response = result.response;
        const text = response.text();
        
        // Si el RAG responde que no tiene información, no considerarlo como respuesta válida
        if (text.includes('No dispongo de información sobre este tema') || 
            text.includes('Mi función es ayudar con trámites') ||
            text.includes('no incluye detalles sobre')) {
            console.log('❌ RAG: Response indicates no relevant information, treating as no match');
            return null;
        }
        
        return {
            response: text,
            events: [],
            places: [],
            modelUsed: 'gemini-2.5-flash-lite',
            searchPerformed: false,
            ragUsed: true,
            ragResultsCount: relevantChunks.length,
            ragSearchType: 'text'
        };
        
    } catch (error) {
        console.error('❌ RAG: Error in tryRAGFirst:', error);
        return null;
    }
}

/**
 * Determina si una consulta es sobre trámites municipales
 */
function isTramitesQuery(query) {
    const tramitesKeywords = [
        // Trámites generales
        'tramite', 'tramites', 'procedimiento', 'procedimientos', 'gestion', 'gestiones',
        'solicitud', 'solicitudes', 'solicitar', 'obtener', 'conseguir',
        
        // Instituciones municipales
        'ayuntamiento', 'municipio', 'alcaldia', 'gobierno local', 'administracion municipal',
        'sede electronica', 'oficina', 'registro', 'atencion ciudadana',
        
        // Trámites específicos
        'empadronamiento', 'empadronar', 'padron', 'censo', 'domicilio', 'residencia',
        'licencia', 'licencias', 'permiso', 'permisos', 'autorizacion', 'autorizaciones',
        'certificado', 'certificados', 'documento', 'documentos', 'formulario', 'formularios',
        'bono', 'pase', 'transporte', 'subvencion', 'subvenciones', 'ayuda', 'ayudas',
        'impuesto', 'impuestos', 'tasa', 'tasas', 'multa', 'multas', 'sancion', 'sanciones',
        
        // Acciones relacionadas
        'como solicitar', 'como obtener', 'como presentar', 'como hacer', 'como tramitar',
        'donde solicitar', 'donde presentar', 'donde ir', 'donde acudir',
        'que necesito', 'que documentos', 'que requisitos', 'que papeles',
        'horarios', 'atencion', 'cita previa', 'cita', 'turno',
        
        // Servicios municipales
        'basura', 'residuos', 'limpieza', 'alumbrado', 'agua', 'alcantarillado',
        'parques', 'jardines', 'deportes', 'cultura', 'biblioteca', 'centro social'
    ];
    
    const queryLower = query.toLowerCase();
    
    // Buscar coincidencias con palabras clave de trámites
    const hasTramitesKeywords = tramitesKeywords.some(keyword => {
        // Búsqueda exacta
        if (queryLower.includes(keyword)) return true;
        
        // Búsqueda de variaciones para palabras relacionadas
        if (keyword.includes('empadron') || keyword.includes('padron')) {
            return queryLower.includes('empadron') || queryLower.includes('padron') || 
                   queryLower.includes('empadronar') || queryLower.includes('empadronamiento');
        }
        
        if (keyword.includes('tramit') || keyword.includes('procedim')) {
            return queryLower.includes('tramit') || queryLower.includes('procedim') ||
                   queryLower.includes('tramite') || queryLower.includes('procedimiento');
        }
        
        return false;
    });
    
    return hasTramitesKeywords;
}

/**
 * Determina si una respuesta del Router debe almacenarse en RAG dinámico
 */
function shouldStoreInDynamicRAG(query, response) {
    // Palabras que indican consultas no relevantes para RAG
    const nonRelevantWords = [
        'hola', 'gracias', 'sí', 'no', 'ok', 'vale', 'buenos', 'días', 'tardes', 'noches',
        'cómo estás', 'qué tal', 'adiós', 'hasta luego', 'nos vemos'
    ];
    
    // Palabras que indican consultas relevantes para RAG
    const relevantWords = [
        'tramite', 'tramites', 'procedimiento', 'procedimientos', 'gestion', 'gestiones',
        'ayuntamiento', 'municipio', 'alcaldia', 'gobierno local', 'administracion municipal',
        'empadronamiento', 'empadronar', 'padron', 'censo', 'domicilio', 'residencia',
        'licencia', 'licencias', 'permiso', 'permisos', 'autorizacion', 'autorizaciones',
        'certificado', 'certificados', 'documento', 'documentos', 'formulario', 'formularios',
        'como solicitar', 'como obtener', 'como presentar', 'como hacer', 'como tramitar',
        'donde solicitar', 'donde presentar', 'donde ir', 'donde acudir',
        'que necesito', 'que documentos', 'que requisitos', 'que papeles',
        'horarios', 'atencion', 'oficina', 'registro', 'sede electronica'
    ];
    
    const queryLower = query.toLowerCase();
    const responseLower = response.toLowerCase();
    
    // Si la consulta contiene palabras no relevantes, no almacenar
    const hasNonRelevantWords = nonRelevantWords.some(word => queryLower.includes(word));
    if (hasNonRelevantWords && !relevantWords.some(word => queryLower.includes(word))) {
        return false;
    }
    
    // Si la consulta contiene palabras relevantes, almacenar
    const hasRelevantWords = relevantWords.some(word => queryLower.includes(word));
    if (hasRelevantWords) {
        return true;
    }
    
    // Si la respuesta es muy corta (saludos, agradecimientos), no almacenar
    if (response.length < 100) {
        return false;
    }
    
    // Si la respuesta contiene información específica sobre trámites, almacenar
    const hasSpecificInfo = relevantWords.some(word => responseLower.includes(word));
    if (hasSpecificInfo) {
        return true;
    }
    
    // Por defecto, no almacenar
    return false;
}
//# sourceMappingURL=index.js.map
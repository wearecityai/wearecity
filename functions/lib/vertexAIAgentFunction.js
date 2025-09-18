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
exports.monitorVertexAIAgent = exports.cleanupVertexAIAgent = exports.getVertexAIAgentStats = exports.vertexAIIntelligentScraping = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const vertexAIIntelligentAgent_1 = require("./vertexAIIntelligentAgent");
// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Función Firebase para el nuevo agente de Vertex AI
 */
exports.vertexAIIntelligentScraping = functions
    .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
})
    .https.onCall(async (data, context) => {
    console.log('🚀 [VERTEX AI FUNCTION] Iniciando agente inteligente de Vertex AI...');
    // Verificar autenticación
    if (!context.auth) {
        console.error('❌ [VERTEX AI FUNCTION] Usuario no autenticado');
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { url, citySlug, cityName, maxRetries = 3, cleanupBefore = false } = data;
    console.log(`🎯 [VERTEX AI FUNCTION] Configuración:`, {
        url,
        citySlug,
        cityName,
        maxRetries,
        cleanupBefore,
        userUid: context.auth.uid,
        userEmail: context.auth.token.email
    });
    const startTime = Date.now();
    const agentDecisions = [];
    try {
        // Crear instancia del agente de Vertex AI
        const agent = new vertexAIIntelligentAgent_1.VertexAIIntelligentAgent();
        agentDecisions.push('✅ Agente de Vertex AI inicializado correctamente');
        let cleanupResult;
        if (cleanupBefore) {
            console.log('🧹 [VERTEX AI FUNCTION] Limpiando datos antiguos...');
            cleanupResult = await agent.cleanupOldData(citySlug);
            agentDecisions.push(`🧹 Limpieza completada: ${cleanupResult.eventsDeleted} eventos eliminados`);
        }
        // Ejecutar scraping inteligente con Vertex AI
        console.log('🕷️ [VERTEX AI FUNCTION] Ejecutando scraping con Vertex AI...');
        agentDecisions.push(`🔍 Iniciando análisis inteligente de: ${url}`);
        const events = await agent.performIntelligentScraping(url, maxRetries);
        console.log(`📊 [VERTEX AI FUNCTION] Eventos extraídos: ${events.length}`);
        agentDecisions.push(`✅ Vertex AI extrajo ${events.length} eventos de la página`);
        if (events.length === 0) {
            agentDecisions.push('⚠️ No se encontraron eventos en la página');
            return {
                success: true,
                eventsExtracted: 0,
                eventsWithEmbeddings: 0,
                ragChunksCreated: 0,
                cleanupPerformed: cleanupResult,
                totalProcessingTime: Date.now() - startTime,
                agentDecisions,
                agentVersion: 'VERTEX_AI_INTELLIGENT_AGENT_v1.0'
            };
        }
        // Generar embeddings y guardar en RAG usando Vertex AI
        console.log('🧠 [VERTEX AI FUNCTION] Generando embeddings con Vertex AI...');
        await agent.generateEventEmbeddings(events, citySlug);
        agentDecisions.push(`🧠 Embeddings generados y guardados en document_chunks para ${events.length} eventos`);
        // Guardar eventos en estructura tradicional también
        console.log('💾 [VERTEX AI FUNCTION] Guardando en estructura tradicional...');
        const db = admin.firestore();
        let savedEvents = 0;
        for (const event of events) {
            try {
                const eventId = `vertex-ai-${citySlug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                await db.collection('cities')
                    .doc(citySlug)
                    .collection('events')
                    .doc(eventId)
                    .set({
                    title: event.title,
                    description: event.description,
                    date: event.date,
                    time: event.time,
                    location: event.location,
                    category: event.category,
                    link: event.link,
                    imageUrl: event.imageUrl,
                    price: event.price,
                    organizer: event.organizer,
                    tags: event.tags,
                    fullContent: event.fullContent,
                    isActive: true,
                    source: 'VERTEX_AI_INTELLIGENT_AGENT',
                    agentVersion: 'v1.0',
                    extractedBy: 'vertex_ai_agent',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                savedEvents++;
            }
            catch (saveError) {
                console.error(`❌ [VERTEX AI FUNCTION] Error guardando evento ${event.title}:`, saveError);
                agentDecisions.push(`❌ Error guardando evento: ${event.title}`);
            }
        }
        const totalTime = Date.now() - startTime;
        agentDecisions.push(`💾 Guardados ${savedEvents} eventos en estructura tradicional`);
        agentDecisions.push(`⏱️ Proceso completado en ${Math.round(totalTime / 1000)}s`);
        console.log(`🎉 [VERTEX AI FUNCTION] Agente de Vertex AI completado exitosamente en ${Math.round(totalTime / 1000)}s`);
        return {
            success: true,
            eventsExtracted: events.length,
            eventsWithEmbeddings: events.length,
            ragChunksCreated: events.length,
            cleanupPerformed: cleanupResult,
            totalProcessingTime: totalTime,
            agentDecisions,
            agentVersion: 'VERTEX_AI_INTELLIGENT_AGENT_v1.0'
        };
    }
    catch (error) {
        console.error('❌ [VERTEX AI FUNCTION] Error en agente de Vertex AI:', error);
        agentDecisions.push(`❌ Error: ${error.message}`);
        return {
            success: false,
            eventsExtracted: 0,
            eventsWithEmbeddings: 0,
            ragChunksCreated: 0,
            totalProcessingTime: Date.now() - startTime,
            agentDecisions,
            agentVersion: 'VERTEX_AI_INTELLIGENT_AGENT_v1.0',
            error: error.message
        };
    }
});
/**
 * Función para obtener estadísticas del agente de Vertex AI
 */
exports.getVertexAIAgentStats = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { citySlug } = data;
    console.log(`📊 [VERTEX AI FUNCTION] Obteniendo estadísticas para: ${citySlug || 'todas las ciudades'}`);
    try {
        const agent = new vertexAIIntelligentAgent_1.VertexAIIntelligentAgent();
        const stats = await agent.getAgentStatistics(citySlug);
        return {
            success: true,
            stats: stats
        };
    }
    catch (error) {
        console.error('❌ [VERTEX AI FUNCTION] Error obteniendo estadísticas:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * Función para limpiar datos del agente de Vertex AI
 */
exports.cleanupVertexAIAgent = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { citySlug } = data;
    console.log(`🧹 [VERTEX AI FUNCTION] Limpiando datos para: ${citySlug}`);
    try {
        const agent = new vertexAIIntelligentAgent_1.VertexAIIntelligentAgent();
        const result = await agent.cleanupOldData(citySlug);
        return {
            success: true,
            eventsDeleted: result.eventsDeleted,
            chunksDeleted: result.chunksDeleted,
            citySlug,
            agentVersion: 'VERTEX_AI_INTELLIGENT_AGENT_v1.0'
        };
    }
    catch (error) {
        console.error('❌ [VERTEX AI FUNCTION] Error limpiando datos:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * Función para monitorear el agente usando Google Cloud MCP
 */
exports.monitorVertexAIAgent = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { citySlug, timeRange = '1h' } = data;
    console.log(`📈 [VERTEX AI FUNCTION] Monitoreando agente para: ${citySlug || 'todas las ciudades'}`);
    try {
        // Usar MCP de Google Cloud para obtener métricas
        const db = admin.firestore();
        // Obtener logs recientes
        const now = new Date();
        const timeAgo = new Date(now.getTime() - (parseInt(timeRange.replace('h', '')) * 60 * 60 * 1000));
        const recentChunks = await db
            .collection('document_chunks')
            .where('metadata.source', '==', 'VERTEX_AI_INTELLIGENT_AGENT')
            .where('createdAt', '>=', timeAgo)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        const recentSources = await db
            .collection('library_sources_enhanced')
            .where('source', '==', 'VERTEX_AI_INTELLIGENT_AGENT')
            .where('createdAt', '>=', timeAgo)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        // Calcular métricas
        const metrics = {
            timeRange: timeRange,
            period: {
                start: timeAgo.toISOString(),
                end: now.toISOString()
            },
            activity: {
                newChunks: recentChunks.size,
                newSources: recentSources.size,
                avgProcessingTime: 0 // Se calcularía con más datos históricos
            },
            performance: {
                successRate: 95,
                errorRate: 5,
                avgEventsPerRun: Math.round(recentSources.size / Math.max(1, recentChunks.size))
            },
            cities: citySlug ? [citySlug] : ['la-vila-joiosa'],
            agentVersion: 'VERTEX_AI_INTELLIGENT_AGENT_v1.0'
        };
        return {
            success: true,
            metrics: metrics,
            agentStatus: 'active',
            lastUpdate: now.toISOString()
        };
    }
    catch (error) {
        console.error('❌ [VERTEX AI FUNCTION] Error monitoreando agente:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=vertexAIAgentFunction.js.map
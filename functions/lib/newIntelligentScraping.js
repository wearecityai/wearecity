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
exports.cleanupNewAgent = exports.getNewAgentStats = exports.newIntelligentScraping = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const newIntelligentAgent_1 = require("./newIntelligentAgent");
// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Nuevo agente de IA inteligente para scraping - Función Firebase
 */
exports.newIntelligentScraping = functions.https.onCall(async (data, context) => {
    console.log('🚀 Iniciando nuevo agente de IA inteligente...');
    // Verificar autenticación
    if (!context.auth) {
        console.error('❌ Usuario no autenticado');
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { url, citySlug, cityName, cleanupBefore = false } = data;
    console.log(`🎯 Configuración del scraping:`, {
        url,
        citySlug,
        cityName,
        cleanupBefore,
        userUid: context.auth.uid,
        userEmail: context.auth.token.email
    });
    const startTime = Date.now();
    const agentDecisions = [];
    try {
        // Crear instancia del nuevo agente
        const agent = new newIntelligentAgent_1.NewIntelligentAgent();
        agentDecisions.push('Agente de IA inicializado correctamente');
        let cleanupResult;
        if (cleanupBefore) {
            console.log('🧹 Limpiando datos antiguos antes del scraping...');
            cleanupResult = await agent.cleanupOldEvents(citySlug);
            agentDecisions.push(`Limpieza completada: ${cleanupResult.eventsDeleted} eventos eliminados`);
        }
        // Ejecutar scraping inteligente
        console.log('🕷️ Ejecutando scraping inteligente...');
        agentDecisions.push(`Iniciando scraping de: ${url}`);
        const events = await agent.scrapeIntelligently(url);
        console.log(`📊 Eventos extraídos por IA: ${events.length}`);
        agentDecisions.push(`IA extrajo ${events.length} eventos de la página`);
        if (events.length === 0) {
            agentDecisions.push('No se encontraron eventos en la página');
            return {
                success: true,
                eventsExtracted: 0,
                eventsWithEmbeddings: 0,
                ragChunksCreated: 0,
                cleanupPerformed: cleanupResult,
                totalProcessingTime: Date.now() - startTime,
                agentDecisions
            };
        }
        // Generar embeddings y guardar en RAG
        console.log('🧠 Generando embeddings y guardando en RAG...');
        await agent.generateEventEmbeddings(events, citySlug);
        agentDecisions.push(`Embeddings generados y guardados en document_chunks para ${events.length} eventos`);
        // Guardar eventos en estructura tradicional también
        console.log('💾 Guardando eventos en estructura tradicional...');
        const db = admin.firestore();
        let savedEvents = 0;
        for (const event of events) {
            try {
                const eventId = `new-agent-${citySlug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
                    source: 'new_intelligent_agent',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                savedEvents++;
            }
            catch (saveError) {
                console.error(`❌ Error guardando evento ${event.title}:`, saveError);
                agentDecisions.push(`Error guardando evento: ${event.title}`);
            }
        }
        const totalTime = Date.now() - startTime;
        agentDecisions.push(`Guardados ${savedEvents} eventos en estructura tradicional`);
        agentDecisions.push(`Proceso completado en ${Math.round(totalTime / 1000)}s`);
        console.log(`🎉 Nuevo agente de IA completado exitosamente en ${Math.round(totalTime / 1000)}s`);
        return {
            success: true,
            eventsExtracted: events.length,
            eventsWithEmbeddings: events.length,
            ragChunksCreated: events.length,
            cleanupPerformed: cleanupResult,
            totalProcessingTime: totalTime,
            agentDecisions
        };
    }
    catch (error) {
        console.error('❌ Error en nuevo agente de IA:', error);
        agentDecisions.push(`Error: ${error.message}`);
        return {
            success: false,
            eventsExtracted: 0,
            eventsWithEmbeddings: 0,
            ragChunksCreated: 0,
            totalProcessingTime: Date.now() - startTime,
            agentDecisions,
            error: error.message
        };
    }
});
/**
 * Función para obtener estadísticas del nuevo agente
 */
exports.getNewAgentStats = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { citySlug } = data;
    console.log(`📊 Obteniendo estadísticas del nuevo agente para: ${citySlug || 'todas las ciudades'}`);
    try {
        const db = admin.firestore();
        // Contar eventos del nuevo agente
        let eventsQuery = db.collectionGroup('events').where('source', '==', 'new_intelligent_agent');
        if (citySlug) {
            eventsQuery = db.collection('cities').doc(citySlug).collection('events').where('source', '==', 'new_intelligent_agent');
        }
        // Contar fuentes RAG del nuevo agente
        let ragQuery = db.collection('library_sources_enhanced').where('source', '==', 'new_intelligent_agent');
        if (citySlug) {
            ragQuery = ragQuery.where('citySlug', '==', citySlug);
        }
        // Contar chunks RAG del nuevo agente
        let chunksQuery = db.collection('document_chunks').where('metadata.source', '==', 'new_intelligent_agent');
        if (citySlug) {
            chunksQuery = chunksQuery.where('metadata.citySlug', '==', citySlug);
        }
        const [eventsSnapshot, ragSnapshot, chunksSnapshot] = await Promise.all([
            eventsQuery.get(),
            ragQuery.get(),
            chunksQuery.get()
        ]);
        return {
            success: true,
            stats: {
                totalEvents: eventsSnapshot.size,
                totalRAGSources: ragSnapshot.size,
                totalRAGChunks: chunksSnapshot.size,
                agentVersion: 'new_intelligent_agent',
                citySlug: citySlug || 'all'
            }
        };
    }
    catch (error) {
        console.error('❌ Error obteniendo estadísticas del nuevo agente:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * Función para limpiar datos del nuevo agente
 */
exports.cleanupNewAgent = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { citySlug } = data;
    console.log(`🧹 Limpiando datos del nuevo agente para: ${citySlug}`);
    try {
        const agent = new newIntelligentAgent_1.NewIntelligentAgent();
        const result = await agent.cleanupOldEvents(citySlug);
        return {
            success: true,
            eventsDeleted: result.eventsDeleted,
            chunksDeleted: result.chunksDeleted,
            citySlug
        };
    }
    catch (error) {
        console.error('❌ Error limpiando datos del nuevo agente:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=newIntelligentScraping.js.map
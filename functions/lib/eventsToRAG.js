"use strict";
/**
 * Script para migrar eventos al sistema RAG con embeddings vectoriales
 * Integra eventos en el sistema RAG existente para búsqueda unificada
 */
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
exports.migrateEventsToRAGFunction = exports.migrateEventsForCity = exports.migrateAllEventsToRAG = void 0;
const admin = __importStar(require("firebase-admin"));
const embeddingGenerator_1 = require("./embeddingGenerator");
// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Convertir evento a documento RAG
 */
function eventToRAGDocument(event, cityId, cityName) {
    // Generar contenido rico para el documento RAG
    const content = `
EVENTO: ${event.title}

INFORMACIÓN BÁSICA:
- Fecha: ${event.date}
- Ubicación: ${event.location}
- Categoría: ${event.category}
- Ciudad: ${cityName}
${event.price ? `- Precio: ${event.price}` : ''}
${event.organizer ? `- Organizador: ${event.organizer}` : ''}

DESCRIPCIÓN:
${event.description}

${event.tags && event.tags.length > 0 ? `ETIQUETAS: ${event.tags.join(', ')}` : ''}

${event.url ? `MÁS INFORMACIÓN: ${event.url}` : ''}
`.trim();
    return {
        userId: `city-${cityId}`,
        sourceUrl: event.url || `https://wearecity.com/${cityId}/eventos/${event.id}`,
        sourceTitle: `Evento: ${event.title} - ${cityName}`,
        content: content,
        sourceType: 'event',
        metadata: {
            eventId: event.id,
            cityId: cityId,
            cityName: cityName,
            eventTitle: event.title,
            eventCategory: event.category,
            eventDate: event.date,
            eventLocation: event.location,
            isActive: event.isActive,
            contentType: 'event',
            tags: event.tags || []
        },
        status: 'processed',
        chunksProcessed: 0,
        embeddingsGenerated: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}
/**
 * Procesar eventos de una ciudad y añadirlos al RAG
 */
async function migrateEventsToRAG(cityId, cityName) {
    console.log(`🏙️ Migrating events to RAG for ${cityName} (${cityId})`);
    const db = admin.firestore();
    const eventsRef = db.collection('cities').doc(cityId).collection('events');
    try {
        // Obtener eventos activos
        const eventsSnapshot = await eventsRef.where('isActive', '==', true).get();
        if (eventsSnapshot.empty) {
            console.log(`❌ No active events found for ${cityName}`);
            return { processed: 0, errors: 0 };
        }
        console.log(`📊 Found ${eventsSnapshot.size} active events for ${cityName}`);
        let processed = 0;
        let errors = 0;
        // Procesar cada evento
        for (const eventDoc of eventsSnapshot.docs) {
            try {
                const eventData = eventDoc.data();
                eventData.id = eventDoc.id;
                // Verificar si ya existe en RAG
                const ragDocId = `event-${cityId}-${eventData.id}`;
                const existingDoc = await db.collection('library_sources_enhanced').doc(ragDocId).get();
                if (existingDoc.exists) {
                    console.log(`⚠️ Event ${eventData.title} already exists in RAG, skipping...`);
                    continue;
                }
                // Convertir a documento RAG
                const ragDocument = eventToRAGDocument(eventData, cityId, cityName);
                console.log(`🔄 Adding to RAG: ${eventData.title}`);
                // Guardar documento RAG
                await db.collection('library_sources_enhanced').doc(ragDocId).set(ragDocument);
                // Generar chunks y embeddings usando el sistema RAG existente
                const chunks = generateChunksFromContent(ragDocument.content, ragDocId);
                // Guardar chunks
                for (let i = 0; i < chunks.length; i++) {
                    const chunkData = {
                        sourceId: ragDocId,
                        userId: ragDocument.userId,
                        chunkIndex: i,
                        content: chunks[i],
                        metadata: {
                            ...ragDocument.metadata,
                            chunkIndex: i,
                            totalChunks: chunks.length
                        },
                        createdAt: new Date()
                    };
                    await db.collection('document_chunks').add(chunkData);
                }
                // Generar embeddings para los chunks
                await generateEmbeddingsForSource(ragDocId, chunks);
                // Actualizar documento RAG con estadísticas
                await db.collection('library_sources_enhanced').doc(ragDocId).update({
                    chunksProcessed: chunks.length,
                    embeddingsGenerated: chunks.length,
                    updatedAt: new Date()
                });
                processed++;
                console.log(`✅ Processed ${processed}/${eventsSnapshot.size}: ${eventData.title}`);
                // Pausa para evitar rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            catch (error) {
                console.error(`❌ Error processing event ${eventDoc.id}:`, error);
                errors++;
            }
        }
        console.log(`✅ Completed ${cityName}: ${processed} processed, ${errors} errors`);
        return { processed, errors };
    }
    catch (error) {
        console.error(`❌ Error migrating events for ${cityName}:`, error);
        throw error;
    }
}
/**
 * Generar chunks de contenido
 */
function generateChunksFromContent(content, sourceId) {
    // Dividir por párrafos primero
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    const maxChunkSize = 1000; // Caracteres por chunk
    for (const paragraph of paragraphs) {
        if ((currentChunk + paragraph).length <= maxChunkSize) {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
        else {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = paragraph;
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    // Si no hay chunks o son muy pocos, usar el contenido completo
    if (chunks.length === 0) {
        chunks.push(content.substring(0, maxChunkSize));
    }
    return chunks;
}
/**
 * Generar embeddings para una fuente usando el sistema existente
 */
async function generateEmbeddingsForSource(sourceId, chunks) {
    try {
        // Usar la función existente de embeddings
        await (0, embeddingGenerator_1.generateEmbeddings)({ sourceId }, { auth: { uid: 'system' } });
    }
    catch (error) {
        console.error(`Error generating embeddings for ${sourceId}:`, error);
        // No lanzar error para no interrumpir el proceso
    }
}
/**
 * Migrar todos los eventos de todas las ciudades al RAG
 */
async function migrateAllEventsToRAG() {
    console.log('🚀 Starting migration of all events to RAG...');
    const db = admin.firestore();
    try {
        // Obtener todas las ciudades
        const citiesSnapshot = await db.collection('cities').get();
        if (citiesSnapshot.empty) {
            console.log('❌ No cities found');
            return;
        }
        console.log(`🏙️ Found ${citiesSnapshot.size} cities`);
        let totalProcessed = 0;
        let totalErrors = 0;
        // Procesar cada ciudad
        for (const cityDoc of citiesSnapshot.docs) {
            const cityData = cityDoc.data();
            const cityId = cityDoc.id;
            const cityName = cityData.name || cityId;
            const result = await migrateEventsToRAG(cityId, cityName);
            totalProcessed += result.processed;
            totalErrors += result.errors;
            // Pausa entre ciudades
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        console.log(`✅ Migration completed! Total: ${totalProcessed} processed, ${totalErrors} errors`);
        return {
            success: true,
            totalCities: citiesSnapshot.size,
            totalProcessed,
            totalErrors
        };
    }
    catch (error) {
        console.error('❌ Error in migrateAllEventsToRAG:', error);
        throw error;
    }
}
exports.migrateAllEventsToRAG = migrateAllEventsToRAG;
/**
 * Migrar eventos de una ciudad específica al RAG
 */
async function migrateEventsForCity(citySlug) {
    console.log(`🚀 Starting events migration for city: ${citySlug}`);
    const db = admin.firestore();
    try {
        // Buscar la ciudad por slug
        const citiesSnapshot = await db.collection('cities').get();
        for (const cityDoc of citiesSnapshot.docs) {
            const cityData = cityDoc.data();
            if (cityData.slug === citySlug || cityDoc.id === citySlug) {
                const result = await migrateEventsToRAG(cityDoc.id, cityData.name || cityDoc.id);
                return {
                    success: true,
                    cityId: cityDoc.id,
                    cityName: cityData.name || cityDoc.id,
                    ...result
                };
            }
        }
        throw new Error(`City not found: ${citySlug}`);
    }
    catch (error) {
        console.error(`❌ Error migrating events for ${citySlug}:`, error);
        throw error;
    }
}
exports.migrateEventsForCity = migrateEventsForCity;
/**
 * Función HTTP para llamar desde Firebase Functions
 */
const migrateEventsToRAGFunction = async (req, res) => {
    try {
        const { citySlug } = req.body;
        if (citySlug) {
            const result = await migrateEventsForCity(citySlug);
            res.status(200).json({
                success: true,
                message: `Events migrated to RAG for city: ${citySlug}`,
                data: result
            });
        }
        else {
            const result = await migrateAllEventsToRAG();
            res.status(200).json({
                success: true,
                message: 'All events migrated to RAG successfully',
                data: result
            });
        }
    }
    catch (error) {
        console.error('Error in migrateEventsToRAGFunction:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.migrateEventsToRAGFunction = migrateEventsToRAGFunction;
//# sourceMappingURL=eventsToRAG.js.map
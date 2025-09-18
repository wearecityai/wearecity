"use strict";
/**
 * Script para generar embeddings vectoriales para eventos existentes
 * Esto preparará los eventos para usar Firestore Vector Search
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
exports.generateEventEmbeddingsFunction = exports.generateEmbeddingsForCity = exports.generateAllEventEmbeddings = void 0;
const admin = __importStar(require("firebase-admin"));
const vertexai_1 = require("@google-cloud/vertexai");
// Inicializar Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
// Inicializar Vertex AI
const vertex_ai = new vertexai_1.VertexAI({
    project: 'wearecity-2ab89',
    location: 'us-central1'
});
const model = vertex_ai.preview.getGenerativeModel({
    model: 'text-embedding-004',
});
/**
 * Generar texto combinado para embedding
 */
function generateEmbeddingText(event) {
    const parts = [
        event.title,
        event.description,
        event.category,
        event.location,
        ...(event.tags || [])
    ].filter(part => part && part.trim().length > 0);
    return parts.join(' ');
}
/**
 * Generar embedding para un texto
 */
async function generateEmbedding(text) {
    try {
        const request = {
            instances: [{ content: text }],
        };
        const response = await model.predict(request);
        if (response.predictions && response.predictions[0] && response.predictions[0].embeddings) {
            return response.predictions[0].embeddings.values;
        }
        throw new Error('No embeddings in response');
    }
    catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
}
/**
 * Procesar eventos de una ciudad y generar embeddings
 */
async function processEventsForCity(cityId, cityName) {
    console.log(`🏙️ Processing events for ${cityName} (${cityId})`);
    const db = admin.firestore();
    const eventsRef = db.collection('cities').doc(cityId).collection('events');
    try {
        const eventsSnapshot = await eventsRef.where('isActive', '==', true).get();
        if (eventsSnapshot.empty) {
            console.log(`❌ No active events found for ${cityName}`);
            return;
        }
        console.log(`📊 Found ${eventsSnapshot.size} active events for ${cityName}`);
        let processed = 0;
        let errors = 0;
        // Procesar eventos en batches para evitar rate limits
        const batch = db.batch();
        for (const eventDoc of eventsSnapshot.docs) {
            try {
                const eventData = eventDoc.data();
                eventData.id = eventDoc.id;
                // Generar texto para embedding
                const embeddingText = generateEmbeddingText(eventData);
                if (embeddingText.trim().length === 0) {
                    console.log(`⚠️ Skipping event ${eventData.id} - no text content`);
                    continue;
                }
                // Generar embedding
                console.log(`🔄 Generating embedding for: ${eventData.title}`);
                const embedding = await generateEmbedding(embeddingText);
                // Actualizar documento con embedding
                batch.update(eventDoc.ref, {
                    embedding: embedding,
                    embeddingText: embeddingText,
                    embeddingGenerated: new Date(),
                    embeddingModel: 'text-embedding-004'
                });
                processed++;
                // Commit batch cada 10 documentos
                if (processed % 10 === 0) {
                    await batch.commit();
                    console.log(`✅ Processed ${processed} events for ${cityName}`);
                    // Pequeña pausa para evitar rate limits
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            catch (error) {
                console.error(`❌ Error processing event ${eventDoc.id}:`, error);
                errors++;
            }
        }
        // Commit remaining documents
        if (processed % 10 !== 0) {
            await batch.commit();
        }
        console.log(`✅ Completed ${cityName}: ${processed} processed, ${errors} errors`);
    }
    catch (error) {
        console.error(`❌ Error processing city ${cityName}:`, error);
    }
}
/**
 * Función principal para procesar todas las ciudades
 */
async function generateAllEventEmbeddings() {
    console.log('🚀 Starting event embeddings generation...');
    const db = admin.firestore();
    try {
        // Obtener todas las ciudades
        const citiesSnapshot = await db.collection('cities').get();
        if (citiesSnapshot.empty) {
            console.log('❌ No cities found');
            return;
        }
        console.log(`🏙️ Found ${citiesSnapshot.size} cities`);
        // Procesar cada ciudad
        for (const cityDoc of citiesSnapshot.docs) {
            const cityData = cityDoc.data();
            const cityId = cityDoc.id;
            const cityName = cityData.name || cityId;
            await processEventsForCity(cityId, cityName);
            // Pausa entre ciudades
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        console.log('✅ All event embeddings generated successfully!');
    }
    catch (error) {
        console.error('❌ Error in generateAllEventEmbeddings:', error);
        throw error;
    }
}
exports.generateAllEventEmbeddings = generateAllEventEmbeddings;
/**
 * Función para generar embeddings de una ciudad específica
 */
async function generateEmbeddingsForCity(citySlug) {
    console.log(`🚀 Starting embeddings generation for city: ${citySlug}`);
    const db = admin.firestore();
    try {
        // Buscar la ciudad por slug
        const citiesSnapshot = await db.collection('cities').get();
        for (const cityDoc of citiesSnapshot.docs) {
            const cityData = cityDoc.data();
            if (cityData.slug === citySlug || cityDoc.id === citySlug) {
                await processEventsForCity(cityDoc.id, cityData.name || cityDoc.id);
                return;
            }
        }
        console.log(`❌ City not found: ${citySlug}`);
    }
    catch (error) {
        console.error(`❌ Error generating embeddings for ${citySlug}:`, error);
        throw error;
    }
}
exports.generateEmbeddingsForCity = generateEmbeddingsForCity;
// Función HTTP para llamar desde Firebase Functions
const generateEventEmbeddingsFunction = async (req, res) => {
    try {
        const { citySlug } = req.body;
        if (citySlug) {
            await generateEmbeddingsForCity(citySlug);
            res.status(200).json({
                success: true,
                message: `Embeddings generated for city: ${citySlug}`
            });
        }
        else {
            await generateAllEventEmbeddings();
            res.status(200).json({
                success: true,
                message: 'Embeddings generated for all cities'
            });
        }
    }
    catch (error) {
        console.error('Error in generateEventEmbeddingsFunction:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.generateEventEmbeddingsFunction = generateEventEmbeddingsFunction;
//# sourceMappingURL=generateEventEmbeddings.js.map
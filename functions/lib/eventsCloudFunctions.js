"use strict";
/**
 * Cloud Functions para el sistema de eventos
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
exports.cleanupOldEvents = exports.getEventsStats = exports.getEventsForCity = exports.processEventsDailyScheduled = exports.processEventsManual = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const eventsService_1 = require("./eventsService");
/**
 * Función para procesar eventos manualmente (llamada por admin)
 */
exports.processEventsManual = functions
    .region('us-central1')
    .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
})
    .https.onCall(async (data, context) => {
    try {
        // Verificar autenticación
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
        }
        const userId = context.auth.uid;
        const { citySlug } = data;
        if (!citySlug) {
            throw new functions.https.HttpsError('invalid-argument', 'citySlug is required');
        }
        // Verificar permisos (admin de la ciudad o superadmin)
        const userDoc = await admin.firestore().collection('profiles').doc(userId).get();
        const userData = userDoc.data();
        if (!userData) {
            throw new functions.https.HttpsError('not-found', 'User profile not found');
        }
        const isSuperAdmin = userData.role === 'superadmin';
        const isCityAdmin = userData.role === 'administrativo' && userData.citySlug === citySlug;
        if (!isSuperAdmin && !isCityAdmin) {
            throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
        }
        console.log(`🎪 Manual event processing requested by ${userId} for city: ${citySlug}`);
        // Procesar eventos
        const result = await eventsService_1.eventsService.processEventsForCity(citySlug);
        // Log del resultado
        await admin.firestore().collection('events_processing_logs').add({
            citySlug,
            userId,
            result,
            type: 'manual',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        return result;
    }
    catch (error) {
        console.error('Error in processEventsManual:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Error processing events');
    }
});
/**
 * Función programada para scraping diario de eventos
 */
exports.processEventsDailyScheduled = functions
    .region('us-central1')
    .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
})
    .pubsub.schedule('0 6 * * *') // Todos los días a las 6:00 AM
    .timeZone('Europe/Madrid')
    .onRun(async (context) => {
    try {
        console.log('🗓️ Starting scheduled daily events processing...');
        // Obtener todas las ciudades activas con URLs de eventos configuradas
        const citiesSnapshot = await admin.firestore()
            .collection('cities')
            .where('isActive', '==', true)
            .get();
        const results = {};
        let totalProcessed = 0;
        for (const cityDoc of citiesSnapshot.docs) {
            const cityData = cityDoc.data();
            const citySlug = cityData.slug;
            if (cityData.agendaEventosUrls && cityData.agendaEventosUrls.length > 0) {
                console.log(`🎪 Processing scheduled events for city: ${citySlug}`);
                try {
                    const result = await eventsService_1.eventsService.processEventsForCity(citySlug);
                    results[citySlug] = result;
                    totalProcessed++;
                    // Log individual del resultado
                    await admin.firestore().collection('events_processing_logs').add({
                        citySlug,
                        result,
                        type: 'scheduled',
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
                catch (error) {
                    console.error(`❌ Error processing events for city ${citySlug}:`, error);
                    results[citySlug] = {
                        success: false,
                        totalEvents: 0,
                        newEvents: 0,
                        updatedEvents: 0,
                        deletedEvents: 0,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            }
            else {
                console.log(`⚠️ City ${citySlug} has no event URLs configured, skipping`);
            }
        }
        console.log(`✅ Scheduled processing completed. Processed ${totalProcessed} cities`);
        // Log global del proceso
        await admin.firestore().collection('events_daily_logs').add({
            totalCities: citiesSnapshot.size,
            processedCities: totalProcessed,
            results,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, totalProcessed, results };
    }
    catch (error) {
        console.error('❌ Error in scheduled events processing:', error);
        throw error;
    }
});
/**
 * Función para obtener eventos de una ciudad
 */
exports.getEventsForCity = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    try {
        const { citySlug, limit = 50, startDate, category } = data;
        if (!citySlug) {
            throw new functions.https.HttpsError('invalid-argument', 'citySlug is required');
        }
        const events = await eventsService_1.eventsService.getEventsForCity(citySlug, limit, startDate, category);
        return {
            success: true,
            events,
            total: events.length
        };
    }
    catch (error) {
        console.error('Error in getEventsForCity:', error);
        throw new functions.https.HttpsError('internal', 'Error getting events');
    }
});
/**
 * Función para obtener estadísticas de eventos
 */
exports.getEventsStats = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    try {
        // Verificar autenticación
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
        }
        const { citySlug } = data;
        if (!citySlug) {
            throw new functions.https.HttpsError('invalid-argument', 'citySlug is required');
        }
        // Obtener estadísticas
        const today = new Date().toISOString().split('T')[0];
        const [totalEventsSnapshot, activeEventsSnapshot, upcomingEventsSnapshot, lastProcessingLogSnapshot] = await Promise.all([
            // 🔧 CORREGIR: Usar la estructura correcta cities/{citySlug}/events
            admin.firestore()
                .collection('cities')
                .doc(citySlug)
                .collection('events')
                .get(),
            admin.firestore()
                .collection('cities')
                .doc(citySlug)
                .collection('events')
                .where('isActive', '==', true)
                .get(),
            admin.firestore()
                .collection('cities')
                .doc(citySlug)
                .collection('events')
                .where('isActive', '==', true)
                .where('date', '>=', today)
                .get(),
            admin.firestore().collection('events_processing_logs')
                .where('citySlug', '==', citySlug)
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get()
        ]);
        // Estadísticas por categoría
        const eventsByCategory = {};
        upcomingEventsSnapshot.docs.forEach(doc => {
            const event = doc.data();
            const category = event.category || 'general';
            eventsByCategory[category] = (eventsByCategory[category] || 0) + 1;
        });
        const lastProcessing = !lastProcessingLogSnapshot.empty
            ? lastProcessingLogSnapshot.docs[0].data()
            : null;
        return {
            success: true,
            stats: {
                totalEvents: totalEventsSnapshot.size,
                activeEvents: activeEventsSnapshot.size,
                upcomingEvents: upcomingEventsSnapshot.size,
                eventsByCategory,
                lastProcessing: lastProcessing ? {
                    timestamp: lastProcessing.timestamp,
                    result: lastProcessing.result,
                    type: lastProcessing.type
                } : null
            }
        };
    }
    catch (error) {
        console.error('Error in getEventsStats:', error);
        throw new functions.https.HttpsError('internal', 'Error getting events stats');
    }
});
/**
 * Función para limpiar eventos antiguos
 */
exports.cleanupOldEvents = functions
    .region('us-central1')
    .pubsub.schedule('0 2 * * 0') // Todos los domingos a las 2:00 AM
    .timeZone('Europe/Madrid')
    .onRun(async (context) => {
    try {
        console.log('🧹 Starting cleanup of old events...');
        // Obtener eventos de más de 30 días de antigüedad
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
        // 🔧 NOTA: Para cleanup global, necesitamos usar collectionGroup
        // Ya que los eventos están distribuidos en cities/{cityId}/events
        const oldEventsSnapshot = await admin.firestore()
            .collectionGroup('events')
            .where('date', '<', cutoffDate)
            .get();
        if (oldEventsSnapshot.empty) {
            console.log('✅ No old events to cleanup');
            return { success: true, deletedEvents: 0 };
        }
        // Eliminar eventos antiguos en lotes
        const batch = admin.firestore().batch();
        let deletedCount = 0;
        oldEventsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
            deletedCount++;
        });
        await batch.commit();
        console.log(`🗑️ Deleted ${deletedCount} old events`);
        // Log del cleanup
        await admin.firestore().collection('events_cleanup_logs').add({
            deletedEvents: deletedCount,
            cutoffDate,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, deletedEvents: deletedCount };
    }
    catch (error) {
        console.error('❌ Error in cleanup old events:', error);
        throw error;
    }
});
//# sourceMappingURL=eventsCloudFunctions.js.map
"use strict";
/**
 * Cloud Functions para scraping automático diario de eventos
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
exports.getEventsStats = exports.getCityEvents = exports.dailyEventsScrapingWebhook = exports.dailyEventsScrapingManual = exports.dailyEventsScrapingScheduled = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const dailyEventsScrapingService_1 = require("./dailyEventsScrapingService");
const cors = require('cors')({ origin: true });
/**
 * Cloud Function programada para ejecutarse diariamente a las 6:00 AM
 * Procesa todas las ciudades activas y extrae eventos
 */
exports.dailyEventsScrapingScheduled = functions
    .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
})
    .pubsub
    .schedule('0 6 * * *') // Todos los días a las 6:00 AM
    .timeZone('Europe/Madrid')
    .onRun(async (context) => {
    console.log('🌅 Starting daily events scraping (scheduled)...');
    try {
        const scrapingService = new dailyEventsScrapingService_1.DailyEventsScrapingService(admin.firestore());
        const results = await scrapingService.processAllCities();
        console.log('✅ Daily scraping completed successfully:', results);
        return results;
    }
    catch (error) {
        console.error('❌ Daily scraping failed:', error);
        throw error;
    }
});
/**
 * Cloud Function manual para triggers administrativos
 * Permite ejecutar el scraping manualmente desde el admin
 */
exports.dailyEventsScrapingManual = functions
    .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
})
    .https
    .onCall(async (data, context) => {
    console.log('🔧 Starting manual events scraping...');
    try {
        // Verificar autenticación (opcional - por ahora permitir sin auth)
        // if (!context.auth) {
        //   throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
        // }
        const scrapingService = new dailyEventsScrapingService_1.DailyEventsScrapingService(admin.firestore());
        // Permitir procesar una ciudad específica o todas
        if (data?.citySlug) {
            console.log(`Processing specific city: ${data.citySlug}`);
            const cityDoc = await admin.firestore().collection('cities').doc(data.citySlug).get();
            if (!cityDoc.exists) {
                throw new functions.https.HttpsError('not-found', `City ${data.citySlug} not found`);
            }
            const cityData = cityDoc.data();
            if (!cityData?.agendaEventosUrls || cityData.agendaEventosUrls.length === 0) {
                throw new functions.https.HttpsError('invalid-argument', `City ${data.citySlug} has no event URLs configured`);
            }
            const results = await scrapingService.processCityEvents(cityData);
            console.log(`✅ Manual scraping completed for ${data.citySlug}:`, results);
            return results;
        }
        else {
            // Procesar todas las ciudades
            const results = await scrapingService.processAllCities();
            console.log('✅ Manual scraping completed for all cities:', results);
            return results;
        }
    }
    catch (error) {
        console.error('❌ Manual scraping failed:', error);
        throw error;
    }
});
/**
 * Cloud Function HTTP para webhook o triggers externos
 */
exports.dailyEventsScrapingWebhook = functions
    .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
})
    .https
    .onRequest((req, res) => {
    return cors(req, res, async () => {
        console.log('🌐 Starting webhook events scraping...');
        try {
            if (req.method !== 'POST') {
                res.status(405).json({ error: 'Method not allowed' });
                return;
            }
            const scrapingService = new dailyEventsScrapingService_1.DailyEventsScrapingService(admin.firestore());
            const results = await scrapingService.processAllCities();
            console.log('✅ Webhook scraping completed:', results);
            res.status(200).json({
                success: true,
                message: 'Daily events scraping completed successfully',
                results
            });
        }
        catch (error) {
            console.error('❌ Webhook scraping failed:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
});
/**
 * Cloud Function para consultar eventos de una ciudad específica
 * Usa la nueva estructura cities/{cityId}/events
 */
exports.getCityEvents = functions.https.onCall(async (data, context) => {
    try {
        const { citySlug, limit = 50, category, startDate, endDate } = data;
        if (!citySlug) {
            throw new functions.https.HttpsError('invalid-argument', 'citySlug is required');
        }
        let query = admin.firestore()
            .collection('cities')
            .doc(citySlug)
            .collection('events')
            .where('isActive', '==', true)
            .orderBy('date', 'asc')
            .limit(limit);
        // Filtros opcionales
        if (category) {
            query = query.where('category', '==', category);
        }
        if (startDate) {
            query = query.where('date', '>=', startDate);
        }
        if (endDate) {
            query = query.where('date', '<=', endDate);
        }
        const eventsSnapshot = await query.get();
        const events = eventsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return {
            success: true,
            citySlug,
            events,
            total: events.length
        };
    }
    catch (error) {
        console.error('Error getting city events:', error);
        throw error;
    }
});
/**
 * Cloud Function para obtener estadísticas de eventos
 */
exports.getEventsStats = functions.https.onCall(async (data, context) => {
    try {
        const { citySlug } = data;
        if (!citySlug) {
            throw new functions.https.HttpsError('invalid-argument', 'citySlug is required');
        }
        const eventsRef = admin.firestore()
            .collection('cities')
            .doc(citySlug)
            .collection('events');
        // Estadísticas básicas
        const [totalEvents, activeEvents, futureEvents] = await Promise.all([
            eventsRef.get().then(s => s.size),
            eventsRef.where('isActive', '==', true).get().then(s => s.size),
            eventsRef.where('date', '>=', new Date().toISOString().split('T')[0]).get().then(s => s.size)
        ]);
        // Eventos por categoría
        const categoriesSnapshot = await eventsRef
            .where('isActive', '==', true)
            .where('date', '>=', new Date().toISOString().split('T')[0])
            .get();
        const categoriesCount = {};
        categoriesSnapshot.docs.forEach(doc => {
            const category = doc.data().category || 'general';
            categoriesCount[category] = (categoriesCount[category] || 0) + 1;
        });
        return {
            success: true,
            citySlug,
            stats: {
                totalEvents,
                activeEvents,
                futureEvents,
                categoriesCount,
                lastUpdated: new Date().toISOString()
            }
        };
    }
    catch (error) {
        console.error('Error getting events stats:', error);
        throw error;
    }
});
//# sourceMappingURL=dailyEventsCloudFunctions.js.map
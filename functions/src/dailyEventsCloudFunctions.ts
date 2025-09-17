/**
 * Cloud Functions para scraping automático diario de eventos
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { DailyEventsScrapingService } from './dailyEventsScrapingService';

const cors = require('cors')({ origin: true });

/**
 * Cloud Function programada para ejecutarse diariamente a las 6:00 AM
 * Procesa todas las ciudades activas y extrae eventos
 */
export const dailyEventsScrapingScheduled = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutos
    memory: '2GB'
  })
  .pubsub
  .schedule('0 6 * * *') // Todos los días a las 6:00 AM
  .timeZone('Europe/Madrid')
  .onRun(async (context) => {
    console.log('🌅 Starting daily events scraping (scheduled)...');
    
    try {
      const scrapingService = new DailyEventsScrapingService(admin.firestore());
      const results = await scrapingService.processAllCities();
      
      console.log('✅ Daily scraping completed successfully:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Daily scraping failed:', error);
      throw error;
    }
  });

/**
 * Cloud Function manual para triggers administrativos
 * Permite ejecutar el scraping manualmente desde el admin
 */
export const dailyEventsScrapingManual = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutos
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
      
      const scrapingService = new DailyEventsScrapingService(admin.firestore());
      
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
        
        const results = await scrapingService.processCityEvents(cityData as any);
        console.log(`✅ Manual scraping completed for ${data.citySlug}:`, results);
        return results;
        
      } else {
        // Procesar todas las ciudades
        const results = await scrapingService.processAllCities();
        console.log('✅ Manual scraping completed for all cities:', results);
        return results;
      }
      
    } catch (error) {
      console.error('❌ Manual scraping failed:', error);
      throw error;
    }
  });

/**
 * Cloud Function HTTP para webhook o triggers externos
 */
export const dailyEventsScrapingWebhook = functions
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
        
        const scrapingService = new DailyEventsScrapingService(admin.firestore());
        const results = await scrapingService.processAllCities();
        
        console.log('✅ Webhook scraping completed:', results);
        res.status(200).json({
          success: true,
          message: 'Daily events scraping completed successfully',
          results
        });
        
      } catch (error) {
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
export const getCityEvents = functions.https.onCall(async (data, context) => {
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
      query = query.where('category', '==', category) as any;
    }
    
    if (startDate) {
      query = query.where('date', '>=', startDate) as any;
    }
    
    if (endDate) {
      query = query.where('date', '<=', endDate) as any;
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
    
  } catch (error) {
    console.error('Error getting city events:', error);
    throw error;
  }
});

/**
 * Cloud Function para obtener estadísticas de eventos
 */
export const getEventsStats = functions.https.onCall(async (data, context) => {
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
    const [
      totalEvents,
      activeEvents,
      futureEvents
    ] = await Promise.all([
      eventsRef.get().then(s => s.size),
      eventsRef.where('isActive', '==', true).get().then(s => s.size),
      eventsRef.where('date', '>=', new Date().toISOString().split('T')[0]).get().then(s => s.size)
    ]);
    
    // Eventos por categoría
    const categoriesSnapshot = await eventsRef
      .where('isActive', '==', true)
      .where('date', '>=', new Date().toISOString().split('T')[0])
      .get();
    
    const categoriesCount: {[key: string]: number} = {};
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
    
  } catch (error) {
    console.error('Error getting events stats:', error);
    throw error;
  }
});
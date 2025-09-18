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
exports.handleScheduledScraping = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Handler para mensajes de scraping programado desde Cloud Scheduler
 */
exports.handleScheduledScraping = functions.pubsub
    .topic('wearecity-scraping-schedule')
    .onPublish(async (message) => {
    try {
        console.log('📅 Mensaje de scraping programado recibido');
        // Decodificar el mensaje
        const messageData = message.json;
        const { operation, cities, deep_scrape = false, full_refresh = false } = messageData;
        console.log(`🎯 Operación: ${operation}`);
        console.log(`🏙️ Ciudades: ${cities.join(', ')}`);
        // Obtener URLs dinámicamente desde Firestore
        const getCityUrls = async (citySlug) => {
            try {
                const cityDoc = await admin.firestore().collection('cities').doc(citySlug).get();
                if (cityDoc.exists) {
                    const cityData = cityDoc.data();
                    const agendaUrls = cityData?.agendaEventosUrls || [];
                    console.log(`📍 URLs para ${citySlug}:`, agendaUrls);
                    return agendaUrls;
                }
                return [];
            }
            catch (error) {
                console.error(`❌ Error obteniendo URLs para ${citySlug}:`, error);
                return [];
            }
        };
        // Procesar según el tipo de operación
        switch (operation) {
            case 'daily_scrape':
                console.log('📅 Ejecutando scraping diario...');
                await processDailyScraping(cities, getCityUrls);
                break;
            case 'weekly_scrape':
                console.log('📊 Ejecutando scraping semanal completo...');
                await processWeeklyScraping(cities, cityUrls, deep_scrape);
                break;
            case 'monthly_cleanup':
                console.log('🧹 Ejecutando limpieza mensual...');
                await processMonthlyCleanup(cities, full_refresh);
                break;
            default:
                console.warn(`❓ Operación desconocida: ${operation}`);
        }
        console.log('✅ Scraping programado completado');
    }
    catch (error) {
        console.error('❌ Error en scraping programado:', error);
        // Registrar el error en Firestore para monitoreo
        await admin.firestore().collection('system_logs').add({
            type: 'scheduled_scraping_error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            messageData: message.json
        });
    }
});
/**
 * Scraping diario - Agenda principal de cada ciudad
 */
async function processDailyScraping(cities, getCityUrls) {
    console.log('🌅 Iniciando scraping diario...');
    for (const city of cities) {
        console.log(`🔍 Obteniendo URLs configuradas para ${city}...`);
        const urls = await getCityUrls(city);
        if (urls.length === 0) {
            console.warn(`⚠️ No hay URLs configuradas para ciudad: ${city}`);
            continue;
        }
        console.log(`📍 ${city}: ${urls.length} URLs encontradas`);
        for (const url of urls) {
            try {
                console.log(`🕷️ Scrapeando ${city}: ${url}`);
                // Llamar al servicio de Puppeteer
                const response = await fetch('https://wearecity-puppeteer-service-294062779330.us-central1.run.app/scrape-events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url,
                        citySlug: city,
                        options: { timeout: 60000 }
                    })
                });
                const result = await response.json();
                if (result.success) {
                    console.log(`✅ ${city}: ${result.eventsExtracted} eventos extraídos`);
                    // Aquí insertaríamos en RAG usando el agente
                    // Por ahora, solo guardamos en Firestore como backup
                    if (result.events && result.events.length > 0) {
                        const batch = admin.firestore().batch();
                        result.events.forEach((event) => {
                            const docRef = admin.firestore()
                                .collection('cities')
                                .doc(city)
                                .collection('events')
                                .doc();
                            batch.set(docRef, {
                                ...event,
                                scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
                                source: 'daily_scraping'
                            });
                        });
                        await batch.commit();
                        console.log(`💾 ${city}: Eventos guardados en Firestore`);
                    }
                }
                else {
                    console.error(`❌ ${city}: Error scrapeando - ${result.error}`);
                }
            }
            catch (error) {
                console.error(`❌ Error procesando ${city}, URL ${url}:`, error);
            }
        } // Cierre del loop de URLs
    } // Cierre del loop de ciudades
}
/**
 * Scraping semanal - Fuentes adicionales y verificación profunda
 */
async function processWeeklyScraping(cities, cityUrls, deepScrape) {
    console.log('📊 Iniciando scraping semanal...');
    // Ejecutar scraping diario primero
    await processDailyScraping(cities, cityUrls);
    if (deepScrape) {
        console.log('🔍 Ejecutando scraping profundo...');
        // Aquí se agregarían fuentes adicionales por ciudad
        const additionalSources = {
            'valencia': [
                'https://www.valencia.es/es/cultura',
                'https://www.valencia.es/es/turismo'
            ],
            'la-vila-joiosa': [
                'https://www.lavilajoiosa.es/es/turismo',
                'https://www.lavilajoiosa.es/es/cultura'
            ],
            'alicante': [
                'https://www.alicante.es/es/cultura',
                'https://www.alicante.es/es/turismo'
            ]
        };
        for (const city of cities) {
            const sources = additionalSources[city] || [];
            console.log(`🔍 ${city}: Scraping profundo de ${sources.length} fuentes adicionales`);
            for (const url of sources) {
                try {
                    console.log(`   📡 Scrapeando: ${url}`);
                    // Implementar scraping de fuentes adicionales
                }
                catch (error) {
                    console.error(`   ❌ Error en ${url}:`, error);
                }
            }
        }
    }
}
/**
 * Limpieza mensual - Refrescar toda la base de datos
 */
async function processMonthlyCleanup(cities, fullRefresh) {
    console.log('🧹 Iniciando limpieza mensual...');
    if (fullRefresh) {
        console.log('🗑️ Limpieza completa activada...');
        for (const city of cities) {
            try {
                console.log(`🧹 Limpiando datos antiguos de ${city}...`);
                // Limpiar eventos antiguos (más de 6 meses)
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                const oldEvents = await admin.firestore()
                    .collection('cities')
                    .doc(city)
                    .collection('events')
                    .where('date', '<', sixMonthsAgo)
                    .get();
                if (!oldEvents.empty) {
                    const batch = admin.firestore().batch();
                    oldEvents.docs.forEach(doc => {
                        batch.delete(doc.ref);
                    });
                    await batch.commit();
                    console.log(`🗑️ ${city}: ${oldEvents.size} eventos antiguos eliminados`);
                }
            }
            catch (error) {
                console.error(`❌ Error limpiando ${city}:`, error);
            }
        }
    }
    // Ejecutar scraping completo después de la limpieza
    console.log('🔄 Ejecutando scraping completo post-limpieza...');
    await processWeeklyScraping(cities, {
        'valencia': 'https://www.valencia.es/es/agenda',
        'la-vila-joiosa': 'https://www.lavilajoiosa.es/es/agenda',
        'alicante': 'https://www.alicante.es/es/agenda'
    }, true);
}
//# sourceMappingURL=scheduledScrapingHandler.js.map
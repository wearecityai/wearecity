"use strict";
/**
 * Servicio de Eventos para WeAreCity
 * Maneja scraping, procesamiento y almacenamiento de eventos
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
exports.eventsService = exports.EventsService = void 0;
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const eventScraper_1 = require("./eventScraper");
/**
 * Servicio principal de eventos
 */
class EventsService {
    constructor() {
        this.db = admin.firestore();
        this.genAI = new generative_ai_1.GoogleGenAI(process.env.GOOGLE_GEMINI_API_KEY);
    }
    /**
     * Procesar eventos de una ciudad específica
     */
    async processEventsForCity(citySlug) {
        var _a;
        try {
            console.log(`🎪 Processing events for city: ${citySlug}`);
            // Obtener configuración de la ciudad
            const cityConfig = await this.getCityConfig(citySlug);
            if (!cityConfig || !((_a = cityConfig.agendaEventosUrls) === null || _a === void 0 ? void 0 : _a.length)) {
                return {
                    success: false,
                    totalEvents: 0,
                    newEvents: 0,
                    updatedEvents: 0,
                    deletedEvents: 0,
                    error: 'No event URLs configured for this city'
                };
            }
            let allRawEvents = [];
            // Scraping de todas las URLs configuradas
            for (const url of cityConfig.agendaEventosUrls) {
                console.log(`🕷️ Scraping events from: ${url}`);
                try {
                    const scrapingResult = await (0, eventScraper_1.scrapeEventsFromUrl)(url, cityConfig.name);
                    if (scrapingResult.success && scrapingResult.events.length > 0) {
                        const rawEvents = scrapingResult.events.map(event => ({
                            title: event.title,
                            date: event.date,
                            time: event.time,
                            location: event.location,
                            description: event.description,
                            url: event.url,
                            sourceUrl: url
                        }));
                        allRawEvents.push(...rawEvents);
                        console.log(`✅ Found ${rawEvents.length} events from ${url}`);
                    }
                }
                catch (error) {
                    console.error(`❌ Error scraping ${url}:`, error);
                }
            }
            console.log(`📊 Total raw events found: ${allRawEvents.length}`);
            if (allRawEvents.length === 0) {
                return {
                    success: true,
                    totalEvents: 0,
                    newEvents: 0,
                    updatedEvents: 0,
                    deletedEvents: 0
                };
            }
            // Limpiar, ordenar y clasificar eventos con IA
            const processedEvents = await this.cleanAndClassifyEvents(allRawEvents, citySlug, cityConfig.name);
            console.log(`🧹 Processed events: ${processedEvents.length}`);
            // Guardar en Firestore
            const saveResult = await this.saveEventsToFirestore(processedEvents, citySlug);
            // Limpiar eventos pasados
            await this.cleanupExpiredEvents(citySlug);
            return {
                success: true,
                totalEvents: processedEvents.length,
                newEvents: saveResult.newEvents,
                updatedEvents: saveResult.updatedEvents,
                deletedEvents: 0
            };
        }
        catch (error) {
            console.error(`❌ Error processing events for ${citySlug}:`, error);
            return {
                success: false,
                totalEvents: 0,
                newEvents: 0,
                updatedEvents: 0,
                deletedEvents: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Limpiar, ordenar y clasificar eventos usando IA
     */
    async cleanAndClassifyEvents(rawEvents, citySlug, cityName) {
        try {
            console.log('🤖 Cleaning and classifying events with AI...');
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const systemPrompt = `Eres un experto en limpieza y clasificación de eventos. 
Tu tarea es procesar una lista de eventos extraídos de webs oficiales y convertirlos en un formato estructurado y limpio.

INSTRUCCIONES CRÍTICAS:

1. **LIMPIEZA DE DATOS:**
   - Normaliza títulos (capitalización adecuada, sin caracteres extraños)
   - Valida y corrige fechas al formato YYYY-MM-DD
   - Normaliza horarios al formato HH:MM - HH:MM (24h)
   - Limpia ubicaciones (nombres correctos, sin caracteres extraños)
   - Mejora descripciones (elimina HTML, caracteres extraños, mejora redacción)

2. **CLASIFICACIÓN:**
   - Asigna categorías: teatro, concierto, cultural, deportivo, infantil, gastronómico, festivo, educativo, religioso, municipal
   - Genera tags relevantes para cada evento
   - Identifica eventos recurrentes (semanales, mensuales)

3. **VALIDACIÓN:**
   - Solo eventos futuros (desde hoy en adelante)
   - Solo eventos en ${cityName}
   - Elimina duplicados
   - Corrige información incompleta cuando sea posible

4. **FORMATO DE SALIDA:**
   Devuelve SOLO un JSON válido con el siguiente formato:
   
\`\`\`json
{
  "events": [
    {
      "title": "Título limpio y normalizado",
      "date": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD" (opcional, solo para eventos de varios días),
      "time": "HH:MM - HH:MM" (opcional),
      "location": "Ubicación normalizada",
      "description": "Descripción mejorada",
      "category": "categoría asignada",
      "isRecurring": false,
      "tags": ["tag1", "tag2", "tag3"],
      "sourceUrl": "URL original",
      "eventDetailUrl": "URL de detalles si está disponible"
    }
  ]
}
\`\`\`

FECHA ACTUAL: ${new Date().toISOString().split('T')[0]}
CIUDAD: ${cityName}

EVENTOS A PROCESAR:
${JSON.stringify(rawEvents, null, 2)}`;
            const result = await model.generateContent(systemPrompt);
            const responseText = result.response.text();
            // Extraer JSON de la respuesta
            const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
            if (!jsonMatch) {
                throw new Error('No JSON found in AI response');
            }
            const parsedData = JSON.parse(jsonMatch[1]);
            if (!parsedData.events || !Array.isArray(parsedData.events)) {
                throw new Error('Invalid events structure in AI response');
            }
            // Convertir a ProcessedEvent
            const processedEvents = parsedData.events.map((event, index) => ({
                id: this.generateEventId(event.title, event.date, citySlug),
                title: event.title,
                date: event.date,
                endDate: event.endDate,
                time: event.time,
                location: event.location,
                description: event.description,
                category: event.category || 'general',
                imageUrl: undefined,
                sourceUrl: event.sourceUrl,
                eventDetailUrl: event.eventDetailUrl,
                citySlug,
                cityName,
                isActive: true,
                isRecurring: event.isRecurring || false,
                tags: event.tags || [],
                createdAt: new Date(),
                updatedAt: new Date(),
                scrapedAt: new Date()
            }));
            console.log(`✅ AI processed ${processedEvents.length} events`);
            return processedEvents;
        }
        catch (error) {
            console.error('❌ Error in AI cleaning and classification:', error);
            // Fallback: procesar eventos manualmente sin IA
            return this.fallbackProcessEvents(rawEvents, citySlug, cityName);
        }
    }
    /**
     * Procesamiento de fallback sin IA
     */
    fallbackProcessEvents(rawEvents, citySlug, cityName) {
        console.log('⚠️ Using fallback processing without AI');
        return rawEvents
            .filter(event => event.title && event.date)
            .map((event, index) => ({
            id: this.generateEventId(event.title, event.date, citySlug),
            title: event.title.trim(),
            date: this.normalizeDate(event.date),
            time: event.time,
            location: event.location,
            description: event.description,
            category: 'general',
            sourceUrl: event.sourceUrl,
            eventDetailUrl: event.url,
            citySlug,
            cityName,
            isActive: true,
            isRecurring: false,
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            scrapedAt: new Date()
        }))
            .filter(event => this.isValidFutureDate(event.date));
    }
    /**
     * Guardar eventos en Firestore
     */
    async saveEventsToFirestore(events, citySlug) {
        let newEvents = 0;
        let updatedEvents = 0;
        const batch = this.db.batch();
        for (const event of events) {
            // 🔧 CORREGIR: Usar la estructura correcta cities/{citySlug}/events
            const eventRef = this.db
                .collection('cities')
                .doc(citySlug)
                .collection('events')
                .doc(event.id);
            const existingEvent = await eventRef.get();
            if (existingEvent.exists) {
                // Actualizar evento existente
                batch.update(eventRef, Object.assign(Object.assign({}, event), { updatedAt: new Date(), scrapedAt: new Date() }));
                updatedEvents++;
            }
            else {
                // Crear nuevo evento
                batch.set(eventRef, event);
                newEvents++;
            }
        }
        await batch.commit();
        console.log(`💾 Saved ${newEvents} new events and updated ${updatedEvents} events`);
        return { newEvents, updatedEvents };
    }
    /**
     * Obtener eventos de una ciudad desde Firestore
     */
    async getEventsForCity(citySlug, limit = 50, startDate, category) {
        try {
            // 🔧 CORREGIR: Usar la estructura correcta cities/{citySlug}/events
            let query = this.db
                .collection('cities')
                .doc(citySlug)
                .collection('events')
                .where('isActive', '==', true)
                .where('date', '>=', startDate || new Date().toISOString().split('T')[0])
                .orderBy('date', 'asc')
                .limit(limit);
            if (category) {
                query = query.where('category', '==', category);
            }
            const snapshot = await query.get();
            return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }
        catch (error) {
            console.error('❌ Error getting events from Firestore:', error);
            return [];
        }
    }
    /**
     * Limpiar eventos pasados
     */
    async cleanupExpiredEvents(citySlug) {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            // 🔧 CORREGIR: Usar la estructura correcta cities/{citySlug}/events
            const expiredEventsSnapshot = await this.db
                .collection('cities')
                .doc(citySlug)
                .collection('events')
                .where('date', '<', yesterdayStr)
                .get();
            if (!expiredEventsSnapshot.empty) {
                const batch = this.db.batch();
                expiredEventsSnapshot.docs.forEach(doc => {
                    batch.update(doc.ref, { isActive: false });
                });
                await batch.commit();
                console.log(`🧹 Marked ${expiredEventsSnapshot.size} expired events as inactive`);
            }
        }
        catch (error) {
            console.error('❌ Error cleaning up expired events:', error);
        }
    }
    /**
     * Obtener configuración de la ciudad
     */
    async getCityConfig(citySlug) {
        try {
            const citySnapshot = await this.db.collection('cities')
                .where('slug', '==', citySlug)
                .limit(1)
                .get();
            if (citySnapshot.empty) {
                console.error(`❌ City not found: ${citySlug}`);
                return null;
            }
            return citySnapshot.docs[0].data();
        }
        catch (error) {
            console.error('❌ Error getting city config:', error);
            return null;
        }
    }
    /**
     * Generar ID único para evento
     */
    generateEventId(title, date, citySlug) {
        const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `${citySlug}_${date}_${cleanTitle}`.substring(0, 100);
    }
    /**
     * Normalizar fecha al formato YYYY-MM-DD
     */
    normalizeDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toISOString().split('T')[0];
        }
        catch (_a) {
            return new Date().toISOString().split('T')[0];
        }
    }
    /**
     * Validar que la fecha sea futura
     */
    isValidFutureDate(dateStr) {
        try {
            const eventDate = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return eventDate >= today;
        }
        catch (_a) {
            return false;
        }
    }
}
exports.EventsService = EventsService;
// Instancia singleton
exports.eventsService = new EventsService();
//# sourceMappingURL=eventsService.js.map
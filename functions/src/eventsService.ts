/**
 * Servicio de Eventos para WeAreCity
 * Maneja scraping, procesamiento y almacenamiento de eventos
 */

import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/generative-ai';
import { scrapeEventsFromUrl } from './eventScraper';

// Interfaces
export interface RawEvent {
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  url?: string;
  sourceUrl: string;
}

export interface ProcessedEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD para eventos de varios días
  time?: string; // HH:MM - HH:MM
  location?: string;
  description?: string;
  category?: string; // teatro, concierto, cultural, deportivo, etc.
  imageUrl?: string;
  sourceUrl: string;
  eventDetailUrl?: string;
  citySlug: string;
  cityName: string;
  isActive: boolean;
  isRecurring: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  scrapedAt: Date;
}

export interface EventsServiceResult {
  success: boolean;
  totalEvents: number;
  newEvents: number;
  updatedEvents: number;
  deletedEvents: number;
  error?: string;
}

/**
 * Servicio principal de eventos
 */
export class EventsService {
  private db = admin.firestore();
  private genAI: GoogleGenAI;

  constructor() {
    this.genAI = new GoogleGenAI(process.env.GOOGLE_GEMINI_API_KEY!);
  }

  /**
   * Procesar eventos de una ciudad específica
   */
  async processEventsForCity(citySlug: string): Promise<EventsServiceResult> {
    try {
      console.log(`🎪 Processing events for city: ${citySlug}`);

      // Obtener configuración de la ciudad
      const cityConfig = await this.getCityConfig(citySlug);
      if (!cityConfig || !cityConfig.agendaEventosUrls?.length) {
        return {
          success: false,
          totalEvents: 0,
          newEvents: 0,
          updatedEvents: 0,
          deletedEvents: 0,
          error: 'No event URLs configured for this city'
        };
      }

      let allRawEvents: RawEvent[] = [];
      
      // Scraping de todas las URLs configuradas
      for (const url of cityConfig.agendaEventosUrls) {
        console.log(`🕷️ Scraping events from: ${url}`);
        
        try {
          const scrapingResult = await scrapeEventsFromUrl(url, cityConfig.name);
          if (scrapingResult.success && scrapingResult.events.length > 0) {
            const rawEvents: RawEvent[] = scrapingResult.events.map(event => ({
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
        } catch (error) {
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

    } catch (error) {
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
  private async cleanAndClassifyEvents(
    rawEvents: RawEvent[], 
    citySlug: string, 
    cityName: string
  ): Promise<ProcessedEvent[]> {
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
      const processedEvents: ProcessedEvent[] = parsedData.events.map((event: any, index: number) => ({
        id: this.generateEventId(event.title, event.date, citySlug),
        title: event.title,
        date: event.date,
        endDate: event.endDate,
        time: event.time,
        location: event.location,
        description: event.description,
        category: event.category || 'general',
        imageUrl: undefined, // Se puede añadir lógica para extraer imágenes
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

    } catch (error) {
      console.error('❌ Error in AI cleaning and classification:', error);
      // Fallback: procesar eventos manualmente sin IA
      return this.fallbackProcessEvents(rawEvents, citySlug, cityName);
    }
  }

  /**
   * Procesamiento de fallback sin IA
   */
  private fallbackProcessEvents(rawEvents: RawEvent[], citySlug: string, cityName: string): ProcessedEvent[] {
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
  private async saveEventsToFirestore(
    events: ProcessedEvent[], 
    citySlug: string
  ): Promise<{ newEvents: number; updatedEvents: number }> {
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
        batch.update(eventRef, {
          ...event,
          updatedAt: new Date(),
          scrapedAt: new Date()
        });
        updatedEvents++;
      } else {
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
  async getEventsForCity(
    citySlug: string, 
    limit: number = 50,
    startDate?: string,
    category?: string
  ): Promise<ProcessedEvent[]> {
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
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProcessedEvent));

    } catch (error) {
      console.error('❌ Error getting events from Firestore:', error);
      return [];
    }
  }

  /**
   * Limpiar eventos pasados
   */
  private async cleanupExpiredEvents(citySlug: string): Promise<void> {
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
    } catch (error) {
      console.error('❌ Error cleaning up expired events:', error);
    }
  }

  /**
   * Obtener configuración de la ciudad
   */
  private async getCityConfig(citySlug: string): Promise<any> {
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
    } catch (error) {
      console.error('❌ Error getting city config:', error);
      return null;
    }
  }

  /**
   * Generar ID único para evento
   */
  private generateEventId(title: string, date: string, citySlug: string): string {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${citySlug}_${date}_${cleanTitle}`.substring(0, 100);
  }

  /**
   * Normalizar fecha al formato YYYY-MM-DD
   */
  private normalizeDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Validar que la fecha sea futura
   */
  private isValidFutureDate(dateStr: string): boolean {
    try {
      const eventDate = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    } catch {
      return false;
    }
  }
}

// Instancia singleton
export const eventsService = new EventsService();
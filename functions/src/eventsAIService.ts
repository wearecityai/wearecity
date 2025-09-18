/**
 * Servicio de IA para Eventos
 * Maneja la integración entre eventos de Firestore y la IA
 */

import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/generative-ai';
import { ProcessedEvent, eventsService } from './eventsService';

export interface EventsAIResponse {
  text: string;
  events: ProcessedEvent[];
  totalEvents: number;
  hasMoreEvents: boolean;
}

/**
 * Servicio de IA para eventos
 */
export class EventsAIService {
  private db = admin.firestore();
  private genAI: GoogleGenAI;

  constructor() {
    this.genAI = new GoogleGenAI(process.env.GOOGLE_GEMINI_API_KEY!);
  }

  /**
   * Procesar consulta sobre eventos usando Firestore + IA
   */
  async processEventsQuery(
    query: string,
    citySlug: string,
    cityName: string,
    limit: number = 10
  ): Promise<EventsAIResponse> {
    try {
      console.log(`🎪 Processing events query for ${cityName}: "${query}"`);

      // Obtener eventos relevantes de Firestore
      const events = await this.getRelevantEvents(query, citySlug, limit);
      
      if (events.length === 0) {
        return {
          text: this.generateNoEventsResponse(cityName),
          events: [],
          totalEvents: 0,
          hasMoreEvents: false
        };
      }

      // Generar respuesta con IA usando los eventos de Firestore
      const aiResponse = await this.generateAIResponse(query, events, cityName);

      return {
        text: aiResponse,
        events: events,
        totalEvents: events.length,
        hasMoreEvents: events.length >= limit
      };

    } catch (error) {
      console.error('❌ Error processing events query:', error);
      return {
        text: `Lo siento, hubo un problema al consultar los eventos de ${cityName}. Por favor, inténtalo de nuevo.`,
        events: [],
        totalEvents: 0,
        hasMoreEvents: false
      };
    }
  }

  /**
   * Obtener eventos relevantes de Firestore basado en la consulta
   */
  private async getRelevantEvents(
    query: string, 
    citySlug: string, 
    limit: number
  ): Promise<ProcessedEvent[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Detectar filtros en la consulta
      const filters = this.extractFilters(query);
      
      // 🔧 CORREGIR: Usar la estructura correcta cities/{citySlug}/events
      let firestoreQuery = this.db
        .collection('cities')
        .doc(citySlug)
        .collection('events')
        .where('isActive', '==', true)
        .where('date', '>=', filters.startDate || today);

      // Aplicar filtros adicionales
      if (filters.category) {
        firestoreQuery = firestoreQuery.where('category', '==', filters.category);
      }

      // Ordenar y limitar
      firestoreQuery = firestoreQuery
        .orderBy('date', 'asc')
        .limit(limit * 2); // Obtenemos más para filtrar después

      const snapshot = await firestoreQuery.get();
      
      let events: ProcessedEvent[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProcessedEvent));

      // Filtrado inteligente por palabras clave
      if (filters.keywords.length > 0) {
        events = this.filterEventsByKeywords(events, filters.keywords);
      }

      // Filtrado por fecha específica
      if (filters.specificDate) {
        events = events.filter(event => event.date === filters.specificDate);
      }

      // Filtrado por período
      if (filters.period) {
        events = this.filterEventsByPeriod(events, filters.period);
      }

      console.log(`📊 Found ${events.length} relevant events for query`);
      
      return events.slice(0, limit);

    } catch (error) {
      console.error('❌ Error getting relevant events:', error);
      return [];
    }
  }

  /**
   * Extraer filtros de la consulta del usuario
   */
  private extractFilters(query: string): {
    category?: string;
    keywords: string[];
    specificDate?: string;
    period?: 'today' | 'tomorrow' | 'weekend' | 'week' | 'month';
    startDate?: string;
  } {
    const queryLower = query.toLowerCase();
    const filters: any = { keywords: [] };

    // Detectar categorías
    const categoryMap: { [key: string]: string } = {
      'teatro': 'teatro',
      'concierto': 'concierto', 
      'música': 'concierto',
      'musica': 'concierto',
      'cultural': 'cultural',
      'cultura': 'cultural',
      'deportivo': 'deportivo',
      'deporte': 'deportivo',
      'infantil': 'infantil',
      'niños': 'infantil',
      'niños': 'infantil',
      'gastronómico': 'gastronómico',
      'gastronomico': 'gastronómico',
      'comida': 'gastronómico',
      'festivo': 'festivo',
      'fiesta': 'festivo',
      'religioso': 'religioso',
      'municipal': 'municipal'
    };

    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (queryLower.includes(keyword)) {
        filters.category = category;
        break;
      }
    }

    // Detectar períodos temporales
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (queryLower.includes('hoy')) {
      filters.period = 'today';
      filters.specificDate = today.toISOString().split('T')[0];
    } else if (queryLower.includes('mañana')) {
      filters.period = 'tomorrow';
      filters.specificDate = tomorrow.toISOString().split('T')[0];
    } else if (queryLower.includes('fin de semana') || queryLower.includes('finde')) {
      filters.period = 'weekend';
    } else if (queryLower.includes('esta semana') || queryLower.includes('semana')) {
      filters.period = 'week';
    } else if (queryLower.includes('este mes') || queryLower.includes('mes')) {
      filters.period = 'month';
    }

    // Extraer palabras clave generales
    const stopWords = ['el', 'la', 'de', 'en', 'y', 'a', 'que', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las', 'un', 'una', 'sobre', 'todo', 'también', 'tras', 'otro', 'algún', 'alguna', 'hasta', 'dos', 'me', 'mi', 'sin', 'ni', 'ya', 'desde', 'durante', 'cada', 'tiene', 'tengo', 'esta', 'este', 'estos', 'estas'];
    
    const words = queryLower
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));

    filters.keywords = words;

    return filters;
  }

  /**
   * Filtrar eventos por palabras clave
   */
  private filterEventsByKeywords(events: ProcessedEvent[], keywords: string[]): ProcessedEvent[] {
    if (keywords.length === 0) return events;

    return events.filter(event => {
      const searchText = `${event.title} ${event.description} ${event.location} ${event.tags.join(' ')}`.toLowerCase();
      
      return keywords.some(keyword => searchText.includes(keyword));
    });
  }

  /**
   * Filtrar eventos por período
   */
  private filterEventsByPeriod(events: ProcessedEvent[], period: string): ProcessedEvent[] {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (period) {
      case 'weekend':
        // Próximo fin de semana
        const nextSaturday = new Date(today);
        const daysUntilSaturday = (6 - today.getDay()) % 7;
        nextSaturday.setDate(today.getDate() + daysUntilSaturday);
        const nextSunday = new Date(nextSaturday);
        nextSunday.setDate(nextSaturday.getDate() + 1);
        
        const saturdayStr = nextSaturday.toISOString().split('T')[0];
        const sundayStr = nextSunday.toISOString().split('T')[0];
        
        return events.filter(event => 
          event.date === saturdayStr || event.date === sundayStr
        );

      case 'week':
        // Esta semana
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
        const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
        
        return events.filter(event => 
          event.date >= todayStr && event.date <= endOfWeekStr
        );

      case 'month':
        // Este mes
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const endOfMonthStr = endOfMonth.toISOString().split('T')[0];
        
        return events.filter(event => 
          event.date >= todayStr && event.date <= endOfMonthStr
        );

      default:
        return events;
    }
  }

  /**
   * Generar respuesta de IA usando eventos de Firestore
   */
  private async generateAIResponse(
    query: string, 
    events: ProcessedEvent[], 
    cityName: string
  ): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const eventsContext = events.map(event => `
📅 **${event.title}**
- Fecha: ${this.formatDate(event.date)}${event.endDate ? ` - ${this.formatDate(event.endDate)}` : ''}
- Hora: ${event.time || 'Por confirmar'}
- Lugar: ${event.location || 'Ubicación por confirmar'}
- Categoría: ${event.category || 'General'}
- Descripción: ${event.description || 'Sin descripción disponible'}
${event.eventDetailUrl ? `- Más info: ${event.eventDetailUrl}` : ''}
${event.tags.length > 0 ? `- Tags: ${event.tags.join(', ')}` : ''}
`).join('\n');

      const systemPrompt = `Eres WeAreCity, el asistente inteligente de ${cityName}.

CONTEXTO: El usuario pregunta sobre eventos y tienes acceso a información actualizada de eventos extraída de las webs oficiales y almacenada en la base de datos.

EVENTOS DISPONIBLES:
${eventsContext}

INSTRUCCIONES:
1. **Respuesta Conversacional**: Escribe 2-3 párrafos introductorios sobre los eventos encontrados
2. **Tono**: Amigable, entusiasta y profesional
3. **Información**: Destaca los eventos más relevantes para la consulta del usuario
4. **Contextualización**: Menciona que esta información está actualizada desde las webs oficiales
5. **NO incluyas JSON**: Los eventos se mostrarán automáticamente como cards después de tu respuesta

CONSULTA DEL USUARIO: "${query}"

Responde SOLO con texto conversacional, SIN incluir ningún JSON ni marcadores especiales.`;

      const result = await model.generateContent(systemPrompt);
      const responseText = result.response.text();
      
      return responseText.trim();

    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      return this.generateFallbackResponse(events, cityName);
    }
  }

  /**
   * Generar respuesta cuando no hay eventos
   */
  private generateNoEventsResponse(cityName: string): string {
    return `🎪 **Eventos en ${cityName}**

Actualmente no tengo información sobre eventos específicos que coincidan con tu consulta en ${cityName}. 

Esto puede deberse a que:
- No hay eventos programados para las fechas consultadas
- Los eventos aún no se han publicado en las webs oficiales
- La información está siendo actualizada

Te recomiendo:
• Consultar directamente la web oficial del ayuntamiento
• Preguntar por eventos en fechas específicas
• Intentar con términos más generales como "eventos esta semana"

¡La información de eventos se actualiza diariamente desde las fuentes oficiales!`;
  }

  /**
   * Respuesta de fallback si falla la IA
   */
  private generateFallbackResponse(events: ProcessedEvent[], cityName: string): string {
    const eventsCount = events.length;
    const firstEvent = events[0];
    
    return `🎪 **Eventos en ${cityName}**

Encontré ${eventsCount} evento${eventsCount > 1 ? 's' : ''} que podrían interesarte en ${cityName}.

${eventsCount > 0 ? `El próximo evento destacado es "${firstEvent.title}" programado para el ${this.formatDate(firstEvent.date)}.` : ''}

Aquí tienes todos los detalles de los eventos disponibles. La información está actualizada desde las webs oficiales del ayuntamiento.`;
  }

  /**
   * Formatear fecha para mostrar
   */
  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }
}

// Instancia singleton
export const eventsAIService = new EventsAIService();
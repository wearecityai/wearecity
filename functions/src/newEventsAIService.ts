/**
 * Nuevo servicio AI para eventos con estructura cities/{cityId}/events
 * Y formato EventCard integrado
 */

import { firestore } from 'firebase-admin';

interface EventsAIResponse {
  success: boolean;
  totalEvents: number;
  events: EventCard[];
  text: string;
  filters: {
    category?: string;
    dateRange?: { start: string; end: string };
    keywords?: string[];
  };
}

interface EventCard {
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  category: string;
  url?: string;
  imageUrl?: string;
  price?: string;
  organizer?: string;
}

interface EventDocument {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  category: string;
  eventCard: EventCard;
  tags: string[];
  isActive: boolean;
  citySlug: string;
  cityName: string;
  eventDetailUrl?: string;
}

export class NewEventsAIService {
  private db: firestore.Firestore;

  constructor(db: firestore.Firestore) {
    this.db = db;
  }

  /**
   * Encontrar el ID real de la ciudad
   */
  private async findRealCityId(citySlug: string, cityName: string): Promise<string | null> {
    try {
      const citiesSnapshot = await this.db.collection('cities').get();
      
      for (const cityDoc of citiesSnapshot.docs) {
        const cityData = cityDoc.data();
        const cityId = cityDoc.id;
        
        // Buscar por múltiples criterios
        const nameMatch = cityData.name?.toLowerCase().includes(cityName.toLowerCase()) ||
                          cityName.toLowerCase().includes(cityData.name?.toLowerCase() || '');
        
        const slugMatch = cityData.slug?.toLowerCase() === citySlug.toLowerCase() ||
                          cityData.slug?.toLowerCase().includes(citySlug.toLowerCase()) ||
                          citySlug.toLowerCase().includes(cityData.slug?.toLowerCase() || '');
        
        if (nameMatch || slugMatch) {
          console.log(`✅ Found real city for AI query: ${cityData.name} (${cityId})`);
          return cityId;
        }
      }
      
      console.log(`❌ No real city found for AI query: ${cityName} (${citySlug})`);
      return null;
      
    } catch (error) {
      console.error('❌ Error finding real city ID for AI:', error);
      return null;
    }
  }

  /**
   * Procesar consulta de eventos usando la nueva estructura
   */
  async processEventsQuery(
    query: string, 
    citySlug: string, 
    cityName: string, 
    limit: number = 15
  ): Promise<EventsAIResponse> {
    try {
      console.log(`🎭 New Events AI: Processing query "${query}" for ${cityName}`);

      // 🔧 NUEVO: Encontrar ID real de la ciudad
      const realCityId = await this.findRealCityId(citySlug, cityName);
      
      if (!realCityId) {
        return {
          success: false,
          totalEvents: 0,
          events: [],
          text: `No se pudo encontrar la ciudad ${cityName} en la base de datos.`,
          filters: { keywords: [query] }
        };
      }

      console.log(`✅ Using real city ID for AI query: ${realCityId}`);

      // 1. Extraer filtros de la consulta
      const filters = this.extractFilters(query);
      console.log('🔍 Extracted filters:', filters);

      // 2. Construir consulta Firestore MUY SIMPLE (sin filtros)
      // Obtener todos los eventos y filtrar en memoria
      const eventsQuery = this.db
        .collection('cities')
        .doc(realCityId)  // <-- Usar ID real
        .collection('events');

      // 3. Ejecutar consulta simple
      console.log('🔍 Executing simple Firestore query (no filters)...');
      const eventsSnapshot = await eventsQuery.get();
      
      if (eventsSnapshot.empty) {
        console.log('❌ No events collection found');
        return {
          success: true,
          totalEvents: 0,
          events: [],
          text: `No he encontrado eventos en ${cityName}.`,
          filters
        };
      }

      // 4. Procesar todos los eventos
      let events: EventDocument[] = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventDocument[];

      console.log(`📊 Retrieved ${events.length} total events, filtering in memory...`);

      // 5. FILTRAR EN MEMORIA - Eventos activos
      events = events.filter(event => event.isActive === true);
      console.log(`✅ After isActive filter: ${events.length} events`);

      // 6. FILTRAR EN MEMORIA - Eventos del mes actual (no solo futuros)
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = today.substring(0, 7); // '2025-09'
      events = events.filter(event => event.date && event.date.startsWith(currentMonth));
      console.log(`✅ After current month filter (${currentMonth}): ${events.length} events`);

      // 7. FILTRAR EN MEMORIA - Rango de fechas
      if (filters.dateRange?.start) {
        events = events.filter(event => event.date >= filters.dateRange!.start);
        console.log(`✅ After start date filter (>= ${filters.dateRange.start}): ${events.length} events`);
      }
      if (filters.dateRange?.end) {
        events = events.filter(event => event.date <= filters.dateRange!.end);
        console.log(`✅ After end date filter (<= ${filters.dateRange.end}): ${events.length} events`);
      }

      // 8. FILTRAR EN MEMORIA - Categoría
      if (filters.category) {
        events = events.filter(event => event.category === filters.category);
        console.log(`✅ After category filter (${filters.category}): ${events.length} events`);
      }

      // 9. FILTRAR EN MEMORIA - Palabras clave
      if (filters.keywords && filters.keywords.length > 0) {
        events = events.filter(event => {
          const searchText = `${event.title} ${event.description} ${event.tags?.join(' ')}`.toLowerCase();
          return filters.keywords!.some(keyword => 
            searchText.includes(keyword.toLowerCase())
          );
        });
        console.log(`✅ After keywords filter: ${events.length} events`);
      }

      // 10. ORDENAR por fecha
      events.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

      // 11. LIMITAR resultados
      events = events.slice(0, limit);
      console.log(`✅ Final result: ${events.length} events after limit ${limit}`);

      if (events.length === 0) {
        return {
          success: true,
          totalEvents: 0,
          events: [],
          text: `No he encontrado eventos que coincidan con tu búsqueda en ${cityName}.`,
          filters
        };
      }

      // 7. Generar respuesta AI
      const responseText = this.generateAIResponse(events, cityName, query, filters);

      // 8. Convertir a EventCards - usar directamente el campo eventCard
      const eventCards: EventCard[] = events.map(event => event.eventCard);

      return {
        success: true,
        totalEvents: eventCards.length,
        events: eventCards,
        text: responseText,
        filters
      };

    } catch (error) {
      console.error('❌ New Events AI: Error processing query:', error);
      
      return {
        success: false,
        totalEvents: 0,
        events: [],
        text: `Lo siento, hubo un problema al buscar eventos en ${cityName}. Por favor, inténtalo de nuevo.`,
        filters: { keywords: [query] }
      };
    }
  }

  /**
   * Extraer filtros de la consulta de usuario
   */
  private extractFilters(query: string): {
    category?: string;
    dateRange?: { start: string; end: string };
    keywords?: string[];
  } {
    const queryLower = query.toLowerCase();
    const filters: any = {};

    // Detectar categorías
    const categoryMap: {[key: string]: string} = {
      'concierto': 'concierto',
      'música': 'concierto',
      'musical': 'concierto',
      'teatro': 'teatro',
      'obra': 'teatro',
      'danza': 'danza',
      'baile': 'danza',
      'cine': 'cine',
      'película': 'cine',
      'exposición': 'exposicion',
      'museo': 'exposicion',
      'festival': 'festival',
      'fiesta': 'festival',
      'deporte': 'deporte',
      'cultural': 'cultural',
      'cultura': 'cultural'
    };

    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (queryLower.includes(keyword)) {
        filters.category = category;
        break;
      }
    }

    // Detectar rangos de fecha
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (queryLower.includes('hoy')) {
      filters.dateRange = { start: todayStr, end: todayStr };
    } else if (queryLower.includes('mañana')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      filters.dateRange = { start: tomorrowStr, end: tomorrowStr };
    } else if (queryLower.includes('esta semana')) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      filters.dateRange = { start: todayStr, end: weekEnd.toISOString().split('T')[0] };
    } else if (queryLower.includes('este mes')) {
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      filters.dateRange = { start: todayStr, end: monthEnd.toISOString().split('T')[0] };
    } else if (queryLower.includes('fin de semana')) {
      // Encontrar próximo fin de semana
      const dayOfWeek = today.getDay();
      const daysToSaturday = (6 - dayOfWeek) % 7;
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + daysToSaturday);
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      
      filters.dateRange = { 
        start: saturday.toISOString().split('T')[0], 
        end: sunday.toISOString().split('T')[0] 
      };
    }

    // Extraer palabras clave (eliminar palabras vacías comunes)
    const stopWords = ['qué', 'que', 'hay', 'eventos', 'en', 'la', 'el', 'de', 'para', 'con', 'un', 'una', 'me', 'recomiendas', 'recomiendan', 'hacer', 'ver'];
    const words = queryLower.split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .filter(word => !Object.keys(categoryMap).includes(word)); // Excluir palabras de categoría

    if (words.length > 0) {
      filters.keywords = words;
    }

    return filters;
  }

  /**
   * Generar respuesta AI contextual
   */
  private generateAIResponse(
    events: EventDocument[], 
    cityName: string, 
    originalQuery: string,
    filters: any
  ): string {
    if (events.length === 0) {
      return `No he encontrado eventos que coincidan con "${originalQuery}" en ${cityName}.`;
    }

    let response = '';

    // Introducción personalizada basada en filtros
    if (filters.category) {
      const categoryNames: {[key: string]: string} = {
        'concierto': 'conciertos y eventos musicales',
        'teatro': 'obras de teatro',
        'danza': 'espectáculos de danza',
        'cine': 'proyecciones de cine',
        'exposicion': 'exposiciones',
        'festival': 'festivales',
        'cultural': 'eventos culturales',
        'deporte': 'eventos deportivos'
      };
      
      response = `🎭 **${categoryNames[filters.category] || 'Eventos'} en ${cityName}**\n\n`;
      response += `He encontrado ${events.length} ${categoryNames[filters.category] || 'eventos'} que podrían interesarte en ${cityName}.\n\n`;
    } else {
      response = `🎪 **Eventos en ${cityName}**\n\n`;
      response += `He encontrado ${events.length} eventos interesantes en ${cityName}. `;
      response += `La ciudad ofrece una programación cultural variada que combina tradición con propuestas modernas.\n\n`;
    }

    // Información sobre la fuente
    response += `Estos eventos están extraídos de las fuentes oficiales y se actualizan diariamente para ofrecerte la información más precisa.\n\n`;

    // Estadísticas rápidas
    const categories = [...new Set(events.map(e => e.category))];
    if (categories.length > 1) {
      const categoryCount: {[key: string]: number} = {};
      events.forEach(e => {
        categoryCount[e.category] = (categoryCount[e.category] || 0) + 1;
      });
      
      const categoryStats = Object.entries(categoryCount)
        .map(([cat, count]) => `${count} de ${cat}`)
        .join(', ');
      
      response += `La selección incluye: ${categoryStats}.\n\n`;
    }

    // Destacar eventos próximos
    const upcomingEvents = events.filter(e => {
      const eventDate = new Date(e.date);
      const inThreeDays = new Date();
      inThreeDays.setDate(inThreeDays.getDate() + 3);
      return eventDate <= inThreeDays;
    });

    if (upcomingEvents.length > 0) {
      response += `📅 **Próximos eventos destacados:**\n`;
      upcomingEvents.slice(0, 2).forEach(event => {
        response += `• **${event.title}** - ${event.eventCard.date}\n`;
      });
      response += '\n';
    }

    return response.trim();
  }

  /**
   * Obtener estadísticas de eventos de una ciudad
   */
  async getCityEventsStats(citySlug: string): Promise<any> {
    try {
      // 🔧 NUEVO: Encontrar ID real de la ciudad
      const realCityId = await this.findRealCityId(citySlug, citySlug);
      
      if (!realCityId) {
        console.error(`Cannot find real city for stats: ${citySlug}`);
        return null;
      }

      const eventsRef = this.db.collection('cities').doc(realCityId).collection('events');
      
      const [totalEvents, activeEvents, futureEvents] = await Promise.all([
        eventsRef.get().then(s => s.size),
        eventsRef.where('isActive', '==', true).get().then(s => s.size),
        eventsRef.where('date', '>=', new Date().toISOString().split('T')[0]).get().then(s => s.size)
      ]);
      
      // Estadísticas por categoría
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
        citySlug,
        totalEvents,
        activeEvents,
        futureEvents,
        categoriesCount,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error getting city events stats:', error);
      return null;
    }
  }
}
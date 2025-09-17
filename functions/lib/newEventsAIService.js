"use strict";
/**
 * Nuevo servicio AI para eventos con estructura cities/{cityId}/events
 * Y formato EventCard integrado
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewEventsAIService = void 0;
class NewEventsAIService {
    constructor(db) {
        this.db = db;
    }
    /**
     * Procesar consulta de eventos usando la nueva estructura
     */
    async processEventsQuery(query, citySlug, cityName, limit = 15) {
        var _a, _b;
        try {
            console.log(`🎭 New Events AI: Processing query "${query}" for ${cityName}`);
            // 1. Extraer filtros de la consulta
            const filters = this.extractFilters(query);
            console.log('🔍 Extracted filters:', filters);
            // 2. Construir consulta Firestore usando nueva estructura
            let eventsQuery = this.db
                .collection('cities')
                .doc(citySlug)
                .collection('events')
                .where('isActive', '==', true)
                .where('date', '>=', new Date().toISOString().split('T')[0])
                .orderBy('date', 'asc')
                .limit(limit);
            // 3. Aplicar filtros
            if (filters.category) {
                eventsQuery = eventsQuery.where('category', '==', filters.category);
            }
            if ((_a = filters.dateRange) === null || _a === void 0 ? void 0 : _a.start) {
                eventsQuery = eventsQuery.where('date', '>=', filters.dateRange.start);
            }
            if ((_b = filters.dateRange) === null || _b === void 0 ? void 0 : _b.end) {
                eventsQuery = eventsQuery.where('date', '<=', filters.dateRange.end);
            }
            // 4. Ejecutar consulta
            const eventsSnapshot = await eventsQuery.get();
            if (eventsSnapshot.empty) {
                return {
                    success: true,
                    totalEvents: 0,
                    events: [],
                    text: `No he encontrado eventos que coincidan con tu búsqueda en ${cityName}.`,
                    filters
                };
            }
            // 5. Procesar eventos encontrados
            let events = eventsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
            // 6. Filtrar por palabras clave si es necesario (filtro en memoria)
            if (filters.keywords && filters.keywords.length > 0) {
                events = events.filter(event => {
                    var _a;
                    const searchText = `${event.title} ${event.description} ${(_a = event.tags) === null || _a === void 0 ? void 0 : _a.join(' ')}`.toLowerCase();
                    return filters.keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
                });
            }
            // 7. Generar respuesta AI
            const responseText = this.generateAIResponse(events, cityName, query, filters);
            // 8. Convertir a EventCards - usar directamente el campo eventCard
            const eventCards = events.map(event => event.eventCard);
            return {
                success: true,
                totalEvents: eventCards.length,
                events: eventCards,
                text: responseText,
                filters
            };
        }
        catch (error) {
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
    extractFilters(query) {
        const queryLower = query.toLowerCase();
        const filters = {};
        // Detectar categorías
        const categoryMap = {
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
        }
        else if (queryLower.includes('mañana')) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            filters.dateRange = { start: tomorrowStr, end: tomorrowStr };
        }
        else if (queryLower.includes('esta semana')) {
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            filters.dateRange = { start: todayStr, end: weekEnd.toISOString().split('T')[0] };
        }
        else if (queryLower.includes('este mes')) {
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            filters.dateRange = { start: todayStr, end: monthEnd.toISOString().split('T')[0] };
        }
        else if (queryLower.includes('fin de semana')) {
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
    generateAIResponse(events, cityName, originalQuery, filters) {
        if (events.length === 0) {
            return `No he encontrado eventos que coincidan con "${originalQuery}" en ${cityName}.`;
        }
        let response = '';
        // Introducción personalizada basada en filtros
        if (filters.category) {
            const categoryNames = {
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
        }
        else {
            response = `🎪 **Eventos en ${cityName}**\n\n`;
            response += `He encontrado ${events.length} eventos interesantes en ${cityName}. `;
            response += `La ciudad ofrece una programación cultural variada que combina tradición con propuestas modernas.\n\n`;
        }
        // Información sobre la fuente
        response += `Estos eventos están extraídos de las fuentes oficiales y se actualizan diariamente para ofrecerte la información más precisa.\n\n`;
        // Estadísticas rápidas
        const categories = [...new Set(events.map(e => e.category))];
        if (categories.length > 1) {
            const categoryCount = {};
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
    async getCityEventsStats(citySlug) {
        try {
            const eventsRef = this.db.collection('cities').doc(citySlug).collection('events');
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
            const categoriesCount = {};
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
        }
        catch (error) {
            console.error('Error getting city events stats:', error);
            return null;
        }
    }
}
exports.NewEventsAIService = NewEventsAIService;
//# sourceMappingURL=newEventsAIService.js.map
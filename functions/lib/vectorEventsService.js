"use strict";
/**
 * Vector-powered Events Search Service using Firestore Vector Search Extension
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorEventsService = void 0;
class VectorEventsService {
    constructor(db) {
        this.db = db;
    }
    /**
     * Encontrar el ID real de la ciudad
     */
    async findRealCityId(citySlug, cityName) {
        try {
            const citiesSnapshot = await this.db.collection('cities').get();
            for (const cityDoc of citiesSnapshot.docs) {
                const cityData = cityDoc.data();
                const cityId = cityDoc.id;
                const nameMatch = cityData.name?.toLowerCase().includes(cityName.toLowerCase()) ||
                    cityName.toLowerCase().includes(cityData.name?.toLowerCase() || '');
                const slugMatch = cityData.slug?.toLowerCase() === citySlug.toLowerCase() ||
                    cityData.slug?.toLowerCase().includes(citySlug.toLowerCase()) ||
                    citySlug.toLowerCase().includes(cityData.slug?.toLowerCase() || '');
                if (nameMatch || slugMatch) {
                    console.log(`✅ Vector Events: Found real city: ${cityData.name} (${cityId})`);
                    return cityId;
                }
            }
            console.log(`❌ Vector Events: No real city found for: ${cityName} (${citySlug})`);
            return null;
        }
        catch (error) {
            console.error('❌ Vector Events: Error finding real city ID:', error);
            return null;
        }
    }
    /**
     * Búsqueda vectorial de eventos usando la extensión
     */
    async searchEventsWithVector(query, citySlug, cityName, limit = 10) {
        try {
            console.log(`🔍 Vector Events: Searching for "${query}" in ${cityName}`);
            // 1. Encontrar ID real de la ciudad
            const realCityId = await this.findRealCityId(citySlug, cityName);
            if (!realCityId) {
                return {
                    success: false,
                    totalEvents: 0,
                    events: [],
                    text: `No se pudo encontrar la ciudad ${cityName} en la base de datos.`,
                    searchMethod: 'fallback'
                };
            }
            try {
                // 2. Usar la extensión Vector Search
                console.log('🚀 Using Vector Search extension...');
                // La extensión debe estar configurada para la colección de eventos
                // Llamar a la función callable de la extensión
                const vectorSearchFunction = this.db.app.functions().httpsCallable('ext-firestore-vector-search-queryCallable');
                const vectorResult = await vectorSearchFunction({
                    query: query,
                    collection: `cities/${realCityId}/events`,
                    limit: limit,
                    filters: {
                        isActive: true,
                        date: { '>=': new Date().toISOString().split('T')[0] }
                    }
                });
                console.log('📊 Vector search result:', vectorResult.data);
                if (vectorResult.data && vectorResult.data.length > 0) {
                    // Procesar resultados vectoriales
                    const events = vectorResult.data.map((doc) => doc.eventCard || {
                        title: doc.title,
                        date: doc.date,
                        location: doc.location,
                        description: doc.description,
                        category: doc.category,
                        url: doc.eventDetailUrl,
                        price: doc.price
                    });
                    const responseText = this.generateVectorResponse(events, cityName, query);
                    return {
                        success: true,
                        totalEvents: events.length,
                        events: events,
                        text: responseText,
                        searchMethod: 'vector'
                    };
                }
            }
            catch (vectorError) {
                console.error('⚠️ Vector search failed, falling back to traditional search:', vectorError);
            }
            // 3. Fallback a búsqueda tradicional mejorada
            console.log('🔄 Fallback to enhanced traditional search...');
            return await this.enhancedTraditionalSearch(query, realCityId, cityName, limit);
        }
        catch (error) {
            console.error('❌ Vector Events: Error in searchEventsWithVector:', error);
            return {
                success: false,
                totalEvents: 0,
                events: [],
                text: 'Lo siento, hubo un problema al buscar eventos. Por favor, inténtalo de nuevo.',
                searchMethod: 'fallback'
            };
        }
    }
    /**
     * Búsqueda tradicional mejorada (sin filtros restrictivos)
     */
    async enhancedTraditionalSearch(query, realCityId, cityName, limit) {
        try {
            console.log('🔍 Enhanced traditional search...');
            // Búsqueda simple - solo obtener todos los eventos activos
            const eventsSnapshot = await this.db
                .collection('cities')
                .doc(realCityId)
                .collection('events')
                .where('isActive', '==', true)
                .get();
            if (eventsSnapshot.empty) {
                return {
                    success: true,
                    totalEvents: 0,
                    events: [],
                    text: `No he encontrado eventos activos en ${cityName}.`,
                    searchMethod: 'fallback'
                };
            }
            let events = eventsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`📊 Retrieved ${events.length} events for enhanced search`);
            // Filtrado inteligente por relevancia
            const scoredEvents = events.map(event => {
                let score = 0;
                const queryLower = query.toLowerCase();
                const searchableText = `${event.title} ${event.description} ${event.category}`.toLowerCase();
                // Puntuación por coincidencias en título (más importante)
                if (event.title.toLowerCase().includes(queryLower))
                    score += 10;
                // Puntuación por coincidencias en descripción
                if (event.description?.toLowerCase().includes(queryLower))
                    score += 5;
                // Puntuación por categoría
                if (event.category?.toLowerCase().includes(queryLower))
                    score += 8;
                // Palabras clave específicas
                const keywords = queryLower.split(' ').filter(word => word.length > 2);
                keywords.forEach(keyword => {
                    if (searchableText.includes(keyword))
                        score += 3;
                });
                // Bonificación por eventos próximos
                const eventDate = new Date(event.date);
                const daysFromNow = (eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                if (daysFromNow <= 7)
                    score += 2; // Eventos esta semana
                if (daysFromNow <= 3)
                    score += 1; // Eventos próximos
                return { ...event, relevanceScore: score };
            });
            // Ordenar por relevancia y tomar los mejores
            const relevantEvents = scoredEvents
                .filter(event => event.relevanceScore > 0)
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, limit);
            console.log(`🎯 Found ${relevantEvents.length} relevant events`);
            if (relevantEvents.length === 0) {
                // Si no hay eventos relevantes, mostrar los próximos eventos en general
                const upcomingEvents = events.slice(0, Math.min(5, limit));
                const eventCards = upcomingEvents.map(event => event.eventCard);
                return {
                    success: true,
                    totalEvents: upcomingEvents.length,
                    events: eventCards,
                    text: `No encontré eventos específicos para "${query}", pero aquí tienes los próximos eventos en ${cityName}:`,
                    searchMethod: 'fallback'
                };
            }
            // Convertir a EventCards
            const eventCards = relevantEvents.map(event => event.eventCard);
            const responseText = this.generateVectorResponse(eventCards, cityName, query);
            return {
                success: true,
                totalEvents: relevantEvents.length,
                events: eventCards,
                text: responseText,
                searchMethod: 'fallback',
                filters: { enhanced: true, relevanceScoring: true }
            };
        }
        catch (error) {
            console.error('❌ Enhanced traditional search failed:', error);
            throw error;
        }
    }
    /**
     * Generar respuesta contextual
     */
    generateVectorResponse(events, cityName, query) {
        if (events.length === 0) {
            return `No he encontrado eventos que coincidan con "${query}" en ${cityName}.`;
        }
        let response = `🎪 **Eventos en ${cityName}**\n\n`;
        if (events.length === 1) {
            response += `He encontrado un evento que coincide con tu búsqueda de "${query}":\n\n`;
        }
        else {
            response += `He encontrado ${events.length} eventos que coinciden con tu búsqueda de "${query}":\n\n`;
        }
        // Agregar información sobre categorías
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
                response += `• **${event.title}** - ${event.date}\n`;
            });
            response += '\n';
        }
        response += `Estos eventos están extraídos de las fuentes oficiales y se actualizan diariamente.`;
        return response.trim();
    }
}
exports.VectorEventsService = VectorEventsService;
//# sourceMappingURL=vectorEventsService.js.map
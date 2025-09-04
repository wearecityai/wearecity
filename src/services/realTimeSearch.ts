/**
 * Servicio integrado para búsquedas en tiempo real
 * Combina Google Places y Google Search para proporcionar información completa
 */

import { googlePlacesService, PlaceResult } from './googlePlaces';
import { googleSearchService, SearchResult } from './googleSearch';

export interface RealTimeSearchRequest {
  query: string;
  city: string;
  location?: { lat: number; lng: number };
  searchType: 'places' | 'events' | 'info' | 'all';
  maxResults?: number;
}

export interface RealTimeSearchResponse {
  places?: PlaceResult[];
  searchResults?: SearchResult[];
  events?: SearchResult[];
  info?: SearchResult[];
  timestamp: string;
  city: string;
  query: string;
}

export interface SearchContext {
  city: string;
  location?: { lat: number; lng: number };
  userType?: 'tourist' | 'resident';
  interests?: string[];
  urgency?: 'low' | 'medium' | 'high';
}

export class RealTimeSearchService {
  private static instance: RealTimeSearchService;

  private constructor() {}

  public static getInstance(): RealTimeSearchService {
    if (!RealTimeSearchService.instance) {
      RealTimeSearchService.instance = new RealTimeSearchService();
    }
    return RealTimeSearchService.instance;
  }

  /**
   * Búsqueda inteligente que determina automáticamente qué servicios usar
   */
  async intelligentSearch(
    query: string, 
    context: SearchContext
  ): Promise<RealTimeSearchResponse> {
    const { city, location, userType = 'resident' } = context;
    
    // Analizar la consulta para determinar qué buscar
    const searchIntents = this.analyzeQuery(query);
    
    const response: RealTimeSearchResponse = {
      timestamp: new Date().toISOString(),
      city,
      query
    };

    try {
      // Búsquedas paralelas según las intenciones detectadas
      const searchPromises: Promise<any>[] = [];

      // Buscar lugares si se detecta intención de lugares
      if (searchIntents.has('places') && location) {
        searchPromises.push(
          this.searchPlaces(query, city, location, userType)
            .then(places => { response.places = places; })
            .catch(error => console.warn('Error searching places:', error))
        );
      }

      // Buscar eventos si se detecta intención de eventos
      if (searchIntents.has('events')) {
        searchPromises.push(
          this.searchEvents(query, city)
            .then(events => { response.events = events; })
            .catch(error => console.warn('Error searching events:', error))
        );
      }

      // Buscar información general si se detecta intención de información
      if (searchIntents.has('info')) {
        searchPromises.push(
          this.searchGeneralInfo(query, city)
            .then(info => { response.info = info; })
            .catch(error => console.warn('Error searching info:', error))
        );
      }

      // Si no se detectó intención específica, hacer búsqueda general
      if (searchIntents.size === 0) {
        searchPromises.push(
          this.searchGeneralInfo(query, city)
            .then(info => { response.info = info; })
            .catch(error => console.warn('Error searching general info:', error))
        );
      }

      // Esperar a que todas las búsquedas terminen
      await Promise.allSettled(searchPromises);

      return response;
    } catch (error) {
      console.error('Error in intelligent search:', error);
      throw new Error(`Error en búsqueda inteligente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Buscar lugares específicos
   */
  async searchPlaces(
    query: string, 
    city: string, 
    location: { lat: number; lng: number },
    userType: 'tourist' | 'resident' = 'resident'
  ): Promise<PlaceResult[]> {
    if (!googlePlacesService.isAvailable()) {
      console.warn('Google Places service not available');
      return [];
    }

    try {
      // Determinar el tipo de búsqueda según la consulta
      const placeType = this.determinePlaceType(query);
      
      if (placeType) {
        return await googlePlacesService.searchByCategory(placeType, location);
      } else {
        // Búsqueda general de lugares
        const response = await googlePlacesService.searchPlaces({
          query: `${query} ${city}`,
          location,
          radius: userType === 'tourist' ? 5000 : 3000,
          maxResults: 10
        });
        return response.results || [];
      }
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  /**
   * Buscar eventos
   */
  async searchEvents(query: string, city: string): Promise<SearchResult[]> {
    if (!googleSearchService.isAvailable()) {
      console.warn('Google Search service not available');
      return [];
    }

    try {
      return await googleSearchService.searchEvents(city, 'week');
    } catch (error) {
      console.error('Error searching events:', error);
      return [];
    }
  }

  /**
   * Buscar información general
   */
  async searchGeneralInfo(query: string, city: string): Promise<SearchResult[]> {
    if (!googleSearchService.isAvailable()) {
      console.warn('Google Search service not available');
      return [];
    }

    try {
      return await googleSearchService.searchCurrentInfo(query, city);
    } catch (error) {
      console.error('Error searching general info:', error);
      return [];
    }
  }

  /**
   * Buscar información específica por categoría
   */
  async searchByCategory(
    category: 'restaurants' | 'monuments' | 'institutions' | 'transport' | 'emergency' | 'culture' | 'procedures',
    city: string,
    location?: { lat: number; lng: number }
  ): Promise<RealTimeSearchResponse> {
    const response: RealTimeSearchResponse = {
      timestamp: new Date().toISOString(),
      city,
      query: category
    };

    try {
      switch (category) {
        case 'restaurants':
          if (location) {
            response.places = await googlePlacesService.searchRestaurants(location);
          }
          response.searchResults = await googleSearchService.searchRestaurantInfo(city);
          break;

        case 'monuments':
          if (location) {
            response.places = await googlePlacesService.searchMonuments(location);
          }
          response.searchResults = await googleSearchService.searchTouristInfo(city, 'monumentos');
          break;

        case 'institutions':
          if (location) {
            response.places = await googlePlacesService.searchInstitutions(location);
          }
          response.searchResults = await googleSearchService.searchOfficialInfo('instituciones públicas', city);
          break;

        case 'transport':
          if (location) {
            response.places = await googlePlacesService.searchTransportStations(location);
          }
          response.searchResults = await googleSearchService.searchTransportInfo(city);
          break;

        case 'emergency':
          if (location) {
            response.places = await googlePlacesService.searchHospitals(location);
            const pharmacies = await googlePlacesService.searchPharmacies(location);
            response.places = [...(response.places || []), ...pharmacies];
          }
          response.searchResults = await googleSearchService.searchEmergencyInfo(city);
          break;

        case 'culture':
          response.events = await googleSearchService.searchEvents(city);
          response.searchResults = await googleSearchService.searchCultureInfo(city);
          break;

        case 'procedures':
          response.searchResults = await googleSearchService.searchMunicipalProcedures(city);
          break;
      }

      return response;
    } catch (error) {
      console.error(`Error searching by category ${category}:`, error);
      throw new Error(`Error al buscar información de ${category}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Analizar la consulta para determinar las intenciones de búsqueda
   */
  private analyzeQuery(query: string): Set<string> {
    const intents = new Set<string>();
    const lowerQuery = query.toLowerCase();

    // Palabras clave para lugares
    const placeKeywords = [
      'restaurante', 'comida', 'cena', 'almuerzo', 'desayuno',
      'monumento', 'museo', 'iglesia', 'castillo', 'plaza', 'parque',
      'ayuntamiento', 'institucion', 'oficina', 'gobierno',
      'farmacia', 'hospital', 'centro salud', 'medico',
      'metro', 'bus', 'estacion', 'transporte', 'parada'
    ];

    // Palabras clave para eventos
    const eventKeywords = [
      'evento', 'actividad', 'concierto', 'festival', 'feria',
      'exposicion', 'teatro', 'cine', 'agenda', 'programa',
      'hoy', 'mañana', 'esta semana', 'fin de semana'
    ];

    // Palabras clave para información
    const infoKeywords = [
      'como', 'donde', 'cuando', 'que', 'por que',
      'tramite', 'proceso', 'requisito', 'documento',
      'horario', 'precio', 'tarifa', 'contacto',
      'telefono', 'direccion', 'web', 'pagina'
    ];

    // Detectar intenciones
    if (placeKeywords.some(keyword => lowerQuery.includes(keyword))) {
      intents.add('places');
    }

    if (eventKeywords.some(keyword => lowerQuery.includes(keyword))) {
      intents.add('events');
    }

    if (infoKeywords.some(keyword => lowerQuery.includes(keyword))) {
      intents.add('info');
    }

    return intents;
  }

  /**
   * Determinar el tipo de lugar según la consulta
   */
  private determinePlaceType(query: string): 'restaurants' | 'monuments' | 'institutions' | 'public_places' | 'pharmacies' | 'hospitals' | 'transport' | null {
    const lowerQuery = query.toLowerCase();

    if (['restaurante', 'comida', 'cena', 'almuerzo', 'desayuno'].some(word => lowerQuery.includes(word))) {
      return 'restaurants';
    }

    if (['monumento', 'museo', 'iglesia', 'castillo', 'turismo'].some(word => lowerQuery.includes(word))) {
      return 'monuments';
    }

    if (['ayuntamiento', 'institucion', 'oficina', 'gobierno'].some(word => lowerQuery.includes(word))) {
      return 'institutions';
    }

    if (['parque', 'plaza', 'espacio publico'].some(word => lowerQuery.includes(word))) {
      return 'public_places';
    }

    if (['farmacia', 'medicina', 'medicamento'].some(word => lowerQuery.includes(word))) {
      return 'pharmacies';
    }

    if (['hospital', 'centro salud', 'medico', 'urgencias'].some(word => lowerQuery.includes(word))) {
      return 'hospitals';
    }

    if (['metro', 'bus', 'estacion', 'transporte', 'parada'].some(word => lowerQuery.includes(word))) {
      return 'transport';
    }

    return null;
  }

  /**
   * Verificar disponibilidad de servicios
   */
  isAvailable(): boolean {
    return googlePlacesService.isAvailable() || googleSearchService.isAvailable();
  }

  /**
   * Obtener información de los servicios disponibles
   */
  getServiceInfo() {
    return {
      name: 'Real Time Search Service',
      provider: 'Google APIs',
      services: {
        places: googlePlacesService.getServiceInfo(),
        search: googleSearchService.getServiceInfo()
      },
      available: this.isAvailable(),
      features: [
        'Búsqueda inteligente automática',
        'Análisis de intenciones de consulta',
        'Búsqueda de lugares en tiempo real',
        'Búsqueda de eventos actuales',
        'Búsqueda de información general',
        'Búsqueda por categorías específicas',
        'Contexto de usuario (turista/residente)',
        'Búsquedas paralelas optimizadas'
      ]
    };
  }
}

// Exportar instancia singleton
export const realTimeSearchService = RealTimeSearchService.getInstance();

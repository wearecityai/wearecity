/**
 * Servicio integrado para búsquedas en tiempo real en Firebase Functions
 * Combina Google Places y Google Search para proporcionar información completa
 */

import { googlePlacesService, PlaceResult } from './googlePlacesService';
import { googleSearchService, SearchResult } from './googleSearchService';

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
      const searchPromises: Promise<void>[] = [];

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
  ): Promise<any[]> {
    if (!googlePlacesService.isAvailable()) {
      console.warn('Google Places service not available');
      return [];
    }

    try {
      // Determinar el tipo de búsqueda según la consulta
      const placeType = this.determinePlaceType(query);
      
      let places: any[] = [];
      
      if (placeType) {
        const results = await googlePlacesService.searchByCategory(placeType, location);
        places = results || [];
      } else {
        // Búsqueda general de lugares - búsqueda MUY específica por ciudad
        const specificQuery = `${query} ${city}, España`;
        const response = await googlePlacesService.searchPlaces({
          query: specificQuery,
          location,
          radius: userType === 'tourist' ? 2000 : 1500, // Radio mucho más pequeño
          maxResults: 10,
          region: 'es' // Forzar región España
        });
        places = response.results || [];
      }

      // 🔍 FILTRAR POR CIUDAD: Solo lugares que realmente estén en la ciudad especificada
      const filteredPlaces = this.filterPlacesByCity(places, city);
      console.log(`🗺️ Places filtered by city "${city}": ${places.length} → ${filteredPlaces.length}`);

      // Convertir a formato PlaceCardInfo y enriquecer con detalles
      return await this.enrichPlacesWithDetails(filteredPlaces, query);
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
            const places = await googlePlacesService.searchRestaurants(location, 1500, city);
            const filteredPlaces = this.filterPlacesByCity(places, city);
            response.places = await this.enrichPlacesWithDetails(filteredPlaces, 'restaurantes');
          }
          response.searchResults = await googleSearchService.searchRestaurantInfo(city);
          break;

        case 'monuments':
          if (location) {
            const places = await googlePlacesService.searchMonuments(location, 2000, city);
            const filteredPlaces = this.filterPlacesByCity(places, city);
            response.places = await this.enrichPlacesWithDetails(filteredPlaces, 'monumentos');
          }
          response.searchResults = await googleSearchService.searchTouristInfo(city, 'monumentos');
          break;

        case 'institutions':
          if (location) {
            const places = await googlePlacesService.searchInstitutions(location, 2000, city);
            const filteredPlaces = this.filterPlacesByCity(places, city);
            response.places = await this.enrichPlacesWithDetails(filteredPlaces, 'instituciones');
          }
          response.searchResults = await googleSearchService.searchOfficialInfo('instituciones públicas', city);
          break;

        case 'transport':
          if (location) {
            const places = await googlePlacesService.searchTransportStations(location, 1500, city);
            const filteredPlaces = this.filterPlacesByCity(places, city);
            response.places = await this.enrichPlacesWithDetails(filteredPlaces, 'transporte');
          }
          response.searchResults = await googleSearchService.searchTransportInfo(city);
          break;

        case 'emergency':
          if (location) {
            const hospitals = await googlePlacesService.searchHospitals(location, 2000, city);
            const pharmacies = await googlePlacesService.searchPharmacies(location, 1500, city);
            const allEmergencyPlaces = [...hospitals, ...pharmacies];
            const filteredPlaces = this.filterPlacesByCity(allEmergencyPlaces, city);
            response.places = await this.enrichPlacesWithDetails(filteredPlaces, 'emergencias');
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
   * Filtrar lugares por ciudad especificada - VERIFICACIÓN EXACTA DE CIUDAD Y CÓDIGO POSTAL
   */
  private filterPlacesByCity(places: any[], restrictedCity: string): any[] {
    if (!restrictedCity || !places) return places;

    const cityName = restrictedCity.toLowerCase().trim();
    
    // Mapeo de ciudades con sus códigos postales específicos
    const cityPostalCodes: { [key: string]: string[] } = {
      'villajoyosa': ['03570'],
      'vila joiosa': ['03570'],
      'la vila joiosa': ['03570'],
      'benidorm': ['03501', '03502', '03503'],
      'alicante': ['03001', '03002', '03003', '03004', '03005', '03006', '03007', '03008', '03009', '03010', '03011', '03012', '03013', '03014', '03015', '03016', '03540'],
      'valencia': ['46001', '46002', '46003', '46004', '46005', '46006', '46007', '46008', '46009', '46010', '46011', '46012', '46013', '46014', '46015', '46016', '46017', '46018', '46019', '46020', '46021', '46022', '46023'],
      'torrevieja': ['03181', '03182', '03183', '03184', '03185'],
      'denia': ['03700'],
      'calpe': ['03710'],
      'altea': ['03590'],
      'javea': ['03730'],
      'xabia': ['03730']
    };

    // Obtener códigos postales de la ciudad restringida
    const restrictedPostalCodes = cityPostalCodes[cityName] || [];
    
    // Crear variaciones exactas del nombre de la ciudad
    const exactCityNames = [
      cityName,
      cityName.replace(/^la\s+/, ''),
      cityName.replace(/^el\s+/, ''),
      cityName.replace(/\s+/g, ''),
      cityName.replace('vila joiosa', 'villajoyosa'),
      cityName.replace('villajoyosa', 'vila joiosa')
    ];
    
    const filteredPlaces = places.filter(place => {
      const fullAddress = (place.formatted_address || place.vicinity || '').toLowerCase();
      const placeName = (place.name || '').toLowerCase();
      
      console.log(`🔍 Checking place: "${place.name}" - Address: "${fullAddress}"`);
      
      // 1. VERIFICACIÓN POR CÓDIGO POSTAL (más preciso)
      if (restrictedPostalCodes.length > 0) {
        const hasValidPostalCode = restrictedPostalCodes.some(postalCode => 
          fullAddress.includes(postalCode)
        );
        
        if (hasValidPostalCode) {
          console.log(`✅ Place ACCEPTED by postal code: "${place.name}" - Found valid postal code`);
          return true;
        }
      }
      
      // 2. VERIFICACIÓN POR NOMBRE EXACTO DE CIUDAD en la dirección
      const cityInAddress = exactCityNames.some(exactName => {
        // Buscar el nombre de la ciudad como palabra completa en la dirección
        const regex = new RegExp(`\\b${exactName}\\b`, 'i');
        return regex.test(fullAddress);
      });
      
      if (!cityInAddress) {
        // 3. VERIFICACIÓN FINAL: Excluir si contiene nombres de otras ciudades conocidas
        const otherKnownCities = Object.keys(cityPostalCodes).filter(c => c !== cityName);
        const hasOtherCity = otherKnownCities.some(otherCity => {
          const regex = new RegExp(`\\b${otherCity}\\b`, 'i');
          return regex.test(fullAddress);
        });
        
        if (hasOtherCity) {
          console.log(`🚫 Place REJECTED: "${place.name}" - Contains other city in address: "${fullAddress}"`);
          return false;
        }
        
        console.log(`🚫 Place REJECTED: "${place.name}" - City not found in address: "${fullAddress}"`);
        return false;
      }
      
      console.log(`✅ Place ACCEPTED by city name: "${place.name}" - City found in address`);
      return true;
    });

    console.log(`🗺️ City filtering results for "${restrictedCity}": ${places.length} → ${filteredPlaces.length}`);
    return filteredPlaces;
  }

  /**
   * Enriquecer lista de lugares con detalles completos
   */
  private async enrichPlacesWithDetails(places: any[], query: string): Promise<any[]> {
    const enrichedPlaces = await Promise.all(
      places.map(async (place) => {
        try {
          // Obtener detalles completos del lugar
          let detailedPlace = place;
          if (place.place_id && !place.opening_hours && !place.reviews) {
            const details = await googlePlacesService.getPlaceDetails(place.place_id);
            if (details) {
              // Combinar datos básicos con detalles completos
              detailedPlace = {
                ...place,
                ...details,
                // Preservar datos originales si son mejores
                rating: details.rating || place.rating,
                user_ratings_total: details.user_ratings_total || place.user_ratings_total,
                photos: details.photos || place.photos,
                opening_hours: details.opening_hours || place.opening_hours,
                website: details.website || place.website,
                reviews: details.reviews || place.reviews,
                price_level: details.price_level || place.price_level,
                international_phone_number: details.international_phone_number || place.international_phone_number
              };
              console.log(`✅ Enriched place with details: ${place.name}`);
            }
          }
          
          return googlePlacesService.convertToPlaceCardInfo(detailedPlace, query);
        } catch (error) {
          console.warn(`⚠️ Failed to get details for place ${place.name}:`, error);
          // Usar datos básicos si falla la obtención de detalles
          return googlePlacesService.convertToPlaceCardInfo(place, query);
        }
      })
    );

    return enrichedPlaces;
  }

  /**
   * Verificar disponibilidad de servicios
   */
  isAvailable(): boolean {
    return googlePlacesService.isAvailable() || googleSearchService.isAvailable();
  }
}

// Exportar instancia singleton
export const realTimeSearchService = RealTimeSearchService.getInstance();

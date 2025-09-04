/**
 * Servicio para interactuar con Google Places API
 * Busca restaurantes, monumentos, instituciones, lugares públicos, etc.
 */

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types: string[];
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  business_status?: string;
  vicinity?: string;
  website?: string;
  international_phone_number?: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

export interface PlacesSearchRequest {
  query: string;
  location?: { lat: number; lng: number };
  radius?: number; // en metros
  type?: string;
  language?: string;
  region?: string;
  maxResults?: number;
}

export interface PlacesSearchResponse {
  results: PlaceResult[];
  status: string;
  next_page_token?: string;
}

export class GooglePlacesService {
  private static instance: GooglePlacesService;
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  private constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ Google Places API key not configured');
    }
  }

  public static getInstance(): GooglePlacesService {
    if (!GooglePlacesService.instance) {
      GooglePlacesService.instance = new GooglePlacesService();
    }
    return GooglePlacesService.instance;
  }

  /**
   * Buscar lugares por texto
   */
  async searchPlaces(request: PlacesSearchRequest): Promise<PlacesSearchResponse> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const params = new URLSearchParams({
      query: request.query,
      key: this.apiKey,
      language: request.language || 'es',
      region: request.region || 'es'
    });

    // Añadir ubicación y radio si están disponibles
    if (request.location) {
      params.append('location', `${request.location.lat},${request.location.lng}`);
      if (request.radius) {
        params.append('radius', request.radius.toString());
      }
    }

    // Añadir tipo si está especificado
    if (request.type) {
      params.append('type', request.type);
    }

    try {
      const response = await fetch(`${this.baseUrl}/textsearch/json?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      // Limitar resultados si se especifica
      if (request.maxResults && data.results) {
        data.results = data.results.slice(0, request.maxResults);
      }

      return data;
    } catch (error) {
      console.error('Error searching places:', error);
      throw new Error(`Error al buscar lugares: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Buscar restaurantes cerca de una ubicación
   */
  async searchRestaurants(location: { lat: number; lng: number }, radius: number = 2000): Promise<PlaceResult[]> {
    const response = await this.searchPlaces({
      query: 'restaurantes',
      location,
      radius,
      type: 'restaurant',
      maxResults: 10
    });

    return response.results || [];
  }

  /**
   * Buscar monumentos y lugares de interés
   */
  async searchMonuments(location: { lat: number; lng: number }, radius: number = 5000): Promise<PlaceResult[]> {
    const response = await this.searchPlaces({
      query: 'monumentos lugares de interés turístico',
      location,
      radius,
      type: 'tourist_attraction',
      maxResults: 15
    });

    return response.results || [];
  }

  /**
   * Buscar instituciones públicas
   */
  async searchInstitutions(location: { lat: number; lng: number }, radius: number = 5000): Promise<PlaceResult[]> {
    const response = await this.searchPlaces({
      query: 'ayuntamiento instituciones públicas gobierno',
      location,
      radius,
      type: 'local_government_office',
      maxResults: 10
    });

    return response.results || [];
  }

  /**
   * Buscar lugares públicos (parques, plazas, etc.)
   */
  async searchPublicPlaces(location: { lat: number; lng: number }, radius: number = 3000): Promise<PlaceResult[]> {
    const response = await this.searchPlaces({
      query: 'parques plazas espacios públicos',
      location,
      radius,
      type: 'park',
      maxResults: 10
    });

    return response.results || [];
  }

  /**
   * Buscar farmacias
   */
  async searchPharmacies(location: { lat: number; lng: number }, radius: number = 2000): Promise<PlaceResult[]> {
    const response = await this.searchPlaces({
      query: 'farmacias',
      location,
      radius,
      type: 'pharmacy',
      maxResults: 10
    });

    return response.results || [];
  }

  /**
   * Buscar hospitales y centros de salud
   */
  async searchHospitals(location: { lat: number; lng: number }, radius: number = 10000): Promise<PlaceResult[]> {
    const response = await this.searchPlaces({
      query: 'hospitales centros de salud',
      location,
      radius,
      type: 'hospital',
      maxResults: 10
    });

    return response.results || [];
  }

  /**
   * Buscar estaciones de transporte
   */
  async searchTransportStations(location: { lat: number; lng: number }, radius: number = 5000): Promise<PlaceResult[]> {
    const response = await this.searchPlaces({
      query: 'estaciones transporte público metro bus',
      location,
      radius,
      type: 'transit_station',
      maxResults: 10
    });

    return response.results || [];
  }

  /**
   * Obtener detalles de un lugar específico
   */
  async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const params = new URLSearchParams({
      place_id: placeId,
      key: this.apiKey,
      language: 'es',
      fields: 'place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level,types,opening_hours,photos,business_status,vicinity,website,international_phone_number,reviews'
    });

    try {
      const response = await fetch(`${this.baseUrl}/details/json?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      return data.result || null;
    } catch (error) {
      console.error('Error getting place details:', error);
      throw new Error(`Error al obtener detalles del lugar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Buscar lugares por categoría específica
   */
  async searchByCategory(
    category: 'restaurants' | 'monuments' | 'institutions' | 'public_places' | 'pharmacies' | 'hospitals' | 'transport',
    location: { lat: number; lng: number },
    radius: number = 3000
  ): Promise<PlaceResult[]> {
    switch (category) {
      case 'restaurants':
        return this.searchRestaurants(location, radius);
      case 'monuments':
        return this.searchMonuments(location, radius);
      case 'institutions':
        return this.searchInstitutions(location, radius);
      case 'public_places':
        return this.searchPublicPlaces(location, radius);
      case 'pharmacies':
        return this.searchPharmacies(location, radius);
      case 'hospitals':
        return this.searchHospitals(location, radius);
      case 'transport':
        return this.searchTransportStations(location, radius);
      default:
        throw new Error(`Categoría no soportada: ${category}`);
    }
  }

  /**
   * Verificar si el servicio está disponible
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Obtener información del servicio
   */
  getServiceInfo() {
    return {
      name: 'Google Places API',
      provider: 'Google',
      features: [
        'Búsqueda de restaurantes',
        'Búsqueda de monumentos',
        'Búsqueda de instituciones',
        'Búsqueda de lugares públicos',
        'Búsqueda de farmacias',
        'Búsqueda de hospitales',
        'Búsqueda de transporte',
        'Detalles de lugares',
        'Búsqueda por proximidad'
      ],
      available: this.isAvailable()
    };
  }
}

// Exportar instancia singleton
export const googlePlacesService = GooglePlacesService.getInstance();

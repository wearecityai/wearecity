/**
 * Servicio de Google Places API para Firebase Functions
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
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor() {
    // Usar API key hardcodeada como fallback para Firebase Functions v2
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyDksNTEkRDILZimpnX7vUc36u66SAAH5l0';
    
    if (!this.apiKey) {
      console.warn('⚠️ Google Places API key not configured in Firebase Functions');
    } else {
      console.log('✅ Google Places API key configured');
    }
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

      const data = await response.json() as any;
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      // Limitar resultados si se especifica
      if (request.maxResults && data.results) {
        data.results = data.results.slice(0, request.maxResults);
      }

      return data as PlacesSearchResponse;
    } catch (error) {
      console.error('Error searching places:', error);
      throw new Error(`Error al buscar lugares: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Buscar restaurantes cerca de una ubicación
   */
  async searchRestaurants(location: { lat: number; lng: number }, radius: number = 1500, city?: string): Promise<PlaceResult[]> {
    const query = city ? `restaurantes ${city}, España` : 'restaurantes';
    const response = await this.searchPlaces({
      query,
      location,
      radius,
      type: 'restaurant',
      region: 'es',
      maxResults: 10
    });

    return response.results || [];
  }

  /**
   * Buscar monumentos y lugares de interés
   */
  async searchMonuments(location: { lat: number; lng: number }, radius: number = 2000, city?: string): Promise<PlaceResult[]> {
    const query = city ? `monumentos lugares turísticos ${city}, España` : 'monumentos lugares de interés turístico';
    const response = await this.searchPlaces({
      query,
      location,
      radius,
      type: 'tourist_attraction',
      region: 'es',
      maxResults: 15
    });

    return response.results || [];
  }

  /**
   * Buscar instituciones públicas
   */
  async searchInstitutions(location: { lat: number; lng: number }, radius: number = 2000, city?: string): Promise<PlaceResult[]> {
    const query = city ? `ayuntamiento instituciones ${city}, España` : 'ayuntamiento instituciones públicas gobierno';
    const response = await this.searchPlaces({
      query,
      location,
      radius,
      type: 'local_government_office',
      region: 'es',
      maxResults: 10
    });

    return response.results || [];
  }

  /**
   * Buscar lugares públicos (parques, plazas, etc.)
   */
  async searchPublicPlaces(location: { lat: number; lng: number }, radius: number = 1500, city?: string): Promise<PlaceResult[]> {
    const query = city ? `parques plazas ${city}, España` : 'parques plazas espacios públicos';
    const response = await this.searchPlaces({
      query,
      location,
      radius,
      type: 'park',
      region: 'es',
      maxResults: 10
    });

    return response.results || [];
  }

  /**
   * Buscar farmacias
   */
  async searchPharmacies(location: { lat: number; lng: number }, radius: number = 1500, city?: string): Promise<PlaceResult[]> {
    const query = city ? `farmacias ${city}, España` : 'farmacias';
    const response = await this.searchPlaces({
      query,
      location,
      radius,
      type: 'pharmacy',
      region: 'es',
      maxResults: 10
    });

    return response.results || [];
  }

  /**
   * Buscar hospitales y centros de salud
   */
  async searchHospitals(location: { lat: number; lng: number }, radius: number = 2000, city?: string): Promise<PlaceResult[]> {
    const query = city ? `hospitales centros salud ${city}, España` : 'hospitales centros de salud';
    const response = await this.searchPlaces({
      query,
      location,
      radius,
      type: 'hospital',
      region: 'es',
      maxResults: 10
    });

    return response.results || [];
  }

  /**
   * Buscar estaciones de transporte
   */
  async searchTransportStations(location: { lat: number; lng: number }, radius: number = 1500, city?: string): Promise<PlaceResult[]> {
    const query = city ? `estaciones transporte metro bus ${city}, España` : 'estaciones transporte público metro bus';
    const response = await this.searchPlaces({
      query,
      location,
      radius,
      type: 'transit_station',
      region: 'es',
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

      const data = await response.json() as any;
      
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
   * Convertir resultado de Google Places a formato PlaceCardInfo
   */
  convertToPlaceCardInfo(place: any, searchQuery?: string): any {
    const placeId = place.place_id || place.id;
    const name = place.name || 'Lugar sin nombre';
    const address = place.formatted_address || place.vicinity || 'Dirección no disponible';
    
    // Generar URL de Google Maps
    const mapsUrl = placeId 
      ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`;

    // Procesar fotos
    let photoUrl: string | undefined;
    let photoAttributions: string[] | undefined;
    
    if (place.photos && place.photos.length > 0) {
      const photo = place.photos[0];
      // Generar URL correcta para la foto usando la API de Google Places
      if (photo.photo_reference) {
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&maxheight=300&photo_reference=${photo.photo_reference}&key=${this.apiKey}`;
      }
      photoAttributions = photo.html_attributions || [];
    }

    // Procesar horarios de apertura
    let openingHours: string[] | undefined;
    if (place.opening_hours) {
      if (place.opening_hours.weekday_text) {
        openingHours = place.opening_hours.weekday_text;
      } else if (Array.isArray(place.opening_hours)) {
        openingHours = place.opening_hours;
      }
    }

    // Mapear tipos para el frontend
    const types = place.types || [];

    return {
      id: `place_${placeId || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      placeId: placeId,
      searchQuery: searchQuery,
      photoUrl: photoUrl,
      photoAttributions: photoAttributions,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      address: address,
      mapsUrl: mapsUrl,
      website: place.website,
      // Nuevos campos para PlaceCard
      priceLevel: place.price_level,
      types: types,
      openingHours: openingHours,
      phoneNumber: place.international_phone_number || place.formatted_phone_number,
      businessStatus: place.business_status,
      reviews: place.reviews ? place.reviews.slice(0, 3) : undefined, // Solo primeras 3 reseñas
      isLoadingDetails: false,
      errorDetails: undefined
    };
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
}

// Exportar instancia singleton
export const googlePlacesService = new GooglePlacesService();

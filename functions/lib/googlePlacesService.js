"use strict";
/**
 * Servicio de Google Places API para Firebase Functions
 * Busca restaurantes, monumentos, instituciones, lugares públicos, etc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.googlePlacesService = exports.GooglePlacesService = void 0;
class GooglePlacesService {
    constructor() {
        this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
        // Usar API key hardcodeada como fallback para Firebase Functions v2
        this.apiKey = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyDksNTEkRDILZimpnX7vUc36u66SAAH5l0';
        if (!this.apiKey) {
            console.warn('⚠️ Google Places API key not configured in Firebase Functions');
        }
        else {
            console.log('✅ Google Places API key configured');
        }
    }
    /**
     * Buscar lugares por texto
     */
    async searchPlaces(request) {
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
        }
        catch (error) {
            console.error('Error searching places:', error);
            throw new Error(`Error al buscar lugares: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    /**
     * Buscar restaurantes cerca de una ubicación
     */
    async searchRestaurants(location, radius = 2000) {
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
    async searchMonuments(location, radius = 5000) {
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
    async searchInstitutions(location, radius = 5000) {
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
    async searchPublicPlaces(location, radius = 3000) {
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
    async searchPharmacies(location, radius = 2000) {
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
    async searchHospitals(location, radius = 10000) {
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
    async searchTransportStations(location, radius = 5000) {
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
    async getPlaceDetails(placeId) {
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
        }
        catch (error) {
            console.error('Error getting place details:', error);
            throw new Error(`Error al obtener detalles del lugar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    /**
     * Convertir resultado de Google Places a formato PlaceCardInfo
     */
    convertToPlaceCardInfo(place, searchQuery) {
        const placeId = place.place_id || place.id;
        const name = place.name || 'Lugar sin nombre';
        const address = place.formatted_address || place.vicinity || 'Dirección no disponible';
        // Generar URL de Google Maps
        const mapsUrl = placeId
            ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`;
        // Procesar fotos
        let photoUrl;
        let photoAttributions;
        if (place.photos && place.photos.length > 0) {
            const photo = place.photos[0];
            photoUrl = photo.getUrl ? photo.getUrl({ maxWidth: 400, maxHeight: 300 }) : photo.photo_reference;
            photoAttributions = photo.html_attributions || [];
        }
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
            isLoadingDetails: false,
            errorDetails: undefined
        };
    }
    /**
     * Buscar lugares por categoría específica
     */
    async searchByCategory(category, location, radius = 3000) {
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
    isAvailable() {
        return !!this.apiKey;
    }
}
exports.GooglePlacesService = GooglePlacesService;
// Exportar instancia singleton
exports.googlePlacesService = new GooglePlacesService();
//# sourceMappingURL=googlePlacesService.js.map
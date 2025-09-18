"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPlacesFromResponse = exports.getPlacePhotoUrl = exports.searchPlaces = void 0;
const google_maps_services_js_1 = require("@googlemaps/google-maps-services-js");
// Initialize Google Maps client
const mapsClient = new google_maps_services_js_1.Client({});
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
// Search for places using Google Places API
const searchPlaces = async (query, location, radius = 1000 // 1km default - muy restrictivo para ciudades
) => {
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            throw new Error('Google Maps API key not configured');
        }
        console.log('🗺️ Searching places:', { query, location, radius });
        // First, geocode the location if provided
        let locationCoords;
        if (location) {
            try {
                const geocodeResult = await mapsClient.geocode({
                    params: {
                        address: location,
                        key: GOOGLE_MAPS_API_KEY,
                    },
                });
                if (geocodeResult.data.results.length > 0) {
                    locationCoords = geocodeResult.data.results[0].geometry.location;
                }
            }
            catch (geocodeError) {
                console.log('❌ Geocoding failed:', geocodeError);
            }
        }
        // Search for places - incluir ciudad en la query para mayor precisión
        const enhancedQuery = location ? `${query} en ${location}` : query;
        const searchParams = {
            query: enhancedQuery,
            key: GOOGLE_MAPS_API_KEY,
            fields: [
                'place_id',
                'name',
                'formatted_address',
                'geometry',
                'rating',
                'user_ratings_total',
                'price_level',
                'photos',
                'types',
                'opening_hours',
                'website',
                'international_phone_number',
                'business_status',
                'reviews',
                'plus_code'
            ].join(','),
        };
        if (locationCoords) {
            searchParams.location = `${locationCoords.lat},${locationCoords.lng}`;
            searchParams.radius = radius;
        }
        const response = await mapsClient.textSearch({
            params: searchParams,
        });
        let places = response.data.results.slice(0, 10); // Get more results initially for filtering
        // 🔍 FILTRAR POR CIUDAD: Solo lugares que realmente estén en la ciudad especificada
        if (location) {
            const cityName = location.toLowerCase();
            // Crear variaciones del nombre de la ciudad para mejor matching
            const cityVariations = [
                cityName,
                cityName.replace(/^la\s+/, ''),
                cityName.replace(/^el\s+/, ''),
                cityName.replace(/\s+/g, ''),
                cityName.replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u'), // Sin acentos
            ];
            // 🚨 FILTRO MÁS ESTRICTO: Excluir ciudades cercanas conocidas
            const nearbyCities = ['benidorm', 'alicante', 'el campello', 'campello', 'villajoyosa', 'vila joiosa'];
            const isTargetCity = nearbyCities.includes(cityName);
            places = places.filter(place => {
                const address = place.formatted_address?.toLowerCase() || '';
                const name = place.name?.toLowerCase() || '';
                // Verificar si la dirección contiene alguna variación del nombre de la ciudad
                const isInCity = cityVariations.some(variation => address.includes(variation) || name.includes(variation));
                // 🚨 EXCLUIR CIUDADES CERCANAS: Si estamos buscando en La Vila Joiosa, excluir Benidorm
                let isExcluded = false;
                if (isTargetCity) {
                    const otherCities = nearbyCities.filter(city => city !== cityName);
                    isExcluded = otherCities.some(otherCity => address.includes(otherCity) || name.includes(otherCity));
                }
                const finalResult = isInCity && !isExcluded;
                // console.log(`🔍 Place filter: "${place.name}" - Address: "${place.formatted_address}" - In ${location}: ${isInCity} - Excluded: ${isExcluded} - Final: ${finalResult}`);
                return finalResult;
            });
        }
        // Limitar a 6 resultados finales
        places = places.slice(0, 6);
        console.log('✅ Found places after city filtering:', places.length);
        return places.map(place => ({
            place_id: place.place_id || '',
            name: place.name || '',
            formatted_address: place.formatted_address || '',
            geometry: place.geometry || { location: { lat: 0, lng: 0 } },
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            price_level: place.price_level,
            photos: place.photos?.slice(0, 1),
            types: place.types || [],
            opening_hours: place.opening_hours,
            website: place.website,
            international_phone_number: place.international_phone_number,
            business_status: place.business_status,
            reviews: place.reviews,
            plus_code: place.plus_code,
        }));
    }
    catch (error) {
        console.error('❌ Error searching places:', error);
        return [];
    }
};
exports.searchPlaces = searchPlaces;
// Get place photo URL
const getPlacePhotoUrl = (photoReference, maxWidth = 400) => {
    if (!GOOGLE_MAPS_API_KEY || !photoReference) {
        return '';
    }
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
};
exports.getPlacePhotoUrl = getPlacePhotoUrl;
// Extract places from AI response
const extractPlacesFromResponse = (responseText) => {
    try {
        // Look for JSON block in the response
        const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (!jsonMatch) {
            return [];
        }
        const jsonString = jsonMatch[1];
        const parsed = JSON.parse(jsonString);
        if (parsed.places && Array.isArray(parsed.places)) {
            console.log('🗺️ Extracted places:', parsed.places);
            return parsed.places;
        }
        return [];
    }
    catch (error) {
        console.error('Error extracting places from response:', error);
        return [];
    }
};
exports.extractPlacesFromResponse = extractPlacesFromResponse;
//# sourceMappingURL=placesService.js.map
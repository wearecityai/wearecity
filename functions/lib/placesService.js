"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPlacesFromResponse = exports.getPlacePhotoUrl = exports.searchPlaces = void 0;
const google_maps_services_js_1 = require("@googlemaps/google-maps-services-js");
// Initialize Google Maps client
const mapsClient = new google_maps_services_js_1.Client({});
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
// Search for places using Google Places API
const searchPlaces = async (query, location, radius = 10000 // 10km default
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
        // Search for places
        const searchParams = {
            query,
            key: GOOGLE_MAPS_API_KEY,
            fields: [
                'place_id',
                'name',
                'formatted_address',
                'geometry',
                'rating',
                'price_level',
                'photos',
                'types',
                'opening_hours',
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
        const places = response.data.results.slice(0, 6); // Limit to 6 results
        console.log('✅ Found places:', places.length);
        return places.map(place => ({
            place_id: place.place_id || '',
            name: place.name || '',
            formatted_address: place.formatted_address || '',
            geometry: place.geometry || { location: { lat: 0, lng: 0 } },
            rating: place.rating,
            price_level: place.price_level,
            photos: place.photos?.slice(0, 1),
            types: place.types || [],
            opening_hours: place.opening_hours,
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
import { Client } from '@googlemaps/google-maps-services-js';

// Initialize Google Maps client
const mapsClient = new Client({});
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

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
  price_level?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types: string[];
  opening_hours?: {
    open_now: boolean;
  };
  plus_code?: {
    global_code: string;
  };
}

// Search for places using Google Places API
export const searchPlaces = async (
  query: string,
  location?: string,
  radius: number = 1000 // 1km default - muy restrictivo para ciudades
): Promise<PlaceResult[]> => {
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
      } catch (geocodeError) {
        console.log('❌ Geocoding failed:', geocodeError);
      }
    }

    // Search for places - incluir ciudad en la query para mayor precisión
    const enhancedQuery = location ? `${query} en ${location}` : query;
    
    const searchParams: any = {
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
        cityName.replace(/^la\s+/, ''), // Quitar "La " del inicio
        cityName.replace(/^el\s+/, ''), // Quitar "El " del inicio
        cityName.replace(/\s+/g, ''),   // Sin espacios
        cityName.replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u'), // Sin acentos
      ];
      
      // 🚨 FILTRO MÁS ESTRICTO: Excluir ciudades cercanas conocidas
      const nearbyCities = ['benidorm', 'alicante', 'el campello', 'campello', 'villajoyosa', 'vila joiosa'];
      const isTargetCity = nearbyCities.includes(cityName);
      
      places = places.filter(place => {
        const address = place.formatted_address?.toLowerCase() || '';
        const name = place.name?.toLowerCase() || '';
        
        // Verificar si la dirección contiene alguna variación del nombre de la ciudad
        const isInCity = cityVariations.some(variation => 
          address.includes(variation) || name.includes(variation)
        );
        
        // 🚨 EXCLUIR CIUDADES CERCANAS: Si estamos buscando en La Vila Joiosa, excluir Benidorm
        let isExcluded = false;
        if (isTargetCity) {
          const otherCities = nearbyCities.filter(city => city !== cityName);
          isExcluded = otherCities.some(otherCity => 
            address.includes(otherCity) || name.includes(otherCity)
          );
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
      photos: place.photos?.slice(0, 1), // Only first photo
      types: place.types || [],
      opening_hours: place.opening_hours,
      website: place.website,
      international_phone_number: place.international_phone_number,
      business_status: place.business_status,
      reviews: place.reviews,
      plus_code: place.plus_code,
    }));

  } catch (error) {
    console.error('❌ Error searching places:', error);
    return [];
  }
};

// Get place photo URL
export const getPlacePhotoUrl = (photoReference: string, maxWidth: number = 400): string => {
  if (!GOOGLE_MAPS_API_KEY || !photoReference) {
    return '';
  }
  
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
};

// Extract places from AI response
export const extractPlacesFromResponse = (responseText: string): any[] => {
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
  } catch (error) {
    console.error('Error extracting places from response:', error);
    return [];
  }
};
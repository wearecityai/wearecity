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
  radius: number = 10000 // 10km default
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

    // Search for places
    const searchParams: any = {
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
      photos: place.photos?.slice(0, 1), // Only first photo
      types: place.types || [],
      opening_hours: place.opening_hours,
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
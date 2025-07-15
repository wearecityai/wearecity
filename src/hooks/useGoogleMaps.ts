import { useState, useCallback, useRef, useEffect } from 'react';
import { MAPS_API_KEY_INVALID_ERROR_MESSAGE, DEFAULT_LANGUAGE_CODE } from '../constants';
import { ChatMessage, PlaceCardInfo } from '../types';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useGoogleMaps = (
  userLocation: UserLocation | null,
  currentLanguageCode: string,
  setAppError: (error: string | null) => void
) => {
  const [googleMapsScriptLoaded, setGoogleMapsScriptLoaded] = useState(false);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    const handleAuthFailure = () => {
      console.error("Google Maps API Authentication Failure (gm_authFailure). Invalid API Key or configuration for Maps.");
      setAppError(MAPS_API_KEY_INVALID_ERROR_MESSAGE);
      setGoogleMapsScriptLoaded(false);
    };

    (window as any).gm_authFailure = handleAuthFailure;

    return () => {
      if ((window as any).gm_authFailure === handleAuthFailure) {
        delete (window as any).gm_authFailure;
      }
    };
  }, [setAppError]);

  const loadGoogleMapsScript = useCallback((apiKey: string) => {
    if (googleMapsScriptLoaded || (typeof google !== 'undefined' && google.maps && google.maps.places)) {
      setGoogleMapsScriptLoaded(true);
      if (typeof google !== 'undefined' && google.maps && google.maps.places && !placesServiceRef.current) {
        // Crear un elemento real del DOM para el servicio
        const mapDiv = document.createElement('div');
        mapDiv.style.display = 'none';
        document.body.appendChild(mapDiv);
        placesServiceRef.current = new google.maps.places.PlacesService(mapDiv);
        console.log('✅ Google Places service initialized with real DOM element');
      }
      return;
    }
    if (document.getElementById('google-maps-script')) return;
    if (!apiKey) {
      console.warn("Google Maps API key is missing. Maps features will be disabled.");
      setGoogleMapsScriptLoaded(false);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ Google Maps script loaded successfully');
      setGoogleMapsScriptLoaded(true);
      if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        // Crear un elemento real del DOM para el servicio
        const mapDiv = document.createElement('div');
        mapDiv.style.display = 'none';
        document.body.appendChild(mapDiv);
        placesServiceRef.current = new google.maps.places.PlacesService(mapDiv);
        console.log('✅ Google Places service initialized with real DOM element');
      } else {
        console.error('❌ Google Maps API not available after script load');
      }
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps API script.");
      setAppError("Error al cargar Google Maps API. Funciones de mapa desactivadas.");
      setGoogleMapsScriptLoaded(false);
    };
    document.head.appendChild(script);
  }, [googleMapsScriptLoaded, setAppError]);

  const updatePlaceCardInMessage = useCallback((
    messageId: string, 
    placeCardId: string, 
    updates: Partial<PlaceCardInfo>,
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  ) => {
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId && msg.placeCards) {
          return {
            ...msg,
            placeCards: msg.placeCards.map(card =>
              card.id === placeCardId ? { ...card, ...updates } : card
            ),
          };
        }
        return msg;
      })
    );
  }, []);

  const fetchPlaceDetailsAndUpdateMessage = useCallback(async (
    messageId: string, 
    placeCardId: string, 
    placeId?: string, 
    searchQuery?: string,
    setMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  ) => {
    if (!setMessages) return;
    
    if (!googleMapsScriptLoaded || !placesServiceRef.current) {
      console.log('❌ Google Maps service not available');
      updatePlaceCardInMessage(messageId, placeCardId, { 
        isLoadingDetails: false, 
        errorDetails: "Servicio de Google Places no disponible." 
      }, setMessages);
      return;
    }

    console.log(`🔍 Fetching details for place card ${placeCardId}:`, { placeId, searchQuery });

    const requestFields = ['name', 'place_id', 'formatted_address', 'photo', 'rating', 'user_ratings_total', 'url', 'geometry', 'website'];
    
    const processPlaceResult = (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
      console.log(`🔍 Process place result for ${placeCardId}:`, { status, placeName: place?.name });
      
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        let photoUrl: string | undefined = undefined;
        let photoAttributions: string[] | undefined = undefined;
        
        if (place.photos && place.photos.length > 0) {
          photoUrl = place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 });
          photoAttributions = place.photos[0].html_attributions;
        }
        
        let distanceString: string | undefined = undefined;
        if (userLocation && place.geometry?.location && typeof google !== 'undefined' && google.maps?.geometry?.spherical) {
          const placeLocation = new google.maps.LatLng(place.geometry.location.lat(), place.geometry.location.lng());
          const currentUserLocation = new google.maps.LatLng(userLocation.latitude, userLocation.longitude);
          const distInMeters = google.maps.geometry.spherical.computeDistanceBetween(currentUserLocation, placeLocation);
          
          if (distInMeters < 1000) distanceString = `${Math.round(distInMeters)} m`;
          else distanceString = `${(distInMeters / 1000).toFixed(1)} km`;
        }
        
        console.log(`✅ Successfully loaded details for ${placeCardId}:`, {
          name: place.name,
          rating: place.rating,
          address: place.formatted_address,
          photoUrl: photoUrl ? 'available' : 'none'
        });
        
        updatePlaceCardInMessage(messageId, placeCardId, {
          isLoadingDetails: false, 
          photoUrl, 
          photoAttributions, 
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total, 
          address: place.formatted_address,
          mapsUrl: place.url, 
          website: place.website, 
          distance: distanceString, 
          errorDetails: undefined,
        }, setMessages);
      } else {
        // If placeId failed and we have a searchQuery, try that as fallback
        if (placeId && searchQuery && (status === google.maps.places.PlacesServiceStatus.NOT_FOUND || status === google.maps.places.PlacesServiceStatus.INVALID_REQUEST)) {
          console.log(`🔄 PlaceId failed (${status}), trying searchQuery fallback: ${searchQuery}`);
          placesServiceRef.current!.textSearch({ 
            query: searchQuery, 
            fields: requestFields, 
            language: currentLanguageCode || DEFAULT_LANGUAGE_CODE 
          }, (results, searchStatus) => {
            if (searchStatus === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
              console.log(`✅ SearchQuery fallback successful for: ${searchQuery}`);
              if (results[0].place_id) {
                placesServiceRef.current!.getDetails({ 
                  placeId: results[0].place_id, 
                  fields: requestFields, 
                  language: currentLanguageCode || DEFAULT_LANGUAGE_CODE 
                }, processPlaceResult);
              } else {
                processPlaceResult(results[0], searchStatus);
              }
            } else {
              console.log(`❌ SearchQuery fallback also failed (${searchStatus}) for: ${searchQuery}`);
              updatePlaceCardInMessage(messageId, placeCardId, { 
                isLoadingDetails: false, 
                errorDetails: `No se encontraron detalles (${status}).` 
              }, setMessages);
            }
          });
          return; // Don't update with error immediately, wait for fallback
        }
        
        console.log(`❌ Failed to load details for ${placeCardId}: ${status}`);
        updatePlaceCardInMessage(messageId, placeCardId, { 
          isLoadingDetails: false, 
          errorDetails: `No se encontraron detalles (${status}).` 
        }, setMessages);
      }
    };

    if (placeId) {
      console.log(`🔍 Fetching details by placeId: ${placeId}`);
      placesServiceRef.current.getDetails({ 
        placeId, 
        fields: requestFields, 
        language: currentLanguageCode || DEFAULT_LANGUAGE_CODE 
      }, processPlaceResult);
    } else if (searchQuery) {
      console.log(`🔍 Searching by query: ${searchQuery}`);
      placesServiceRef.current.textSearch({ 
        query: searchQuery, 
        fields: requestFields, 
        language: currentLanguageCode || DEFAULT_LANGUAGE_CODE 
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          if (results[0].place_id) {
            placesServiceRef.current!.getDetails({ 
              placeId: results[0].place_id, 
              fields: requestFields, 
              language: currentLanguageCode || DEFAULT_LANGUAGE_CODE 
            }, processPlaceResult);
          } else processPlaceResult(results[0], status);
        } else {
          console.log(`❌ Text search failed for ${searchQuery}: ${status}`);
          updatePlaceCardInMessage(messageId, placeCardId, { 
            isLoadingDetails: false, 
            errorDetails: `Lugar no encontrado (${status}).` 
          }, setMessages);
        }
      });
    } else {
      console.log(`❌ No placeId or searchQuery provided for ${placeCardId}`);
      updatePlaceCardInMessage(messageId, placeCardId, { 
        isLoadingDetails: false, 
        errorDetails: "Falta ID o consulta." 
      }, setMessages);
    }
  }, [userLocation, updatePlaceCardInMessage, currentLanguageCode, googleMapsScriptLoaded]);

  const testGooglePlacesAPI = useCallback(() => {
    if (!googleMapsScriptLoaded || !placesServiceRef.current) {
      console.log('❌ Google Places API not available for testing');
      return;
    }
    
    console.log('🧪 Testing Google Places API...');
    
    // Test with a simple search
    placesServiceRef.current.textSearch({ 
      query: 'Pizzería La Famiglia Finestrat', 
      fields: ['name', 'place_id', 'formatted_address'], 
      language: currentLanguageCode || 'es' 
    }, (results, status) => {
      console.log('🧪 Test search result:', { status, resultsCount: results?.length, firstResult: results?.[0] });
    });
  }, [googleMapsScriptLoaded, currentLanguageCode]);

  return {
    googleMapsScriptLoaded,
    placesServiceRef,
    loadGoogleMapsScript,
    fetchPlaceDetailsAndUpdateMessage,
    updatePlaceCardInMessage,
    testGooglePlacesAPI
  };
};

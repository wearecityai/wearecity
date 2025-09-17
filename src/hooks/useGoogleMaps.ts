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
        setAppError('Google Maps API no disponible después de cargar el script. Verifica la configuración.');
      }
    };
    script.onerror = (error) => {
      console.error("Failed to load Google Maps API script:", error);
      setAppError("Error al cargar Google Maps API. Verifica la API key y el facturación del proyecto Google Cloud.");
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

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log(`⏰ Timeout reached for place card ${placeCardId}`);
      updatePlaceCardInMessage(messageId, placeCardId, { 
        isLoadingDetails: false, 
        errorDetails: "Tiempo de espera agotado. Haz clic para reintentar." 
      }, setMessages);
    }, 15000); // Reducido a 15 segundos para mejor UX

    // Add retry mechanism
    const retryTimeoutId = setTimeout(() => {
      console.log(`🔄 Auto-retry timeout for place card ${placeCardId}`);
      // Si después de 10 segundos no hay respuesta, marcar como error pero permitir reintento manual
      updatePlaceCardInMessage(messageId, placeCardId, { 
        isLoadingDetails: false, 
        errorDetails: "Carga lenta. Haz clic para reintentar." 
      }, setMessages);
    }, 10000);

    const requestFields = [
      'name', 
      'place_id', 
      'formatted_address', 
      'photo', 
      'rating', 
      'user_ratings_total', 
      'url', 
      'geometry', 
      'website',
      'price_level',
      'types',
      'opening_hours',
      'international_phone_number',
      'business_status',
      'reviews'
    ];
    
    const processPlaceResult = (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
      // Clear both timeouts since we got a result
      clearTimeout(timeoutId);
      clearTimeout(retryTimeoutId);
      
      console.log(`🔍 Process place result for ${placeCardId}:`, { status, placeName: place?.name });
      
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        // VALIDACIÓN CRÍTICA: Verificar que el lugar esté en la ciudad correcta
        if (userLocation && place.geometry?.location) {
          const placeLocation = new google.maps.LatLng(place.geometry.location.lat(), place.geometry.location.lng());
          const currentUserLocation = new google.maps.LatLng(userLocation.latitude, userLocation.longitude);
          const distInMeters = google.maps.geometry.spherical.computeDistanceBetween(currentUserLocation, placeLocation);
          
          // Aumentar el radio a 50km para evitar bloquear lugares válidos de la misma ciudad
          // Muchas ciudades tienen barrios y áreas que están a más de 20km del centro
          if (distInMeters > 50000) {
            console.log(`❌ Place ${place.name} is too far from user location: ${(distInMeters/1000).toFixed(1)}km`);
            updatePlaceCardInMessage(messageId, placeCardId, { 
              isLoadingDetails: false, 
              errorDetails: "Este lugar no está en la ciudad configurada." 
            }, setMessages);
            return;
          }
          
          console.log(`✅ Place ${place.name} distance validated: ${(distInMeters/1000).toFixed(1)}km from user`);
        }
        
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
        
        // Procesar horarios de apertura
        let openingHours: string[] | undefined = undefined;
        if (place.opening_hours?.weekday_text) {
          openingHours = place.opening_hours.weekday_text;
        }

        // Procesar tipos de lugar
        let types: string[] | undefined = undefined;
        if (place.types) {
          types = place.types;
        }

        // Procesar estado del negocio
        let businessStatus: string | undefined = undefined;
        if (place.business_status) {
          businessStatus = place.business_status;
        }

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
          priceLevel: place.price_level,
          types: types,
          openingHours: openingHours,
          phoneNumber: place.international_phone_number,
          businessStatus: businessStatus,
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
              clearTimeout(timeoutId); // Clear timeout on error
              clearTimeout(retryTimeoutId);
              updatePlaceCardInMessage(messageId, placeCardId, { 
                isLoadingDetails: false, 
                errorDetails: `No se encontraron detalles (${status}). Haz clic para reintentar.` 
              }, setMessages);
            }
          });
          return; // Don't update with error immediately, wait for fallback
        }
        
        console.log(`❌ Failed to load details for ${placeCardId}: ${status}`);
        clearTimeout(timeoutId); // Clear timeout on error
        clearTimeout(retryTimeoutId);
        updatePlaceCardInMessage(messageId, placeCardId, { 
          isLoadingDetails: false, 
          errorDetails: `No se encontraron detalles (${status}). Haz clic para reintentar.` 
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
          clearTimeout(timeoutId); // Clear timeout on error
          updatePlaceCardInMessage(messageId, placeCardId, { 
            isLoadingDetails: false, 
            errorDetails: `Lugar no encontrado (${status}).` 
          }, setMessages);
        }
      });
    } else {
      console.log(`❌ No placeId or searchQuery provided for ${placeCardId}`);
      clearTimeout(timeoutId); // Clear timeout on error
      updatePlaceCardInMessage(messageId, placeCardId, { 
        isLoadingDetails: false, 
        errorDetails: "Falta ID o consulta." 
      }, setMessages);
    }
  }, [userLocation, updatePlaceCardInMessage, currentLanguageCode, googleMapsScriptLoaded]);

  // Función para validar que una PlaceCard esté en la ciudad correcta ANTES del renderizado
  const validatePlaceCardLocation = useCallback(async (
    placeCard: PlaceCardInfo,
    restrictedCityName?: string
  ): Promise<boolean> => {
    if (!googleMapsScriptLoaded || !placesServiceRef.current) {
      console.log('❌ Google Maps service not available for location validation');
      return false;
    }

    // Si no hay ciudad restringida, no validar
    if (!restrictedCityName) {
      console.log('⚠️ No restricted city configured, skipping location validation');
      return true;
    }

    try {
      console.log(`🔍 Validating place card location: ${placeCard.name} for city: ${restrictedCityName}`);

      // Si ya tenemos placeId, validar directamente
      if (placeCard.placeId) {
        const requestFields = ['geometry', 'formatted_address'];
        
        return new Promise((resolve) => {
          placesServiceRef.current!.getDetails({ 
            placeId: placeCard.placeId, 
            fields: requestFields, 
            language: currentLanguageCode || 'es' 
          }, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
              const placeLat = place.geometry.location.lat();
              const placeLng = place.geometry.location.lng();
              
              // Obtener coordenadas de la ciudad restringida
              getCityCoordinates(restrictedCityName).then(cityCoords => {
                if (cityCoords) {
                  const distance = calculateDistance(
                    cityCoords.lat, 
                    cityCoords.lng, 
                    placeLat, 
                    placeLng
                  );
                  
                  // Si está a más de 50km, NO es válido
                  if (distance > 50) {
                    console.log(`❌ Place ${placeCard.name} rejected: ${distance.toFixed(1)}km from ${restrictedCityName}`);
                    resolve(false);
                  } else {
                    console.log(`✅ Place ${placeCard.name} validated: ${distance.toFixed(1)}km from ${restrictedCityName}`);
                    resolve(true);
                  }
                } else {
                  console.log('⚠️ Could not get city coordinates, rejecting place card for safety');
                  resolve(false);
                }
              });
            } else {
              console.log(`❌ Could not get place details for validation: ${status}`);
              resolve(false);
            }
          });
        });
      }
      
      // Si no hay placeId pero hay searchQuery, validar mediante búsqueda
      if (placeCard.searchQuery) {
        const searchQuery = `${placeCard.name}, ${restrictedCityName}`;
        
        return new Promise((resolve) => {
          placesServiceRef.current!.textSearch({ 
            query: searchQuery, 
            fields: ['geometry', 'formatted_address'], 
            language: currentLanguageCode || 'es' 
          }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
              const place = results[0];
              if (place.geometry?.location) {
                const placeLat = place.geometry.location.lat();
                const placeLng = place.geometry.location.lng();
                
                // Obtener coordenadas de la ciudad restringida
                getCityCoordinates(restrictedCityName).then(cityCoords => {
                  if (cityCoords) {
                    const distance = calculateDistance(
                      cityCoords.lat, 
                      cityCoords.lng, 
                      placeLat, 
                      placeLng
                    );
                    
                    // Si está a más de 50km, NO es válido
                    if (distance > 50) {
                      console.log(`❌ Place ${placeCard.name} rejected: ${distance.toFixed(1)}km from ${restrictedCityName}`);
                      resolve(false);
                    } else {
                      console.log(`✅ Place ${placeCard.name} validated: ${distance.toFixed(1)}km from ${restrictedCityName}`);
                      resolve(true);
                    }
                  } else {
                    console.log('⚠️ Could not get city coordinates, rejecting place card for safety');
                    resolve(false);
                  }
                });
              } else {
                console.log('❌ Place has no geometry for validation');
                resolve(false);
              }
            } else {
              console.log(`❌ Could not find place for validation: ${status}`);
              resolve(false);
            }
          });
        });
      }
      
      // Si no hay placeId ni searchQuery, rechazar por seguridad
      console.log('❌ Place card has no placeId or searchQuery, rejecting for safety');
      return false;
      
    } catch (error) {
      console.error('❌ Error validating place card location:', error);
      return false; // Por seguridad, rechazar si hay error
    }
  }, [googleMapsScriptLoaded, currentLanguageCode]);

  // Función para obtener coordenadas de una ciudad
  const getCityCoordinates = useCallback(async (cityName: string): Promise<{ lat: number; lng: number } | null> => {
    if (!googleMapsScriptLoaded) return null;
    
    try {
      // Usar Google Places Text Search API como alternativa al Geocoder
      const searchQuery = `${cityName}, España`;
      
      return new Promise((resolve) => {
        placesServiceRef.current!.textSearch({ 
          query: searchQuery, 
          fields: ['geometry'], 
          language: currentLanguageCode || 'es' 
        }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            const place = results[0];
            if (place.geometry?.location) {
              resolve({ 
                lat: place.geometry.location.lat(), 
                lng: place.geometry.location.lng() 
              });
            } else {
              console.log(`❌ City ${cityName} has no geometry`);
              resolve(null);
            }
          } else {
            console.log(`❌ Could not find city: ${cityName} (Status: ${status})`);
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Error getting city coordinates:', error);
      return null;
    }
  }, [googleMapsScriptLoaded, currentLanguageCode]);

  // Función para calcular distancia entre dos puntos (fórmula de Haversine)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Cleanup function for timeouts
  useEffect(() => {
    return () => {
      // This will run when the component unmounts
      // Note: Individual timeouts are cleared in processPlaceResult and error handlers
    };
  }, []);

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
      
      // Handle specific error cases
      if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
        console.error('❌ Google Places API: Quota exceeded');
        setAppError('Límite de consultas de Google Places API excedido. Funciones de mapa desactivadas.');
      } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
        console.error('❌ Google Places API: Request denied - Check API key and billing');
        setAppError('Acceso denegado a Google Places API. Verifica la configuración de la API key y el facturación del proyecto.');
      } else if (status === google.maps.places.PlacesServiceStatus.INVALID_REQUEST) {
        console.error('❌ Google Places API: Invalid request');
        setAppError('Solicitud inválida a Google Places API. Verifica la configuración.');
      } else if (status === google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR) {
        console.error('❌ Google Places API: Unknown error');
        setAppError('Error desconocido en Google Places API. Inténtalo de nuevo más tarde.');
      } else if (status === google.maps.places.PlacesServiceStatus.OK) {
        console.log('✅ Google Places API working correctly');
        setAppError(null); // Clear any previous errors
      }
    });
  }, [googleMapsScriptLoaded, currentLanguageCode, setAppError]);

  return {
    googleMapsScriptLoaded,
    placesServiceRef,
    loadGoogleMapsScript,
    fetchPlaceDetailsAndUpdateMessage,
    updatePlaceCardInMessage,
    testGooglePlacesAPI,
    validatePlaceCardLocation
  };
};

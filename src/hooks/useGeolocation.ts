
import { useState, useEffect } from 'react';

interface UserLocation {
  latitude: number;
  longitude: number;
}

type GeolocationStatus = 'idle' | 'pending' | 'success' | 'error';

interface UseGeolocationReturn {
  userLocation: UserLocation | null;
  geolocationError: string | null;
  geolocationStatus: GeolocationStatus;
}

export const useGeolocation = (allowGeolocation: boolean): UseGeolocationReturn => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [geolocationStatus, setGeolocationStatus] = useState<GeolocationStatus>('idle');

  useEffect(() => {
    if (allowGeolocation) {
      setGeolocationStatus('pending');
      setGeolocationError("Obteniendo ubicación...");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
            setGeolocationError(null);
            setGeolocationStatus('success');
          },
          (geoError) => {
            console.warn("Geolocation error:", geoError);
            let message = "No se pudo obtener la ubicación.";
             switch(geoError.code) {
              case geoError.PERMISSION_DENIED: message = "Permiso de ubicación denegado."; break;
              case geoError.POSITION_UNAVAILABLE: message = "Información de ubicación no disponible."; break;
              case geoError.TIMEOUT: message = "Solicitud de ubicación agotada."; break;
            }
            setGeolocationError(message); setUserLocation(null); setGeolocationStatus('error');
          }, { timeout: 10000, enableHighAccuracy: false }
        );
      } else {
        setGeolocationError("Geolocalización no soportada."); setUserLocation(null); setGeolocationStatus('error');
      }
    } else {
      setUserLocation(null);
      setGeolocationError("Geolocalización desactivada.");
      setGeolocationStatus('idle');
    }
  }, [allowGeolocation]);

  return {
    userLocation,
    geolocationError,
    geolocationStatus
  };
};

import { useState, useEffect, useCallback, useRef } from 'react';

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

type GeolocationStatus = 'idle' | 'pending' | 'success' | 'error';

interface UseGeolocationReturn {
  userLocation: UserLocation | null;
  geolocationError: string | null;
  geolocationStatus: GeolocationStatus;
  refreshLocation: () => void;
  isWatching: boolean;
}

export const useGeolocation = (allowGeolocation: boolean): UseGeolocationReturn => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [geolocationStatus, setGeolocationStatus] = useState<GeolocationStatus>('idle');
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const handleLocationSuccess = useCallback((position: GeolocationPosition) => {
    const newLocation: UserLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };
    
    setUserLocation(newLocation);
    setGeolocationError(null);
    setGeolocationStatus('success');
    
    console.log('📍 Ubicación actualizada:', {
      lat: newLocation.latitude,
      lng: newLocation.longitude,
      accuracy: newLocation.accuracy,
      timestamp: new Date(newLocation.timestamp || Date.now()).toLocaleString()
    });
  }, []);

  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    console.error("❌ Error de geolocalización:", error);
    
    let message = "No se pudo obtener la ubicación.";
    switch(error.code) {
      case error.PERMISSION_DENIED:
        message = "Permiso de ubicación denegado. Por favor, habilita la geolocalización en tu navegador.";
        break;
      case error.POSITION_UNAVAILABLE:
        message = "Información de ubicación no disponible. Verifica tu conexión GPS.";
        break;
      case error.TIMEOUT:
        message = "Solicitud de ubicación agotada. Intentando de nuevo...";
        break;
    }
    
    setGeolocationError(message);
    setUserLocation(null);
    setGeolocationStatus('error');
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setGeolocationError("Geolocalización no soportada por este navegador.");
      setGeolocationStatus('error');
      return;
    }

    setGeolocationStatus('pending');
    setGeolocationError("Obteniendo ubicación precisa...");
    setIsWatching(true);

    // Opciones para máxima precisión
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000 // Cache por 30 segundos
    };

    // Primero obtener ubicación actual
    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    );

    // Luego iniciar seguimiento continuo
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        ...options,
        timeout: 30000, // Más tiempo para el seguimiento
        maximumAge: 60000 // Cache por 1 minuto en seguimiento
      }
    );

    console.log('🎯 Iniciando seguimiento de ubicación con ID:', watchIdRef.current);
  }, [handleLocationSuccess, handleLocationError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
      console.log('⏹️ Deteniendo seguimiento de ubicación');
    }
  }, []);

  const refreshLocation = useCallback(() => {
    if (allowGeolocation && navigator.geolocation) {
      setGeolocationStatus('pending');
      setGeolocationError("Actualizando ubicación...");
      
      navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Forzar nueva lectura
        }
      );
    }
  }, [allowGeolocation, handleLocationSuccess, handleLocationError]);

  useEffect(() => {
    if (allowGeolocation) {
      startWatching();
    } else {
      stopWatching();
      setUserLocation(null);
      setGeolocationError("Geolocalización desactivada.");
      setGeolocationStatus('idle');
    }

    return () => {
      stopWatching();
    };
  }, [allowGeolocation, startWatching, stopWatching]);

  return {
    userLocation,
    geolocationError,
    geolocationStatus,
    refreshLocation,
    isWatching
  };
};

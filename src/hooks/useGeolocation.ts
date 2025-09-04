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
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
  restartLocationTracking: () => void;
  isWatching: boolean;
}

export const useGeolocation = (): UseGeolocationReturn => {
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
    
    // Only log the first successful location or significant changes
    if (!userLocation || 
        Math.abs(userLocation.latitude - newLocation.latitude) > 0.001 ||
        Math.abs(userLocation.longitude - newLocation.longitude) > 0.001) {
      console.log('📍 Ubicación actualizada:', {
        lat: newLocation.latitude,
        lng: newLocation.longitude,
        accuracy: newLocation.accuracy,
        timestamp: new Date(newLocation.timestamp || Date.now()).toLocaleString()
      });
    }
  }, [userLocation]);

  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    console.error("❌ Error de geolocalización:", error);
    
    let message = "No se pudo obtener la ubicación.";
    switch(error.code) {
      case error.PERMISSION_DENIED:
        message = "Permiso de ubicación denegado. Por favor, habilita la geolocalización en tu navegador.";
        break;
      case error.POSITION_UNAVAILABLE:
        message = "Información de ubicación no disponible. Verifica tu conexión GPS o ubicación.";
        break;
      case error.TIMEOUT:
        message = "Solicitud de ubicación agotada. Se reintentará automáticamente.";
        break;
    }
    
    setGeolocationError(message);
    setUserLocation(null);
    setGeolocationStatus('error');
    
    // Log específico para diferentes tipos de errores
    if (error.code === error.POSITION_UNAVAILABLE) {
      console.warn("⚠️ GPS no disponible o ubicación no encontrada. Esto puede ser normal en interiores.");
    } else if (error.code === error.TIMEOUT) {
      console.warn("⚠️ Timeout de geolocalización. Verificando configuración...");
    }
  }, []);

  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGeolocationError("Geolocalización no soportada por este navegador.");
      setGeolocationStatus('error');
      return;
    }

    setGeolocationStatus('pending');
    setGeolocationError("Obteniendo ubicación precisa...");
    setIsWatching(true);

    // Opciones para máxima precisión y seguimiento continuo
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

    // Luego iniciar seguimiento continuo con opciones optimizadas
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        ...options,
        timeout: 30000, // Más tiempo para el seguimiento
        maximumAge: 60000 // Cache por 1 minuto en seguimiento
      }
    );

    console.log('🎯 Geolocalización iniciada manualmente');
  }, [handleLocationSuccess, handleLocationError]);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
      console.log('⏹️ Geolocalización detenida');
    }
  }, []);

  const refreshLocation = useCallback(() => {
    if (navigator.geolocation) {
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
  }, [handleLocationSuccess, handleLocationError]);

  // Función para reiniciar el seguimiento si se detiene
  const restartLocationTracking = useCallback(() => {
    if (isWatching && watchIdRef.current === null) {
      console.log('🔄 Reiniciando seguimiento de geolocalización...');
      startLocationTracking();
    }
  }, [isWatching, startLocationTracking]);

  // Verificar y mantener el seguimiento activo
  useEffect(() => {
    if (isWatching && watchIdRef.current === null) {
      console.log('⚠️ Seguimiento de geolocalización perdido, reiniciando...');
      restartLocationTracking();
    }
  }, [isWatching, restartLocationTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, [stopLocationTracking]);

  return {
    userLocation,
    geolocationError,
    geolocationStatus,
    refreshLocation,
    startLocationTracking,
    stopLocationTracking,
    restartLocationTracking,
    isWatching
  };
};

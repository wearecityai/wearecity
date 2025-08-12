import { useEffect, useRef } from 'react';
import { useGeolocation } from './useGeolocation';

interface UseAutoGeolocationOptions {
  /** Si debe solicitar geolocalización automáticamente */
  autoRequest?: boolean;
  /** Si debe seguir la ubicación continuamente */
  trackLocation?: boolean;
  /** Tiempo en ms para volver a solicitar geolocalización si falla */
  retryDelay?: number;
  /** Callback cuando se obtiene la ubicación exitosamente */
  onLocationObtained?: (location: { latitude: number; longitude: number }) => void;
  /** Callback cuando hay un error de geolocalización */
  onLocationError?: (error: string) => void;
}

export const useAutoGeolocation = (options: UseAutoGeolocationOptions = {}) => {
  const {
    autoRequest = true,
    trackLocation = false,
    retryDelay = 30000, // 30 segundos
    onLocationObtained,
    onLocationError
  } = options;

  const {
    userLocation,
    geolocationError,
    geolocationStatus,
    startLocationTracking,
    stopLocationTracking,
    refreshLocation,
    isWatching
  } = useGeolocation();

  const hasRequestedInitially = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationShownRef = useRef(false);

  // Solicitar geolocalización automáticamente al montar el componente
  useEffect(() => {
    if (autoRequest && !hasRequestedInitially.current && geolocationStatus === 'idle') {
      console.log('🎯 Solicitando geolocalización automáticamente...');
      
      // Mostrar notificación al usuario la primera vez
      if (!notificationShownRef.current) {
        console.log('📍 Esta aplicación necesita acceso a tu ubicación para ofrecerte información personalizada de tu ciudad.');
        notificationShownRef.current = true;
      }
      
      if (trackLocation) {
        startLocationTracking();
      } else {
        refreshLocation();
      }
      
      hasRequestedInitially.current = true;
    }
  }, [autoRequest, trackLocation, geolocationStatus, startLocationTracking, refreshLocation]);

  // Manejar éxito en la obtención de ubicación
  useEffect(() => {
    if (userLocation && geolocationStatus === 'success' && onLocationObtained) {
      onLocationObtained({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      });
      
      // Limpiar cualquier reintento pendiente
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    }
  }, [userLocation, geolocationStatus, onLocationObtained]);

  // Manejar errores y reintentos
  useEffect(() => {
    if (geolocationStatus === 'error' && geolocationError) {
      console.error('❌ Error de geolocalización:', geolocationError);
      
      if (onLocationError) {
        onLocationError(geolocationError);
      }
      
      // Solo reintentar si no es un error de permisos denegados
      if (!geolocationError.includes('denegado') && !geolocationError.includes('denied')) {
        console.log(`🔄 Reintentando geolocalización en ${retryDelay / 1000} segundos...`);
        
        retryTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Reintentando obtener geolocalización...');
          if (trackLocation) {
            startLocationTracking();
          } else {
            refreshLocation();
          }
        }, retryDelay);
      }
    }
  }, [geolocationStatus, geolocationError, onLocationError, retryDelay, trackLocation, startLocationTracking, refreshLocation]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (isWatching) {
        stopLocationTracking();
      }
    };
  }, [isWatching, stopLocationTracking]);

  return {
    userLocation,
    geolocationError,
    geolocationStatus,
    isWatching,
    // Funciones manuales para control explícito
    requestLocation: refreshLocation,
    startTracking: startLocationTracking,
    stopTracking: stopLocationTracking
  };
};
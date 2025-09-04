import { useEffect, useRef, useCallback } from 'react';
import { useGeolocation } from './useGeolocation';

export interface UseAutoGeolocationOptions {
  autoRequest?: boolean;
  trackLocation?: boolean;
  retryDelay?: number;
  onLocationObtained?: (location: { latitude: number; longitude: number }) => void;
  onLocationError?: (error: string) => void;
  persistentTracking?: boolean; // Nueva opción para seguimiento persistente
}

export const useAutoGeolocation = (options: UseAutoGeolocationOptions = {}) => {
  const {
    autoRequest = true,
    trackLocation = true,
    retryDelay = 30000, // 30 segundos
    onLocationObtained,
    onLocationError,
    persistentTracking = true // Por defecto, seguimiento persistente
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
  const persistentTrackingRef = useRef(persistentTracking);

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

  // Manejar errores de geolocalización con reintentos automáticos (menos agresivos)
  useEffect(() => {
    if (geolocationStatus === 'error' && persistentTrackingRef.current) {
      // Solo reintentar si no hay un timeout ya programado
      if (!retryTimeoutRef.current) {
        console.log('⚠️ Error de geolocalización, reintentando en', retryDelay / 1000, 'segundos...');
        
        // Programar reintento automático con delay más largo para evitar spam
        retryTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Reintentando geolocalización automáticamente...');
          if (trackLocation) {
            startLocationTracking();
          } else {
            refreshLocation();
          }
          retryTimeoutRef.current = null; // Limpiar referencia
        }, retryDelay);
      }
    }
  }, [geolocationStatus, retryDelay, trackLocation, startLocationTracking, refreshLocation]);

  // Mantener seguimiento activo si está habilitado
  useEffect(() => {
    if (persistentTracking && trackLocation && !isWatching && geolocationStatus === 'success') {
      console.log('🔄 Reiniciando seguimiento de geolocalización...');
      startLocationTracking();
    }
  }, [persistentTracking, trackLocation, isWatching, geolocationStatus, startLocationTracking]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Función para forzar la activación de geolocalización
  const forceEnableGeolocation = useCallback(() => {
    console.log('🔧 Forzando activación de geolocalización...');
    if (trackLocation) {
      startLocationTracking();
    } else {
      refreshLocation();
    }
    hasRequestedInitially.current = true;
  }, [trackLocation, startLocationTracking, refreshLocation]);

  // Función para desactivar seguimiento persistente
  const disablePersistentTracking = useCallback(() => {
    persistentTrackingRef.current = false;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    console.log('⏹️ Seguimiento persistente de geolocalización desactivado');
  }, []);

  // Función para activar seguimiento persistente
  const enablePersistentTracking = useCallback(() => {
    persistentTrackingRef.current = true;
    console.log('▶️ Seguimiento persistente de geolocalización activado');
    
    // Si no hay ubicación activa, intentar obtenerla
    if (geolocationStatus === 'idle' || geolocationStatus === 'error') {
      forceEnableGeolocation();
    }
  }, [geolocationStatus, forceEnableGeolocation]);

  return {
    userLocation,
    geolocationError,
    geolocationStatus,
    refreshLocation,
    startLocationTracking,
    stopLocationTracking,
    isWatching,
    forceEnableGeolocation,
    disablePersistentTracking,
    enablePersistentTracking,
    isPersistentTrackingEnabled: persistentTrackingRef.current
  };
};
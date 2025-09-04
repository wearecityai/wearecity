import { useEffect, useRef, useCallback } from 'react';
import { useGeolocation } from './useGeolocation';

export const usePersistentGeolocation = () => {
  const {
    userLocation,
    geolocationError,
    geolocationStatus,
    refreshLocation,
    startLocationTracking,
    stopLocationTracking,
    restartLocationTracking,
    isWatching
  } = useGeolocation();

  const hasInitialized = useRef(false);
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar geolocalización al montar el componente
  useEffect(() => {
    if (!hasInitialized.current) {
      console.log('🌍 Inicializando geolocalización persistente...');
      hasInitialized.current = true;
      startLocationTracking();
    }
  }, [startLocationTracking]);

  // Función para verificar el estado de la geolocalización
  const checkGeolocationHealth = useCallback(() => {
    if (geolocationStatus === 'error' || (!isWatching && geolocationStatus !== 'pending')) {
      console.log('⚠️ Geolocalización no está activa, reiniciando...');
      startLocationTracking();
    }
  }, [geolocationStatus, isWatching, startLocationTracking]);

  // Configurar verificación de salud periódica
  useEffect(() => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }

    // Verificar cada 30 segundos si la geolocalización está activa
    healthCheckIntervalRef.current = setInterval(checkGeolocationHealth, 30000);

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [checkGeolocationHealth]);

  // Manejar reintentos automáticos en caso de error (menos agresivos)
  useEffect(() => {
    if (geolocationStatus === 'error') {
      // Solo reintentar si no hay un timeout ya programado
      if (!retryIntervalRef.current) {
        console.log('🔄 Error de geolocalización detectado, reintentando en 30 segundos...');
        
        retryIntervalRef.current = setTimeout(() => {
          console.log('🔄 Reintentando geolocalización...');
          startLocationTracking();
          retryIntervalRef.current = null; // Limpiar referencia
        }, 30000); // Aumentar delay a 30 segundos
      }
    }
  }, [geolocationStatus, startLocationTracking]);

  // Limpiar intervalos al desmontar
  useEffect(() => {
    return () => {
      if (retryIntervalRef.current) {
        clearTimeout(retryIntervalRef.current);
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, []);

  // Función para forzar la reactivación de la geolocalización
  const forceReactivate = useCallback(() => {
    console.log('🔧 Forzando reactivación de geolocalización...');
    stopLocationTracking();
    
    // Pequeño delay antes de reiniciar
    setTimeout(() => {
      startLocationTracking();
    }, 1000);
  }, [stopLocationTracking, startLocationTracking]);

  // Función para obtener ubicación fresca
  const getFreshLocation = useCallback(() => {
    console.log('🔄 Obteniendo ubicación fresca...');
    refreshLocation();
  }, [refreshLocation]);

  return {
    userLocation,
    geolocationError,
    geolocationStatus,
    isWatching,
    refreshLocation: getFreshLocation,
    forceReactivate,
    isHealthy: isWatching && geolocationStatus === 'success'
  };
};

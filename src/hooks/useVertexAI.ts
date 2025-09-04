import { useState, useEffect, useCallback } from 'react';
import { vertexAIService } from '../services/vertexAI';

export interface VertexAIStatus {
  isAvailable: boolean;
  isInitializing: boolean;
  lastChecked: Date | null;
  error: string | null;
  serviceInfo: any;
}

/**
 * Hook para manejar el estado y disponibilidad de Vertex AI
 */
export const useVertexAI = () => {
  const [status, setStatus] = useState<VertexAIStatus>({
    isAvailable: false,
    isInitializing: true,
    lastChecked: null,
    error: null,
    serviceInfo: null
  });

  const checkAvailability = useCallback(async () => {
    setStatus(prev => ({ ...prev, isInitializing: true, error: null }));
    
    try {
      console.log('🔍 Checking Vertex AI availability...');
      
      const isAvailable = await vertexAIService.checkAvailability();
      const serviceInfo = vertexAIService.getServiceInfo();
      
      setStatus({
        isAvailable,
        isInitializing: false,
        lastChecked: new Date(),
        error: null,
        serviceInfo
      });
      
      console.log('✅ Vertex AI availability check completed:', {
        isAvailable,
        serviceInfo: serviceInfo.name
      });
      
    } catch (error) {
      console.error('❌ Vertex AI availability check failed:', error);
      
      setStatus({
        isAvailable: false,
        isInitializing: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Error desconocido',
        serviceInfo: null
      });
    }
  }, []);

  // Verificar disponibilidad al montar el componente
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Verificar disponibilidad periódicamente (cada 5 minutos)
  useEffect(() => {
    const interval = setInterval(() => {
      checkAvailability();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [checkAvailability]);

  return {
    ...status,
    checkAvailability,
    isReady: status.isAvailable && !status.isInitializing
  };
};

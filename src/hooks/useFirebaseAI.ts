import { useState, useEffect, useCallback } from 'react';
import { firebaseAIService, FirebaseAIRequest, FirebaseAIResponse } from '../services/firebaseAI';

interface UseFirebaseAIState {
  isAvailable: boolean;
  isLoading: boolean;
  isConnected: boolean;
  lastChecked: Date | null;
  error: string | null;
  serviceInfo: any;
}

interface UseFirebaseAI {
  state: UseFirebaseAIState;
  checkAvailability: () => Promise<void>;
  sendMessage: (request: FirebaseAIRequest) => Promise<FirebaseAIResponse>;
  resetError: () => void;
}

export const useFirebaseAI = (): UseFirebaseAI => {
  const [state, setState] = useState<UseFirebaseAIState>({
    isAvailable: false,
    isLoading: true,
    isConnected: false,
    lastChecked: null,
    error: null,
    serviceInfo: null
  });

  const checkAvailability = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const isAvailable = await firebaseAIService.checkAvailability();
      const serviceInfo = firebaseAIService.getServiceInfo();
      
      setState(prev => ({
        ...prev,
        isAvailable,
        isConnected: isAvailable,
        isLoading: false,
        lastChecked: new Date(),
        error: null,
        serviceInfo
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAvailable: false,
        isConnected: false,
        isLoading: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Error desconocido',
        serviceInfo: null
      }));
    }
  }, []);

  const sendMessage = useCallback(async (request: FirebaseAIRequest): Promise<FirebaseAIResponse> => {
    if (!state.isAvailable) {
      throw new Error('El servicio de IA no está disponible');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await firebaseAIService.sendMessage(request);
      setState(prev => ({ ...prev, isLoading: false, error: null }));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [state.isAvailable]);

  const resetError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Verificar disponibilidad al montar el hook
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Verificar disponibilidad periódicamente cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.isLoading) {
        checkAvailability();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [checkAvailability, state.isLoading]);

  return {
    state,
    checkAvailability,
    sendMessage,
    resetError
  };
};

import { useState, useEffect, useCallback } from 'react';
import { AIProvider } from '../components/AIProviderSelector';

const AI_PROVIDER_STORAGE_KEY = 'wearecity_ai_provider';

/**
 * Hook para manejar el estado del proveedor de IA seleccionado
 */
export const useAIProvider = () => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('firebase');

  // Cargar proveedor guardado al inicializar
  useEffect(() => {
    const savedProvider = localStorage.getItem(AI_PROVIDER_STORAGE_KEY) as AIProvider;
    if (savedProvider && (savedProvider === 'firebase' || savedProvider === 'vertex')) {
      setSelectedProvider(savedProvider);
    }
  }, []);

  // Guardar proveedor cuando cambie
  const handleProviderChange = useCallback((provider: AIProvider) => {
    setSelectedProvider(provider);
    localStorage.setItem(AI_PROVIDER_STORAGE_KEY, provider);
    console.log('🔄 AI Provider changed to:', provider);
  }, []);

  // Obtener información del proveedor actual
  const getCurrentProviderInfo = useCallback(() => {
    switch (selectedProvider) {
      case 'firebase':
        return {
          name: 'Firebase AI',
          description: 'Google AI (Gemini) con Firebase AI Logic',
          features: [
            'Chat en tiempo real',
            'Contexto de ciudad',
            'Búsqueda en tiempo real',
            'SDK oficial de Firebase'
          ]
        };
      case 'vertex':
        return {
          name: 'Vertex AI',
          description: 'Google Cloud AI Platform con instrucciones dinámicas',
          features: [
            'Instrucciones dinámicas',
            'Detección automática de intenciones',
            'Geolocalización inteligente',
            'Anti-alucinación para trámites',
            'Formateo automático de cards'
          ]
        };
      default:
        return {
          name: 'Unknown',
          description: 'Proveedor desconocido',
          features: []
        };
    }
  }, [selectedProvider]);

  return {
    selectedProvider,
    setSelectedProvider: handleProviderChange,
    getCurrentProviderInfo,
    isFirebase: selectedProvider === 'firebase',
    isVertex: selectedProvider === 'vertex'
  };
};

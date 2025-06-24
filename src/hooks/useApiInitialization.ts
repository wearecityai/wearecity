import { useState, useEffect } from 'react';
import { initializeGeminiService } from '../services/geminiService';

export const useApiInitialization = () => {
  const [isGeminiReady, setIsGeminiReady] = useState<boolean>(false);
  const [appError, setAppError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Gemini service with hardcoded API key
    if (initializeGeminiService()) {
      setIsGeminiReady(true);
      setAppError(null);
    } else {
      setIsGeminiReady(false);
      setAppError("Error al inicializar el servicio Gemini.");
    }
  }, []);

  return {
    isGeminiReady,
    setIsGeminiReady,
    appError,
    setAppError
  };
};

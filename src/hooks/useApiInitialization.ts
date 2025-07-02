import { useState } from 'react';

export const useApiInitialization = () => {
  // El servicio Gemini ya no se inicializa en el frontend
  const [isGeminiReady] = useState<boolean>(true);
  const [appError, setAppError] = useState<string | null>(null);

  return {
    isGeminiReady,
    setIsGeminiReady: () => {},
    appError,
    setAppError
  };
};

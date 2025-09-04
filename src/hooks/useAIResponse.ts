import { useState, useCallback } from 'react';
import { AIResponseRenderer } from '../components/AIResponseRenderer';

interface UseAIResponseOptions {
  onError?: (error: Error) => void;
  onSuccess?: (response: string) => void;
}

export const useAIResponse = (options: UseAIResponseOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string, context?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      // Aquí iría la llamada a tu API de IA
      // Por ahora, simulamos una respuesta
      const response = await new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve(`## 🎯 Respuesta de la IA

### 📋 **Información Procesada**
| Campo | Valor |
|-------|-------|
| **Mensaje** | ${message} |
| **Contexto** | ${context ? 'Disponible' : 'No disponible'} |
| **Estado** | ✅ Procesado |

### 🔹 **Detalles**
- **Timestamp:** ${new Date().toISOString()}
- **Procesamiento:** Completado exitosamente
- **Formato:** Markdown avanzado

> **💡 Tip:** Esta es una respuesta de ejemplo con el nuevo formato

---
`);
        }, 1000);
      });

      options.onSuccess?.(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      options.onError?.(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const renderResponse = useCallback((content: string, className?: string) => {
    return <AIResponseRenderer content={content} className={className} />;
  }, []);

  return {
    sendMessage,
    renderResponse,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};

export default useAIResponse;

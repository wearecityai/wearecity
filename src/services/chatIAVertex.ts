import { vertexAIService, VertexAIRequest } from './vertexAI';

export async function fetchChatIAVertex(
  userMessage: string,
  options?: {
    allowMapDisplay?: boolean,
    customSystemInstruction?: string,
    userId?: string,
    userLocation?: { lat: number; lng: number };
    citySlug?: string;
    cityId?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    mode?: 'fast' | 'quality';
    userContext?: {
      isTourist?: boolean;
      language?: string;
      accessibility?: boolean;
      urgency?: 'low' | 'medium' | 'high' | 'emergency';
    };
  }
) {
  console.log('🚀 Vertex AI - fetchChatIAVertex called with:', {
    userMessage,
    options,
    citySlug: options?.citySlug,
    cityId: options?.cityId,
    conversationHistoryLength: options?.conversationHistory?.length || 0
  });

  try {
    // Verificar disponibilidad del servicio Vertex AI
    const isAvailable = await vertexAIService.checkAvailability();
    
    if (!isAvailable) {
      throw new Error('El servicio de Vertex AI no está disponible en este momento. Por favor, intenta más tarde.');
    }

    // Preparar la petición para Vertex AI
    const request: VertexAIRequest = {
      userMessage,
      userId: options?.userId,
      userLocation: options?.userLocation,
      allowMapDisplay: options?.allowMapDisplay ?? false,
      customSystemInstruction: options?.customSystemInstruction ?? "",
      citySlug: options?.citySlug,
      cityId: options?.cityId,
      conversationHistory: options?.conversationHistory || [],
      mode: options?.mode || 'quality',
      userContext: options?.userContext || {}
    };

    console.log('🚀 Vertex AI - Sending request to Vertex AI');

    // Enviar mensaje usando Vertex AI
    const response = await vertexAIService.sendMessage(request);

    console.log('🚀 Vertex AI - Response received:', {
      responseLength: response.response.length,
      eventsCount: response.events?.length || 0,
      placeCardsCount: response.placeCards?.length || 0,
      aiProvider: response.context?.aiProvider
    });

    return response;

  } catch (error) {
    console.error('🚀 Vertex AI - Error in fetchChatIAVertex:', error);
    
    // Reintentar con modo fallback si es un error de timeout
    if (error instanceof Error && error.message.includes('timeout')) {
      console.log('🚀 Vertex AI - Retrying with fast mode due to timeout');
      
      try {
        const fallbackRequest: VertexAIRequest = {
          userMessage,
          userId: options?.userId,
          userLocation: options?.userLocation,
          allowMapDisplay: options?.allowMapDisplay ?? false,
          customSystemInstruction: options?.customSystemInstruction ?? "",
          citySlug: options?.citySlug,
          cityId: options?.cityId,
          conversationHistory: options?.conversationHistory || [],
          mode: 'fast', // Usar modo rápido como fallback
          userContext: {
            ...options?.userContext,
            urgency: 'low' // Reducir urgencia para respuesta más rápida
          }
        };

        const fallbackResponse = await vertexAIService.sendMessage(fallbackRequest);
        console.log('🚀 Vertex AI - Fallback response successful');
        return fallbackResponse;

      } catch (fallbackError) {
        console.error('🚀 Vertex AI - Fallback also failed:', fallbackError);
        throw new Error('No se pudo obtener respuesta del asistente Vertex AI. Por favor, intenta más tarde.');
      }
    }
    
    throw error;
  }
}

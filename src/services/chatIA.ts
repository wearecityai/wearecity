import { firebaseAIService, FirebaseAIRequest } from './firebaseAI';

export async function fetchChatIA(
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
    historyWindow?: number;
    timeoutMs?: number;
  }
) {
  console.log('🚀 Firebase AI Logic - fetchChatIA called with:', {
    userMessage,
    options,
    citySlug: options?.citySlug,
    cityId: options?.cityId,
    conversationHistoryLength: options?.conversationHistory?.length || 0
  });

  try {
    // Verificar disponibilidad del servicio Firebase AI Logic
    const isAvailable = await firebaseAIService.checkAvailability();
    
    if (!isAvailable) {
      throw new Error('El servicio de IA no está disponible en este momento. Por favor, intenta más tarde.');
    }

    // Preparar la petición para Firebase AI Logic
    const request: FirebaseAIRequest = {
      userMessage,
      userId: options?.userId,
      userLocation: options?.userLocation,
      allowMapDisplay: options?.allowMapDisplay ?? false,
      customSystemInstruction: options?.customSystemInstruction ?? "",
      citySlug: options?.citySlug,
      cityId: options?.cityId,
      conversationHistory: options?.conversationHistory || [],
      mode: options?.mode || 'quality',
      historyWindow: options?.historyWindow,
      timeoutMs: options?.timeoutMs
    };

    console.log('🚀 Firebase AI Logic - Sending request to Firebase AI Logic');

    // Enviar mensaje usando Firebase AI Logic
    const response = await firebaseAIService.sendMessage(request);

    console.log('🚀 Firebase AI Logic - Response received:', {
      responseLength: response.response.length,
      eventsCount: response.events?.length || 0,
      placeCardsCount: response.placeCards?.length || 0
    });

    return response;

  } catch (error) {
    console.error('🚀 Firebase AI Logic - Error in fetchChatIA:', error);
    
    // Reintentar con modo fallback si es un error de timeout
    if (error instanceof Error && error.message.includes('timeout')) {
      console.log('🚀 Firebase AI Logic - Retrying with fast mode due to timeout');
      
      try {
        const fallbackRequest: FirebaseAIRequest = {
          userMessage,
          userId: options?.userId,
          userLocation: options?.userLocation,
          allowMapDisplay: options?.allowMapDisplay ?? false,
          customSystemInstruction: options?.customSystemInstruction ?? "",
          citySlug: options?.citySlug,
          cityId: options?.cityId,
          conversationHistory: options?.conversationHistory || [],
          mode: 'fast', // Usar modo rápido como fallback
          historyWindow: options?.historyWindow || 5, // Reducir contexto para respuesta más rápida
          timeoutMs: 30000 // Timeout más corto
        };

        const fallbackResponse = await firebaseAIService.sendMessage(fallbackRequest);
        console.log('🚀 Firebase AI Logic - Fallback response successful');
        return fallbackResponse;

      } catch (fallbackError) {
        console.error('🚀 Firebase AI Logic - Fallback also failed:', fallbackError);
        throw new Error('No se pudo obtener respuesta del asistente. Por favor, intenta más tarde.');
      }
    }
    
    throw error;
  }
}
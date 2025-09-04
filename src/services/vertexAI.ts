import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../integrations/firebase/config';

// Inicializar Firebase Functions
const functions = getFunctions(app);

export interface VertexAIRequest {
  userMessage: string;
  userId?: string;
  userLocation?: { lat: number; lng: number };
  allowMapDisplay?: boolean;
  customSystemInstruction?: string;
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

export interface VertexAIResponse {
  response: string;
  events?: any[];
  placeCards?: any[];
  context?: {
    city?: string;
    userContext?: any;
    timestamp?: string;
    aiProvider?: string;
  };
  error?: string;
}

/**
 * Servicio para interactuar con Vertex AI usando Firebase Functions
 * Implementación completa con instrucciones dinámicas y búsqueda en tiempo real
 */
export class VertexAIService {
  private static instance: VertexAIService;
  private chatFunction: any;

  private constructor() {
    // Inicializar función callable de Vertex AI
    this.chatFunction = httpsCallable(functions, 'chatIAVertex');
    console.log('✅ Vertex AI Service initialized');
  }

  public static getInstance(): VertexAIService {
    if (!VertexAIService.instance) {
      VertexAIService.instance = new VertexAIService();
    }
    return VertexAIService.instance;
  }

  /**
   * Enviar mensaje al chat IA usando Vertex AI
   */
  async sendMessage(request: VertexAIRequest): Promise<VertexAIResponse> {
    try {
      console.log('🚀 Vertex AI - Enviando mensaje:', {
        userMessage: request.userMessage.substring(0, 100) + '...',
        citySlug: request.citySlug,
        cityId: request.cityId,
        conversationHistoryLength: request.conversationHistory?.length || 0,
        mode: request.mode,
        userContext: request.userContext
      });

      // Llamar a la función de Vertex AI
      const result = await this.chatFunction({
        userMessage: request.userMessage,
        userId: request.userId,
        userLocation: request.userLocation,
        allowMapDisplay: request.allowMapDisplay ?? false,
        customSystemInstruction: request.customSystemInstruction ?? '',
        citySlug: request.citySlug,
        cityId: request.cityId,
        conversationHistory: request.conversationHistory || [],
        mode: request.mode || 'quality',
        userContext: request.userContext || {}
      });

      console.log('🚀 Vertex AI - Respuesta recibida:', {
        responseLength: result.data.response?.length || 0,
        eventsCount: result.data.events?.length || 0,
        placeCardsCount: result.data.placeCards?.length || 0,
        aiProvider: result.data.context?.aiProvider
      });

      return {
        response: result.data.response,
        events: result.data.events || [],
        placeCards: result.data.placeCards || [],
        context: result.data.context
      };

    } catch (error) {
      console.error('🚀 Vertex AI - Error al enviar mensaje:', error);
      
      // Manejar errores específicos
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          throw new Error('La petición tardó demasiado tiempo. Por favor, intenta de nuevo.');
        }
        
        if (error.message.includes('unavailable') || error.message.includes('network')) {
          throw new Error('Error de conexión. Verifica tu conexión a internet e intenta de nuevo.');
        }
        
        if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          throw new Error('No tienes permisos para usar este servicio. Contacta al administrador.');
        }

        if (error.message.includes('functions/invalid-argument')) {
          throw new Error('Parámetros inválidos en la petición. Por favor, verifica los datos enviados.');
        }

        if (error.message.includes('functions/internal')) {
          throw new Error('Error interno del servidor. Por favor, intenta más tarde.');
        }
      }
      
      throw new Error(`Error al comunicarse con Vertex AI: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Verificar si el servicio está disponible
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Intentar hacer una petición simple para verificar disponibilidad
      const testRequest: VertexAIRequest = {
        userMessage: 'Hola, ¿estás funcionando?',
        mode: 'fast'
      };
      
      await this.sendMessage(testRequest);
      return true;
    } catch (error) {
      console.warn('🚀 Vertex AI - Servicio no disponible:', error);
      return false;
    }
  }

  /**
   * Obtener información del servicio
   */
  getServiceInfo() {
    return {
      name: 'Vertex AI',
      provider: 'Google Cloud AI Platform',
      models: ['gemini-1.5-flash'],
      features: [
        'Chat con instrucciones dinámicas',
        'Contexto de ciudad inteligente',
        'Historial de conversación',
        'Modos rápido/calidad',
        'Búsqueda en tiempo real integrada',
        'Detección automática de intenciones',
        'Geolocalización automática',
        'Anti-alucinación para trámites',
        'Formateo automático de PlaceCards y EventCards',
        'Contexto de usuario personalizable'
      ],
      capabilities: {
        realTimeSearch: true,
        dynamicInstructions: true,
        intentDetection: true,
        geolocation: true,
        placeCards: true,
        eventCards: true,
        antiHallucination: true
      }
    };
  }
}

// Exportar instancia singleton
export const vertexAIService = VertexAIService.getInstance();

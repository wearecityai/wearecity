import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { app } from '../integrations/firebase/config';

// Inicializar Firebase AI Logic con el backend de Google AI
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Crear instancia del modelo Gemini
const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

export interface FirebaseAIRequest {
  userMessage: string;
  userId?: string;
  userLocation?: { lat: number; lng: number };
  allowMapDisplay?: boolean;
  customSystemInstruction?: string;
  citySlug?: string;
  cityId?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  mode?: 'fast' | 'quality';
  historyWindow?: number;
  timeoutMs?: number;
}

export interface FirebaseAIResponse {
  response: string;
  events?: any[];
  placeCards?: any[];
  error?: string;
}

/**
 * Servicio para interactuar con Firebase AI Functions
 */
export class FirebaseAIService {
  private static instance: FirebaseAIService;
  private chatSession: any;

  private constructor() {
    // Inicializar sesión de chat
    this.chatSession = model.startChat({
      history: [],
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2000,
      },
    });
  }

  public static getInstance(): FirebaseAIService {
    if (!FirebaseAIService.instance) {
      FirebaseAIService.instance = new FirebaseAIService();
    }
    return FirebaseAIService.instance;
  }

  /**
   * Enviar mensaje al chat IA usando Firebase AI Logic
   */
  async sendMessage(request: FirebaseAIRequest): Promise<FirebaseAIResponse> {
    try {
      console.log('🚀 Firebase AI Logic - Enviando mensaje:', {
        userMessage: request.userMessage.substring(0, 100) + '...',
        citySlug: request.citySlug,
        cityId: request.cityId,
        conversationHistoryLength: request.conversationHistory?.length || 0,
        mode: request.mode
      });

      // Construir el prompt del sistema
      let systemPrompt = `Eres un asistente de ciudad inteligente y amigable. Tu objetivo es ayudar a los usuarios con información sobre su ciudad, servicios municipales, eventos, lugares de interés y cualquier consulta relacionada con la vida urbana.

Debes ser:
- Útil y preciso en tus respuestas
- Amigable y accesible
- Conocedor de la ciudad y sus servicios
- Capaz de proporcionar información práctica y actualizada

${request.customSystemInstruction ? `Instrucción específica: ${request.customSystemInstruction}` : ''}`;

      // Añadir contexto de la ciudad si está disponible
      if (request.citySlug) {
        systemPrompt += `\n\nContexto de la ciudad: ${request.citySlug}`;
      }

      // Añadir contexto de ubicación si está disponible
      if (request.userLocation) {
        systemPrompt += `\n\nUbicación del usuario: Latitud ${request.userLocation.lat}, Longitud ${request.userLocation.lng}`;
      }

      // Añadir instrucciones para mapas si está permitido
      if (request.allowMapDisplay) {
        systemPrompt += `\n\nPuedes sugerir mostrar mapas cuando sea relevante para la consulta del usuario.`;
      }

      // Construir el historial de conversación para el contexto
      const recentHistory = request.conversationHistory
        ?.slice(-(request.historyWindow || 10))
        .map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`)
        .join('\n') || '';

      // Construir el prompt completo
      const fullPrompt = `${systemPrompt}

${recentHistory ? `Historial reciente de la conversación:\n${recentHistory}\n\n` : ''}Usuario: ${request.userMessage}

Asistente:`;

      console.log('🚀 Firebase AI Logic - Prompt del sistema construido, longitud:', fullPrompt.length);

      // Crear un timeout para la petición
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout: La petición tardó demasiado tiempo'));
        }, request.timeoutMs || 60000); // 60 segundos por defecto
      });

      // Ejecutar la generación de contenido con timeout
      const resultPromise = model.generateContent(fullPrompt);
      
      const result = await Promise.race([resultPromise, timeoutPromise]);
      
      console.log('🚀 Firebase AI Logic - Respuesta generada, longitud:', result.response.text().length);

      return {
        response: result.response.text(),
        events: [],
        placeCards: []
      };

    } catch (error) {
      console.error('🚀 Firebase AI Logic - Error al enviar mensaje:', error);
      
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
      }
      
      throw new Error(`Error al comunicarse con el asistente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Verificar si el servicio está disponible
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Intentar hacer una petición simple para verificar disponibilidad
      const testRequest: FirebaseAIRequest = {
        userMessage: 'Hola, ¿estás funcionando?',
        mode: 'fast'
      };
      
      await this.sendMessage(testRequest);
      return true;
    } catch (error) {
      console.warn('🚀 Firebase AI Logic - Servicio no disponible:', error);
      return false;
    }
  }

  /**
   * Obtener información del servicio
   */
  getServiceInfo() {
    return {
      name: 'Firebase AI Logic',
      provider: 'Google AI (Gemini)',
      models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
      features: ['Chat en tiempo real', 'Contexto de ciudad', 'Historial de conversación', 'Modos rápido/calidad', 'SDK oficial de Firebase']
    };
  }
}

// Exportar instancia singleton
export const firebaseAIService = FirebaseAIService.getInstance();

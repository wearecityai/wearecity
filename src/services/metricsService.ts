import { db } from '@/integrations/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';

const functions = getFunctions();

// Interfaz para métricas de chat
export interface ChatMetricData {
  cityId: string;
  userId?: string;
  sessionId?: string;
  messageContent: string;
  messageType: 'user' | 'assistant';
  responseTimeMs?: number;
  tokensUsed?: number;
}

// Clase para gestionar métricas en tiempo real
export class MetricsService {
  private static instance: MetricsService;
  private sessionId: string;
  private startTimes: Map<string, number> = new Map();

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Registrar cuando un usuario envía un mensaje
  public recordUserMessage(citySlugOrId: string, userId: string | undefined, message: string): void {
    const messageId = `msg_${Date.now()}`;
    this.startTimes.set(messageId, Date.now());

    // Registrar la métrica del usuario (usando slug como cityId por ahora)
    this.recordMetricAsync({
      cityId: citySlugOrId, // Esto podría ser slug o ID
      userId,
      sessionId: this.sessionId,
      messageContent: message,
      messageType: 'user'
    });
    
    console.log('📊 Recording user message for city:', citySlugOrId, 'message length:', message.length);
  }

  // Registrar cuando la IA responde
  public recordAssistantResponse(
    citySlugOrId: string, 
    userId: string | undefined, 
    response: string, 
    tokensUsed?: number
  ): void {
    // Calcular tiempo de respuesta basado en el último mensaje
    const lastStartTime = Array.from(this.startTimes.values()).pop();
    const responseTimeMs = lastStartTime ? Date.now() - lastStartTime : undefined;

    // Limpiar tiempos antiguos
    this.startTimes.clear();

    // Registrar la métrica de la respuesta
    this.recordMetricAsync({
      cityId: citySlugOrId, // Esto podría ser slug o ID
      userId,
      sessionId: this.sessionId,
      messageContent: response,
      messageType: 'assistant',
      responseTimeMs,
      tokensUsed
    });
    
    console.log('📊 Recording assistant response for city:', citySlugOrId, 'responseTime:', responseTimeMs, 'ms');
  }

  // Método privado para registrar métricas de forma asíncrona
  private async recordMetricAsync(data: ChatMetricData): Promise<void> {
    try {
      // Usar Firebase Function para registrar y clasificar
      const recordMetric = httpsCallable(functions, 'recordChatMetric');
      
      await recordMetric({
        cityId: data.cityId,
        userId: data.userId,
        sessionId: data.sessionId,
        messageContent: data.messageContent,
        messageType: data.messageType,
        responseTimeMs: data.responseTimeMs,
        tokensUsed: data.tokensUsed
      });

      console.log('📊 Metric recorded:', {
        city: data.cityId,
        type: data.messageType,
        responseTime: data.responseTimeMs
      });

    } catch (error) {
      console.error('Error recording metric:', error);
      
      // Fallback: guardar directamente en Firestore sin clasificación
      try {
        await addDoc(collection(db, 'chat_analytics'), {
          city_id: data.cityId,
          user_id: data.userId || null,
          session_id: data.sessionId,
          message_content: data.messageContent,
          message_type: data.messageType,
          category_id: null, // Se clasificará después
          response_time_ms: data.responseTimeMs || null,
          tokens_used: data.tokensUsed || null,
          created_at: serverTimestamp()
        });

        console.log('📊 Metric recorded (fallback)');
      } catch (fallbackError) {
        console.error('Error recording metric (fallback):', fallbackError);
      }
    }
  }

  // Inicializar categorías (solo admin)
  public async initializeCategories(): Promise<void> {
    try {
      const initCategories = httpsCallable(functions, 'initializeCategories');
      const result = await initCategories();
      console.log('Categories initialized:', result.data);
    } catch (error) {
      console.error('Error initializing categories:', error);
    }
  }

  // Obtener métricas de una ciudad (para dashboard)
  public async getCityMetrics(
    cityId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<any> {
    try {
      const getMetrics = httpsCallable(functions, 'getCityMetrics');
      const result = await getMetrics({
        cityId,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      });

      return result.data;
    } catch (error) {
      console.error('Error getting city metrics:', error);
      return { success: false, metrics: [], total: 0 };
    }
  }

  // Obtener nueva sesión (cuando empieza nueva conversación)
  public resetSession(): void {
    this.sessionId = this.generateSessionId();
    this.startTimes.clear();
  }

  // Obtener ID de sesión actual
  public getSessionId(): string {
    return this.sessionId;
  }
}

// Hook personalizado para usar el servicio de métricas
export const useMetrics = () => {
  const metricsService = MetricsService.getInstance();

  const recordUserMessage = (cityId: string, userId: string | undefined, message: string) => {
    metricsService.recordUserMessage(cityId, userId, message);
  };

  const recordAssistantResponse = (
    cityId: string, 
    userId: string | undefined, 
    response: string, 
    tokensUsed?: number
  ) => {
    metricsService.recordAssistantResponse(cityId, userId, response, tokensUsed);
  };

  const resetSession = () => {
    metricsService.resetSession();
  };

  const getSessionId = () => {
    return metricsService.getSessionId();
  };

  return {
    recordUserMessage,
    recordAssistantResponse,
    resetSession,
    getSessionId
  };
};

// Hook para administradores
export const useAdminMetrics = () => {
  const metricsService = MetricsService.getInstance();

  const initializeCategories = async () => {
    await metricsService.initializeCategories();
  };

  const getCityMetrics = async (cityId: string, startDate?: Date, endDate?: Date) => {
    return await metricsService.getCityMetrics(cityId, startDate, endDate);
  };

  return {
    initializeCategories,
    getCityMetrics
  };
};

export default MetricsService;
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { app } from '../integrations/firebase/config';
import { firebaseRealTimeSearchService } from './firebaseRealTimeSearch';

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
  realTimeData?: {
    places?: any[];
    searchResults?: any[];
    events?: any[];
    info?: any[];
  };
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

      // Realizar búsqueda en tiempo real si es necesario
      let realTimeData = null;
      if (this.shouldPerformRealTimeSearch(request.userMessage)) {
        try {
          realTimeData = await firebaseRealTimeSearchService.intelligentSearch({
            query: request.userMessage,
            city: request.citySlug || request.cityId || 'ciudad',
            location: request.userLocation,
            userType: this.detectUserType(request.userMessage, request.conversationHistory),
            urgency: this.detectUrgency(request.userMessage)
          });

          console.log('🚀 Firebase AI Logic - Datos en tiempo real obtenidos:', {
            places: realTimeData.places?.length || 0,
            events: realTimeData.events?.length || 0,
            searchResults: realTimeData.searchResults?.length || 0,
            info: realTimeData.info?.length || 0
          });
        } catch (error) {
          console.warn('🚀 Firebase AI Logic - Error en búsqueda en tiempo real:', error);
          // Continuar sin datos en tiempo real
        }
      }

      // Obtener información de fecha y hora actual
      const now = new Date();
      const currentDateTime = {
        date: now.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: now.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        iso: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // Construir el prompt del sistema con capacidades de búsqueda en tiempo real
      let systemPrompt = `Eres un asistente de ciudad inteligente y amigable con acceso a información en tiempo real. Tu objetivo es ayudar a los usuarios con información sobre su ciudad, servicios municipales, eventos, lugares de interés y cualquier consulta relacionada con la vida urbana.

🕐 **INFORMACIÓN TEMPORAL ACTUAL (SOLO USAR CUANDO SEA RELEVANTE):**
- **Fecha actual:** ${currentDateTime.date}
- **Hora actual:** ${currentDateTime.time}
- **Zona horaria:** ${currentDateTime.timezone}

**INSTRUCCIONES OPTIMIZADAS PARA USO DE FECHA Y HORA:**
⚠️ **USO SELECTIVO:** Solo menciona la fecha/hora cuando sea directamente relevante para la respuesta.

**CASOS DONDE SÍ USAR INFORMACIÓN TEMPORAL:**
- Preguntas sobre tiempo: "¿Qué hora es?", "¿Cuánto falta para...?"
- Eventos con fechas específicas: "¿Qué eventos hay hoy/mañana?"
- Horarios de servicios: "¿Está abierto el ayuntamiento?"
- Recomendaciones por momento: "¿Dónde puedo desayunar/almorzar/cenar?"
- Transporte: "¿Qué horarios tiene el autobús?"
- Trámites: "¿Puedo hacer trámites ahora?"

**CASOS DONDE NO USAR INFORMACIÓN TEMPORAL:**
❌ Preguntas generales: "¿Qué restaurantes hay?", "¿Dónde está el ayuntamiento?"
❌ Información estática: "¿Qué monumentos hay?", "¿Cómo llegar a...?"
❌ Consultas sin urgencia temporal: "¿Qué actividades puedo hacer?"

**REGLAS DE USO:**
- ✅ Solo menciona la hora cuando el usuario pregunte específicamente sobre tiempo
- ❌ NO menciones la hora en respuestas generales o informativas

## 🚀 CAPACIDADES DE BÚSQUEDA EN TIEMPO REAL

Tienes acceso a:
- **Google Places API**: Para buscar restaurantes, monumentos, instituciones, lugares públicos, farmacias, hospitales, estaciones de transporte
- **Google Search API**: Para buscar eventos actuales, información de trámites, noticias locales, información turística

### INSTRUCCIONES PARA USAR DATOS EN TIEMPO REAL:
1. **SIEMPRE** usa la información en tiempo real cuando esté disponible
2. **PRIORIZA** datos actualizados sobre información estática
3. **COMBINA** información de múltiples fuentes para respuestas completas
4. **MENCIÓN** que la información es actualizada cuando uses datos en tiempo real

Debes ser:
- Útil y preciso en tus respuestas
- Amigable y accesible
- Conocedor de la ciudad y sus servicios
- Capaz de proporcionar información práctica y actualizada
- Proactivo en buscar información actual cuando sea necesario

## 🎨 **FORMATO PROFESIONAL DE RESPUESTAS:**

### **ESTRUCTURA Y ORGANIZACIÓN:**
- **Títulos principales:** \`## 📍 Título Principal\`
- **Subtítulos:** \`### 🔹 Subtítulo\`
- **Listas:** \`• Elemento principal\` y \`  ◦ Sub-elemento\`
- **Iconos temáticos:** 🏛️ 🍽️ 🏥 🚌 🎉 📋 📞 🕐 📍

### **FORMATO DE INFORMACIÓN:**
- **Lugares:** \`## 🏪 [Nombre]\` con **📍 Dirección**, **🕐 Horario**, **📞 Teléfono**
- **Eventos:** \`## 🎉 [Evento]\` con **📅 Fecha**, **🕐 Hora**, **📍 Ubicación**
- **Trámites:** \`## 📋 [Trámite]\` con pasos numerados y documentación requerida
- **Separadores:** Usa \`---\` para dividir secciones

### **ELEMENTOS VISUALES:**
- **Alertas:** \`⚠️ Importante:\` para advertencias
- **Éxito:** \`✅ Correcto:\` para confirmaciones
- **Información:** \`ℹ️ Nota:\` para detalles adicionales

### **EJEMPLO DE FORMATO:**
\`\`\`
## 🍽️ Restaurantes Recomendados

### 🔹 Opciones Principales:
• **Restaurante A** - Cocina mediterránea
• **Restaurante B** - Especialidad en pescado

### 🔹 Información Útil:
**📍 Ubicación:** Centro histórico
**🕐 Horario:** 12:00-23:00
**💰 Precio:** €15-€35

---
\`\`\`

**OBJETIVO:** Crear respuestas visualmente atractivas, bien estructuradas y fáciles de leer.

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

      // Añadir datos en tiempo real al prompt si están disponibles
      if (realTimeData) {
        systemPrompt += `\n\n## 📊 DATOS EN TIEMPO REAL DISPONIBLES:\n`;
        
        if (realTimeData.places && realTimeData.places.length > 0) {
          systemPrompt += `\n### 🏢 LUGARES ENCONTRADOS:\n`;
          realTimeData.places.slice(0, 5).forEach((place, index) => {
            systemPrompt += `${index + 1}. **${place.name}** - ${place.formatted_address}`;
            if (place.rating) systemPrompt += ` (⭐ ${place.rating}/5)`;
            if (place.opening_hours?.open_now !== undefined) {
              systemPrompt += ` - ${place.opening_hours.open_now ? '🟢 Abierto' : '🔴 Cerrado'}`;
            }
            systemPrompt += `\n`;
          });
        }

        if (realTimeData.events && realTimeData.events.length > 0) {
          systemPrompt += `\n### 🎉 EVENTOS ACTUALES:\n`;
          realTimeData.events.slice(0, 3).forEach((event, index) => {
            systemPrompt += `${index + 1}. **${event.title}** - ${event.snippet}\n`;
          });
        }

        if (realTimeData.searchResults && realTimeData.searchResults.length > 0) {
          systemPrompt += `\n### 🔍 INFORMACIÓN ACTUALIZADA:\n`;
          realTimeData.searchResults.slice(0, 3).forEach((result, index) => {
            systemPrompt += `${index + 1}. **${result.title}** - ${result.snippet}\n`;
          });
        }

        systemPrompt += `\n**IMPORTANTE**: Usa esta información en tiempo real para proporcionar respuestas actualizadas y precisas.`;
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
        events: realTimeData?.events || [],
        placeCards: realTimeData?.places || [],
        realTimeData: realTimeData ? {
          places: realTimeData.places,
          searchResults: realTimeData.searchResults,
          events: realTimeData.events,
          info: realTimeData.info
        } : undefined
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
   * Determinar si se debe realizar búsqueda en tiempo real
   */
  private shouldPerformRealTimeSearch(userMessage: string): boolean {
    const lowerMessage = userMessage.toLowerCase();
    
    // Palabras clave que indican necesidad de búsqueda en tiempo real
    const realTimeKeywords = [
      'restaurante', 'comida', 'cena', 'almuerzo',
      'monumento', 'museo', 'iglesia', 'castillo',
      'evento', 'actividad', 'concierto', 'festival',
      'farmacia', 'hospital', 'medico', 'urgencias',
      'metro', 'bus', 'transporte', 'estacion',
      'ayuntamiento', 'tramite', 'proceso',
      'hoy', 'mañana', 'esta semana', 'actual',
      'donde', 'como', 'cuando', 'que'
    ];

    return realTimeKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Detectar el tipo de usuario
   */
  private detectUserType(userMessage: string, conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>): 'tourist' | 'resident' {
    const lowerMessage = userMessage.toLowerCase();
    const fullContext = conversationHistory?.map(msg => msg.content).join(' ').toLowerCase() || '';
    
    const touristKeywords = [
      'turista', 'visitar', 'viaje', 'hotel', 'alojamiento',
      'que ver', 'lugares turisticos', 'monumentos', 'museos',
      'primera vez', 'no conozco', 'recomendaciones turisticas'
    ];

    const residentKeywords = [
      'tramite', 'ayuntamiento', 'servicios municipales',
      'empadronamiento', 'licencia', 'permiso',
      'basura', 'limpieza', 'mantenimiento'
    ];

    const allText = `${lowerMessage} ${fullContext}`;
    
    if (touristKeywords.some(keyword => allText.includes(keyword))) {
      return 'tourist';
    }
    
    if (residentKeywords.some(keyword => allText.includes(keyword))) {
      return 'resident';
    }

    return 'resident'; // Por defecto
  }

  /**
   * Detectar urgencia de la consulta
   */
  private detectUrgency(userMessage: string): 'low' | 'medium' | 'high' {
    const lowerMessage = userMessage.toLowerCase();
    
    const highUrgencyKeywords = [
      'urgencia', 'emergencia', 'urgente', 'inmediato',
      'accidente', 'incendio', 'robo', 'asalto',
      'ambulancia', 'policia', 'bomberos'
    ];

    const mediumUrgencyKeywords = [
      'rapido', 'pronto', 'hoy', 'mañana',
      'problema', 'incidencia', 'averia'
    ];

    if (highUrgencyKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    }
    
    if (mediumUrgencyKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Obtener información del servicio
   */
  getServiceInfo() {
    return {
      name: 'Firebase AI Logic',
      provider: 'Google AI (Gemini)',
      models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
      features: [
        'Chat en tiempo real',
        'Contexto de ciudad',
        'Historial de conversación',
        'Modos rápido/calidad',
        'SDK oficial de Firebase',
        'Búsqueda en tiempo real con Google Places',
        'Búsqueda en tiempo real con Google Search',
        'Detección inteligente de intenciones',
        'Análisis de contexto de usuario'
      ],
      realTimeSearch: firebaseRealTimeSearchService.getServiceInfo()
    };
  }
}

// Exportar instancia singleton
export const firebaseAIService = FirebaseAIService.getInstance();

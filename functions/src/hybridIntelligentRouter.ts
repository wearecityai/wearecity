import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Tipos de consulta y sus características
export enum QueryType {
  SIMPLE = 'simple',           // Saludos, agradecimientos, consultas básicas
  EVENTS = 'events',           // Eventos, actividades, agenda cultural
  PROCEDURES = 'procedures',   // Trámites, documentación, burocracia
  COMPLEX = 'complex'          // Consultas complejas que requieren razonamiento
}

export interface QueryClassification {
  type: QueryType;
  confidence: number;
  reasoning: string;
  suggestedSystem: 'gemini-direct' | 'rag-vectorial' | 'google-search' | 'agent-full';
  estimatedCost: number;      // En euros
  estimatedLatency: number;   // En segundos
}

export interface HybridResponse {
  success: boolean;
  response: string;
  classification: QueryClassification;
  systemUsed: string;
  modelUsed: string;
  searchPerformed: boolean;
  processingTime: number;
  timestamp: string;
  fallbackUsed?: boolean;
  error?: string;
}

/**
 * 🧠 CLASIFICADOR INTELIGENTE DE CONSULTAS
 * Analiza la consulta y decide el mejor sistema para responderla
 */
export class IntelligentQueryClassifier {
  
  // Patrones para diferentes tipos de consulta
  private static readonly SIMPLE_PATTERNS = [
    /^(hola|hi|hello|buenas|buenos días|buenas tardes|buenas noches)$/i,
    /^(gracias|thank you|muchas gracias)$/i,
    /^(adiós|bye|hasta luego|nos vemos)$/i,
    /^(¿?cómo estás|how are you|qué tal)$/i,
    /^(ayuda|help|información)$/i
  ];

  private static readonly EVENTS_PATTERNS = [
    /\b(evento|eventos|actividad|actividades|concierto|festival|exposición)\b/i,
    /\b(agenda|programación|calendario|espectáculo|teatro|música)\b/i,
    /\b(qué hay|qué pasa|qué hacer|planes|entretenimiento)\b/i,
    /\b(este fin de semana|esta semana|hoy|mañana|próximo)\b.*\b(evento|actividad)\b/i,
    /\b(cultural|deportivo|gastronómico|turístico)\b.*\b(evento|actividad)\b/i
  ];

  private static readonly PROCEDURES_PATTERNS = [
    /\b(trámite|trámites|papeles|documentación|solicitar|solicitud)\b/i,
    /\b(licencia|permiso|certificado|empadronamiento|padrón)\b/i,
    /\b(ayuntamiento|consistorio|oficina|sede electrónica)\b/i,
    /\b(cita previa|horario|teléfono|dirección).*\b(ayuntamiento|oficina)\b/i,
    /\b(impuesto|tasa|multa|pago|factura)\b/i,
    /\b(cómo|dónde|cuándo).*\b(solicitar|tramitar|pagar|presentar)\b/i
  ];

  private static readonly COMPLEX_PATTERNS = [
    /\b(planifica|organiza|recomienda|sugiere|diseña)\b/i,
    /\b(ruta|itinerario|plan|programa).*\b(turístico|visita|día)\b/i,
    /\b(mejor|mejores|comparar|diferencia|ventajas)\b/i,
    /\b(combina|relaciona|conecta).*\b(con|y)\b/i,
    /\b(análisis|evaluación|opinión|consejo)\b/i
  ];

  /**
   * Clasifica una consulta y determina el mejor sistema para procesarla
   */
  static classifyQuery(query: string, citySlug: string): QueryClassification {
    const normalizedQuery = query.toLowerCase().trim();
    const queryLength = query.length;
    
    console.log(`🧠 Clasificando consulta: "${query.substring(0, 50)}..." para ${citySlug}`);

    // 1️⃣ CONSULTAS SIMPLES (Gemini directo)
    if (queryLength < 20 || this.matchesPatterns(normalizedQuery, this.SIMPLE_PATTERNS)) {
      return {
        type: QueryType.SIMPLE,
        confidence: 0.95,
        reasoning: 'Consulta simple: saludo, agradecimiento o pregunta básica',
        suggestedSystem: 'gemini-direct',
        estimatedCost: 0.001,
        estimatedLatency: 0.1
      };
    }

    // 2️⃣ CONSULTAS DE EVENTOS (RAG Vectorial)
    if (this.matchesPatterns(normalizedQuery, this.EVENTS_PATTERNS)) {
      return {
        type: QueryType.EVENTS,
        confidence: 0.9,
        reasoning: 'Consulta sobre eventos: buscar en RAG vectorial primero',
        suggestedSystem: 'rag-vectorial',
        estimatedCost: 0.005,
        estimatedLatency: 0.3
      };
    }

    // 3️⃣ CONSULTAS DE TRÁMITES (Google Search)
    if (this.matchesPatterns(normalizedQuery, this.PROCEDURES_PATTERNS)) {
      return {
        type: QueryType.PROCEDURES,
        confidence: 0.85,
        reasoning: 'Consulta sobre trámites: usar Google Search Grounding para info oficial',
        suggestedSystem: 'google-search',
        estimatedCost: 0.01,
        estimatedLatency: 0.8
      };
    }

    // 4️⃣ CONSULTAS COMPLEJAS (Agente IA completo)
    if (queryLength > 100 || this.matchesPatterns(normalizedQuery, this.COMPLEX_PATTERNS)) {
      return {
        type: QueryType.COMPLEX,
        confidence: 0.8,
        reasoning: 'Consulta compleja: requiere razonamiento y múltiples herramientas',
        suggestedSystem: 'agent-full',
        estimatedCost: 0.03,
        estimatedLatency: 2.0
      };
    }

    // 5️⃣ DEFAULT: Usar Google Search para consultas generales
    return {
      type: QueryType.PROCEDURES,
      confidence: 0.6,
      reasoning: 'Consulta general: usar Google Search como opción segura',
      suggestedSystem: 'google-search',
      estimatedCost: 0.01,
      estimatedLatency: 0.8
    };
  }

  /**
   * Verifica si la consulta coincide con algún patrón
   */
  private static matchesPatterns(query: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(query));
  }
}

/**
 * 🚀 ROUTER HÍBRIDO INTELIGENTE
 * Procesa consultas usando el sistema óptimo para cada caso
 */
export class HybridIntelligentRouter {

  /**
   * Procesa una consulta usando el sistema híbrido inteligente
   */
  static async processQuery(
    query: string,
    citySlug: string,
    userId: string = 'anonymous',
    isAdmin: boolean = false
  ): Promise<HybridResponse> {
    const startTime = Date.now();
    
    try {
      // 🧠 PASO 1: Clasificar la consulta
      const classification = IntelligentQueryClassifier.classifyQuery(query, citySlug);
      
      console.log(`🎯 Consulta clasificada como: ${classification.type} (${classification.confidence * 100}%)`);
      console.log(`💡 Sistema sugerido: ${classification.suggestedSystem}`);
      console.log(`⏱️ Latencia estimada: ${classification.estimatedLatency}s`);
      console.log(`💰 Costo estimado: €${classification.estimatedCost}`);

      let result: any;
      let systemUsed: string;
      let fallbackUsed = false;

      // 🔀 PASO 2: Procesar según el sistema sugerido
      switch (classification.suggestedSystem) {
        case 'gemini-direct':
          result = await this.processWithGeminiDirect(query, citySlug);
          systemUsed = 'Gemini 2.5 Flash Directo';
          break;

        case 'rag-vectorial':
          result = await this.processWithRAGVectorial(query, citySlug);
          if (!result || !result.response) {
            console.log('🔄 RAG no encontró resultados, fallback a Google Search...');
            result = await this.processWithGoogleSearch(query, citySlug);
            systemUsed = 'RAG Vectorial → Google Search (Fallback)';
            fallbackUsed = true;
          } else {
            systemUsed = 'RAG Vectorial';
          }
          break;

        case 'google-search':
          result = await this.processWithGoogleSearch(query, citySlug);
          systemUsed = 'Gemini 2.5 Flash + Google Search';
          break;

        case 'agent-full':
          result = await this.processWithFullAgent(query, citySlug, isAdmin);
          systemUsed = 'Vertex AI Agent Engine Completo';
          break;

        default:
          throw new Error(`Sistema no reconocido: ${classification.suggestedSystem}`);
      }

      const processingTime = (Date.now() - startTime) / 1000;

      return {
        success: true,
        response: result.response || 'No se pudo generar una respuesta adecuada.',
        classification,
        systemUsed,
        modelUsed: result.modelUsed || classification.suggestedSystem,
        searchPerformed: result.searchPerformed || false,
        processingTime,
        timestamp: new Date().toISOString(),
        fallbackUsed
      };

    } catch (error) {
      console.error('❌ Error en HybridIntelligentRouter:', error);
      
      const processingTime = (Date.now() - startTime) / 1000;
      
      return {
        success: false,
        response: 'Lo siento, hubo un problema procesando tu consulta. Por favor, inténtalo de nuevo.',
        classification: {
          type: QueryType.SIMPLE,
          confidence: 0,
          reasoning: 'Error en procesamiento',
          suggestedSystem: 'gemini-direct',
          estimatedCost: 0,
          estimatedLatency: 0
        },
        systemUsed: 'Error Handler',
        modelUsed: 'error',
        searchPerformed: false,
        processingTime,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * 💬 SISTEMA 1: Gemini 2.5 Flash Directo (Consultas simples)
   */
  private static async processWithGeminiDirect(query: string, citySlug: string): Promise<any> {
    console.log('💬 Procesando con Gemini 2.5 Flash directo...');
    
    try {
      // Importar el servicio de Gemini
      const { processSimpleQuery } = await import('./vertexAIService');
      
      const result = await processSimpleQuery(query, citySlug, []);
      
      return {
        response: result.response,
        modelUsed: 'gemini-2.5-flash-lite',
        searchPerformed: false
      };
    } catch (error) {
      console.error('❌ Error en Gemini directo:', error);
      throw error;
    }
  }

  /**
   * 🧠 SISTEMA 2: RAG Vectorial (Eventos)
   */
  private static async processWithRAGVectorial(query: string, citySlug: string): Promise<any> {
    console.log('🧠 Procesando con RAG vectorial...');
    
    try {
      // Llamar al agente con instrucciones específicas para RAG
      const agentPrompt = `Busca información sobre eventos usando búsqueda vectorial: ${query}

Para la ciudad: ${citySlug}

INSTRUCCIONES:
1. USA vector_search_in_rag para buscar información sobre eventos
2. Si encuentras eventos relevantes, preséntalos de forma organizada
3. Si no encuentras información, responde que no hay eventos disponibles
4. NO inventes información
5. Responde en español de forma útil`;

      const agentResponse = await this.callAgentEngine(agentPrompt);
      
      // Verificar si encontró información útil
      if (!agentResponse || 
          agentResponse.length < 50 ||
          agentResponse.includes('no hay eventos') ||
          agentResponse.includes('No se encontraron')) {
        return null; // Trigger fallback
      }

      return {
        response: agentResponse,
        modelUsed: 'vertex-ai-agent-rag',
        searchPerformed: true
      };
    } catch (error) {
      console.error('❌ Error en RAG vectorial:', error);
      return null; // Trigger fallback
    }
  }

  /**
   * 🔍 SISTEMA 3: Google Search Grounding (Trámites)
   */
  private static async processWithGoogleSearch(query: string, citySlug: string): Promise<any> {
    console.log('🔍 Procesando con Google Search Grounding...');
    
    try {
      // Importar el servicio de Google Search
      const { processInstitutionalQuery } = await import('./vertexAIService');
      
      const result = await processInstitutionalQuery(query, citySlug, []);
      
      return {
        response: result.response,
        modelUsed: 'gemini-2.5-flash',
        searchPerformed: true
      };
    } catch (error) {
      console.error('❌ Error en Google Search:', error);
      throw error;
    }
  }

  /**
   * 🤖 SISTEMA 4: Agente IA Completo (Consultas complejas)
   */
  private static async processWithFullAgent(query: string, citySlug: string, isAdmin: boolean): Promise<any> {
    console.log('🤖 Procesando con Agente IA completo...');
    
    try {
      const agentPrompt = `${query}

Para la ciudad: ${citySlug}

INSTRUCCIONES:
- Usa todas las herramientas disponibles según necesites
- Combina información de RAG, Vector Search y búsqueda web si es necesario
- Proporciona una respuesta completa y bien estructurada
- Responde en español de forma útil y organizada`;

      const agentResponse = await this.callAgentEngine(agentPrompt);
      
      return {
        response: agentResponse,
        modelUsed: 'vertex-ai-agent-full',
        searchPerformed: true
      };
    } catch (error) {
      console.error('❌ Error en Agente completo:', error);
      throw error;
    }
  }

  /**
   * Llamar al Vertex AI Agent Engine
   */
  private static async callAgentEngine(prompt: string): Promise<string> {
    // Importar la función de llamada al agente
    const { callAgentEngineHTTP } = await import('./vertexAISimpleProxy');
    return await callAgentEngineHTTP(prompt);
  }
}

/**
 * 🌐 FUNCIÓN CLOUD FUNCTION PRINCIPAL
 * Endpoint HTTP para el sistema híbrido inteligente
 */
export const hybridIntelligentProxy = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    const { query, citySlug, userId, isAdmin } = req.body;

    if (!query || !citySlug) {
      return res.status(400).json({
        success: false,
        error: 'Query y citySlug son requeridos',
        response: '',
        systemUsed: 'Error Handler',
        modelUsed: 'error',
        searchPerformed: false,
        processingTime: 0,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🚀 HÍBRIDO INTELIGENTE: "${query}" para ${citySlug}`);

    // Procesar con el sistema híbrido
    const result = await HybridIntelligentRouter.processQuery(
      query,
      citySlug,
      userId || 'anonymous',
      isAdmin || false
    );

    console.log(`✅ Procesado con ${result.systemUsed} en ${result.processingTime.toFixed(2)}s`);
    
    res.json(result);

  } catch (error) {
    console.error('❌ Error en hybridIntelligentProxy:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      response: 'Lo siento, hubo un problema procesando tu consulta. Por favor, inténtalo de nuevo.',
      systemUsed: 'Error Handler',
      modelUsed: 'error',
      searchPerformed: false,
      processingTime: 0,
      timestamp: new Date().toISOString()
    });
  }
});

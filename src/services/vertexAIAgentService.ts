/**
 * Servicio para interactuar con Vertex AI Agent Engine
 */

interface AgentResponse {
  success: boolean;
  response: string;
  modelUsed: string;
  eventsFromFirestore: boolean;
  searchPerformed: boolean;
  error?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Procesar consulta usando Vertex AI Agent Engine
 */
export const processWithVertexAIAgent = async (
  query: string,
  cityContext?: { name: string; slug: string },
  conversationHistory?: ChatMessage[],
  userId?: string
): Promise<AgentResponse> => {
  try {
    console.log('🤖 Procesando con Vertex AI Agent Engine:', {
      query: query.substring(0, 50) + '...',
      citySlug: cityContext?.slug,
      userId
    });

    // Obtener token de autenticación
    const { auth } = await import('../integrations/firebase/config');
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const idToken = await user.getIdToken();
    
    // Preparar datos de la consulta
    const requestBody = {
      query,
      citySlug: cityContext?.slug || 'unknown',
      userId: user.uid,
      conversationHistory: conversationHistory?.slice(-5) || [] // Solo los últimos 5 mensajes
    };

    console.log('📡 Enviando consulta al Agent Engine...');

    // Hacer la llamada al Agent Engine a través de Firebase Functions
    const response = await fetch(
      'https://us-central1-wearecity-2ab89.cloudfunctions.net/queryVertexAIAgent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Respuesta recibida del Agent Engine');
    
    return {
      success: result.success || false,
      response: result.response || 'No se pudo obtener respuesta',
      modelUsed: 'vertex-ai-agent-engine',
      eventsFromFirestore: result.eventsFromFirestore || false,
      searchPerformed: result.searchPerformed || false,
      error: result.error
    };

  } catch (error) {
    console.error('❌ Error en processWithVertexAIAgent:', error);
    
    return {
      success: false,
      response: 'Lo siento, ha ocurrido un error procesando tu consulta con el Agent Engine.',
      modelUsed: 'vertex-ai-agent-engine',
      eventsFromFirestore: false,
      searchPerformed: false,
      error: error.message
    };
  }
};

/**
 * Función de fallback que usa el sistema anterior
 */
export const processWithFallback = async (
  query: string,
  cityContext?: { name: string; slug: string },
  conversationHistory?: ChatMessage[],
  mediaUrl?: string,
  mediaType?: 'image' | 'document',
  cityConfig?: any
): Promise<AgentResponse> => {
  // Importar el servicio anterior
  const { processWithVertexAI } = await import('./vertexAIService');
  
  try {
    const result = await processWithVertexAI(
      query,
      cityContext,
      conversationHistory,
      mediaUrl,
      mediaType,
      cityConfig
    );
    
    return {
      success: true,
      response: result.response,
      modelUsed: result.modelUsed,
      eventsFromFirestore: true,
      searchPerformed: result.searchPerformed
    };
  } catch (error) {
    return {
      success: false,
      response: 'Error en el sistema de fallback',
      modelUsed: 'fallback',
      eventsFromFirestore: false,
      searchPerformed: false,
      error: error.message
    };
  }
};

/**
 * Función principal que intenta Agent Engine y usa fallback si es necesario
 */
export const processAIQuery = async (
  query: string,
  cityContext?: { name: string; slug: string },
  conversationHistory?: ChatMessage[],
  mediaUrl?: string,
  mediaType?: 'image' | 'document',
  cityConfig?: any
): Promise<AgentResponse> => {
  console.log('🎯 Iniciando procesamiento de consulta...');
  
  // Intentar con Agent Engine primero
  try {
    console.log('🤖 Intentando Vertex AI Agent Engine...');
    const agentResult = await processWithVertexAIAgent(
      query, 
      cityContext, 
      conversationHistory, 
      cityConfig?.userId
    );
    
    if (agentResult.success && agentResult.response.length > 10) {
      console.log('✅ Agent Engine respondió exitosamente');
      return agentResult;
    } else {
      console.log('🔄 Agent Engine no respondió adecuadamente, usando fallback...');
    }
  } catch (error) {
    console.warn('⚠️ Error en Agent Engine, usando fallback:', error);
  }
  
  // Usar sistema anterior como fallback
  console.log('🔄 Usando sistema anterior como fallback...');
  return processWithFallback(
    query,
    cityContext,
    conversationHistory,
    mediaUrl,
    mediaType,
    cityConfig
  );
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIResponse {
  response: string;
  events?: any[];
  places?: any[];
  modelUsed: 'gemini-2.5-flash-lite' | 'gemini-2.5-pro';
  complexity: 'simple' | 'complex';
  searchPerformed: boolean;
  multimodal?: boolean;
}

const FUNCTIONS_BASE_URL = import.meta.env.VITE_FUNCTIONS_BASE_URL || 'https://us-central1-wearecity-2ab89.cloudfunctions.net';

// Main function to process queries with Firebase Functions
export const processWithVertexAI = async (
  query: string,
  citySlug?: string,
  conversationHistory?: ChatMessage[],
  mediaUrl?: string,
  mediaType?: 'image' | 'document'
): Promise<AIResponse> => {
  try {
    console.log('🤖 Processing with Firebase Functions:', {
      query: query.substring(0, 50) + '...',
      citySlug,
      hasHistory: !!conversationHistory?.length,
      isMultimodal: !!(mediaUrl && mediaType)
    });

    // Get authentication token
    const { auth } = await import('../integrations/firebase/config');
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const idToken = await user.getIdToken();
    
    // Prepare request body
    const cityContext = {
      name: citySlug === 'la-vila-joiosa' ? 'La Vila Joiosa' : citySlug,
      slug: citySlug
    };
    
    const requestBody = {
      query,
      citySlug,
      cityContext,
      conversationHistory,
      mediaUrl,
      mediaType
    };

    console.log('📤 Sending request to Firebase Functions:', {
      url: `${FUNCTIONS_BASE_URL}/processAIChat`,
      body: requestBody
    });

    // Call Firebase Function
    const response = await fetch(`${FUNCTIONS_BASE_URL}/processAIChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Firebase Function error: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error en la respuesta del servidor');
    }

    console.log('✅ Firebase Functions response received:', {
      modelUsed: result.data.modelUsed,
      complexity: result.data.complexity,
      searchPerformed: result.data.searchPerformed,
      responseLength: result.data.response.length
    });

    return result.data;

  } catch (error) {
    console.error('❌ Error in processWithVertexAI:', error);
    
    // Fallback response
    return {
      response: `Lo siento, hubo un problema procesando tu consulta. ${error instanceof Error ? error.message : 'Error desconocido'}`,
      modelUsed: 'gemini-2.5-flash-lite',
      complexity: 'simple',
      searchPerformed: false
    };
  }
};

// Function to classify query complexity without processing
export const classifyQuery = async (query: string): Promise<'simple' | 'complex'> => {
  try {
    // Simple classification logic (can be enhanced later)
    const complexIndicators = [
      'buscar', 'busca', 'encuentra', 'localizar', 'ubicar', 'donde está', 'dónde está',
      'información actual', 'noticias', 'eventos', 'horarios', 'agenda', 'tiempo real',
      'analizar', 'comparar', 'evaluar', 'explicar en detalle', 'profundizar',
      'múltiples', 'varios', 'opciones', 'alternativas',
      'paso a paso', 'proceso', 'procedimiento', 'cómo hacer', 'tutorial',
      'imagen', 'foto', 'mapa', 'ubicación', 'documento', 'pdf'
    ];

    const simpleIndicators = [
      'hola', 'gracias', 'sí', 'no', 'ok', 'vale',
      'qué tal', 'cómo estás', 'buenos días', 'buenas tardes',
      'definir', 'qué es', 'significa'
    ];

    const queryLower = query.toLowerCase();
    
    if (simpleIndicators.some(indicator => queryLower.includes(indicator))) {
      return 'simple';
    }

    if (complexIndicators.some(indicator => queryLower.includes(indicator))) {
      return 'complex';
    }

    if (query.length > 100 || query.split(' ').length > 20) {
      return 'complex';
    }

    return 'simple';
  } catch (error) {
    console.error('Error classifying query:', error);
    return 'simple'; // Default to simple on error
  }
};
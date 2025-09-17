interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIResponse {
  response: string;
  events?: any[];
  places?: any[];
  modelUsed: 'gemini-2.5-flash';
  complexity: 'simple' | 'complex';
  searchPerformed: boolean;
  multimodal?: boolean;
}

const FUNCTIONS_BASE_URL = import.meta.env.VITE_FUNCTIONS_BASE_URL || 'https://us-central1-wearecity-2ab89.cloudfunctions.net';

// Main function to process queries with Firebase Functions
export const processWithVertexAI = async (
  query: string,
  cityContext?: { name: string; slug: string },
  conversationHistory?: ChatMessage[],
  mediaUrl?: string,
  mediaType?: 'image' | 'document',
  cityConfig?: any // Nueva: configuración completa de la ciudad
): Promise<AIResponse> => {
  try {
    console.log('🤖 Processing with Firebase Functions:', {
      query: query.substring(0, 50) + '...',
      cityContext,
      cityContextType: typeof cityContext,
      cityContextValue: cityContext,
      hasHistory: !!conversationHistory?.length,
      isMultimodal: !!(mediaUrl && mediaType)
    });

    // Get authentication token (REQUIRED for security)
    const { auth } = await import('../integrations/firebase/config');
    const user = auth.currentUser;
    
    console.log('🔐 Auth check:', {
      hasUser: !!user,
      userId: user?.uid || 'none',
      isAnonymous: user?.isAnonymous || false
    });
    
    if (!user) {
      throw new Error('Usuario no autenticado. Por favor, inicia sesión.');
    }
    
    const idToken = await user.getIdToken();
    console.log('🎫 Token obtained:', idToken ? 'YES' : 'NO');
    
    // Prepare request body
    const requestBody = {
      query,
      citySlug: cityContext?.slug,
      cityContext: cityContext?.name || '', // Enviar cityContext como string
      cityConfig: cityConfig || null, // Nueva: enviar configuración completa de la ciudad
      conversationHistory,
      mediaUrl,
      mediaType
    };

    console.log('📤 Sending request to Firebase Functions:', {
      url: `${FUNCTIONS_BASE_URL}/processAIChat`,
      body: requestBody,
      citySlugInBody: requestBody.citySlug,
      citySlugTypeInBody: typeof requestBody.citySlug
    });

    // Call Firebase Function
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header (now required)
    headers['Authorization'] = `Bearer ${idToken}`;
    
    console.log('📡 Making request to Firebase Function:', {
      url: `${FUNCTIONS_BASE_URL}/processAIChat`,
      hasAuth: !!idToken,
      method: 'POST'
    });
    
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 540000); // 9 minutes timeout to match Firebase Function

    let response;
    try {
      response = await fetch(`${FUNCTIONS_BASE_URL}/processAIChat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error('❌ Request timeout after 9 minutes');
        throw new Error('Request timeout - the query is taking too long to process. This may happen with complex event searches.');
      }
      throw error;
    }

    console.log('📨 Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: await response.text() };
      }
      
      console.error('❌ Firebase Function error details:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // Better error message handling
      let errorMessage = 'Error desconocido';
      if (typeof errorData === 'object' && errorData) {
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (response.statusText) {
        errorMessage = response.statusText;
      }
      
      throw new Error(`Firebase Function error (${response.status}): ${errorMessage}`);
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
      modelUsed: 'gemini-2.5-flash',
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
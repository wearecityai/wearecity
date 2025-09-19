import { VertexAI } from '@google-cloud/vertexai';
import * as admin from 'firebase-admin';

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT || 'wearecity-2ab89',
  location: 'us-central1'
});

// Get the generative model
const model = vertexAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
});

// Simple query complexity classification
export const classifyQueryComplexity = (query: string): 'simple' | 'institutional' => {
  const queryLower = query.toLowerCase();
  
  // 🎯 CONSULTAS SIMPLES (Gemini Flash Lite)
  const simpleIndicators = [
    // Saludos y bienvenidas
    'hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'bienvenido',
    'gracias', 'de nada', 'por favor', 'disculpa', 'perdon',
    // Respuestas muy rápidas y simples
    'si', 'no', 'ok', 'vale', 'perfecto', 'entendido', 'claro',
    'que tal', 'como estas', 'como va', 'todo bien',
    // Preguntas históricas básicas
    'historia', 'historico', 'historica', 'fundacion', 'fundado', 'origen', 'origenes',
    'cuando se fundo', 'cuando se creo', 'siglo', 'antigua', 'antiguo'
  ];

  // Verificar si es consulta simple
  const isSimpleQuery = simpleIndicators.some(indicator => 
    queryLower.includes(indicator)
  );

  if (isSimpleQuery) {
    console.log('🟢 Simple query detected - using Gemini Flash Lite');
    return 'simple';
  }

  // Todo lo demás es institucional (necesita Google Search)
  console.log('🔍 Complex query detected - using Gemini Flash + Google Search');
  return 'institutional';
};

// Simple query processing (Gemini Flash Lite)
export const processSimpleQuery = async (
  query: string, 
  cityContext?: string,
  conversationHistory?: any[]
): Promise<{ text: string; events?: any[]; places?: any[] }> => {
  try {
    console.log('🟢 Processing simple query with Gemini 2.5 Flash Lite');
    
    // Get the Flash Lite model for simple queries
    const simpleModel = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    });

    // Get current date and time for context
    const now = new Date();
    const currentDateTime = now.toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const systemPrompt = `Eres WeAreCity, el asistente inteligente de ${cityContext || 'la ciudad'}. 

INFORMACIÓN ACTUAL:
- Fecha y hora actual: ${currentDateTime} (España)
- Usa esta fecha y hora como referencia temporal

Responde de manera amigable, clara y concisa en español.
Para consultas históricas o generales, proporciona información básica y útil.
Si no tienes información específica, reconócelo honestamente.

Mantén un tono profesional pero cercano.`;

    // Limited conversation context for simple queries
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = '\n\nÚltimos mensajes:\n';
      conversationHistory.slice(-2).forEach((msg: any) => {
        conversationContext += `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}\n`;
      });
    }

    const fullPrompt = `${systemPrompt}${conversationContext}\n\nConsulta: ${query}`;

    const result = await simpleModel.generateContent(fullPrompt);
    
    return {
      text: result.text || 'No se pudo generar una respuesta.',
      events: [],
      places: []
    };

  } catch (error) {
    console.error('Error in processSimpleQuery:', error);
    throw new Error(`Error procesando consulta simple: ${error}`);
  }
};

// Complex query processing (Gemini Flash + Google Search)
export const processInstitutionalQuery = async (
  query: string,
  cityContext?: string,
  conversationHistory?: any[],
  cityConfig?: any
): Promise<{ text: string; events?: any[]; places?: any[] }> => {
  try {
    console.log('🔍 Processing complex query with Gemini 2.5 Flash + Google Search grounding');
    
    // Get the Flash model with Google Search grounding
    const flashModel = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{
        googleSearch: {},
      }],
    });

    // Get current date and time for context
    const now = new Date();
    const currentDateTime = now.toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const systemPrompt = `Eres WeAreCity, el asistente inteligente de ${cityContext || 'la ciudad'}. 
Tienes acceso a Google Search en tiempo real para proporcionar información actualizada y precisa.

INFORMACIÓN ACTUAL:
- Fecha y hora actual: ${currentDateTime} (España)
- Usa esta fecha y hora como referencia temporal

🚨 INSTRUCCIONES CRÍTICAS:
1. **BÚSQUEDA OBLIGATORIA**: Para eventos, trámites, horarios, lugares, transporte, etc., SIEMPRE busca información actualizada
2. **ESPECIFICIDAD**: Proporciona información específica de ${cityContext || 'la ciudad'}
3. **ACTUALIZACIÓN**: Usa Google Search para obtener información en tiempo real
4. **HONESTIDAD**: Si no encuentras información, reconócelo claramente

PARA EVENTOS:
- Fechas específicas y actualizadas
- Ubicaciones exactas
- Descripciones detalladas
- Enlaces a fuentes oficiales cuando sea posible

PARA TRÁMITES:
- Documentos requeridos específicos
- Horarios y ubicaciones de oficinas
- Pasos detallados del proceso
- Enlaces a formularios oficiales

PARA LUGARES Y SERVICIOS:
- Direcciones completas
- Horarios de atención actualizados
- Información de contacto
- Servicios disponibles

Responde de manera estructurada y útil en español.
Mantén un tono profesional y amigable.`;

    // Limited conversation context
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = '\n\nÚltimos mensajes:\n';
      conversationHistory.slice(-2).forEach((msg: any) => {
        conversationContext += `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}\n`;
      });
    }

    const fullPrompt = `${systemPrompt}${conversationContext}\n\nConsulta: ${query}`;

    const result = await flashModel.generateContent(fullPrompt);
    
    return {
      text: result.text || 'No se pudo generar una respuesta.',
      events: [],
      places: []
    };

  } catch (error) {
    console.error('Error in processComplexQuery:', error);
    throw new Error(`Error procesando consulta compleja: ${error}`);
  }
};

// Main processing function - SIMPLIFIED
export const processUserQuery = async (
  query: string,
  cityContext?: string,
  conversationHistory?: any[],
  cityConfig?: any
): Promise<{
  response: string;
  events?: any[];
  places?: any[];
  modelUsed: 'gemini-2.5-flash-lite' | 'gemini-2.5-flash';
  complexity: 'simple' | 'institutional';
  searchPerformed: boolean;
}> => {
  const complexity = classifyQueryComplexity(query);
  
  console.log(`🎯 Query classified as: ${complexity}`);
  
  try {
    let result: { text: string; events?: any[]; places?: any[] };
    let searchPerformed = false;
    let modelUsed: 'gemini-2.5-flash-lite' | 'gemini-2.5-flash';

    if (complexity === 'institutional') {
      result = await processInstitutionalQuery(query, cityContext, conversationHistory, cityConfig);
      searchPerformed = true;
      modelUsed = 'gemini-2.5-flash';
    } else {
      result = await processSimpleQuery(query, cityContext, conversationHistory);
      modelUsed = 'gemini-2.5-flash-lite';
    }

    return {
      response: result.text,
      events: result.events,
      places: result.places,
      modelUsed,
      complexity,
      searchPerformed
    };

  } catch (error) {
    console.error('Error in processUserQuery:', error);
    
    // Fallback response
    return {
      response: 'Lo siento, hubo un problema procesando tu consulta. Por favor, inténtalo de nuevo.',
      events: [],
      places: [],
      modelUsed: 'gemini-2.5-flash-lite',
      complexity,
      searchPerformed: false
    };
  }
};

// Multimodal processing for images and documents
export const processMultimodalQuery = async (
  query: string,
  mediaUrl: string,
  mediaType: 'image' | 'document',
  cityContext?: string
): Promise<{ text: string; events?: any[]; places?: any[] }> => {
  try {
    const multimodalModel = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    // Get current date and time for context
    const now = new Date();
    const currentDateTime = now.toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const systemPrompt = `Eres el asistente inteligente de ${cityContext || 'la ciudad'}.

INFORMACIÓN ACTUAL:
- Fecha y hora actual: ${currentDateTime} (España)
- Usa esta fecha y hora como referencia temporal

Analiza ${mediaType === 'image' ? 'la imagen' : 'el documento'} proporcionado y responde la consulta del usuario.
Responde en español de manera clara y útil.`;

    if (mediaType === 'image') {
      // For images, fetch and process
      const imageData = await fetchMediaAsBase64(mediaUrl);
      
      const result = await multimodalModel.generateContent([
        { text: systemPrompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageData
            }
        },
        { text: `\n\nConsulta: ${query}` }
      ]);
      
      return {
        text: result.response.text(),
        modelUsed: 'gemini-2.5-flash',
        complexity: 'multimodal',
        searchPerformed: false
      };
    } else {
      // For documents, use text extraction (simplified)
      const result = await multimodalModel.generateContent([
        `${systemPrompt}\n\nConsulta: ${query}\n\nDocumento: ${mediaUrl}`
      ]);
      
      return {
        text: result.response.text(),
        modelUsed: 'gemini-2.5-flash',
        complexity: 'multimodal',
        searchPerformed: false
      };
    }

  } catch (error) {
    console.error('Error in processMultimodalQuery:', error);
    throw new Error(`Error procesando consulta multimodal: ${error}`);
  }
};

// Helper function to fetch media as base64
async function fetchMediaAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return base64;
  } catch (error) {
    console.error('Error fetching media:', error);
    throw new Error('No se pudo obtener el archivo multimedia');
  }
}

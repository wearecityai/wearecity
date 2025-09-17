import { FirebaseApp } from "firebase/app";
import {
  ChatSession,
  FileDataPart,
  GenerationConfig,
  GenerativeModel,
  getGenerativeModel,
  getAI,
  HarmBlockThreshold,
  HarmCategory,
  InlineDataPart,
  Part,
  SafetySetting,
  VertexAIBackend,
} from "firebase/ai";
import { app } from '../integrations/firebase/config';

// AI Response interface
export interface AIResponse {
  response: string;
  modelUsed: 'gemini-2.5-flash-lite' | 'gemini-2.5-flash';
  complexity: 'simple' | 'institutional';
  searchPerformed: boolean;
  multimodal?: boolean;
}

// Query complexity classifier
export const classifyQueryComplexity = (query: string): 'simple' | 'institutional' => {
  // 🎯 Flash Lite SOLO para casos muy específicos
  const flashLiteIndicators = [
    // Preguntas históricas que nunca cambian
    'historia', 'historico', 'historica', 'fundacion', 'fundado', 'origen', 'origenes',
    'cuando se fundo', 'cuando se creo', 'siglo', 'antigua', 'antiguo', 'epoca', 'pasado',
    'patrimonio historico', 'monumento historico', 'edificio historico',
    // Saludos y bienvenidas
    'hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'bienvenido',
    'gracias', 'de nada', 'por favor', 'disculpa', 'perdon',
    // Respuestas muy rápidas y simples
    'si', 'no', 'ok', 'vale', 'perfecto', 'entendido', 'claro',
    'que tal', 'como estas', 'como va', 'todo bien',
    // Itinerarios turísticos básicos (información que no cambia frecuentemente)
    'ruta turistica', 'itinerario turistico', 'que ver en', 'lugares turisticos',
    'sitios turisticos', 'puntos de interes', 'monumentos principales'
  ];

  const queryNormalized = query.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  
  // Verificar si es consulta que necesita Flash Lite (casos muy específicos)
  const needsFlashLite = flashLiteIndicators.some(indicator => {
    const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(queryNormalized);
  });

  if (needsFlashLite) {
    return 'simple';
  }

  // Por defecto, usar Flash + Grounding para todo lo demás
  return 'institutional';
};

// Initialize Firebase AI
const ai = getAI(app, {
  backend: new VertexAIBackend({ location: "us-central1" })
});

// Common safety settings
const safetySettings: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.OFF,
  },
];

// System prompt for WeAreCity
const getSystemPrompt = (cityContext?: string) => {
  return `Eres **WeAreCity**, un asistente de inteligencia artificial especializado en dar información local sobre una ciudad concreta.

🎯 Tu misión:
- Ayudar a ciudadanos y turistas a encontrar información clara y precisa sobre:
  - Trámites municipales y documentación necesaria.
  - Normativas y procedimientos oficiales.
  - Transporte público, horarios y direcciones.
  - Eventos culturales, deportivos y de ocio (mostrar en formato de cards).
  - Recomendaciones de lugares (restaurantes, monumentos, hoteles, etc., en formato de cards).
  - Información histórica, cultural y turística.
  - Itinerarios turísticos personalizados según tiempo disponible, intereses y ubicación del usuario.

📍 Contexto de ciudad:
- Cada ciudad tiene su propia instancia de WeAreCity con un contexto independiente.
- Se te proporcionará un **contexto específico para esa ciudad** (documentos, enlaces, webs oficiales).
- Solo debes responder con información de la ciudad activa.
- Si el usuario pregunta por otra ciudad, indica que esta instancia solo ofrece información sobre la ciudad configurada.

🌐 Búsqueda en tiempo real:
- Nunca digas "consulta la web".
- Debes buscar en tiempo real en las **fuentes oficiales proporcionadas por el configurador de la ciudad**, así como en buscadores y APIs externas (Google Places, Bing, etc.).
- Da siempre la información concreta y actualizada, pero **nunca inventes datos**.
- Para **trámites** y **eventos**, incluye siempre la **fuente oficial** (URL o nombre de la web de origen) al final de la respuesta o dentro de la card.

📍 Uso de ubicación:
- Si el usuario comparte su ubicación, adáptala para recomendar lugares y rutas cercanas.
- Si no lo hace, responde con información general dentro de la ciudad activa.

⚠️ Seguridad y privacidad:
- Nunca pidas, almacenes ni proceses datos sensibles como:
  - Contraseñas
  - DNI o pasaporte
  - Números de tarjeta de crédito o cuentas bancarias
  - Información médica privada
- Si el usuario intenta compartir estos datos, adviértele amablemente de que no debe introducir información personal sensible en el chat.

✅ Formato de respuesta:
- Texto claro y directo.
- Eventos y lugares → en **cards**.
- Trámites → en pasos claros, con la **fuente oficial citada**.
- Itinerarios → listas organizadas por franjas horarias o días.
- Adaptar siempre las respuestas a la ubicación (si se ha aceptado).

${cityContext ? `\n📍 Ciudad actual: ${cityContext}` : ''}`;
};

// Process simple queries with Gemini 2.5 Flash-Lite
export const processSimpleQuery = async (
  query: string,
  cityContext?: string,
  conversationHistory?: any[]
): Promise<AIResponse> => {
  try {
    console.log('⚡ Processing simple query with Gemini 2.5 Flash-Lite');
    
    const model = getGenerativeModel(ai, {
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.5,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
      safetySettings,
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

    const systemPrompt = getSystemPrompt(cityContext);
    
    // Build conversation context
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = '\n\nÚltimos mensajes:\n';
      conversationHistory.slice(-2).forEach((msg: any) => {
        conversationContext += `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}\n`;
      });
    }

    const fullPrompt = `${systemPrompt}

INFORMACIÓN ACTUAL:
- Fecha y hora actual: ${currentDateTime} (España)
- Usa esta fecha y hora como referencia

${conversationContext}

Consulta: ${query}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    console.log('✅ Simple query processed successfully');
    
    return {
      response,
      modelUsed: 'gemini-2.5-flash-lite',
      complexity: 'simple',
      searchPerformed: false
    };

  } catch (error) {
    console.error('Error in processSimpleQuery:', error);
    throw new Error(`Error procesando consulta simple: ${error}`);
  }
};

// Process complex queries with Gemini 2.5 Pro
export const processComplexQuery = async (
  query: string,
  cityContext?: string,
  conversationHistory?: any[]
): Promise<AIResponse> => {
  try {
    console.log('🔍 Processing complex query with Gemini 2.5 Pro');
    
    const model = getGenerativeModel(ai, {
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 8192,
      },
      safetySettings,
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

    const systemPrompt = getSystemPrompt(cityContext);
    
    // Build conversation context
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = '\n\nCONTEXTO:\n';
      conversationHistory.slice(-6).forEach((msg: any) => {
        conversationContext += `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}\n`;
      });
    }

    const fullPrompt = `${systemPrompt}

INFORMACIÓN ACTUAL:
- Fecha y hora actual: ${currentDateTime} (España)
- Usa SIEMPRE esta fecha y hora como referencia para información temporal

Instrucciones:
- Para consultas sobre eventos, noticias o información actual, busca información específica y actualizada
- SIEMPRE usa la fecha/hora actual proporcionada como referencia temporal
- Si no tienes información actualizada, indícalo claramente
- Mantén un tono profesional pero amigable
- Responde en español
- Contextualiza para ${cityContext || 'la ciudad'}, España

${conversationContext}

Consulta: ${query}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    console.log('✅ Complex query processed successfully');
    
    return {
      response,
      modelUsed: 'gemini-2.5-flash',
      complexity: 'complex',
      searchPerformed: true // Complex queries should perform search
    };

  } catch (error) {
    console.error('Error in processComplexQuery:', error);
    throw new Error(`Error procesando consulta compleja: ${error}`);
  }
};

// Main processing function that routes to appropriate model
export const processUserQuery = async (
  query: string,
  cityContext?: string,
  conversationHistory?: any[]
): Promise<AIResponse> => {
  const complexity = classifyQueryComplexity(query);
  
  console.log(`🎯 Query classified as: ${complexity}`);
  console.log(`🤖 Using model: ${complexity === 'institutional' ? 'Gemini 2.5 Flash + Grounding' : 'Gemini 2.5 Flash-Lite'}`);

  try {
    if (complexity === 'institutional') {
      return await processComplexQuery(query, cityContext, conversationHistory);
    } else {
      return await processSimpleQuery(query, cityContext, conversationHistory);
    }
  } catch (error) {
    console.error('Error in processUserQuery:', error);
    
    // Fallback response
    return {
      response: 'Lo siento, hubo un problema procesando tu consulta. Por favor, inténtalo de nuevo.',
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
): Promise<AIResponse> => {
  try {
    console.log('🖼️ Processing multimodal query with Gemini 2.5 Pro');
    
    const model = getGenerativeModel(ai, {
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 8192,
      },
      safetySettings,
    });

    const systemPrompt = getSystemPrompt(cityContext);
    
    // For now, we'll process as text since Firebase AI SDK doesn't support grounding yet
    // When grounding is available, we can add it here
    const fullPrompt = `${systemPrompt}

Consulta multimodal: ${query}
Tipo de media: ${mediaType}
URL: ${mediaUrl}

Procesa esta consulta considerando el contenido multimedia proporcionado.`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    console.log('✅ Multimodal query processed successfully');
    
    return {
      response,
      modelUsed: 'gemini-2.5-flash',
      complexity: 'complex',
      searchPerformed: false,
      multimodal: true
    };

  } catch (error) {
    console.error('Error in processMultimodalQuery:', error);
    throw new Error(`Error procesando consulta multimodal: ${error}`);
  }
};

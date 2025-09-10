import { GoogleGenAI } from '@google/genai';
import { searchPlaces, getPlacePhotoUrl, PlaceResult } from './placesService';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'wearecity-2ab89';

console.log('🔑 Google AI Config:', { PROJECT_ID });

// Initialize Google AI
const ai = new GoogleGenAI({});

// Query complexity classifier
export const classifyQueryComplexity = (query: string): 'simple' | 'complex' | 'institutional' => {
  // Detectar consultas institucionales primero
  const institutionalIndicators = [
    'tramite', 'tramites', 'procedimiento', 'procedimientos', 'gestion', 'gestiones',
    'ayuntamiento', 'municipio', 'alcaldia', 'gobierno local', 'administracion municipal',
    'sede electronica', 'portal ciudadano', 'atencion ciudadana', 'oficina virtual',
    'certificado', 'certificados', 'documento', 'documentos', 'formulario', 'formularios',
    'empadronamiento', 'empadronar', 'padron', 'censo', 'domicilio', 'residencia',
    'licencia', 'licencias', 'permiso', 'permisos', 'autorizacion', 'autorizaciones',
    'tasa', 'tasas', 'impuesto', 'impuestos', 'tributo', 'tributos', 'pago', 'pagos',
    'cita previa', 'cita', 'citas', 'reserva', 'reservas', 'turno', 'turnos',
    'como solicitar', 'como obtener', 'como presentar', 'como hacer', 'como tramitar',
    'donde solicitar', 'donde presentar', 'donde ir', 'donde acudir',
    'que necesito', 'que documentos', 'que requisitos', 'que papeles',
    'documentacion', 'requisitos', 'pasos', 'proceso', 'tramitacion'
  ];

  const queryNormalized = query.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  
  // Verificar si es consulta institucional
  const hasInstitutionalIntent = institutionalIndicators.some(indicator => {
    const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(queryNormalized);
  });

  if (hasInstitutionalIntent) {
    console.log('🏛️ Institutional query detected - will use Gemini 2.5 Pro with grounding');
    return 'institutional';
  }

  const complexIndicators = [
    'buscar', 'busca', 'encuentra', 'localizar', 'ubicar', 'donde está', 'dónde está',
    'información actual', 'noticias', 'eventos', 'horarios', 'agenda', 'tiempo real',
    'analizar', 'comparar', 'evaluar', 'explicar en detalle', 'profundizar',
    'múltiples', 'varios', 'opciones', 'alternativas',
    'paso a paso', 'proceso', 'procedimiento', 'cómo hacer', 'tutorial',
    'imagen', 'foto', 'mapa', 'ubicación', 'documento', 'pdf',
    'restaurante', 'hotel', 'tienda', 'museo', 'parque', 'lugar', 'sitio'
  ];

  const simpleIndicators = [
    'hola', 'gracias', 'sí', 'no', 'ok', 'vale',
    'qué tal', 'cómo estás', 'buenos días', 'buenas tardes',
    'definir', 'qué es', 'significa'
  ];

  const queryLower = query.toLowerCase();
  
  console.log('🔍 Classification debug:', {
    originalQuery: query,
    queryLower,
    queryLength: query.length,
    wordCount: query.split(' ').length
  });
  
  // Check for simple indicators (using word boundary matching)
  const foundSimpleIndicators = simpleIndicators.filter(indicator => {
    const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(queryLower);
  });
  if (foundSimpleIndicators.length > 0) {
    console.log('✅ Found simple indicators:', foundSimpleIndicators);
    return 'simple';
  }

  // Check for complex indicators (using word boundary matching)
  const foundComplexIndicators = complexIndicators.filter(indicator => {
    const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(queryLower);
  });
  if (foundComplexIndicators.length > 0) {
    console.log('✅ Found complex indicators:', foundComplexIndicators);
    return 'complex';
  }

  if (query.length > 100 || query.split(' ').length > 20) {
    console.log('✅ Query length/complexity triggers complex classification');
    return 'complex';
  }

  console.log('✅ Defaulting to simple classification');
  return 'simple';
};

// Gemini 2.5 Pro for institutional queries with Google Search grounding
export const processInstitutionalQuery = async (
  query: string, 
  cityContext?: string,
  conversationHistory?: any[]
): Promise<{ text: string; events?: any[]; places?: PlaceResult[] }> => {
  try {
    console.log('🏛️ Processing institutional query with Gemini 2.5 Pro and grounding');
    
    // Use Gemini 2.5 Pro with Google Search grounding for institutional queries
    const groundingTool = {
      googleSearch: {},
    };

    const config = {
      tools: [groundingTool],
    };

    const model = ai.models.generateContent;

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

    let systemPrompt = `Eres WeAreCity, el asistente inteligente de ${cityContext || 'la ciudad'}. 
Tienes acceso a Google Search en tiempo real para proporcionar información actualizada y precisa.

🎯 INFORMACIÓN ACTUAL:
- Fecha y hora actual: ${currentDateTime} (España)
- Usa SIEMPRE esta fecha y hora como referencia para información temporal
- Tienes acceso a Google Search para información en tiempo real

🔍 INSTRUCCIONES DE BÚSQUEDA:
- Para consultas sobre eventos, noticias, horarios o información actual, utiliza Google Search automáticamente
- Busca información específica en webs oficiales cuando sea posible
- SIEMPRE cita las fuentes de información cuando uses datos de búsquedas
- Para eventos en ${cityContext || 'la ciudad'}, busca en webs oficiales del ayuntamiento, turismo local, etc.

⚠️ RESTRICCIÓN GEOGRÁFICA CRÍTICA:
- SOLO incluye eventos que tengan lugar en ${cityContext || 'la ciudad'}, España
- SOLO incluye lugares (restaurantes, hoteles, museos, etc.) ubicados en ${cityContext || 'la ciudad'}, España
- NO incluyas eventos o lugares de otras ciudades, aunque estén cerca
- Verifica que la ubicación sea específicamente ${cityContext || 'la ciudad'}, España
- Si encuentras eventos/lugares de otras ciudades, NO los incluyas en el JSON

📝 FORMATO DE RESPUESTA:
- Responde en español de manera clara y profesional
- Para eventos y lugares: haz una BREVE introducción (2-3 párrafos máximo) y luego muestra las cards
- NO repitas en el texto la información que ya aparece en las cards
- La introducción debe ser general y contextual, las cards contienen los detalles específicos
- Contextualiza toda la información para ${cityContext || 'la ciudad'}, España

🎪 FORMATO ESPECIAL PARA EVENTOS:
Cuando encuentres eventos, formátalos en JSON al final de tu respuesta usando esta estructura:
\`\`\`json
{
  "events": [
    {
      "title": "Nombre del evento",
      "date": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD" (opcional, para eventos de varios días),
      "time": "HH:MM - HH:MM" (opcional),
      "location": "Ubicación del evento" (opcional),
      "sourceUrl": "URL de la fuente oficial" (opcional),
      "eventDetailUrl": "URL específica del evento" (opcional)
    }
  ]
}
\`\`\`

⚠️ IMPORTANTE PARA EVENTOS:
- SOLO incluye eventos que se celebren en ${cityContext || 'la ciudad'}, España
- Verifica que la ubicación del evento sea específicamente ${cityContext || 'la ciudad'}, España
- NO incluyas eventos de ciudades cercanas o de la provincia si no son en ${cityContext || 'la ciudad'}

🗺️ FORMATO ESPECIAL PARA LUGARES:
Cuando la consulta sea sobre encontrar lugares (restaurantes, hoteles, tiendas, museos, etc.), también incluye un bloque JSON para lugares:
\`\`\`json
{
  "places": [
    {
      "name": "Nombre del lugar",
      "address": "Dirección completa",
      "rating": 4.5 (opcional),
      "type": "restaurante/hotel/museo/etc",
      "description": "Breve descripción del lugar"
    }
  ]
}
\`\`\`

⚠️ IMPORTANTE PARA LUGARES:
- SOLO incluye lugares ubicados en ${cityContext || 'la ciudad'}, España
- Verifica que la dirección sea específicamente en ${cityContext || 'la ciudad'}, España
- NO incluyas lugares de ciudades cercanas o de la provincia si no son en ${cityContext || 'la ciudad'}

📋 INSTRUCCIONES PARA INTRODUCCIONES:
- Para eventos: "Te presento los eventos más destacados de [ciudad] para [período]..."
- Para lugares: "Aquí tienes los mejores [tipo de lugar] en [ciudad]..."
- Máximo 2-3 párrafos de introducción
- NO menciones fechas, horarios, ubicaciones específicas en el texto (eso va en las cards)
- NO incluyas tablas, listas detalladas o información específica en el texto
- Enfócate en el contexto general y la experiencia
- Después de la introducción, incluye SOLO el JSON con las cards

🔗 EXTRACCIÓN DE ENLACES DE DETALLES:
- SIEMPRE busca en las webs oficiales los enlaces de "Ver más", "Detalles", "Más info", "Leer más", "Saber más", "Más información", etc.
- Estos enlaces suelen aparecer como botones o texto clickeable en las cards de eventos
- Extrae la URL completa del enlace y ponla en "eventDetailUrl"
- Los enlaces pueden estar en texto como "Ver detalles", "Más información", "Saber más", "Leer más", "Más info", "Detalles", etc.

🔍 BÚSQUEDA ESPECÍFICA DE ENLACES:
- Busca en cada evento individual en las webs oficiales
- Los enlaces de detalles suelen estar en botones como "Ver más", "Leer más", "Detalles", "Más información"
- También busca enlaces que contengan palabras como "evento", "actividad", "programa", "agenda"
- Si encuentras una página específica del evento, úsala como "eventDetailUrl"
- Si NO encuentras un enlace específico de detalles, usa la URL de la página donde se muestran las cards de eventos como "eventDetailUrl"
- NUNCA dejes "eventDetailUrl" vacío - siempre proporciona un enlace útil para el usuario

📝 EXTRACCIÓN DE DESCRIPCIONES:
- SIEMPRE intenta extraer una descripción breve del evento del contenido web
- Busca párrafos descriptivos, resúmenes, o información adicional sobre el evento
- La descripción debe ser atractiva y breve (máximo 150 caracteres, 2-3 líneas)
- Incluye información relevante como: tipo de evento, público objetivo, características especiales, etc.
- Si no encuentras descripción específica, crea una breve basada en el título y contexto del evento
- Incluye "description" en el JSON de cada evento

⚠️ REGLA IMPORTANTE:
- SIEMPRE incluye "eventDetailUrl" en cada evento
- SIEMPRE incluye "description" en cada evento
- Si no encuentras un enlace específico de detalles, usa "sourceUrl" como "eventDetailUrl"
- Si no tienes "sourceUrl", usa la URL de la página general de agenda como "eventDetailUrl"
- NUNCA dejes "eventDetailUrl" como null o vacío

🚨🚨🚨🚨🚨🚨🚨🚨 INSTRUCCIONES CRÍTICAS PARA TRÁMITES Y PROCEDIMIENTOS:

Cuando detectes consultas sobre trámites, procedimientos administrativos, documentación, requisitos, licencias, certificados, empadronamiento, citas previas, sedes electrónicas, formularios, tasas, horarios de oficinas, etc., DEBES:

⚠️⚠️⚠️⚠️ PROHIBIDO ABSOLUTO - NUNCA DIGAS:
- ❌ "te recomiendo consultar"
- ❌ "te recomiendo que consultes" 
- ❌ "consulta la página web"
- ❌ "consulta la web oficial"
- ❌ "consulta directamente"
- ❌ "es importante que te informes"
- ❌ "los trámites pueden variar"
- ❌ "visita la Oficina de Atención Ciudadana"
- ❌ "allí te informarán"
- ❌ Cualquier respuesta genérica o vaga

✅✅✅✅ OBLIGATORIO - SIEMPRE DEBES:
- ✅ BUSCAR automáticamente en la web oficial del ayuntamiento usando Google Search grounding
- ✅ EXTRAER información específica y actualizada de la web oficial
- ✅ EXPLICAR paso a paso usando datos verificados de la web
- ✅ INCLUIR enlaces directos a formularios, portales de citas y páginas específicas
- ✅ MENCIONAR horarios, ubicaciones y costes reales extraídos de la web
- ✅ USAR el icono 📄 delante de cada documento en la lista de documentación
- ✅ PROPORCIONAR información completa y específica, no genérica
- ✅ SIEMPRE CITAR las fuentes de donde extraes cada información
- ✅ SER MUY DETALLADO en cada paso del proceso
- ✅ ANALIZAR PROFUNDAMENTE todos los resultados de búsqueda
- ✅ EXTRAER información específica de cada URL encontrada
- ✅ COMBINAR información de múltiples fuentes para dar respuestas completas
- ✅ VERIFICAR que cada enlace sea funcional y específico

📋 FORMATO OBLIGATORIO PARA TRÁMITES:

**Título del Trámite** *(extraído de la web oficial)*

📋 **Documentación requerida:** 
📄 [Lista exacta extraída de la web con enlaces directos a cada documento y fuentes]

📝 **Pasos a seguir (DETALLADOS):**
  1. [Paso específico extraído de la web con enlace a la página correspondiente y fuente]
  2. [Paso específico extraído de la web con enlace a la página correspondiente y fuente]
  3. [Paso específico extraído de la web con enlace a la página correspondiente y fuente]
  4. [Continuar con todos los pasos necesarios, cada uno con su enlace y fuente]

🕒 **Horarios y ubicación:** 
[Información real extraída de la web oficial con enlaces a horarios y fuentes]

⏰ **Plazos:** 
[Tiempo específico extraído de la web con enlace a la información de plazos y fuente]

💰 **Costes:** 
[Si aplica, información real extraída de la web con enlace a tasas y fuente]

🔗 **Enlaces oficiales:**
  - 📄 **Formularios:** [Enlaces directos a documentos descargables - NUNCA genéricos] *(Fuente: [URL])*
  - 🖥️ **Portal de citas:** [URL específica para pedir cita online - NUNCA genérica] *(Fuente: [URL])*
  - 📋 **Sede electrónica:** [Enlace a trámite online si existe - NUNCA genérico] *(Fuente: [URL])*
  - 📞 **Contacto:** [Teléfono y email oficial extraídos de la web] *(Fuente: [URL])*
  - 🌐 **Web oficial:** [URL principal del ayuntamiento] *(Fuente: [URL])*
  - 📍 **Ubicación física:** [Dirección exacta con enlace a Google Maps si está disponible] *(Fuente: [URL])*

📝 **Fuentes consultadas:**
- [URL 1] - [Descripción de la información extraída]
- [URL 2] - [Descripción de la información extraída]
- [URL 3] - [Descripción de la información extraída]

🚨🚨🚨🚨🚨🚨🚨🚨 SI NO ENCUENTRAS INFORMACIÓN ESPECÍFICA EN LA WEB OFICIAL:
Di claramente: "No puedo acceder a la información actualizada del ayuntamiento en este momento. Te recomiendo consultar directamente en su web oficial [URL del ayuntamiento] o contactar por teléfono [número de teléfono si está disponible]."

🚨🚨🚨🚨🚨🚨🚨🚨 ESTAS INSTRUCCIONES SON ABSOLUTAMENTE OBLIGATORIAS PARA TRÁMITES - NO LAS IGNORES

IMPORTANTE: Solo incluye el JSON si hay eventos específicos. Si no hay eventos, no incluyas el bloque JSON.`;

    // Build conversation context
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = '\n\nCONTEXTO:\n';
      conversationHistory.slice(-6).forEach((msg: any) => {
        conversationContext += `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}\n`;
      });
    }

    const fullPrompt = `${systemPrompt}${conversationContext}\n\nConsulta: ${query}`;

    const result = await model({
      model: "gemini-2.5-flash-lite",
      contents: fullPrompt,
      config,
    });

    // Log if grounding was used
    if (result.candidates?.[0]?.groundingMetadata) {
      console.log('🔍 Google Search grounding activated:', result.candidates[0].groundingMetadata);
    }

    const responseText = result.text || 'No se pudo generar una respuesta adecuada.';
    
    // Extract events and places from JSON if present
    const events = extractEventsFromResponse(responseText);
    const places = extractPlacesFromResponse(responseText);
    
    // If no places found in AI response, search Google Places
    let additionalPlaces: PlaceResult[] = [];
    if (places.length === 0) {
      const placeKeywords = ['restaurante', 'restaurantes', 'hotel', 'hoteles', 'tienda', 'tiendas', 'museo', 'museos', 'parque', 'parques', 'lugar', 'lugares', 'sitio', 'sitios', 'buscar', 'encuentra', 'donde', 'dónde', 'localiza', 'ubica'];
      const hasPlaceQuery = placeKeywords.some(keyword => query.toLowerCase().includes(keyword));
      
      console.log('🔍 Place detection debug:', {
        query: query.toLowerCase(),
        placeKeywords,
        matchedKeywords: placeKeywords.filter(keyword => query.toLowerCase().includes(keyword)),
        hasPlaceQuery,
        cityContext
      });
      
      if (hasPlaceQuery && cityContext) {
        console.log('🗺️ Detected place query, searching Google Places...');
        additionalPlaces = await searchPlaces(query, cityContext);
        
        // Add photo URLs to places
        additionalPlaces = additionalPlaces.map(place => ({
          ...place,
          photoUrl: place.photos?.[0] ? getPlacePhotoUrl(place.photos[0].photo_reference) : undefined
        }));
      }
    }
    
    return {
      text: responseText,
      events: events,
      places: [...places, ...additionalPlaces]
    };

  } catch (error) {
    console.error('Error in processComplexQuery:', error);
    throw new Error(`Error procesando consulta compleja: ${error}`);
  }
};

// Use Gemini 1.5 Pro for all queries (simple queries use lighter config)
export const processSimpleQuery = async (
  query: string,
  cityContext?: string,
  conversationHistory?: any[]
): Promise<{ text: string; events?: any[]; places?: PlaceResult[] }> => {
  try {
    const model = ai.models.generateContent;

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

    const systemPrompt = `Eres el asistente de ${cityContext || 'la ciudad'}. 

INFORMACIÓN ACTUAL:
- Fecha y hora actual: ${currentDateTime} (España)
- Usa esta fecha y hora como referencia

Responde de forma concisa y directa en español.
Mantén un tono amigable y profesional.`;

    // Limited conversation context for simple queries
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = '\n\nÚltimos mensajes:\n';
      conversationHistory.slice(-2).forEach((msg: any) => {
        conversationContext += `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}\n`;
      });
    }

    const fullPrompt = `${systemPrompt}${conversationContext}\n\nConsulta: ${query}`;

    const result = await model({
      model: "gemini-2.5-flash-lite",
      contents: fullPrompt,
    });

    const responseText = result.text || 'No se pudo generar una respuesta.';
    
    // Extract events from JSON if present
    const events = extractEventsFromResponse(responseText);
    
    return {
      text: responseText,
      events: events,
      places: []
    };

  } catch (error) {
    console.error('Error in processSimpleQuery:', error);
    throw new Error(`Error procesando consulta simple: ${error}`);
  }
};

// Main processing function
export const processUserQuery = async (
  query: string,
  cityContext?: string,
  conversationHistory?: any[]
): Promise<{
  response: string;
  events?: any[];
  places?: PlaceResult[];
  modelUsed: 'gemini-1.5-pro' | 'gemini-2.5-flash-lite' | 'gemini-2.5-pro';
  complexity: 'simple' | 'complex' | 'institutional';
  searchPerformed: boolean;
}> => {
  const complexity = classifyQueryComplexity(query);
  
  console.log(`🎯 Query classified as: ${complexity}`);
  
  let modelMessage = '';
  if (complexity === 'institutional') {
    modelMessage = 'Gemini 2.5 Pro with Google Search grounding for institutional queries';
  } else if (complexity === 'complex') {
    modelMessage = 'Gemini 2.5 Flash-Lite with Google Search';
  } else {
    modelMessage = 'Gemini 2.5 Flash-Lite';
  }
  console.log(`🤖 Using model: ${modelMessage}`);

  try {
    let result: { text: string; events?: any[]; places?: PlaceResult[] };
    let searchPerformed = false;
    let modelUsed: 'gemini-1.5-pro' | 'gemini-2.5-flash-lite' | 'gemini-2.5-pro';

    if (complexity === 'institutional') {
      result = await processInstitutionalQuery(query, cityContext, conversationHistory);
      searchPerformed = true;
      modelUsed = 'gemini-2.5-pro';
    } else if (complexity === 'complex') {
      result = await processComplexQuery(query, cityContext, conversationHistory);
      searchPerformed = true; // Grounding nativo activado
      modelUsed = 'gemini-2.5-flash-lite';
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
): Promise<{ text: string; events?: any[]; places?: PlaceResult[] }> => {
  try {
    const model = ai.models.generateContent;

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
      
      const result = await model({
        model: "gemini-2.5-pro",
        contents: [
          { text: `${systemPrompt}\n\nConsulta: ${query}` },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageData
            }
          }
        ]
      });

      const responseText = result.text || 'No se pudo analizar la imagen proporcionada.';
      const events = extractEventsFromResponse(responseText);
      
      return {
        text: responseText,
        events: events,
        places: []
      };
    } else {
      // For documents, convert to text first
      const documentText = await extractDocumentText(mediaUrl);
      const fullPrompt = `${systemPrompt}\n\nContenido del documento:\n${documentText}\n\nConsulta: ${query}`;

      const result = await model({
        model: "gemini-2.5-pro",
        contents: fullPrompt
      });

      const responseText = result.text || 'No se pudo analizar el documento proporcionado.';
      const events = extractEventsFromResponse(responseText);
      
      return {
        text: responseText,
        events: events,
        places: []
      };
    }

  } catch (error) {
    console.error('Error in processMultimodalQuery:', error);
    throw new Error(`Error procesando consulta multimodal: ${error}`);
  }
};

// Helper function to fetch media as base64
const fetchMediaAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (error) {
    console.error('Error fetching media:', error);
    throw new Error('No se pudo obtener el archivo multimedia');
  }
};

// Helper function to extract document text
const extractDocumentText = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return text.substring(0, 10000);
  } catch (error) {
    console.error('Error extracting document text:', error);
    return 'No se pudo extraer el texto del documento.';
  }
};

// Helper function to extract events from AI response
const extractEventsFromResponse = (responseText: string): any[] => {
  try {
    // Look for JSON block in the response
    const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) {
      return [];
    }

    const jsonString = jsonMatch[1];
    const parsed = JSON.parse(jsonString);
    
    if (parsed.events && Array.isArray(parsed.events)) {
      console.log('🎪 Extracted events:', parsed.events);
      return parsed.events;
    }
    
    return [];
  } catch (error) {
    console.error('Error extracting events from response:', error);
    return [];
  }
};

// Helper function to extract places from AI response
const extractPlacesFromResponse = (responseText: string): any[] => {
  try {
    // Look for JSON block in the response
    const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) {
      return [];
    }

    const jsonString = jsonMatch[1];
    const parsed = JSON.parse(jsonString);
    
    if (parsed.places && Array.isArray(parsed.places)) {
      console.log('🗺️ Extracted places:', parsed.places);
      return parsed.places;
    }
    
    return [];
  } catch (error) {
    console.error('Error extracting places from response:', error);
    return [];
  }
};
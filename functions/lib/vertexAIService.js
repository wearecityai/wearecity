"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMultimodalQuery = exports.processUserQuery = exports.processSimpleQuery = exports.processComplexQuery = exports.classifyQueryComplexity = void 0;
const genai_1 = require("@google/genai");
const placesService_1 = require("./placesService");
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'wearecity-2ab89';
console.log('🔑 Google AI Config:', { PROJECT_ID });
// Initialize Google AI
const ai = new genai_1.GoogleGenAI({});
// Query complexity classifier
const classifyQueryComplexity = (query) => {
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
exports.classifyQueryComplexity = classifyQueryComplexity;
// Gemini 1.5 Pro for complex queries with Google Search grounding
const processComplexQuery = async (query, cityContext, conversationHistory) => {
    try {
        // Use Gemini 2.5 Pro with Google Search grounding for complex queries
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

IMPORTANTE: Solo incluye el JSON si hay eventos específicos. Si no hay eventos, no incluyas el bloque JSON.`;
        // Build conversation context
        let conversationContext = '';
        if (conversationHistory && conversationHistory.length > 0) {
            conversationContext = '\n\nCONTEXTO:\n';
            conversationHistory.slice(-6).forEach((msg) => {
                conversationContext += `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}\n`;
            });
        }
        const fullPrompt = `${systemPrompt}${conversationContext}\n\nConsulta: ${query}`;
        const result = await model({
            model: "gemini-2.5-pro",
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
        let additionalPlaces = [];
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
                additionalPlaces = await (0, placesService_1.searchPlaces)(query, cityContext);
                // Add photo URLs to places
                additionalPlaces = additionalPlaces.map(place => ({
                    ...place,
                    photoUrl: place.photos?.[0] ? (0, placesService_1.getPlacePhotoUrl)(place.photos[0].photo_reference) : undefined
                }));
            }
        }
        return {
            text: responseText,
            events: events,
            places: [...places, ...additionalPlaces]
        };
    }
    catch (error) {
        console.error('Error in processComplexQuery:', error);
        throw new Error(`Error procesando consulta compleja: ${error}`);
    }
};
exports.processComplexQuery = processComplexQuery;
// Use Gemini 1.5 Pro for all queries (simple queries use lighter config)
const processSimpleQuery = async (query, cityContext, conversationHistory) => {
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
            conversationHistory.slice(-2).forEach((msg) => {
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
    }
    catch (error) {
        console.error('Error in processSimpleQuery:', error);
        throw new Error(`Error procesando consulta simple: ${error}`);
    }
};
exports.processSimpleQuery = processSimpleQuery;
// Main processing function
const processUserQuery = async (query, cityContext, conversationHistory) => {
    const complexity = (0, exports.classifyQueryComplexity)(query);
    console.log(`🎯 Query classified as: ${complexity}`);
    console.log(`🤖 Using model: Gemini 2.5 Flash-Lite (US-Central1)${complexity === 'complex' ? ' with Google Search' : ''}`);
    try {
        let result;
        let searchPerformed = false;
        if (complexity === 'complex') {
            result = await (0, exports.processComplexQuery)(query, cityContext, conversationHistory);
            searchPerformed = true; // Grounding nativo activado
        }
        else {
            result = await (0, exports.processSimpleQuery)(query, cityContext, conversationHistory);
        }
        return {
            response: result.text,
            events: result.events,
            places: result.places,
            modelUsed: 'gemini-2.5-flash-lite',
            complexity,
            searchPerformed
        };
    }
    catch (error) {
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
exports.processUserQuery = processUserQuery;
// Multimodal processing for images and documents
const processMultimodalQuery = async (query, mediaUrl, mediaType, cityContext) => {
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
        }
        else {
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
    }
    catch (error) {
        console.error('Error in processMultimodalQuery:', error);
        throw new Error(`Error procesando consulta multimodal: ${error}`);
    }
};
exports.processMultimodalQuery = processMultimodalQuery;
// Helper function to fetch media as base64
const fetchMediaAsBase64 = async (url) => {
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer).toString('base64');
    }
    catch (error) {
        console.error('Error fetching media:', error);
        throw new Error('No se pudo obtener el archivo multimedia');
    }
};
// Helper function to extract document text
const extractDocumentText = async (url) => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        return text.substring(0, 10000);
    }
    catch (error) {
        console.error('Error extracting document text:', error);
        return 'No se pudo extraer el texto del documento.';
    }
};
// Helper function to extract events from AI response
const extractEventsFromResponse = (responseText) => {
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
    }
    catch (error) {
        console.error('Error extracting events from response:', error);
        return [];
    }
};
// Helper function to extract places from AI response
const extractPlacesFromResponse = (responseText) => {
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
    }
    catch (error) {
        console.error('Error extracting places from response:', error);
        return [];
    }
};
//# sourceMappingURL=vertexAIService.js.map
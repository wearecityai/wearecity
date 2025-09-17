"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMultimodalQuery = exports.processUserQuery = exports.processSimpleQuery = exports.processInstitutionalQuery = exports.classifyQueryComplexity = void 0;
const genai_1 = require("@google/genai");
const placesService_1 = require("./placesService");
const eventScraper_1 = require("./eventScraper");
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'wearecity-2ab89';
console.log('🔑 Google AI Config:', { PROJECT_ID });
// Initialize Google AI
const ai = new genai_1.GoogleGenAI({});
// Query complexity classifier
const classifyQueryComplexity = (query) => {
    // 🎯 NUEVA LÓGICA: Detectar consultas que necesitan Gemini 2.5 Flash + Google Search Grounding
    const flashGroundingIndicators = [
        // Eventos y actividades - SIEMPRE Gemini 2.5 Flash + grounding
        'evento', 'eventos', 'actividad', 'actividades', 'fiesta', 'fiestas', 'festival', 'festivales',
        'concierto', 'conciertos', 'teatro', 'cine', 'exposicion', 'exposiciones', 'feria', 'ferias',
        'mercado', 'mercados', 'celebraciones', 'agenda', 'programa', 'que hacer', 'que hacer',
        'planes', 'ocio', 'entretenimiento', 'cultura', 'deporte', 'deportes',
        // 🎯 CONSULTAS TEMPORALES (SIEMPRE necesitan información en tiempo real)
        'octubre', 'noviembre', 'diciembre', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'este mes', 'próximo mes', 'esta semana', 'próxima semana',
        'hoy', 'mañana', 'fin de semana', 'finde', 'puente', 'vacaciones', 'navidad', 'semana santa',
        // 🎯 LUGARES Y RECOMENDACIONES (SIEMPRE necesitan información actualizada)
        'restaurante', 'restaurantes', 'hotel', 'hoteles', 'tienda', 'tiendas', 'museo', 'museos',
        'parque', 'parques', 'lugar', 'lugares', 'sitio', 'sitios', 'recomienda', 'recomendame',
        'mejor', 'mejores', 'donde comer', 'donde ir', 'donde visitar', 'que visitar',
        'pizzeria', 'bar', 'bares', 'cafe', 'cafes', 'cafeteria', 'cafeterias',
        // 🎯 TRÁMITES Y PROCEDIMIENTOS ADMINISTRATIVOS (SIEMPRE 2.5 Flash + grounding)
        'tramite', 'tramites', 'procedimiento', 'procedimientos', 'gestion', 'gestiones',
        'ayuntamiento', 'municipio', 'alcaldia', 'gobierno local', 'administracion municipal',
        'sede electronica', 'portal ciudadano', 'atencion ciudadana', 'oficina virtual',
        'certificado', 'certificados', 'documento', 'documentos', 'formulario', 'formularios',
        'empadronamiento', 'empadronar', 'padron', 'censo', 'domicilio', 'residencia',
        'licencia', 'licencias', 'permiso', 'permisos', 'autorizacion', 'autorizaciones',
        'tasa', 'tasas', 'impuesto', 'impuestos', 'tributo', 'tributos', 'pago', 'pagos',
        'cita previa', 'cita', 'citas', 'reserva', 'reservas', 'turno', 'turnos',
        // 🎯 SERVICIOS PÚBLICOS Y OFICINAS (SIEMPRE 2.5 Flash + grounding)
        'oficina', 'oficinas', 'dependencia', 'dependencias', 'departamento', 'departamentos',
        'ventanilla', 'ventanillas', 'mostrador', 'mostradores', 'atencion publico',
        'registro civil', 'hacienda', 'seguridad social', 'sanidad', 'educacion',
        'bomberos', 'policia local', 'guardia civil', 'proteccion civil',
        // 🎯 INFORMACIÓN BUROCRÁTICA E INSTITUCIONAL (SIEMPRE 2.5 Flash + grounding)
        'como solicitar', 'como obtener', 'como presentar', 'como hacer', 'como tramitar',
        'donde solicitar', 'donde presentar', 'donde ir', 'donde acudir',
        'que necesito', 'que documentos', 'que requisitos', 'que papeles',
        'documentacion', 'requisitos', 'pasos', 'proceso', 'tramitacion',
        // 🎯 HORARIOS Y TRANSPORTE (SIEMPRE 2.5 Flash + grounding)
        'horario', 'horarios', 'abierto', 'cerrado', 'funcionamiento',
        'transporte', 'autobus', 'autobuses', 'tren', 'metro', 'taxi',
        'itinerario', 'itinerarios', 'ruta', 'rutas', 'linea', 'lineas'
    ];
    const queryNormalized = query.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    // 🎯 NUEVA LÓGICA: Flash Lite SOLO para casos muy específicos
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
    // Verificar si es consulta que necesita Flash Lite (casos muy específicos)
    const needsFlashLite = flashLiteIndicators.some(indicator => {
        const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(queryNormalized);
    });
    if (needsFlashLite) {
        console.log('🎯 Flash Lite query detected - simple historical/greeting content');
        console.log('🔍 Matched indicators:', flashLiteIndicators.filter(indicator => {
            const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            return regex.test(queryNormalized);
        }));
        return 'simple';
    }
    // Verificar si es consulta que necesita información en tiempo real (Gemini 2.5 Flash + grounding)
    const hasRealTimeIntent = flashGroundingIndicators.some(indicator => {
        const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(queryNormalized);
    });
    if (hasRealTimeIntent) {
        console.log('🎯 Flash + Grounding query detected - real-time information needed');
        console.log('🔍 Matched indicators:', flashGroundingIndicators.filter(indicator => {
            const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            return regex.test(queryNormalized);
        }));
        return 'institutional';
    }
    const queryLower = query.toLowerCase();
    console.log('🔍 Classification debug:', {
        originalQuery: query,
        queryLower,
        queryLength: query.length,
        wordCount: query.split(' ').length
    });
    // Por defecto, usar Flash + Grounding para todo lo demás (principio de precaución)
    console.log('✅ Defaulting to Flash + Grounding for comprehensive information');
    return 'institutional';
};
exports.classifyQueryComplexity = classifyQueryComplexity;
// Gemini 2.5 Flash for institutional queries with Google Search grounding
const processInstitutionalQuery = async (query, cityContext, conversationHistory, cityConfig // Nueva: configuración completa de la ciudad
) => {
    var _a, _b;
    try {
        console.log('🏛️ Processing institutional query with Gemini 2.5 Flash + Google Search grounding');
        // Configure grounding tool (will be used conditionally)
        const groundingTool = {
            googleSearch: {},
        };
        let config = {
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
        // 🎯 CONFIGURACIÓN DE URLs OFICIALES PARA EVENTOS
        const agendaEventosUrls = (cityConfig === null || cityConfig === void 0 ? void 0 : cityConfig.agendaEventosUrls) || [];
        const agendaUrlsText = agendaEventosUrls.length > 0
            ? `
🔒 URLs OFICIALES CONFIGURADAS PARA EVENTOS:
- ${agendaEventosUrls.join('\n- ')}

🔒 BÚSQUEDAS OBLIGATORIAS PARA EVENTOS:

🔍 BUSCA EXACTAMENTE ESTOS TÉRMINOS:
1. "${agendaEventosUrls[0]}" (URL completa)
2. "eventos La Vila Joiosa septiembre 2025"
3. "villajoyosa.com/evento/ agenda"
4. "teatro concierto villajoyosa"

🔒 ACCESO DIRECTO: Ve a ${agendaEventosUrls[0]} y extrae los eventos actuales`
            : '🔒 No hay URLs oficiales configuradas para eventos en esta ciudad';
        console.log('🔍 Event URLs configuration:', {
            hasEventUrls: agendaEventosUrls.length > 0,
            eventUrls: agendaEventosUrls,
            query: query.substring(0, 100)
        });
        let systemPrompt = `Eres WeAreCity, el asistente inteligente de ${cityContext || 'la ciudad'}. 
Tienes acceso a Google Search en tiempo real para proporcionar información actualizada y precisa.

🚨🚨🚨 INSTRUCCIÓN CRÍTICA PARA EVENTOS 🚨🚨🚨
Para consultas sobre eventos, tienes acceso a:
1. 🕷️ SCRAPING DIRECTO de la web oficial (información más actualizada)
2. 🔍 Google Search Grounding (como respaldo)

Si recibes información de scraping directo (marcada con 🕷️), úsala PRIORITARIAMENTE.
Si no hay información de scraping, entonces usa Google Search para buscar eventos.

🎯 INFORMACIÓN ACTUAL:
- Fecha y hora actual: ${currentDateTime} (España)
- Usa SIEMPRE esta fecha y hora como referencia para información temporal
- Tienes acceso a Google Search para información en tiempo real

🔍 INSTRUCCIONES DE BÚSQUEDA:
- Para consultas sobre eventos, noticias, horarios o información actual, utiliza Google Search automáticamente
- Busca información específica en webs oficiales cuando sea posible
- SIEMPRE cita las fuentes de información cuando uses datos de búsquedas
${agendaUrlsText}

🎪 PROTOCOLO OBLIGATORIO PARA CONSULTAS DE EVENTOS:

🔍 PASO 1 - BÚSQUEDA OBLIGATORIA:
Para CUALQUIER consulta sobre eventos, debes hacer estas búsquedas OBLIGATORIAS usando Google Search:
1. Busca: "${agendaEventosUrls.length > 0 ? agendaEventosUrls[0] : 'eventos villajoyosa.com'}"
2. Busca: "eventos septiembre 2025 villajoyosa.com"
3. Busca: "agenda cultural La Vila Joiosa 2025"
4. Busca: "teatro concierto villajoyosa septiembre octubre"

🚨 CRÍTICO - DEBES BUSCAR ANTES DE RESPONDER:
- NO respondas sobre eventos hasta haber hecho las búsquedas
- Si Google Search no funciona, dilo explícitamente: "Estoy consultando la web oficial de eventos..."
- Accede directamente a la página: ${agendaEventosUrls.length > 0 ? agendaEventosUrls[0] : 'https://www.villajoyosa.com/evento/'}

⚠️ PROHIBIDO decir "no hay eventos" sin haber buscado primero

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
            conversationHistory.slice(-6).forEach((msg) => {
                conversationContext += `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}\n`;
            });
        }
        // Check if this is an event query and try Puppeteer scraping
        const isEventQuery = /eventos?|actividades|agenda|cultural|teatro|cine|concierto|festival/i.test(query);
        let scrapedEventsContent = '';
        if (isEventQuery && agendaEventosUrls.length > 0) {
            console.log('🎪 Event query detected, attempting Puppeteer scraping...');
            try {
                const scrapingResult = await (0, eventScraper_1.scrapeEventsFromUrl)(agendaEventosUrls[0], cityContext || 'la ciudad');
                if (scrapingResult.success && scrapingResult.events.length > 0) {
                    console.log(`✅ Puppeteer found ${scrapingResult.events.length} events - disabling Google Search Grounding for efficiency`);
                    // Disable Google Search Grounding since we have direct data
                    config = {}; // Remove grounding tools to speed up processing
                    // Format scraped events for AI processing
                    scrapedEventsContent = `
🕷️ EVENTOS EXTRAÍDOS DIRECTAMENTE DE LA WEB OFICIAL (${agendaEventosUrls[0]}):

${scrapingResult.events.map((event, index) => `
📅 EVENTO ${index + 1}:
• Título: ${event.title}
• Fecha: ${event.date}
• Hora: ${event.time}
• Ubicación: ${event.location}
• Descripción: ${event.description}
• URL: ${event.url}
`).join('\n')}

🎯 INFORMACIÓN EXTRAÍDA: ${scrapingResult.scrapedAt}
📊 TOTAL DE EVENTOS ENCONTRADOS: ${scrapingResult.events.length}

INSTRUCCIONES: Usa ÚNICAMENTE esta información extraída directamente de la web oficial para responder sobre eventos. NO uses Google Search ya que tienes datos directos y actualizados.`;
                }
                else {
                    console.log('⚠️ Puppeteer scraping did not find events or failed');
                    if (scrapingResult.error) {
                        console.error('Scraping error:', scrapingResult.error);
                    }
                }
            }
            catch (error) {
                console.error('❌ Error in Puppeteer scraping:', error);
            }
        }
        const fullPrompt = `${systemPrompt}${conversationContext}

${scrapedEventsContent}

Consulta: ${query}`;
        // Retry mechanism for overloaded model errors
        let result;
        let retryCount = 0;
        const maxRetries = 3;
        while (retryCount < maxRetries) {
            try {
                console.log(`🤖 Attempting AI generation (attempt ${retryCount + 1}/${maxRetries})`);
                result = await model({
                    model: "gemini-2.5-flash",
                    contents: fullPrompt,
                    config,
                });
                break; // Success, exit retry loop
            }
            catch (error) {
                retryCount++;
                if (error.status === 503 && retryCount < maxRetries) {
                    console.log(`⚠️ Model overloaded (503), retrying in ${retryCount * 2} seconds... (${retryCount}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, retryCount * 2000)); // Exponential backoff
                    continue;
                }
                // If not a 503 error or we've exhausted retries, throw the error
                throw error;
            }
        }
        // Log if grounding was used
        if ((_b = (_a = result.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.groundingMetadata) {
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
                additionalPlaces = additionalPlaces.map(place => {
                    var _a;
                    return (Object.assign(Object.assign({}, place), { photoUrl: ((_a = place.photos) === null || _a === void 0 ? void 0 : _a[0]) ? (0, placesService_1.getPlacePhotoUrl)(place.photos[0].photo_reference) : undefined }));
                });
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
exports.processInstitutionalQuery = processInstitutionalQuery;
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
        // Extract places from JSON if present
        const places = extractPlacesFromResponse(responseText);
        // 🗺️ DETECCIÓN Y BÚSQUEDA DE LUGARES TAMBIÉN EN CONSULTAS SIMPLES
        let additionalPlaces = [];
        const placeKeywords = ['restaurante', 'restaurantes', 'hotel', 'hoteles', 'tienda', 'tiendas', 'museo', 'museos', 'parque', 'parques', 'lugar', 'lugares', 'sitio', 'sitios', 'buscar', 'encuentra', 'donde', 'dónde', 'localiza', 'ubica', 'recomienda', 'recomendame', 'mejor', 'mejores'];
        const hasPlaceQuery = placeKeywords.some(keyword => query.toLowerCase().includes(keyword));
        console.log('🔍 Simple query place detection:', {
            query: query.toLowerCase(),
            placeKeywords,
            matchedKeywords: placeKeywords.filter(keyword => query.toLowerCase().includes(keyword)),
            hasPlaceQuery,
            cityContext
        });
        if (hasPlaceQuery && cityContext) {
            console.log('🗺️ Detected place query in simple query, searching Google Places...');
            additionalPlaces = await (0, placesService_1.searchPlaces)(query, cityContext);
            // Add photo URLs to places
            additionalPlaces = additionalPlaces.map(place => {
                var _a;
                return (Object.assign(Object.assign({}, place), { photoUrl: ((_a = place.photos) === null || _a === void 0 ? void 0 : _a[0]) ? (0, placesService_1.getPlacePhotoUrl)(place.photos[0].photo_reference) : undefined }));
            });
        }
        return {
            text: responseText,
            events: events,
            places: [...places, ...additionalPlaces]
        };
    }
    catch (error) {
        console.error('Error in processSimpleQuery:', error);
        throw new Error(`Error procesando consulta simple: ${error}`);
    }
};
exports.processSimpleQuery = processSimpleQuery;
// Main processing function
const processUserQuery = async (query, cityContext, conversationHistory, cityConfig // Nueva: configuración completa de la ciudad
) => {
    const complexity = (0, exports.classifyQueryComplexity)(query);
    console.log(`🎯 Query classified as: ${complexity}`);
    let modelMessage = '';
    if (complexity === 'institutional') {
        modelMessage = 'Gemini 2.5 Flash with Google Search grounding for real-time information';
    }
    else {
        modelMessage = 'Gemini 2.5 Flash-Lite for simple/historical queries only';
    }
    console.log(`🤖 Using model: ${modelMessage}`);
    try {
        let result;
        let searchPerformed = false;
        let modelUsed;
        if (complexity === 'institutional') {
            result = await (0, exports.processInstitutionalQuery)(query, cityContext, conversationHistory, cityConfig);
            searchPerformed = true;
            modelUsed = 'gemini-2.5-flash';
        }
        else {
            result = await (0, exports.processSimpleQuery)(query, cityContext, conversationHistory);
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
                model: "gemini-2.5-flash",
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
                model: "gemini-2.5-flash",
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
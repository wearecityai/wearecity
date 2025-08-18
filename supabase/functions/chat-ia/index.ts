import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 🗄️ CLIENTE DE SUPABASE
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_ANON_KEY') || ''
)

// 🎯 CONFIGURACIÓN DE VERTEX AI NATIVO
const VERTEX_CONFIG = {
  apiKey: Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GOOGLE_GEMINI_API_KEY') || '',
  searchApiKey: Deno.env.get('GOOGLE_CSE_KEY') || Deno.env.get('GOOGLE_SEARCH_API_KEY') || Deno.env.get('GOOGLE_API_KEY') || '',
  searchEngineId: Deno.env.get('GOOGLE_CSE_CX') || Deno.env.get('GOOGLE_SEARCH_ENGINE_ID') || Deno.env.get('GOOGLE_CSE_ID') || '',
  model: 'gemini-1.5-pro', // 🌐 MODELO CON CAPACIDADES DE ACCESO A WEB
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta'
}

// Verificar si Vertex AI está configurado
const VERTEX_ENABLED = VERTEX_CONFIG.apiKey.length > 0

// Debug: Mostrar configuración
console.log('🔧 DEBUG - Configuración Vertex AI:')
console.log('API Key length:', VERTEX_CONFIG.apiKey.length)
console.log('Search API Key length:', VERTEX_CONFIG.searchApiKey.length)
console.log('Search Engine ID:', VERTEX_CONFIG.searchEngineId)
console.log('VERTEX_ENABLED:', VERTEX_ENABLED)

// 🔍 FUNCIÓN DE BÚSQUEDA WEB INTELIGENTE
async function searchWebForCityInfo(query: string, cityName: string, cityId: number): Promise<any[]> {
  try {
    console.log('🔍 Iniciando búsqueda web para:', query, 'en ciudad:', cityName)
    console.log('🔍 Query original:', query)
    console.log('🔍 Query en minúsculas:', query.toLowerCase())
    
    // 🎯 DETERMINAR TIPO DE BÚSQUEDA
    const isEventQuery = query.toLowerCase().includes('evento') || 
                        query.toLowerCase().includes('eventos') ||
                        query.toLowerCase().includes('agenda') ||
                        query.toLowerCase().includes('actividad') ||
                        query.toLowerCase().includes('actividades') ||
                        query.toLowerCase().includes('feria') ||
                        query.toLowerCase().includes('festival') ||
                        query.toLowerCase().includes('concierto') ||
                        query.toLowerCase().includes('exposición') ||
                        query.toLowerCase().includes('teatro') ||
                        query.toLowerCase().includes('cine') ||
                        query.toLowerCase().includes('mercado') ||
                        query.toLowerCase().includes('fiesta') ||
                        query.toLowerCase().includes('celebracion') ||
                        query.toLowerCase().includes('fin de semana') ||
                        query.toLowerCase().includes('este mes') ||
                        query.toLowerCase().includes('próximos días') ||
                        query.toLowerCase().includes('próxima semana')

    console.log('🎯 ¿Es consulta de eventos?', isEventQuery)
    console.log('🚨 DEBUG CRÍTICO - Query original:', query)
    console.log('🚨 DEBUG CRÍTICO - Query en minúsculas:', query.toLowerCase())
    console.log('🚨 DEBUG CRÍTICO - ¿Contiene "eventos"?', query.toLowerCase().includes('eventos'))
    console.log('🚨 DEBUG CRÍTICO - ¿Contiene "este mes"?', query.toLowerCase().includes('este mes'))

    // 🏛️ SI ES CONSULTA DE EVENTOS: BUSCAR SOLO EN WEBS OFICIALES
    if (isEventQuery) {
      console.log('🎉 BÚSQUEDA DE EVENTOS DETECTADA - usando Gemini 1.5 Pro')
      console.log('🚨 DEBUG CRÍTICO - Llamando a extractEventsFromConfiguredSources...')
      console.log('🚨 DEBUG CRÍTICO - Parámetros:', { cityName, cityId, query })
      
      // 📱 OBTENER DATOS DE LA CIUDAD PARA URLs ESPECÍFICOS
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select('agenda_eventos_urls, name, slug')
        .eq('id', cityId)
        .single()
      
      if (cityError || !cityData) {
        console.log('⚠️ Error obteniendo datos de ciudad, NO SE PUEDEN BUSCAR EVENTOS')
        console.log('🚨 CRÍTICO: Sin agenda_eventos_urls configurados, no se buscarán eventos')
        return [] // No buscar eventos si no hay URLs configurados
      }
      
      // 🚨 VALIDAR QUE EXISTAN URLs DE AGENDA CONFIGURADOS
      if (!cityData.agenda_eventos_urls || cityData.agenda_eventos_urls.length === 0) {
        console.log('🚨 CRÍTICO: No hay agenda_eventos_urls configurados para esta ciudad')
        console.log('🚨 Los eventos SOLO se buscan en fuentes oficiales configuradas')
        return [] // No buscar eventos si no hay URLs específicos
      }
      
      console.log('✅ URLs de agenda configurados:', cityData.agenda_eventos_urls)
      console.log('🔍 Buscando eventos EXCLUSIVAMENTE en fuentes oficiales configuradas')
      
      // 🚀 BUSCAR EVENTOS SOLO EN URLs OFICIALES CONFIGURADOS
      const result = await extractEventsFromConfiguredSources(cityName, cityData.agenda_eventos_urls, query)
      console.log('✅ Eventos extraídos de fuentes oficiales:', result.length)
      return result
    }

    // 🏪 SI ES CONSULTA DE LUGARES: USAR GOOGLE SEARCH
    if (query.toLowerCase().includes('restaurante') || 
        query.toLowerCase().includes('restaurantes') ||
        query.toLowerCase().includes('lugar') ||
        query.toLowerCase().includes('lugares') ||
        query.toLowerCase().includes('monumento') ||
        query.toLowerCase().includes('museo') ||
        query.toLowerCase().includes('parque') ||
        query.toLowerCase().includes('bar') ||
        query.toLowerCase().includes('café') ||
        query.toLowerCase().includes('tienda')) {
      
      console.log('🏪 Búsqueda de LUGARES detectada - usando Google Search')
      return await searchPlacesWithGoogle(query, cityName)
    }

    // 🏛️ SI ES CONSULTA DE TRÁMITES: USAR GOOGLE SEARCH EN WEBS OFICIALES
    if (query.toLowerCase().includes('trámite') || 
        query.toLowerCase().includes('tramite') ||
        query.toLowerCase().includes('empadronamiento') ||
        query.toLowerCase().includes('licencia') ||
        query.toLowerCase().includes('documento') ||
        query.toLowerCase().includes('certificado') ||
        query.toLowerCase().includes('procedimiento')) {
      
      console.log('🏛️ Búsqueda de TRÁMITES detectada - usando Google Search en webs oficiales')
      return await searchProceduresInOfficialWebsites(query, cityName, cityId)
    }

    // 🔍 BÚSQUEDA GENERAL: USAR GOOGLE SEARCH
    console.log('🔍 BÚSQUEDA GENERAL detectada - usando Google Search')
    return await searchGeneralWithGoogle(query, cityName)
  } catch (error) {
    console.error('Error en búsqueda web:', error)
    return []
  }
}

// 🎉 BÚSQUEDA DE EVENTOS EN WEBS OFICIALES CON GOOGLE SEARCH
async function searchEventsInOfficialWebsites(cityName: string, cityId: number, query: string): Promise<any[]> {
  try {
    console.log('🎯 Buscando eventos en webs oficiales para:', cityName)
    console.log('🚨 DEBUG CRÍTICO - searchEventsInOfficialWebsites INICIADA')
    console.log('🚨 DEBUG CRÍTICO - Parámetros recibidos:', { cityName, cityId, query })
    
    // 📊 OBTENER DATOS DE LA CIUDAD DESDE LA BASE DE DATOS
    console.log('🔍 DEBUG - Obteniendo datos de ciudad con ID:', cityId)
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('agenda_eventos_urls, nombre, provincia')
      .eq('id', cityId)
      .single()

    if (cityError || !cityData) {
      console.error('❌ Error obteniendo datos de la ciudad:', cityError)
      console.log('🔍 DEBUG - cityData:', cityData)
      return await generateTypicalEvents(cityName, query)
    }

    console.log('🏙️ Datos de la ciudad obtenidos:', cityData.nombre)
    console.log('🔗 URLs de agenda disponibles:', cityData.agenda_eventos_urls)
    console.log('🔍 DEBUG - Tipo de agenda_eventos_urls:', typeof cityData.agenda_eventos_urls)
    console.log('🔍 DEBUG - Longitud de agenda_eventos_urls:', cityData.agenda_eventos_urls?.length)

    // 🚫 SI NO HAY URLs DE AGENDA, GENERAR EVENTOS TÍPICOS
    if (!cityData.agenda_eventos_urls || cityData.agenda_eventos_urls.length === 0) {
      console.log('⚠️ No hay URLs de agenda configuradas, generando eventos típicos')
      return await generateTypicalEvents(cityName, query)
    }
    
    // 🚨 DEBUG CRÍTICO - Verificar estructura de URLs
    console.log('🚨 DEBUG CRÍTICO - Tipo de agenda_eventos_urls:', typeof cityData.agenda_eventos_urls)
    console.log('🚨 DEBUG CRÍTICO - Contenido de agenda_eventos_urls:', JSON.stringify(cityData.agenda_eventos_urls))
    console.log('🚨 DEBUG CRÍTICO - ¿Es array?', Array.isArray(cityData.agenda_eventos_urls))

    const results: any[] = []

    // 🔍 BUSCAR EN CADA URL OFICIAL DE AGENDA CON GOOGLE SEARCH
    console.log('🔍 DEBUG - Iniciando búsqueda en URLs oficiales con Google Search...')
    console.log('🔍 DEBUG - Total de URLs a procesar:', cityData.agenda_eventos_urls.length)
    
    for (const url of cityData.agenda_eventos_urls) {
      if (!url || url.trim() === '') {
        console.log('⚠️ URL vacía o nula, saltando...')
        continue
      }

      console.log('🔍 Buscando eventos en URL oficial con Google Search:', url)
      console.log('🚨 DEBUG CRÍTICO - Procesando URL:', url)

      try {
        // 🔍 BÚSQUEDA CON GOOGLE SEARCH EN LUGAR DE ACCESO DIRECTO
        const searchQuery = `${cityName} eventos agenda actividades ${query}`
        const googleResponse = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${VERTEX_CONFIG.searchApiKey}&cx=${VERTEX_CONFIG.searchEngineId}&q=${encodeURIComponent(searchQuery)}&siteSearch=${encodeURIComponent(url)}&siteSearchFilter=i&num=3`
        )

        if (!googleResponse.ok) {
          console.log(`⚠️ Error en Google Search para ${url}:`, googleResponse.status)
          continue
        }

        const googleData = await googleResponse.json()
        
        if (googleData.items && googleData.items.length > 0) {
          console.log(`✅ Google Search encontró ${googleData.items.length} resultados para ${url}`)
          
          // 🚀 PROCESAR RESULTADOS CON GEMINI
          for (const item of googleData.items) {
            try {
              console.log('🚀 Procesando resultado con Gemini:', item.title)
              
              // 🎯 PROMPT PARA GEMINI CON INFORMACIÓN DE GOOGLE SEARCH
              const geminiPrompt = `Analiza esta información de eventos de ${cityName} y genera un Event Card en formato JSON:

TÍTULO: ${item.title}
DESCRIPCIÓN: ${item.snippet}
URL: ${item.link}

Genera un Event Card con esta información y datos adicionales típicos de la ciudad:

[EVENT_CARD_START]
{
  "title": "Título del evento basado en la información",
  "date": "Fecha estimada o 'Consultar'",
  "time": "Horario estimado o 'Consultar'",
  "location": "Ubicación en ${cityName}",
  "description": "Descripción basada en el snippet",
  "price": "Precio o 'Consultar'",
  "category": "Categoría del evento",
  "audience": "Público objetivo",
  "contact": "Contacto o 'Consultar'",
  "website": "${item.link}"
}
[/EVENT_CARD_END]`

              // 🚀 LLAMADA A GEMINI
              const geminiResponse = await fetch(
                `${VERTEX_CONFIG.baseUrl}/models/${VERTEX_CONFIG.model}:generateContent?key=${VERTEX_CONFIG.apiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: geminiPrompt }] }],
                    generationConfig: {
                      temperature: 0.3,
                      maxOutputTokens: 2000,
                      topP: 0.8
                    }
                  })
                }
              )

              if (geminiResponse.ok) {
                const geminiData = await geminiResponse.json()
                const extractedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
                
                if (extractedText) {
                  // 📱 EXTRAER EVENT CARD
                  const eventCards = extractEventCards(extractedText)
                  if (eventCards.length > 0) {
                    console.log(`✅ Gemini generó ${eventCards.length} Event Cards`)
                    results.push(...eventCards)
                  }
                }
              }
              
            } catch (geminiError) {
              console.error(`❌ Error procesando resultado con Gemini:`, geminiError)
              continue
            }
          }
          
  } else {
          console.log(`⚠️ Google Search no encontró resultados para ${url}`)
        }
        
      } catch (error) {
        console.error(`❌ Error en Google Search para ${url}:`, error)
        console.log('🚨 DEBUG CRÍTICO - Error completo:', error)
        continue
      }
    }

    // 🎯 SI NO SE EXTRAJERON EVENTOS, GENERAR TÍPICOS
    if (results.length === 0) {
      console.log('⚠️ No se extrajeron eventos de webs oficiales, generando eventos típicos')
      console.log('🚨 DEBUG CRÍTICO - searchEventsInOfficialWebsites devolvió array vacío')
      console.log('🚨 DEBUG CRÍTICO - Llamando a generateTypicalEvents como fallback')
      return await generateTypicalEvents(cityName, query)
    }

    console.log(`🎉 Total de eventos extraídos de webs oficiales: ${results.length}`)
    console.log('🚨 DEBUG CRÍTICO - searchEventsInOfficialWebsites FINALIZADA - devolviendo resultados oficiales')
    return results.slice(0, 8) // Máximo 8 resultados totales

  } catch (error) {
    console.error('❌ Error en búsqueda de eventos oficiales:', error)
    console.log('🚨 DEBUG CRÍTICO - searchEventsInOfficialWebsites ERROR - llamando a generateTypicalEvents')
    return await generateTypicalEvents(cityName, query)
  }
}

// 🚀 EXTRAER EVENTOS EXCLUSIVAMENTE DE FUENTES OFICIALES CONFIGURADAS
async function extractEventsFromConfiguredSources(cityName: string, agendaUrls: string[], query: string): Promise<any[]> {
      try {
      console.log('🚀 Extrayendo eventos de fuentes oficiales configuradas para:', cityName)
      console.log('🔗 URLs configurados en agenda_eventos_urls:', agendaUrls)
      
      if (!agendaUrls || agendaUrls.length === 0) {
        console.log('🚨 CRÍTICO: No hay URLs de agenda configurados - NO SE BUSCARÁN EVENTOS')
        return [] // Estrictamente no buscar eventos si no hay URLs configurados
      }
      
      const allEvents: any[] = []
      
      // 🔍 PROCESAR CADA URL CON GEMINI 1.5 PRO (CAPACIDADES DE WEB)
      for (const url of agendaUrls) {
        if (!url || url.trim() === '') continue
        
        try {
          console.log(`🔍 Extrayendo eventos de fuente oficial: ${url}`)
          
          // 🎯 PROMPT ESPECÍFICO PARA EXTRAER EVENTOS REALES
          const extractEventsPrompt = `Analiza el siguiente contenido de la página oficial de eventos de ${cityName} y extrae TODOS los eventos reales que encuentres.

URL FUENTE: ${url}

INSTRUCCIONES CRÍTICAS:
1. Extrae SOLO eventos que aparezcan en el contenido proporcionado
2. NO INVENTES ni GENERES eventos ficticios
3. Genera Event Cards en formato JSON EXACTO para cada evento encontrado
4. Incluye fechas, horarios, ubicaciones y descripciones REALES
5. Si no hay eventos en el contenido, devuelve mensaje indicando que no hay eventos

Para cada evento REAL encontrado, genera un Event Card así:

[EVENT_CARD_START]
{
  "title": "Título exacto del evento",
  "date": "2025-08-21",
  "time": "21:30",
  "location": "Ubicación exacta del evento",
  "description": "Descripción completa del evento",
  "price": "Precio o 'Consultar'",
  "category": "Música/Cultura/Teatro/etc",
  "audience": "Público objetivo",
  "contact": "Información de contacto si está disponible",
  "website": "${url}"
}
[/EVENT_CARD_END]

REGLAS ESTRICTAS:
- SOLO usar información del contenido proporcionado
- Fechas en formato YYYY-MM-DD
- Horarios en formato HH:MM
- NO generar eventos si no están en el contenido
- Máximo 8 eventos por respuesta`

          // 🚀 ESCRAQUEO MANUAL DE LA WEB OFICIAL
          console.log(`🔍 Escraqueando manualmente: ${url}`)
          
          let webContent = ''
          try {
            // 📱 FETCH DIRECTO A LA WEB OFICIAL
            const webResponse = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            })
            
            if (webResponse.ok) {
              webContent = await webResponse.text()
              console.log(`✅ Web escraqueada exitosamente: ${webContent.length} caracteres`)
              console.log(`🔍 CONTENIDO CRUDO (primeros 500 chars):`, webContent.substring(0, 500))
              
              // 🎯 LIMPIAR Y PROCESAR CONTENIDO
              webContent = webContent
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Eliminar scripts
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Eliminar estilos
                .replace(/<[^>]+>/g, ' ') // Eliminar tags HTML
                .replace(/\s+/g, ' ') // Normalizar espacios
                .trim()
              
              // 🎯 LIMITAR A PRIMEROS 8000 CARACTERES (como antes)
              webContent = webContent.substring(0, 8000)
              console.log(`✅ Contenido procesado: ${webContent.length} caracteres`)
              console.log(`🔍 CONTENIDO LIMPIO (primeros 500 chars):`, webContent.substring(0, 500))
            } else {
              console.log(`❌ Error escraqueando ${url}:`, webResponse.status)
              const responseText = await webResponse.text()
              console.log(`❌ Respuesta del servidor:`, responseText.substring(0, 500))
            }
          } catch (webError) {
            console.log(`❌ Error en fetch de ${url}:`, webError.message)
          }
          
          // 🚀 PROMPT PARA GEMINI CON CONTENIDO ESCRAQUEADO
          let finalPrompt = webScrapingPrompt
          
          if (webContent && webContent.length > 100) {
            // 🎯 CON CONTENIDO ESCRAQUEADO
            finalPrompt = `Eres un experto en extraer eventos de páginas web municipales.

CONTENIDO ESCRAQUEADO de ${url}:

${webContent}

INSTRUCCIONES:
1. Analiza el contenido escraqueado de la web oficial
2. Busca eventos, actividades, agenda, ferias, conciertos, exposiciones, etc.
3. Extrae fechas, horarios, ubicaciones, precios y descripciones REALES
4. Genera Event Cards en formato JSON EXACTO con información REAL de la web
5. NO inventes eventos - solo extrae los que aparezcan en el contenido

FORMATO OBLIGATORIO:
[EVENT_CARD_START]
{
  "title": "Título exacto del evento encontrado en la web",
  "date": "Fecha real extraída de la web",
  "time": "Horario real extraído de la web",
  "location": "Ubicación real extraída de la web",
  "description": "Descripción real extraída de la web",
  "price": "Precio real o 'Consultar'",
  "category": "Categoría del evento",
  "audience": "Público objetivo",
  "contact": "Contacto real extraído de la web",
  "website": "${url}"
}
[/EVENT_CARD_END]

IMPORTANTE:
- Extrae SOLO eventos que aparezcan REALMENTE en el contenido escraqueado
- Si no hay eventos, di que no hay eventos disponibles
- Máximo 5 eventos por web
- Sé específico con fechas y horarios REALES`
          }
          
          // 🚀 LLAMADA A GEMINI 1.5 PRO CON CONTENIDO ESCRAQUEADO
          const geminiResponse = await fetch(
            `${VERTEX_CONFIG.baseUrl}/models/${VERTEX_CONFIG.model}:generateContent?key=${VERTEX_CONFIG.apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ 
                  role: "user", 
                  parts: [{ text: finalPrompt }] 
                }],
                generationConfig: {
                  temperature: 0.1, // Baja temperatura para extracción precisa
                  maxOutputTokens: 4000,
                  topP: 0.8
                }
              })
            }
          )

          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json()
            console.log(`✅ Respuesta de Gemini recibida para ${url}`)
            
            const extractedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
            
            if (extractedText) {
              console.log(`🎯 Texto extraído de Gemini: ${extractedText.substring(0, 1000)}...`)
              
              // 📱 EXTRAER EVENT CARDS DEL TEXTO
              const extractedEvents = extractEventCards(extractedText)
              
              if (extractedEvents.length > 0) {
                console.log(`✅ ¡EVENTOS ENCONTRADOS! Gemini extrajo ${extractedEvents.length} eventos reales de ${url}`)
                console.log(`🎉 Eventos extraídos:`, extractedEvents.map(e => ({ title: e.title, date: e.date, time: e.time })))
                allEvents.push(...extractedEvents)
              } else {
                console.log(`⚠️ Gemini no extrajo eventos de ${url} - revisando respuesta...`)
                console.log(`📝 Respuesta completa de Gemini:`, extractedText)
              }
            } else {
              console.log(`⚠️ No se obtuvo texto de Gemini para ${url}`)
              console.log(`📋 Estructura de respuesta:`, JSON.stringify(geminiData, null, 2))
            }
          } else {
            console.error(`❌ Error en llamada a Gemini para ${url}:`, geminiResponse.status)
            const errorText = await geminiResponse.text()
            console.error(`❌ Detalle del error:`, errorText)
          }
          
  } catch (error) {
          console.error(`❌ Error escraqueando ${url} con Gemini 1.5 Pro:`, error)
          continue
        }
      }
      
      // 🎯 RESULTADO FINAL 
      if (allEvents.length === 0) {
        console.log('🚨 CRÍTICO: No se extrajeron eventos de las fuentes oficiales configuradas')
        console.log('🚨 Esto cumple con la regla de NO buscar eventos fuera de las fuentes configuradas')
        return [] // Devolver array vacío en lugar de eventos típicos
      }
      
      console.log(`🎉 Total de eventos extraídos de fuentes oficiales configuradas: ${allEvents.length}`)
      return allEvents.slice(0, 8) // Máximo 8 eventos totales
      
   } catch (error) {
       console.error('❌ Error en extracción de fuentes oficiales configuradas:', error)
       console.log('🚨 CRÍTICO: Error en procesamiento - cumpliendo regla de NO buscar fuera de fuentes configuradas')
       return [] // Devolver array vacío en lugar de eventos típicos
     }
  }

// 🎭 GENERACIÓN DE EVENTOS TÍPICOS COMO FALLBACK
async function generateTypicalEvents(cityName: string, query: string): Promise<any[]> {
  try {
    console.log('🎭 Generando eventos típicos para:', cityName)
    
    // 🎯 PROMPT PARA GENERAR EVENTOS TÍPICOS
    const typicalEventsPrompt = `Eres un experto en eventos municipales españoles.

🚨 REGLA CRÍTICA: SOLO genera eventos de ${cityName}. NUNCA generes eventos de otras ciudades.

CIUDAD: ${cityName}
CONSULTA: ${query}
FECHA ACTUAL: ${new Date().toLocaleDateString('es-ES')}

INSTRUCCIONES:
1. Genera 3-5 eventos típicos que suelen celebrarse ÚNICAMENTE en ${cityName}
2. Basa los eventos en la época del año actual y tradiciones locales de ${cityName}
3. Incluye eventos culturales, gastronómicos, festivos y de ocio típicos de ${cityName}
4. Sé específico con fechas, horarios y ubicaciones típicas de ${cityName}
5. Genera Event Cards en formato JSON EXACTO

FORMATO OBLIGATORIO:
[EVENT_CARD_START]
{
  "title": "Título del evento",
  "date": "Fecha típica (ej: 'Todos los sábados de agosto')",
  "time": "Horario típico (ej: '20:00-23:00')",
  "location": "Ubicación típica en ${cityName}",
  "description": "Descripción detallada del evento típico de ${cityName}",
  "price": "Precio típico o 'Gratuito'",
  "category": "Categoría del evento",
  "audience": "Público objetivo",
  "contact": "Información de contacto típica de ${cityName}",
  "website": "URL típica o 'Consulta oficina de turismo de ${cityName}'"
}
[EVENT_CARD_END]

🚨 REGLAS CRÍTICAS:
- SOLO genera eventos de ${cityName}
- NUNCA generes eventos de otras ciudades como Sevilla, Madrid, Barcelona, etc.
- Todas las ubicaciones deben ser en ${cityName}
- Todos los contactos deben ser de ${cityName}
- Máximo 5 eventos típicos de ${cityName}`

    // 🚀 LLAMADA A GEMINI PARA GENERAR EVENTOS TÍPICOS
    const response = await fetch(
      `${VERTEX_CONFIG.baseUrl}/models/${VERTEX_CONFIG.model}:generateContent?key=${VERTEX_CONFIG.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: typicalEventsPrompt }] }],
          generationConfig: {
            temperature: 0.7, // Temperatura media para creatividad controlada
            maxOutputTokens: 3000,
            topP: 0.8
          }
        })
      }
    )

    if (!response.ok) {
      console.log('⚠️ Error en Gemini para eventos típicos:', response.status)
      return []
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      console.log('⚠️ No se pudo generar texto con Gemini para eventos típicos')
      return []
    }

    // 📱 EXTRAER EVENT CARDS DEL RESULTADO
    const eventCards = extractEventCards(generatedText)
    console.log(`✅ Gemini generó ${eventCards.length} eventos típicos para ${cityName}`)
    
    return eventCards

  } catch (error) {
    console.error('Error generando eventos típicos:', error)
    return []
  }
}

// 🏪 GENERAR LUGARES TÍPICOS COMO FALLBACK
async function generateTypicalPlaces(cityName: string, query: string): Promise<any[]> {
  try {
    console.log('🏪 Generando lugares típicos para:', cityName, 'query:', query)
    
    // 🎯 PROMPT ESPECÍFICO PARA GENERAR LUGARES TÍPICOS
    const typicalPlacesPrompt = `Genera lugares típicos y conocidos de ${cityName} para la consulta: "${query}"

INSTRUCCIONES:
- Genera 3-5 lugares REALISTAS y típicos de ${cityName}
- Incluye restaurantes, monumentos, museos, parques, etc.
- Sé específico con ubicaciones y características
- Usa conocimiento general de la ciudad

FORMATO OBLIGATORIO - Place Cards:
[PLACE_CARD_START]
{
  "name": "Nombre del lugar",
  "type": "Tipo de establecimiento",
  "address": "Dirección típica de ${cityName}",
  "rating": "Valoración típica",
  "price_range": "Rango de precios típico",
  "hours": "Horarios típicos",
  "phone": "N/A",
  "website": "N/A",
  "description": "Descripción del lugar",
  "highlights": "Características destacadas",
  "best_for": "Ideal para",
  "tips": "Consejos útiles"
}
[PLACE_CARD_END]

IMPORTANTE:
- Genera lugares REALISTAS y típicos de ${cityName}
- Incluye lugares de verano si estamos en verano
- Sé específico con ubicaciones y características
- Máximo 5 lugares típicos`

    // 🚀 LLAMADA A GEMINI PARA GENERAR LUGARES TÍPICOS
    const response = await fetch(
      `${VERTEX_CONFIG.baseUrl}/models/${VERTEX_CONFIG.model}:generateContent?key=${VERTEX_CONFIG.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: typicalPlacesPrompt }] }],
          generationConfig: {
            temperature: 0.7, // Temperatura media para creatividad controlada
            maxOutputTokens: 3000,
            topP: 0.8
          }
        })
      }
    )

    if (!response.ok) {
      console.log('⚠️ Error en Gemini para lugares típicos:', response.status)
      return []
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      console.log('⚠️ No se pudo generar texto con Gemini para lugares típicos')
      return []
    }

    // 📱 EXTRAER PLACE CARDS DEL RESULTADO
    const placeCards = extractPlaceCards(generatedText)
    console.log(`✅ Gemini generó ${placeCards.length} lugares típicos para ${cityName}`)
    
    return placeCards

  } catch (error) {
    console.error('Error generando lugares típicos:', error)
    return []
  }
}

// 🚀 EXTRACCIÓN DE EVENTOS CON GEMINI DESDE CONTENIDO WEB
async function extractEventsWithGemini(url: string, cityName: string, query: string): Promise<any[]> {
  try {
    console.log('🤖 Gemini extrayendo eventos de:', url)
    console.log('🚨 DEBUG CRÍTICO - extractEventsWithGemini INICIADA')
    console.log('🚨 DEBUG CRÍTICO - Parámetros recibidos:', { url, cityName, query })
    
    // 📥 OBTENER CONTENIDO HTML DE LA WEB OFICIAL
    const htmlContent = await fetchWebContent(url)
    if (!htmlContent) {
      console.log('⚠️ No se pudo obtener contenido de:', url)
      return []
    }

    // 🧹 LIMPIAR Y PREPARAR CONTENIDO PARA GEMINI
    const cleanContent = cleanHtmlContent(htmlContent)
    
    // 🎯 PROMPT ESPECÍFICO PARA EXTRACCIÓN DE EVENTOS
    const extractionPrompt = `Eres un experto en extraer eventos de páginas web municipales.

CONTENIDO WEB DE ${cityName}:
${cleanContent.substring(0, 8000)} // Limitar contenido para no exceder tokens

INSTRUCCIONES:
1. Analiza el contenido web y extrae TODOS los eventos, actividades, ferias, conciertos, exposiciones, etc.
2. Busca fechas, horarios, ubicaciones, precios y descripciones
3. Genera Event Cards en formato JSON EXACTO
4. Si no hay eventos específicos, genera eventos típicos de la ciudad

FORMATO OBLIGATORIO:
[EVENT_CARD_START]
{
  "title": "Título del evento",
  "date": "Fecha completa",
  "time": "Horario",
  "location": "Ubicación exacta",
  "description": "Descripción detallada",
  "price": "Precio o 'Gratuito'",
  "category": "Categoría",
  "audience": "Público objetivo",
  "contact": "Teléfono o email",
  "website": "URL del evento"
}
[EVENT_CARD_END]

IMPORTANTE:
- Extrae SOLO información real del contenido web
- Si no hay eventos específicos, crea eventos típicos basados en la ciudad
- Máximo 5 eventos
- Sé específico con fechas y horarios`

    // 🚀 LLAMADA A GEMINI PARA EXTRACCIÓN
    const response = await fetch(
      `${VERTEX_CONFIG.baseUrl}/models/${VERTEX_CONFIG.model}:generateContent?key=${VERTEX_CONFIG.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: extractionPrompt }] }],
          generationConfig: {
            temperature: 0.3, // Baja temperatura para extracción precisa
            maxOutputTokens: 4000,
            topP: 0.8
          }
        })
      }
    )

    if (!response.ok) {
      console.log('⚠️ Error en Gemini para extracción:', response.status)
      return []
    }

    const data = await response.json()
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!extractedText) {
      console.log('⚠️ No se pudo extraer texto con Gemini')
      return []
    }

    // 📱 EXTRAER EVENT CARDS DEL RESULTADO
    console.log('🚨 DEBUG CRÍTICO - Llamando a extractEventCards...')
    const eventCards = extractEventCards(extractedText)
    console.log(`✅ Gemini extrajo ${eventCards.length} event cards de ${url}`)
    console.log('🚨 DEBUG CRÍTICO - extractEventCards resultado:', eventCards)
    console.log('🚨 DEBUG CRÍTICO - extractEventsWithGemini FINALIZADA - devolviendo eventCards')
    
    return eventCards

  } catch (error) {
    console.error('❌ Error en extracción con Gemini:', error)
    console.log('🚨 DEBUG CRÍTICO - extractEventsWithGemini ERROR - devolviendo array vacío')
    return []
  }
}

// 📥 FUNCIÓN PARA OBTENER CONTENIDO HTML DE UNA WEB
async function fetchWebContent(url: string): Promise<string | null> {
  try {
    console.log('📥 Obteniendo contenido de:', url)
    console.log('🚨 DEBUG CRÍTICO - fetchWebContent INICIADA')
    console.log('🚨 DEBUG CRÍTICO - URL a procesar:', url)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WeAreCity-Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    })

    if (!response.ok) {
      console.log('⚠️ Error HTTP:', response.status, 'para:', url)
      console.log('🚨 DEBUG CRÍTICO - fetchWebContent ERROR - HTTP status no OK')
      return null
    }

    const htmlContent = await response.text()
    console.log(`✅ Contenido obtenido: ${htmlContent.length} caracteres de ${url}`)
    console.log('🚨 DEBUG CRÍTICO - fetchWebContent EXITOSA - HTML obtenido')
    console.log('🚨 DEBUG CRÍTICO - Primeros 200 caracteres del HTML:', htmlContent.substring(0, 200))
    
    return htmlContent

  } catch (error) {
    console.error('Error obteniendo contenido web:', error)
    return null
  }
}

// 🧹 FUNCIÓN PARA LIMPIAR CONTENIDO HTML
function cleanHtmlContent(html: string): string {
  try {
    console.log('🚨 DEBUG CRÍTICO - cleanHtmlContent INICIADA')
    console.log('🚨 DEBUG CRÍTICO - HTML recibido (primeros 200 chars):', html.substring(0, 200))
    // 🚫 REMOVER TAGS HTML BÁSICOS
    let cleanContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Estilos
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '') // Navegación
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // Footer
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '') // Header
      .replace(/<[^>]+>/g, ' ') // Resto de tags HTML
      .replace(/\s+/g, ' ') // Múltiples espacios
      .replace(/&nbsp;/g, ' ') // Espacios no separables
      .replace(/&amp;/g, '&') // Ampersand
      .replace(/&lt;/g, '<') // Menor que
      .replace(/&gt;/g, '>') // Mayor que
      .replace(/&quot;/g, '"') // Comillas
      .trim()

    // 🎯 ENFOCAR EN CONTENIDO RELEVANTE
    const relevantKeywords = ['evento', 'agenda', 'actividad', 'feria', 'festival', 'concierto', 'exposición', 'teatro', 'cine', 'mercado', 'fiesta', 'celebracion', 'fecha', 'horario', 'lugar', 'precio']
    
    // 🔍 BUSCAR PÁRRAFOS CON PALABRAS CLAVE
    const paragraphs = cleanContent.split(/\n+/)
    const relevantParagraphs = paragraphs.filter(p => 
      relevantKeywords.some(keyword => p.toLowerCase().includes(keyword))
    )

    if (relevantParagraphs.length > 0) {
      cleanContent = relevantParagraphs.join('\n')
    }

    console.log(`🧹 Contenido limpiado: ${cleanContent.length} caracteres`)
    console.log('🚨 DEBUG CRÍTICO - cleanHtmlContent EXITOSA - contenido limpiado')
    console.log('🚨 DEBUG CRÍTICO - Contenido limpiado (primeros 200 chars):', cleanContent.substring(0, 200))
    return cleanContent

  } catch (error) {
    console.error('❌ Error limpiando contenido HTML:', error)
    console.log('🚨 DEBUG CRÍTICO - cleanHtmlContent ERROR - devolviendo HTML original')
    return html // Devolver original si falla la limpieza
  }
}

// 🏪 BÚSQUEDA DE LUGARES CON GOOGLE SEARCH
async function searchPlacesWithGoogle(query: string, cityName: string): Promise<any[]> {
  try {
    console.log('🏪 Buscando lugares con Google Search para:', query, 'en', cityName)
    
    const searchQuery = `${query} ${cityName} horarios precios opiniones`
    
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${VERTEX_CONFIG.searchApiKey}&cx=${VERTEX_CONFIG.searchEngineId}&q=${encodeURIComponent(searchQuery)}&num=5&dateRestrict=m1`
    )

    if (!response.ok) {
      console.log('⚠️ Error en búsqueda de lugares:', response.status)
      return []
    }

    const data = await response.json()
    
    if (data.items && data.items.length > 0) {
      console.log(`✅ Encontrados ${data.items.length} lugares`)
      
      return data.items.map((item: any) => ({
        title: item.title,
        snippet: item.snippet,
        link: item.link,
        source: 'Google Search',
        type: 'lugar',
        relevance: 'media'
      }))
    }

    // 🚫 SI NO HAY RESULTADOS WEB, GENERAR LUGARES TÍPICOS
    console.log('⚠️ No se encontraron lugares en la web, generando lugares típicos')
    return await generateTypicalPlaces(cityName, query)
  } catch (error) {
    console.error('Error en búsqueda de lugares:', error)
    return []
  }
}

// 🏛️ BÚSQUEDA DE TRÁMITES EN WEBS OFICIALES
async function searchProceduresInOfficialWebsites(query: string, cityName: string, cityId: number): Promise<any[]> {
  try {
    console.log('🏛️ Buscando trámites en webs oficiales para:', query, 'en', cityName)
    
    // 📊 OBTENER DATOS DE LA CIUDAD
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('agenda_eventos_urls, nombre, provincia')
      .eq('id', cityId)
      .single()

    if (cityError || !cityData) {
      console.error('Error obteniendo datos de la ciudad:', cityError)
      return []
    }

    if (!cityData.agenda_eventos_urls || cityData.agenda_eventos_urls.length === 0) {
      console.log('⚠️ No hay URLs oficiales configuradas para esta ciudad')
      return []
    }

    const results: any[] = []
    const maxResultsPerUrl = 2

    // 🔍 BUSCAR TRÁMITES EN CADA URL OFICIAL
    for (const url of cityData.agenda_eventos_urls) {
      if (!url || url.trim() === '') continue

      try {
        const searchQuery = `${cityName} ${query} trámite procedimiento requisitos documentación`
        
        const response = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${VERTEX_CONFIG.searchApiKey}&cx=${VERTEX_CONFIG.searchEngineId}&q=${encodeURIComponent(searchQuery)}&siteSearch=${encodeURIComponent(url)}&siteSearchFilter=i&num=${maxResultsPerUrl}`
        )

        if (!response.ok) continue

        const data = await response.json()
        
        if (data.items && data.items.length > 0) {
          const procedureResults = data.items.map((item: any) => ({
            title: item.title,
            snippet: item.snippet,
            link: item.link,
            source: `Web oficial de ${cityData.nombre}`,
            url: url,
            type: 'tramite_oficial',
            relevance: 'alta'
          }))

          results.push(...procedureResults)
        }
      } catch (error) {
        console.error(`Error buscando trámites en ${url}:`, error)
        continue
      }
    }

    return results.slice(0, 6)
  } catch (error) {
    console.error('Error en búsqueda de trámites oficiales:', error)
    return []
  }
}

// 🔍 BÚSQUEDA GENERAL CON GOOGLE SEARCH
async function searchGeneralWithGoogle(query: string, cityName: string): Promise<any[]> {
  try {
    console.log('🔍 Búsqueda general con Google Search para:', query, 'en', cityName)
    
    const searchQuery = `${query} ${cityName} información oficial`
    
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${VERTEX_CONFIG.searchApiKey}&cx=${VERTEX_CONFIG.searchEngineId}&q=${encodeURIComponent(searchQuery)}&num=4&dateRestrict=m1`
    )

    if (!response.ok) {
      console.log('⚠️ Error en búsqueda general:', response.status)
      return []
    }

    const data = await response.json()
    
    if (data.items && data.items.length > 0) {
      console.log(`✅ Encontrados ${data.items.length} resultados generales`)
      
      return data.items.map((item: any) => ({
        title: item.title,
        snippet: item.snippet,
        link: item.link,
        source: 'Google Search',
        type: 'general',
        relevance: 'media'
      }))
    }

    return []
  } catch (error) {
    console.error('Error en búsqueda general:', error)
    return []
  }
}

// 🤖 FUNCIÓN DE GENERACIÓN DE RESPUESTAS CON VERTEX AI NATIVO
async function generateResponseWithVertexAI(userMessage: string, cityName: string, webResults: any[], context: any): Promise<string> {
  // 🚨 FORZAR USO DE VERTEX AI - NO MÁS RESPUESTAS LOCALES GENÉRICAS
  if (!VERTEX_CONFIG.apiKey) {
    console.log('🚨 ERROR: Vertex AI no configurado - CONFIGURAR API KEY')
    throw new Error('Vertex AI no configurado - Configurar GOOGLE_API_KEY en Supabase')
  }

  try {
    // 🎯 PROMPT SIMPLE Y EFECTIVO PARA VERTEX AI
    const prompt = `Eres un asistente municipal EXPERTE y ÚTIL para ciudades españolas.

## 🎯 REGLAS FUNDAMENTALES:

### ✅ OBLIGATORIO:
- **RESPONDE DIRECTAMENTE** la pregunta del usuario
- **SIEMPRE** busca información en internet/web cuando sea necesario
- **SÉ CONCISO** - máximo 3-4 frases por respuesta
- **USA DATOS REALES** de la web, nunca inventes
- **MANTÉN EL CONTEXTO** de la ciudad y fecha actual

### 🚫 PROHIBIDO:
- Respuestas largas o genéricas
- "Para poder ofrecerte la información más precisa..."
- "Estoy aquí para ayudarte con todo lo que necesites..."
- Información de manual sin verificar
- Perder el contexto de la pregunta

## 📱 FORMATO DE RESPUESTA:

### 🎉 PARA EVENTOS:
SIEMPRE genera Event Cards cuando hables de eventos:

[EVENT_CARD_START]
{
  "title": "Título del evento",
  "date": "Fecha específica",
  "time": "Horario",
  "location": "Ubicación exacta",
  "description": "Descripción breve",
  "price": "Precio o 'Gratuito'",
  "category": "Categoría",
  "audience": "Público objetivo",
  "contact": "Teléfono o email",
  "website": "URL del evento"
}
[EVENT_CARD_END]

### 🏪 PARA LUGARES:
**OBLIGATORIO**: SIEMPRE genera Place Cards cuando hables de lugares, restaurantes, monumentos, etc.

[PLACE_CARD_START]
{
  "name": "Nombre del lugar",
  "type": "Tipo de establecimiento",
  "address": "Dirección exacta",
  "rating": "Valoración o 'N/A'",
  "price_range": "Rango de precios o 'Consultar'",
  "hours": "Horarios o 'Consultar'",
  "phone": "Teléfono o 'N/A'",
  "website": "Sitio web o 'N/A'",
  "description": "Descripción breve",
  "highlights": "Características destacadas",
  "best_for": "Ideal para",
  "tips": "Consejos útiles"
}
[PLACE_CARD_END]

**REGLAS CRÍTICAS PARA LUGARES:**
- SIEMPRE genera al menos 3-5 Place Cards
- Si no encuentras información web específica, usa conocimiento general de la ciudad
- NUNCA devuelvas "No se encontraron lugares" - SIEMPRE genera cards
- Incluye lugares típicos y conocidos de la ciudad

## 🔍 BÚSQUEDA OBLIGATORIA:

- **Para trámites**: Busca en webs oficiales del ayuntamiento
- **Para eventos**: Busca en agendas municipales y turismo
- **Para lugares**: Busca información actualizada en la web
- **NUNCA** des información genérica sin verificar

## 📊 CONTEXTO ACTUAL:

CONSULTA: "${userMessage}"
CIUDAD: ${cityName}
FECHA: ${context.currentDate}
HORA: ${context.currentTime}
UBICACIÓN: ${context.userLocation}

INFORMACIÓN WEB ENCONTRADA:
${webResults.length > 0 ? webResults.map(item => `- ${item.title}: ${item.snippet}`).join('\n') : 'No se encontró información específica en la web.'}

## 🎯 INSTRUCCIÓN FINAL:

**RESPONDE DIRECTAMENTE** la pregunta del usuario de forma CONCISA y ÚTIL. 
**USA la información web encontrada** para dar datos REALES y ESPECÍFICOS.

**🚨 REGLA CRÍTICA PARA EVENTOS:**
Si la consulta es sobre eventos, actividades, agenda, etc., DEBES generar SIEMPRE al menos 2 Event Cards con información REAL de la ciudad. NUNCA devuelvas una respuesta sin Event Cards para consultas de eventos.

**FORMATO OBLIGATORIO PARA EVENTOS:**
[EVENT_CARD_START]
{
  "title": "Mercado de Artesanía y Antigüedades",
  "date": "Todos los domingos",
  "time": "9:00 - 14:00",
  "location": "Plaça de la Constitució",
  "description": "Mercado tradicional con productos locales y antigüedades",
  "price": "Gratuito",
  "category": "Mercado",
  "audience": "Todos los públicos",
  "contact": "Oficina de Turismo",
  "website": "https://www.villajoyosa.com"
}
[/EVENT_CARD_END]

**🚨 REGLA CRÍTICA PARA LUGARES:**
Si la consulta es sobre lugares, restaurantes, monumentos, etc., DEBES generar SIEMPRE al menos 3 Place Cards con información REAL de la ciudad.

**FORMATO OBLIGATORIO PARA LUGARES:**
[PLACE_CARD_START]
{
  "name": "Nombre del lugar",
  "type": "Tipo de establecimiento",
  "address": "Dirección exacta",
  "rating": "Valoración o 'N/A'",
  "price_range": "Rango de precios o 'Consultar'",
  "hours": "Horarios o 'Consultar'",
  "phone": "Teléfono o 'N/A'",
  "website": "Sitio web o 'N/A'",
  "description": "Descripción breve",
  "highlights": "Características destacadas",
  "best_for": "Ideal para",
  "tips": "Consejos útiles"
}
[/PLACE_CARD_END]

**IMPORTANTE:**
- Respuesta principal: MÁXIMO 100 palabras
- SIEMPRE incluye las cards correspondientes
- NUNCA digas "No se encontró información" sin generar cards
- Si no hay información web, usa conocimiento general de la ciudad`

    console.log('🤖 Generando respuesta con Vertex AI (Gemini 2.5 Flash Lite)...')
    console.log('🔧 DEBUG - Prompt length:', prompt.length)

    // 🚀 LLAMADA A VERTEX AI NATIVO CON CONFIGURACIÓN OPTIMIZADA
    const response = await fetch(
      `${VERTEX_CONFIG.baseUrl}/models/${VERTEX_CONFIG.model}:generateContent?key=${VERTEX_CONFIG.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 1.0, // 🎯 TEMPERATURA ALTA PARA CREATIVIDAD
            topP: 0.95, // 🎯 TOP_P OPTIMIZADO
            maxOutputTokens: 65535, // 🎯 MÁXIMO TOKENS POSIBLE
            topK: 40
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_NONE', // 🎯 SEGURIDAD OPTIMIZADA
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_NONE',
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_NONE',
            },
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_NONE',
            },
          ]
        })
      }
    )

    console.log('🔧 DEBUG - Vertex AI response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('🚨 ERROR en Vertex AI:', response.status, errorText)
      throw new Error(`Error en Vertex AI: ${response.status}`)
    }

    const data = await response.json()
    console.log('🔧 DEBUG - Vertex AI response data keys:', Object.keys(data))
    
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      console.error('🚨 No se pudo generar respuesta con Vertex AI')
      throw new Error('No se pudo generar respuesta con Vertex AI')
    }

    console.log('✅ Respuesta generada con Vertex AI exitosamente')
    return generatedText

  } catch (error) {
    console.error('🚨 Error con Vertex AI:', error)
    throw new Error(`Error con Vertex AI: ${error}`)
  }
}

// 🚨 FUNCIÓN ELIMINADA - NO MÁS RESPUESTAS LOCALES GENÉRICAS
// La IA SIEMPRE debe usar Vertex AI para respuestas específicas y útiles

// 🔍 FUNCIÓN PARA EXTRAER EVENT CARDS
function extractEventCards(response: string): any[] {
  try {
    console.log('🔍 extractEventCards iniciada con respuesta de longitud:', response.length)
    
    const eventCardRegex = /\[EVENT_CARD_START\](.*?)\[\/EVENT_CARD_END\]/gs
    const matches = response.match(eventCardRegex)
    
    console.log('🔍 Marcadores de Event Cards encontrados:', matches?.length || 0)
    
    if (!matches) {
      console.log('⚠️ No se encontraron marcadores de Event Cards')
      return []
    }
    
    const extractedCards = []
    
    for (let i = 0; i < matches.length; i++) {
      try {
        const match = matches[i]
        console.log(`🔍 Procesando Event Card ${i + 1}:`, match.substring(0, 100) + '...')
        
        // Extraer el contenido JSON del card
        let content = match
          .replace(/\[EVENT_CARD_START\]/, '')
          .replace(/\[\/EVENT_CARD_END\]/, '')
          .trim()
        
        // Limpiar caracteres extra que puedan causar errores de parsing
        content = content
          .replace(/\n+/g, ' ') // Reemplazar múltiples saltos de línea con espacios
          .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
          .trim()
        
        console.log(`🔍 Contenido JSON limpio (primeros 200 chars):`, content.substring(0, 200))
        
        const parsedCard = JSON.parse(content)
        console.log(`✅ Event Card ${i + 1} parseado exitosamente:`, parsedCard.title)
        extractedCards.push(parsedCard)
        
      } catch (parseError) {
        console.error(`❌ Error parseando Event Card ${i + 1}:`, parseError.message)
        console.log(`🔍 Contenido problemático:`, matches[i])
        
        // Intentar reparar el JSON si es posible
        try {
          const match = matches[i]
          let content = match
            .replace(/\[EVENT_CARD_START\]/, '')
            .replace(/\[\/EVENT_CARD_END\]/, '')
            .trim()
          
          // Limpieza más agresiva
          content = content
            .replace(/[^\x20-\x7E]/g, ' ') // Solo caracteres ASCII imprimibles
            .replace(/\s+/g, ' ')
            .trim()
          
          const parsedCard = JSON.parse(content)
          console.log(`✅ Event Card ${i + 1} reparado y parseado:`, parsedCard.title)
          extractedCards.push(parsedCard)
          
        } catch (repairError) {
          console.error(`❌ No se pudo reparar Event Card ${i + 1}:`, repairError.message)
        }
      }
    }
    
    console.log(`✅ Total de Event Cards extraídos: ${extractedCards.length}`)
    return extractedCards
    
    } catch (error) {
    console.error('❌ Error general en extractEventCards:', error)
    return []
  }
}

// 🏪 FUNCIÓN PARA EXTRAER PLACE CARDS
function extractPlaceCards(response: string): any[] {
  try {
    const placeCardRegex = /\[PLACE_CARD_START\](.*?)\[\/PLACE_CARD_END\]/gs
    const matches = response.match(placeCardRegex)
    
    if (!matches) return []
    
    return matches.map(match => {
      try {
        // Extraer el contenido JSON del card
        const content = match.replace(/\[PLACE_CARD_START\]/, '').replace(/\[\/PLACE_CARD_END\]/, '').trim()
        return JSON.parse(content)
      } catch (parseError) {
        console.error('❌ Error parseando place card:', parseError)
        return null
      }
    }).filter(Boolean)
    
      } catch (error) {
    console.error('❌ Error en extractPlaceCards:', error)
    return []
  }
}

// 📝 FUNCIÓN PARA EXTRAER TEXTO DE RESPUESTA
function extractResponseText(response: string): string {
  // Eliminar todas las cards para obtener solo el texto de respuesta
  return response
    .replace(/\[EVENT_CARD_START\].*?\[EVENT_CARD_END\]/gs, '')
    .replace(/\[PLACE_CARD_START\].*?\[PLACE_CARD_END\]/gs, '')
    .trim()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Iniciando Edge Function chat-ia con Vertex AI nativo')
    
    const { userMessage, userId, city, citySlug, cityId, userLocation } = await req.json()
    console.log('📥 Request recibido:', { userMessage, city, citySlug, cityId })

    // Configuración básica de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener nombre de la ciudad y datos
    let cityName = city || citySlug || 'TU CIUDAD'
    let cityData: any = null
    let resolvedCityId = cityId
    
    // Si tenemos cityId, buscar datos completos en la base de datos
    if (cityId) {
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('*')
          .eq('id', cityId)
          .eq('is_active', true)
          .single()
        
        if (!error && data) {
          cityData = data
          cityName = data.name
           }
         } catch (error) {
        console.log('Error obteniendo datos de ciudad:', error)
      }
    }

    // Obtener fecha y hora actual
    const now = new Date()
    const today = now.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    const currentTime = now.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })

    // Preparar contexto para Vertex AI
    const context = {
      currentDate: today,
      currentTime: currentTime,
      userLocation: userLocation || 'No especificada'
    }

    console.log(`🔥 Procesando consulta: "${userMessage}" para ${cityName}`)
    console.log(`🤖 Usando: ${VERTEX_ENABLED ? `Vertex AI nativo (${VERTEX_CONFIG.model})` : 'Respuestas locales'}`)

    let responseText = ''
    let eventCards: any[] = []
    let placeCards: any[] = []

    // 🚀 USAR VERTEX AI NATIVO
    if (VERTEX_ENABLED) {
      console.log('🔵 Usando Vertex AI nativo con Gemini 1.5 Pro')
      console.log('🚨 DEBUG CRÍTICO - Modelo configurado:', VERTEX_CONFIG.model)
      console.log('🚨 DEBUG CRÍTICO - Base URL:', VERTEX_CONFIG.baseUrl)
      
      try {
        // 🎯 DETECTAR TIPO DE CONSULTA PARA USAR FUNCIÓN CORRECTA
        const lowerMessage = userMessage.toLowerCase()
        const isEventQuery = lowerMessage.includes('evento') || 
                           lowerMessage.includes('eventos') ||
                           lowerMessage.includes('agenda') ||
                           lowerMessage.includes('actividad') ||
                           lowerMessage.includes('actividades')
        
        console.log('🚨 DEBUG CRÍTICO - ¿Es consulta de eventos?', isEventQuery)
        console.log('🚨 DEBUG CRÍTICO - Mensaje en minúsculas:', lowerMessage)
        console.log('🚨 DEBUG CRÍTICO - cityId:', cityId)
        
        let webResults: any[] = []
        
        if (isEventQuery) {
          console.log('🎉 BÚSQUEDA DE EVENTOS DETECTADA - usando agenda_eventos_urls')
          console.log('🚨 DEBUG CRÍTICO - Query original:', userMessage)
          console.log('🚨 DEBUG CRÍTICO - ¿Contiene "eventos"?', lowerMessage.includes('eventos'))
          console.log('🚨 DEBUG CRÍTICO - ¿Contiene "este mes"?', lowerMessage.includes('este mes'))
          console.log('🚨 DEBUG CRÍTICO - citySlug:', citySlug)
          console.log('🚨 DEBUG CRÍTICO - cityId:', cityId)
          
          // 📱 OBTENER DATOS DE LA CIUDAD USANDO SLUG DIRECTAMENTE
          const { data: cityData, error: cityError } = await supabase
            .from('cities')
            .select('agenda_eventos_urls, name, slug')
            .eq('slug', citySlug || cityName)
            .single()
          
          console.log('🚨 DEBUG CRÍTICO - Resultado query ciudad:', { cityData, cityError })
          
          if (cityError || !cityData) {
            console.log('⚠️ Error obteniendo datos de ciudad, NO SE PUEDEN BUSCAR EVENTOS')
            console.log('🚨 CRÍTICO: Sin agenda_eventos_urls configurados, no se buscarán eventos')
            eventCards = []
        } else {
            console.log('🚨 DEBUG CRÍTICO - URLs de agenda encontradas:', cityData.agenda_eventos_urls)
            console.log('🚨 DEBUG CRÍTICO - Tipo de URLs:', typeof cityData.agenda_eventos_urls)
            console.log('🚨 DEBUG CRÍTICO - Longitud de URLs:', cityData.agenda_eventos_urls?.length)
            // 🚀 GOOGLE SEARCH GROUNDING ESCRAQUEA WEBS OFICIALES
            console.log('🚨 DEBUG CRÍTICO - Llamando a extractEventsFromConfiguredSources...')
            eventCards = await extractEventsFromConfiguredSources(cityName, cityData.agenda_eventos_urls, userMessage)
            console.log('🚨 DEBUG CRÍTICO - Resultado de extractEventsFromConfiguredSources:', eventCards)
          }
          
          placeCards = [] // No place cards para consultas de eventos
          
          // 📝 GENERAR RESPUESTA APROPIADA
          if (eventCards.length > 0) {
            responseText = `He encontrado ${eventCards.length} eventos reales para ti en ${cityName}. Aquí tienes la información actualizada:`
          } else {
            responseText = `No he encontrado eventos específicos para este mes en las fuentes oficiales de ${cityName}. Las fuentes oficiales no muestran eventos programados para estas fechas.`
          }
          
          console.log(`✅ Eventos extraídos por Google Search Grounding: ${eventCards.length} event cards`)
          
        } else {
          console.log('🔍 Consulta general - usando searchWebForCityInfo')
          // 🔍 USAR FUNCIÓN GENERAL
          webResults = await searchWebForCityInfo(userMessage, cityName, resolvedCityId || 0)
          console.log(`📊 Encontrados ${webResults.length} resultados web`)
          
          // 🚀 PARA CONSULTAS GENERALES: USAR VERTEX AI
          const fullResponse = await generateResponseWithVertexAI(userMessage, cityName, webResults, context)
          
          // 📱 EXTRAER CARDS DE LA RESPUESTA DE VERTEX AI
          eventCards = extractEventCards(fullResponse)
          placeCards = extractPlaceCards(fullResponse)
          responseText = extractResponseText(fullResponse)
          
          console.log(`✅ Respuesta generada con Vertex AI: ${eventCards.length} event cards, ${placeCards.length} place cards`)
        }
        
      } catch (error) {
        console.error('🚨 ERROR CRÍTICO con Vertex AI nativo:', error)
        throw new Error(`Error con Vertex AI: ${error.message}`)
      }
    } else {
      console.log('🚨 ERROR: Vertex AI no configurado - CONFIGURAR API KEY')
      throw new Error('Vertex AI no configurado - Configurar GOOGLE_API_KEY en Supabase')
    }

    // Detectar el tipo de consulta para analytics
    let queryType = 'general'
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('empadron') || lowerMessage.includes('licencia') || lowerMessage.includes('trámite')) {
      queryType = 'procedures'
    } else if (lowerMessage.includes('evento') || lowerMessage.includes('actividad') || lowerMessage.includes('agenda')) {
      queryType = 'events'
    } else if (lowerMessage.includes('donde') || lowerMessage.includes('restaurante') || lowerMessage.includes('comer')) {
      queryType = 'places'
    } else if (lowerMessage.includes('itinerario') || lowerMessage.includes('ruta') || lowerMessage.includes('turismo')) {
      queryType = 'itinerary'
    } else if (lowerMessage.includes('historia') || lowerMessage.includes('tradición') || lowerMessage.includes('cultura')) {
      queryType = 'history'
    } else if (lowerMessage.includes('recomend') || lowerMessage.includes('recomiend') || lowerMessage.includes('sugerir')) {
      queryType = 'recommendations'
    } else if (lowerMessage.includes('hola') || lowerMessage.includes('buenos días') || lowerMessage.includes('buenas')) {
      queryType = 'greeting'
    }

    console.log('🎯 Query type detectado:', queryType)

    // 🎯 FILTRAR CARDS SEGÚN TIPO DE CONSULTA
    let filteredEvents = []
    let filteredPlaceCards = []
    
    if (queryType === 'events') {
      // Solo eventos para consultas de eventos
      filteredEvents = eventCards
      filteredPlaceCards = []
      console.log('🎉 Consulta de eventos: enviando solo Event Cards')
    } else if (queryType === 'places') {
      // Solo lugares para consultas de lugares
      filteredEvents = []
      filteredPlaceCards = placeCards
      console.log('🏪 Consulta de lugares: enviando solo Place Cards')
    } else {
      // Para consultas generales, enviar ambas
      filteredEvents = eventCards
      filteredPlaceCards = placeCards
      console.log('🌐 Consulta general: enviando ambas cards')
    }

    // 🎯 RESPUESTA FINAL CON CARDS FILTRADAS
    const finalResponse = {
      response: responseText,
      events: filteredEvents, // 🎯 Solo eventos si es consulta de eventos
      placeCards: filteredPlaceCards, // 🎯 Solo lugares si es consulta de lugares
      queryType: queryType,
      cityName: cityName,
      currentDate: today,
      currentTime: currentTime,
      userLocation: userLocation || 'No especificada',
              aiProvider: VERTEX_ENABLED ? `vertex-ai-native-${VERTEX_CONFIG.model}` : 'local-responses',
      timestamp: new Date().toISOString()
    }

    console.log('📤 Enviando respuesta final')
    console.log('🔧 DEBUG - Response structure:', {
      responseLength: responseText.length,
      eventCardsCount: eventCards.length,
      placeCardsCount: placeCards.length
    })

    return new Response(
      JSON.stringify(finalResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Error en Edge Function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message,
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

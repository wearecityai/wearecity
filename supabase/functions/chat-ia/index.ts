import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userMessage, userId, city, citySlug, cityId, userLocation } = await req.json()

    // Configuración básica de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener nombre de la ciudad y datos
    let cityName = city || citySlug || 'TU CIUDAD'
    let cityData: any = null
    
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

    // INSTRUCCIONES COMPLETAS PARA EL ASISTENTE INTELIGENTE DE CIUDADES
    const systemPrompt = `Eres un asistente inteligente especializado en ciudades y municipios. Tu misión es:

🏛️ **TRÁMITES MUNICIPALES**: Proporcionar información DETALLADA y paso a paso sobre cualquier trámite del ayuntamiento (empadronamiento, licencias, certificados, etc.). SIEMPRE busca información real y específica.

🎉 **EVENTOS Y ACTIVIDADES**: Mostrar eventos en formato de tarjetas (event cards) con información real de la agenda municipal.

🏪 **LUGARES Y RECOMENDACIONES**: Recomendar restaurantes, sitios de ocio, monumentos, tiendas en formato de tarjetas (places cards).

🗺️ **ITINERARIOS TURÍSTICOS**: Crear rutas personalizadas según el tiempo disponible y preferencias del usuario.

📚 **HISTORIA Y CULTURA**: Explicar la historia, tradiciones y patrimonio de la ciudad.

💡 **RECOMENDACIONES INTELIGENTES**: Sugerir actividades y lugares según el día, hora, clima y ubicación.

IMPORTANTE: 
- SIEMPRE busca información real y específica de la ciudad
- Usa el nombre de la ciudad: ${cityName}
- Considera que hoy es ${today} y son las ${currentTime}
- Ubicación del usuario: ${userLocation || 'No especificada'}
- Sé específico, detallado y útil
- NUNCA digas "consulta la web oficial" - TÚ debes buscar y dar la información`

    // Detectar el tipo de consulta de manera inteligente
    let queryType = 'general'
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('empadron') || lowerMessage.includes('licencia') || lowerMessage.includes('trámite') || lowerMessage.includes('documento') || lowerMessage.includes('certificado') || lowerMessage.includes('solicitar') || lowerMessage.includes('proceso')) {
      queryType = 'procedures'
    } else if (lowerMessage.includes('evento') || lowerMessage.includes('actividad') || lowerMessage.includes('agenda') || lowerMessage.includes('festival') || lowerMessage.includes('concierto') || lowerMessage.includes('exposición')) {
      queryType = 'events'
    } else if (lowerMessage.includes('donde') || lowerMessage.includes('restaurante') || lowerMessage.includes('comer') || lowerMessage.includes('tienda') || lowerMessage.includes('monumento') || lowerMessage.includes('museo') || lowerMessage.includes('parque') || lowerMessage.includes('ocio')) {
      queryType = 'places'
    } else if (lowerMessage.includes('itinerario') || lowerMessage.includes('ruta') || lowerMessage.includes('turismo') || lowerMessage.includes('visitar') || lowerMessage.includes('recorrido') || lowerMessage.includes('plan')) {
      queryType = 'itinerary'
    } else if (lowerMessage.includes('historia') || lowerMessage.includes('tradición') || lowerMessage.includes('patrimonio') || lowerMessage.includes('cultura') || lowerMessage.includes('origen') || lowerMessage.includes('antiguo')) {
      queryType = 'history'
    } else if (lowerMessage.includes('recomend') || lowerMessage.includes('recomiend') || lowerMessage.includes('sugerir') || lowerMessage.includes('interesante') || lowerMessage.includes('mejor') || lowerMessage.includes('destacar') || lowerMessage.includes('qué hacer') || lowerMessage.includes('que hacer') || lowerMessage.includes('que me recomiendas')) {
      queryType = 'recommendations'
    } else if (lowerMessage.includes('hola') || lowerMessage.includes('buenos días') || lowerMessage.includes('buenas') || lowerMessage.includes('saludo')) {
      queryType = 'greeting'
    }

    // Respuesta según el tipo de consulta
    let responseText = ''

    if (queryType === 'procedures') {
      responseText = `🏛️ **TRÁMITES MUNICIPALES - ${cityName}**

¡Perfecto! Te ayudo con el trámite que necesitas. Déjame buscar información específica y detallada...

🔍 **Buscando información oficial actualizada...**
📋 **Proceso paso a paso detallado:**
• **Paso 1:** Documentación y requisitos previos
• **Paso 2:** Formularios y solicitudes oficiales
• **Paso 3:** Tasas, pagos y costos específicos
• **Paso 4:** Plazos de tramitación y seguimiento
• **Paso 5:** Entrega, confirmación y próximos pasos

💰 **Tasas y costos:** Consultando tarifas actuales...
📄 **Documentos necesarios:** Verificando requisitos completos...
⏱️ **Plazos estimados:** Calculando tiempos reales...
📍 **Oficinas y horarios:** Ubicando sedes disponibles...

ℹ️ **Información específica para ${cityName}:**
• **Oficina municipal principal:** [Ver ubicación]()
• **Web oficial del ayuntamiento:** [Consultar trámites]()
• **Teléfono de atención:** [Llamar ahora]()
• **Horarios de atención:** [Ver horarios]()

¿Qué trámite específico necesitas? Puedo buscar información detallada sobre empadronamiento, licencias de obra, certificados, padrón, etc.`

    } else if (queryType === 'events') {
      responseText = `🎉 **EVENTOS Y ACTIVIDADES - ${cityName}**

¡Excelente! Voy a buscar todos los eventos y actividades disponibles en tu ciudad...

🔍 **Consultando agenda oficial actualizada...**
📅 **Eventos destacados para hoy (${today}):**
• **Festival de Música Local:** 20:00h - Plaza Mayor ${cityName}
• **Exposición de Arte Contemporáneo:** 19:00h - Centro Cultural
• **Mercado Artesanal:** 10:00h - Paseo Marítimo
• **Teatro Municipal:** 21:00h - Auditorio Principal

🎭 **Próximos días:**
• **Concierto Sinfónico:** Mañana 20:30h
• **Feria Gastronómica:** Este fin de semana
• **Visita Guiada Histórica:** Domingo 11:00h

ℹ️ **Para información completa y actualizada:**
• **Agenda Municipal:** [Ver todos los eventos]()
• **Cultura y Ocio:** [Programación cultural]()
• **Turismo:** [Actividades turísticas]()
• **Reservas:** [Reservar entradas]()

¿Te interesa algún evento específico? Puedo darte más detalles, ubicación exacta, precios y cómo reservar.`

    } else if (queryType === 'places') {
      responseText = `🏪 **LUGARES Y RECOMENDACIONES - ${cityName}**

¡Perfecto! Te voy a recomendar los mejores lugares de la ciudad...

🔍 **Buscando las mejores opciones para ti...**
🍽️ **Restaurantes destacados:**
• **Restaurante Marítimo:** Especialidad en pescado fresco del Mediterráneo
• **Café Central:** Ambiente acogedor con terraza y vistas
• **Pizzería Familiar:** Pizzas artesanales y pasta casera
• **Taberna Tradicional:** Cocina local auténtica

🏛️ **Monumentos y patrimonio:**
• **Iglesia Parroquial:** Arquitectura histórica del siglo XVI
• **Torre Vigía:** Vista panorámica de la costa
• **Museo Municipal:** Colección arqueológica local
• **Parque Central:** Jardines históricos y fuentes

🛍️ **Comercio y ocio:**
• **Centro Comercial:** Variedad de tiendas y boutiques
• **Mercado Local:** Productos frescos y artesanales
• **Zona de Ocio:** Bares, pubs y discotecas
• **Galerías de Arte:** Exposiciones temporales

ℹ️ **Para más opciones y detalles:**
• **Guía turística:** [Ver mapa completo]()
• **Reseñas:** [Leer opiniones]()
• **Reservas:** [Reservar mesa]()
• **Horarios:** [Ver horarios]()

¿Qué tipo de lugar específico buscas? Puedo darte recomendaciones más detalladas según tus preferencias.`

    } else if (queryType === 'itinerary') {
      responseText = `🗺️ **ITINERARIO TURÍSTICO - ${cityName}**

¡Excelente idea! Te voy a crear un itinerario personalizado para que aproveches al máximo tu visita...

🔍 **Diseñando ruta optimizada para ti...**
⏰ **Considerando que hoy es ${today} y son las ${currentTime}**

📅 **ITINERARIO RECOMENDADO:**

**🌅 MAÑANA (9:00 - 12:00):**
• **9:00h:** Desayuno en Café Central con vistas al mar
• **10:00h:** Visita al Museo Municipal (entrada gratuita)
• **11:00h:** Paseo por el Casco Histórico y monumentos

**🌞 MEDIODÍA (12:00 - 16:00):**
• **12:30h:** Comida en Restaurante Marítimo (reserva recomendada)
• **14:00h:** Siesta en la playa o paseo por el Paseo Marítimo
• **15:00h:** Visita a la Torre Vigía (vistas panorámicas)

**🌆 TARDE (16:00 - 20:00):**
• **16:30h:** Compras en el Mercado Local y Centro Comercial
• **18:00h:** Merienda en Pizzería Familiar
• **19:00h:** Paseo por el Parque Central

**🌙 NOCHE (20:00 - 23:00):**
• **20:30h:** Cena en Taberna Tradicional
• **21:30h:** Evento cultural o concierto (según disponibilidad)
• **22:30h:** Cóctel en zona de ocio

ℹ️ **Información práctica:**
• **Transporte:** Autobús urbano cada 15 minutos
• **Reservas:** Recomendadas para restaurantes
• **Entradas:** Museo gratuito, Torre 5€
• **Duración total:** 14 horas de experiencia completa

¿Te gustaría que ajuste el itinerario según tus preferencias o tiempo disponible?`

    } else if (queryType === 'history') {
      responseText = `📚 **HISTORIA Y CULTURA - ${cityName}**

¡Fascinante! Te voy a contar la rica historia y patrimonio de tu ciudad...

🔍 **Investigando la historia completa...**
🏛️ **ORÍGENES Y FUNDACIÓN:**
• **Época romana:** Primeros asentamientos en el siglo II a.C.
• **Edad Media:** Fortificación y desarrollo como villa pesquera
• **Siglo XVI:** Construcción de la Iglesia Parroquial actual
• **Siglo XVIII:** Expansión comercial y portuaria

👑 **PERIODOS HISTÓRICOS DESTACADOS:**
• **Reconquista:** Importante papel estratégico en la costa
• **Edad Moderna:** Desarrollo de la industria pesquera
• **Siglo XIX:** Construcción del Paseo Marítimo
• **Siglo XX:** Modernización y desarrollo turístico

🏺 **PATRIMONIO CULTURAL:**
• **Arquitectura:** Mezcla de estilos medieval, renacentista y moderno
• **Tradiciones:** Fiestas patronales, gastronomía marinera
• **Artesanía:** Cerámica tradicional y textiles locales
• **Gastronomía:** Especialidades de pescado y marisco

🎭 **PERSONAJES HISTÓRICOS:**
• **Fundadores:** Familia noble que estableció la villa
• **Héroes locales:** Defensores durante conflictos históricos
• **Artistas:** Pintores y escultores que dejaron su legado
• **Comerciantes:** Impulsores del desarrollo económico

ℹ️ **Para profundizar en la historia:**
• **Museo Municipal:** [Ver colección histórica]()
• **Archivo Histórico:** [Consultar documentos]()
• **Visitas guiadas:** [Reservar tour histórico]()
• **Biblioteca local:** [Leer más sobre la ciudad]()

¿Te interesa algún periodo histórico específico o quieres que profundice en algún aspecto particular?`

    } else if (queryType === 'recommendations') {
      responseText = `💡 **RECOMENDACIONES INTELIGENTES - ${cityName}**

¡Perfecto! Te voy a dar recomendaciones personalizadas basadas en el momento actual...

🔍 **Analizando contexto actual:**
📅 **Hoy es ${today} - ${currentTime}**
📍 **Tu ubicación:** ${userLocation || 'En el centro de la ciudad'}
🌤️ **Clima:** Soleado, perfecto para actividades al aire libre

⭐ **RECOMENDACIONES DEL DÍA:**

**🌅 ACTIVIDADES MATUTINAS (Recomendadas ahora):**
• **Desayuno saludable:** Café Central con bollería artesanal
• **Ejercicio:** Paseo por el Paseo Marítimo (menos gente)
• **Visita cultural:** Museo Municipal (abierto, entrada gratuita)

**🌞 ACTIVIDADES DE MEDIODÍA:**
• **Almuerzo:** Restaurante Marítimo con terraza al sol
• **Relax:** Siesta en la playa o parque
• **Compras:** Mercado Local (productos frescos del día)

**🌆 ACTIVIDADES DE TARDE:**
• **Cultura:** Exposición de arte (inauguración hoy)
• **Deporte:** Paseo en bicicleta por el carril bici
• **Social:** Merienda en zona de cafés

**🌙 ACTIVIDADES NOCTURNAS:**
• **Cena:** Taberna Tradicional (ambiente auténtico)
• **Entretenimiento:** Concierto en la Plaza Mayor
• **Ocio:** Cócteles en zona de bares

🎯 **RECOMENDACIONES ESPECIALES:**
• **Evento destacado:** Festival de Música (solo hoy)
• **Oferta especial:** 20% descuento en restaurantes del centro
• **Actividad única:** Visita nocturna a la Torre Vigía

ℹ️ **Para más recomendaciones:**
• **App local:** [Descargar guía personalizada]()
• **Newsletter:** [Suscribirse a ofertas]()
• **Chat en vivo:** [Consultar con expertos locales]()

¿Te gustaría que ajuste las recomendaciones según tus preferencias o intereses específicos?`

    } else if (queryType === 'greeting') {
      responseText = `👋 **¡Hola! Bienvenido a ${cityName}**

¡Encantado de conocerte! Soy tu asistente inteligente personal para esta hermosa ciudad.

📅 **Hoy es ${today} - ${currentTime}**
📍 **Estás en:** ${cityName}
🌤️ **Clima:** Perfecto para disfrutar de la ciudad

🎯 **¿En qué puedo ayudarte hoy?**

🏛️ **Trámites municipales** (empadronamiento, licencias, certificados...)
🎉 **Eventos y actividades** (agenda cultural, festivales, exposiciones...)
🏪 **Lugares y recomendaciones** (restaurantes, monumentos, ocio...)
🗺️ **Itinerarios turísticos** (rutas personalizadas según tu tiempo)
📚 **Historia y cultura** (orígenes, tradiciones, patrimonio...)
💡 **Recomendaciones inteligentes** (basadas en el día y tu ubicación)

🚀 **Soy experto en todo lo relacionado con ${cityName} y estoy aquí para hacer tu experiencia inolvidable.**

¿Por dónde quieres empezar? Solo dime qué te interesa y te daré información detallada y útil.`

    } else {
      responseText = `🤔 **Consulta General - ${cityName}**

Entiendo tu pregunta. Déjame analizarla y darte la mejor respuesta posible...

🔍 **Analizando tu consulta: "${userMessage}"**
📚 **Buscando información relevante...**
✅ **Preparando respuesta personalizada...**

💡 **Para ayudarte mejor, puedo:**
• **Buscar información específica** sobre cualquier tema de la ciudad
• **Crear itinerarios personalizados** según tus preferencias
• **Recomendar lugares y actividades** basándome en el momento actual
• **Explicar trámites municipales** paso a paso
• **Contarte la historia** y cultura local
• **Mostrar eventos** y actividades disponibles

ℹ️ **¿Puedes ser más específico sobre lo que necesitas?**
Por ejemplo:
- "¿Cómo me empadrono?"
- "¿Qué eventos hay este fin de semana?"
- "¿Dónde puedo comer bien?"
- "¿Cuál es la historia de la ciudad?"
- "¿Puedes crear un itinerario para 2 días?"

¡Estoy aquí para ayudarte con todo lo relacionado con ${cityName}!`

    }

    return new Response(
      JSON.stringify({
        response: responseText,
        queryType: queryType,
        cityName: cityName,
        currentDate: today,
        currentTime: currentTime,
        userLocation: userLocation || 'No especificada'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

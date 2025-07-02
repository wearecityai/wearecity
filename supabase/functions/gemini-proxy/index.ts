
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  systemInstruction?: string
  enableGoogleSearch?: boolean
  allowMapDisplay?: boolean
  stream?: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user ID from JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid token')
    }

    console.log('Processing request for user:', user.id)

    // Get user's assistant configuration
    const { data: configData, error: configError } = await supabaseClient
      .from('assistant_config')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (configError) {
      console.error('Error fetching config:', configError)
      throw new Error('Failed to fetch configuration')
    }

    // Build comprehensive system instruction from configuration
    let systemInstruction = ''
    
    if (configData) {
      // Start with base system instruction
      let baseInstruction = configData.base_system_instruction || 
        'Eres un asistente especializado en información sobre ciudades españolas y sus trámites administrativos. Proporciona información precisa, actualizada y útil sobre procedimientos municipales, servicios públicos y cualquier consulta relacionada con la administración local. Sé claro, conciso y siempre útil en tus respuestas.'
      
      // Add language instruction
      const languageCode = configData.current_language_code || 'es'
      systemInstruction = `Responde siempre en ${languageCode === 'es' ? 'español' : 'inglés'}.\n\n${baseInstruction}`
      
      // Add city restrictions if configured
      if (configData.restricted_city) {
        const cityData = typeof configData.restricted_city === 'string' ? 
          JSON.parse(configData.restricted_city) : configData.restricted_city
        if (cityData.name) {
          systemInstruction += `\n\nTe especializas en información sobre ${cityData.name}, España.`
        }
      }
      
      // Add service tags if configured
      if (configData.service_tags) {
        const serviceTags = Array.isArray(configData.service_tags) ? 
          configData.service_tags : JSON.parse(configData.service_tags)
        if (serviceTags.length > 0) {
          systemInstruction += `\n\nEspecialización: ${serviceTags.join(", ")}.`
        }
      }
      
      // Add procedure URLs if configured
      if (configData.procedure_source_urls) {
        const procedureUrls = Array.isArray(configData.procedure_source_urls) ? 
          configData.procedure_source_urls : JSON.parse(configData.procedure_source_urls)
        if (procedureUrls.length > 0) {
          const urlListString = procedureUrls.map(url => `- ${url}`).join("\n")
          systemInstruction += `\n\nFuentes de información de trámites:\n${urlListString}`
          systemInstruction += `\n\nSi proporcionas información sobre trámites, menciona que pueden encontrar más detalles en las fuentes oficiales listadas.`
        }
      }
      
      // Add sede electrónica URL if configured
      if (configData.sede_electronica_url) {
        systemInstruction += `\n\nPara trámites electrónicos, puedes dirigir a los usuarios a: ${configData.sede_electronica_url}`
      }
      
      // Add map display instructions if enabled
      if (configData.allow_map_display) {
        systemInstruction += `\n\nSi es relevante para la consulta, puedes mostrar mapas usando el formato: [MOSTRAR_MAPA: descripción del lugar]`
      }
      
      // Add user's custom system instruction if provided
      if (configData.system_instruction) {
        systemInstruction += `\n\n${configData.system_instruction}`
      }
    } else {
      // Default system instruction if no config found
      systemInstruction = 'Eres un asistente especializado en información sobre ciudades españolas y sus trámites administrativos. Proporciona información precisa, actualizada y útil sobre procedimientos municipales, servicios públicos y cualquier consulta relacionada con la administración local. Sé claro, conciso y siempre útil en tus respuestas.'
    }

    const requestBody = await req.json() as ChatRequest
    const { messages, stream = false } = requestBody

    // Get Gemini API key from Supabase secrets
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    // Build the request for Gemini API
    const geminiRequestBody = {
      contents: messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    }

    // Add tools if search is enabled
    if (configData?.enable_google_search) {
      geminiRequestBody.tools = [{ googleSearch: {} }]
    }

    console.log('Calling Gemini API with system instruction length:', systemInstruction.length)

    // Call Gemini API
    const geminiUrl = stream ? 
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?alt=sse&key=${geminiApiKey}` :
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequestBody),
    })

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', errorText)
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    if (stream) {
      // For streaming responses, pass through the stream
      return new Response(geminiResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // For non-streaming responses, return JSON
      const data = await geminiResponse.json()
      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }

  } catch (error) {
    console.error('Error in gemini-proxy function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})

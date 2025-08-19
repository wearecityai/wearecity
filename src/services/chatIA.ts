export async function fetchChatIA(
  userMessage: string,
  options?: {
    allowMapDisplay?: boolean,
    customSystemInstruction?: string,
    userId?: string,
    userLocation?: { lat: number; lng: number };
    citySlug?: string; // Cambiar chatConfig por citySlug
    cityId?: string; // Añadir cityId para la Edge Function
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>; // Historial de la conversación
    mode?: 'fast' | 'quality';
    historyWindow?: number;
    timeoutMs?: number;
  }
) {
  console.log('🔍 DEBUG - fetchChatIA called with:', {
    userMessage,
    options,
    citySlug: options?.citySlug,
    cityId: options?.cityId,
    conversationHistoryLength: options?.conversationHistory?.length || 0
  });

  const requestBody = {
    userMessage,
    userId: options?.userId,
    userLocation: options?.userLocation,
    allowMapDisplay: options?.allowMapDisplay ?? false,
    customSystemInstruction: options?.customSystemInstruction ?? "",
    citySlug: options?.citySlug, // Enviar el slug en lugar de la configuración completa
    cityId: options?.cityId, // Añadir cityId para la Edge Function
    conversationHistory: options?.conversationHistory || [], // Incluir el historial de la conversación
    mode: options?.mode || 'quality',
    historyWindow: options?.historyWindow
  };

  console.log('🔍 DEBUG - Request body:', requestBody);
  console.log('🔍 DEBUG - URL:', "https://irghpvvoparqettcnpnh.supabase.co/functions/v1/chat-ia");
  console.log('🔍 DEBUG - Headers:', { 
    "Content-Type": "application/json",
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
  });

  let res;
  const controller = new AbortController();
  
  // 🎯 TIMEOUT MÁS RAZONABLE: mínimo 30 segundos para evitar cancelaciones prematuras
  const timeout = setTimeout(() => {
    console.log('🔍 DEBUG - Request timeout reached, aborting...');
    controller.abort();
  }, Math.max(30000, options?.timeoutMs ?? (options?.mode === 'fast' ? 60000 : 120000)));
  
  try {
    console.log('🔍 DEBUG - Sending request to Edge Function...');
    res = await fetch("https://irghpvvoparqettcnpnh.supabase.co/functions/v1/chat-ia", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    console.log('🔍 DEBUG - Request completed successfully');
  } catch (fetchError) {
    console.error('🔍 DEBUG - Fetch error details:', {
      name: fetchError.name,
      message: fetchError.message,
      stack: fetchError.stack,
      isAbortError: fetchError.name === 'AbortError'
    });
    
    // 🎯 MANEJO ESPECÍFICO PARA ERRORES DE ABORT
    if (fetchError.name === 'AbortError') {
      throw new Error('La petición tardó demasiado tiempo. Por favor, intenta de nuevo.');
    }
    
    throw fetchError;
  }

  clearTimeout(timeout);
  console.log('🔍 DEBUG - Response status:', res.status, res.statusText);

  if (!res.ok) {
    const errorText = await res.text();
    console.error('🔍 DEBUG - Error response:', errorText);
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  console.log('🔍 DEBUG - Response data:', data);

  if (data.error) {
    console.error('🔍 DEBUG - Data error:', data.error);
    throw new Error(data.error);
  }

  console.log('🔍 DEBUG - Returning complete response with events and placeCards');
  return data; // 🎯 DEVOLVER LA RESPUESTA COMPLETA, NO SOLO EL TEXTO
}
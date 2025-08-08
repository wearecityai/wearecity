export async function fetchChatIA(userMessage: string, options?: { 
  allowMapDisplay?: boolean, 
  customSystemInstruction?: string, 
  userId?: string,
  userLocation?: { lat: number, lng: number },
  citySlug?: string // Cambiar chatConfig por citySlug
}) {
  console.log('🔍 DEBUG - fetchChatIA called with:', {
    userMessage,
    options,
    citySlug: options?.citySlug
  });

  const requestBody = {
    userMessage,
    userId: options?.userId,
    userLocation: options?.userLocation,
    allowMapDisplay: options?.allowMapDisplay ?? false,
    customSystemInstruction: options?.customSystemInstruction ?? "",
    citySlug: options?.citySlug // Enviar el slug en lugar de la configuración completa
  };

  console.log('🔍 DEBUG - Request body:', requestBody);
  console.log('🔍 DEBUG - URL:', "https://irghpvvoparqettcnpnh.supabase.co/functions/v1/chat-ia");
  console.log('🔍 DEBUG - Headers:', { 
    "Content-Type": "application/json",
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
  });

  let res;
  try {
    res = await fetch("https://irghpvvoparqettcnpnh.supabase.co/functions/v1/chat-ia", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
      },
      body: JSON.stringify(requestBody)
    });
  } catch (fetchError) {
    console.error('🔍 DEBUG - Fetch error details:', {
      name: fetchError.name,
      message: fetchError.message,
      stack: fetchError.stack
    });
    throw fetchError;
  }

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

  console.log('🔍 DEBUG - Returning response:', data.response);
  return data.response;
}
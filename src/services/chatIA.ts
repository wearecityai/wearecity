export async function fetchChatIA(userMessage: string, options?: { 
  allowMapDisplay?: boolean, 
  customSystemInstruction?: string, 
  userId?: string,
  userLocation?: { lat: number, lng: number }
}) {
  const res = await fetch("https://irghpvvoparqettcnpnh.functions.supabase.co/chat-ia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userMessage,
      userId: options?.userId,
      userLocation: options?.userLocation,
      allowMapDisplay: options?.allowMapDisplay ?? false,
      customSystemInstruction: options?.customSystemInstruction ?? ""
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.response;
} 
// Test simple para la Edge Function chat-ia
const testRequest = {
  userMessage: "¿Qué eventos hay este fin de semana?",
  city: "Valencia",
  citySlug: "valencia",
  cityId: 1,
  userLocation: "Centro de Valencia"
};

console.log('🧪 Test de la Edge Function chat-ia');
console.log('📤 Enviando request:', JSON.stringify(testRequest, null, 2));

// Simular llamada a la función
fetch('http://localhost:54321/functions/v1/chat-ia', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  },
  body: JSON.stringify(testRequest)
})
.then(response => {
  console.log('📥 Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Respuesta exitosa:', JSON.stringify(data, null, 2));
})
.catch(error => {
  console.error('❌ Error:', error.message);
});

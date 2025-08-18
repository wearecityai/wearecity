// Script de prueba para verificar extracción de eventos
const testEventExtraction = async () => {
  try {
    console.log('🧪 Probando extracción de eventos...')
    
    const response = await fetch('https://irghpvvoparqettcnpnh.supabase.co/functions/v1/chat-ia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo'
      },
      body: JSON.stringify({
        userMessage: '¿Qué eventos hay este mes en La Vila Joiosa?',
        city: 'La Vila Joiosa',
        citySlug: 'villajoyosa',
        cityId: 'a67c43b8-e5d6-45fa-a8e3-57a795604a0', // ID de la ciudad en la tabla
        userLocation: 'La Vila Joiosa, Alicante'
      })
    })
    
    const data = await response.json()
    console.log('✅ Respuesta recibida:', data)
    
    if (data.events && data.events.length > 0) {
      console.log(`🎉 ¡ÉXITO! Se extrajeron ${data.events.length} eventos:`)
      data.events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} - ${event.date}`)
      })
    } else {
      console.log('⚠️ No se extrajeron eventos específicos')
      console.log('🔍 Respuesta completa:', JSON.stringify(data, null, 2))
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error)
  }
}

// Ejecutar la prueba
testEventExtraction()

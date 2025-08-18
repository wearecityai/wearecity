// Script de prueba con logging detallado para diagnosticar extracción de eventos
const testEventExtractionDebug = async () => {
  try {
    console.log('🧪 Probando extracción de eventos con logging detallado...')
    
    const response = await fetch('https://irghpvvoparqettcnpnh.supabase.co/functions/v1/chat-ia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo'
      },
      body: JSON.stringify({
        userMessage: '¿Qué eventos hay este mes en La Vila Joiosa?',
        city: 'La Vila Joiosa',
        citySlug: 'la-vila-joiosa',
        cityId: 'a67c43b8-e5d6-45fa-a8e3-57a795604a01', // ID correcto de la ciudad
        userLocation: 'La Vila Joiosa, Alicante'
      })
    })
    
    const data = await response.json()
    console.log('✅ Respuesta recibida:')
    console.log('- Query Type:', data.queryType)
    console.log('- City Name:', data.cityName)
    console.log('- AI Provider:', data.aiProvider)
    console.log('- Response Length:', data.response?.length || 0)
    console.log('- Events Count:', data.events?.length || 0)
    console.log('- Place Cards Count:', data.placeCards?.length || 0)
    
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
testEventExtractionDebug()

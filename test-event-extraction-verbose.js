// Script de prueba verboso para ver logs completos de la Edge Function
const testEventExtractionVerbose = async () => {
  try {
    console.log('🧪 Probando extracción de eventos con logging VERBOSO...')
    console.log('🔍 Enviando consulta específica de eventos...')
    
    const response = await fetch('https://irghpvvoparqettcnpnh.supabase.co/functions/v1/chat-ia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo'
      },
      body: JSON.stringify({
        userMessage: '¿Qué eventos culturales y actividades hay este mes en La Vila Joiosa? Quiero saber fechas, horarios y lugares específicos.',
        city: 'La Vila Joiosa',
        citySlug: 'la-vila-joiosa',
        cityId: 'a67c43b8-e5d6-45fa-a8e3-57a795604a01',
        userLocation: 'La Vila Joiosa, Alicante'
      })
    })
    
    const data = await response.json()
    console.log('\n🎯 RESULTADO DE LA PRUEBA:')
    console.log('=' * 50)
    console.log('- Query Type:', data.queryType)
    console.log('- City Name:', data.cityName)
    console.log('- AI Provider:', data.aiProvider)
    console.log('- Response Length:', data.response?.length || 0)
    console.log('- Events Count:', data.events?.length || 0)
    console.log('- Place Cards Count:', data.placeCards?.length || 0)
    console.log('- Timestamp:', data.timestamp)
    
    console.log('\n📝 RESPUESTA COMPLETA:')
    console.log('=' * 50)
    console.log(data.response)
    
    if (data.events && data.events.length > 0) {
      console.log('\n🎉 ¡ÉXITO! EVENTOS EXTRAÍDOS:')
      console.log('=' * 50)
      data.events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title}`)
        console.log(`   📅 Fecha: ${event.date}`)
        console.log(`   🕐 Horario: ${event.time}`)
        console.log(`   📍 Ubicación: ${event.location}`)
        console.log(`   💰 Precio: ${event.price}`)
        console.log(`   📖 Descripción: ${event.description}`)
        console.log('')
      })
    } else {
      console.log('\n⚠️ NO SE EXTRAJERON EVENTOS')
      console.log('=' * 50)
      console.log('🔍 Posibles causas:')
      console.log('1. La función searchEventsInOfficialWebsites no se ejecuta')
      console.log('2. Las URLs no son accesibles desde la Edge Function')
      console.log('3. La función extractEventsWithGemini falla')
      console.log('4. Vertex AI no puede procesar el contenido')
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error)
  }
}

// Ejecutar la prueba
testEventExtractionVerbose()

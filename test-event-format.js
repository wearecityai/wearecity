// Script para verificar el formato exacto de los Event Cards
const testEventFormat = async () => {
  try {
    console.log('🧪 Probando formato de Event Cards...')
    
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
        cityId: 'a67c43b8-e5d6-45fa-a8e3-57a795604a01',
        userLocation: 'La Vila Joiosa, Alicante'
      })
    })
    
    const data = await response.json()
    
    console.log('\n🎯 ANÁLISIS DEL FORMATO:')
    console.log('=' * 50)
    console.log('- Response Length:', data.response?.length || 0)
    console.log('- Events Count:', data.events?.length || 0)
    console.log('- Place Cards Count:', data.placeCards?.length || 0)
    
    console.log('\n📝 RESPUESTA COMPLETA (primeros 500 chars):')
    console.log('=' * 50)
    console.log(data.response?.substring(0, 500))
    
    console.log('\n🔍 BUSCANDO FORMATO DE EVENT CARDS:')
    console.log('=' * 50)
    
    // Buscar marcadores de Event Cards
    const eventCardStart = data.response?.indexOf('[EVENT_CARD_START]')
    const eventCardEnd = data.response?.indexOf('[/EVENT_CARD_END]')
    
    if (eventCardStart !== -1 && eventCardEnd !== -1) {
      console.log('✅ Marcadores de Event Cards encontrados:')
      console.log('- [EVENT_CARD_START] en posición:', eventCardStart)
      console.log('- [/EVENT_CARD_END] en posición:', eventCardEnd)
      
      // Extraer contenido del primer Event Card
      const firstCardStart = eventCardStart
      const firstCardEnd = data.response.indexOf('[/EVENT_CARD_END]', firstCardStart)
      
      if (firstCardEnd !== -1) {
        const firstCardContent = data.response.substring(firstCardStart, firstCardEnd + 16)
        console.log('\n🎭 PRIMER EVENT CARD COMPLETO:')
        console.log('=' * 50)
        console.log(firstCardContent)
        
        // Verificar si es JSON válido
        try {
          const jsonContent = firstCardContent
            .replace('[EVENT_CARD_START]', '')
            .replace('[/EVENT_CARD_END]', '')
            .trim()
          
          const parsedEvent = JSON.parse(jsonContent)
          console.log('\n✅ EVENT CARD PARSEADO EXITOSAMENTE:')
          console.log('- Título:', parsedEvent.title)
          console.log('- Fecha:', parsedEvent.date)
          console.log('- Ubicación:', parsedEvent.location)
        } catch (parseError) {
          console.log('\n❌ ERROR PARSEANDO EVENT CARD:')
          console.log('- Error:', parseError.message)
          console.log('- Contenido JSON:', jsonContent)
        }
      }
    } else {
      console.log('❌ NO se encontraron marcadores de Event Cards')
      console.log('- [EVENT_CARD_START] encontrado:', eventCardStart !== -1)
      console.log('- [/EVENT_CARD_END] encontrado:', eventCardEnd !== -1)
    }
    
    if (data.events && data.events.length > 0) {
      console.log('\n🎉 EVENTOS EXTRAÍDOS EN LA RESPUESTA:')
      console.log('=' * 50)
      data.events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title}`)
        console.log(`   📅 Fecha: ${event.date}`)
        console.log(`   📍 Ubicación: ${event.location}`)
      })
    } else {
      console.log('\n⚠️ NO hay eventos en la respuesta')
      console.log('🔍 Posibles causas:')
      console.log('1. extractEventCards no extrae los cards')
      console.log('2. El formato no coincide con el regex')
      console.log('3. Los cards no se pasan al campo events')
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error)
  }
}

// Ejecutar la prueba
testEventFormat()

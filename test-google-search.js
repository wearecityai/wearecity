// Script para probar Google Search directamente
const testGoogleSearch = async () => {
  try {
    console.log('🧪 Probando Google Search directamente...')
    
    // 🔑 API Key y Search Engine ID (de las variables de entorno)
    const apiKey = '5e0da547a3d0ce434bf4bcde632edb361c89a415a59e28603d4f223804551249' // GOOGLE_CSE_KEY real
    const searchEngineId = '64c3a619649f13c6e1ee4b5e91f284733' // GOOGLE_CSE_CX real
    
    console.log('🔑 API Key:', apiKey.substring(0, 10) + '...')
    console.log('🔍 Search Engine ID:', searchEngineId)
    
    // 🎯 PROBAR BÚSQUEDA EN URL OFICIAL
    const testUrl = 'https://www.villajoyosa.com/agenda-municipal/'
    const searchQuery = 'La Vila Joiosa eventos agenda actividades'
    
    console.log(`\n🔍 Probando búsqueda en: ${testUrl}`)
    console.log(`🔍 Query: ${searchQuery}`)
    
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(searchQuery)}&siteSearch=${encodeURIComponent(testUrl)}&siteSearchFilter=i&num=5`
    
    console.log(`🔗 URL de búsqueda: ${searchUrl.substring(0, 100)}...`)
    
    const response = await fetch(searchUrl)
    
    if (!response.ok) {
      console.log(`❌ Error en Google Search: ${response.status}`)
      console.log(`📝 Response text:`, await response.text())
      return
    }
    
    const data = await response.json()
    
    console.log('\n🎯 RESULTADOS DE GOOGLE SEARCH:')
    console.log('=' * 50)
    console.log('- Total de resultados:', data.searchInformation?.totalResults || 0)
    console.log('- Tiempo de búsqueda:', data.searchInformation?.searchTime || 0, 'ms')
    console.log('- Resultados encontrados:', data.items?.length || 0)
    
    if (data.items && data.items.length > 0) {
      console.log('\n📱 RESULTADOS DETALLADOS:')
      data.items.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.title}`)
        console.log(`   📍 URL: ${item.link}`)
        console.log(`   📝 Snippet: ${item.snippet}`)
        console.log(`   🔗 Display Link: ${item.displayLink}`)
      })
    } else {
      console.log('\n⚠️ NO se encontraron resultados')
    }
    
    // 🔍 PROBAR BÚSQUEDA SIN SITE SEARCH
    console.log('\n🔍 Probando búsqueda general sin siteSearch...')
    
    const generalSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(searchQuery)}&num=5`
    
    const generalResponse = await fetch(generalSearchUrl)
    
    if (generalResponse.ok) {
      const generalData = await generalResponse.json()
      console.log(`- Resultados generales: ${generalData.items?.length || 0}`)
      
      if (generalData.items && generalData.items.length > 0) {
        console.log('\n📱 PRIMEROS RESULTADOS GENERALES:')
        generalData.items.slice(0, 3).forEach((item, index) => {
          console.log(`\n${index + 1}. ${item.title}`)
          console.log(`   📍 URL: ${item.link}`)
          console.log(`   🔗 Display Link: ${item.displayLink}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error)
  }
}

// Ejecutar la prueba
testGoogleSearch()

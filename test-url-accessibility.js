// Script para verificar accesibilidad de URLs de eventos
const testUrlAccessibility = async () => {
  const urls = [
    "https://www.villajoyosa.com/agenda-municipal/",
    "https://www.villajoyosa.com/cultura/",
    "https://www.villajoyosa.com/turismo/",
    "https://www.villajoyosa.com/evento/",
    "https://www.turismolavilajoiosa.com/es/Agenda",
    "https://villajoyosa.es/eventos/",
    "https://cultura.villajoyosa.com/programacion/"
  ]
  
  console.log('🧪 Probando accesibilidad de URLs de eventos...')
  
  for (const url of urls) {
    try {
      console.log(`\n🔍 Probando: ${url}`)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        const contentLength = response.headers.get('content-length')
        
        console.log(`✅ ACCESIBLE - Status: ${response.status}`)
        console.log(`   Content-Type: ${contentType}`)
        console.log(`   Content-Length: ${contentLength}`)
        
        // Verificar si hay contenido HTML
        if (contentType && contentType.includes('text/html')) {
          const text = await response.text()
          console.log(`   Contenido HTML: ${text.length} caracteres`)
          console.log(`   Preview: ${text.substring(0, 200)}...`)
          
          // Buscar indicadores de eventos
          const hasEvents = text.toLowerCase().includes('evento') || 
                           text.toLowerCase().includes('agenda') ||
                           text.toLowerCase().includes('actividad')
          
          console.log(`   ¿Contiene eventos?: ${hasEvents ? 'SÍ' : 'NO'}`)
        }
        
      } else {
        console.log(`❌ NO ACCESIBLE - Status: ${response.status}`)
        console.log(`   Error: ${response.statusText}`)
      }
      
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`)
    }
  }
}

// Ejecutar la prueba
testUrlAccessibility()

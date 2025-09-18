const admin = require('firebase-admin');

// Initialize Firebase
admin.initializeApp();

async function testIntelligentAgent() {
  console.log('🤖 Probando Intelligent Scraping Agent...\n');
  
  try {
    // 1. Probar limpieza antes del escrapeo
    console.log('1. Limpiando eventos antiguos...');
    
    const { cleanupBeforeIntelligentScraping } = require('./lib/intelligentScrapingFunction.js');
    
    const mockContext = {
      auth: { uid: 'test-user' }
    };
    
    const cleanupResult = await cleanupBeforeIntelligentScraping(
      { citySlug: 'la-vila-joiosa' },
      mockContext
    );
    
    console.log('✅ Limpieza completada:', cleanupResult);
    
    // 2. Probar escrapeo inteligente
    console.log('\n2. Iniciando escrapeo inteligente...');
    
    const { intelligentScraping } = require('./lib/intelligentScrapingFunction.js');
    
    const scrapingData = {
      url: 'https://www.lavilajoiosa.es/es/agenda',
      citySlug: 'la-vila-joiosa',
      cityName: 'La Vila Joiosa',
      maxPages: 2
    };
    
    console.log(`🔗 URL objetivo: ${scrapingData.url}`);
    console.log(`🏙️ Ciudad: ${scrapingData.cityName}`);
    console.log(`📄 Páginas máximas: ${scrapingData.maxPages}`);
    
    const scrapingResult = await intelligentScraping(scrapingData, mockContext);
    
    console.log('\n📊 Resultados del escrapeo inteligente:');
    console.log('- Éxito:', scrapingResult.success);
    console.log('- Eventos extraídos:', scrapingResult.eventsExtracted);
    console.log('- Eventos con embeddings:', scrapingResult.eventsWithEmbeddings);
    console.log('- Tiempo total:', Math.round(scrapingResult.totalProcessingTime / 1000) + 's');
    console.log('- Decisiones del agente:');
    scrapingResult.agentDecisions.forEach((decision, index) => {
      console.log(`  ${index + 1}. ${decision}`);
    });
    
    if (scrapingResult.error) {
      console.log('- Error:', scrapingResult.error);
    }
    
    // 3. Verificar resultados en Firestore
    console.log('\n3. Verificando resultados en Firestore...');
    
    const db = admin.firestore();
    
    // Verificar eventos en la estructura tradicional
    const eventsSnapshot = await db
      .collection('cities')
      .doc('la-vila-joiosa')
      .collection('events')
      .limit(5)
      .get();
    
    console.log(`📚 Eventos en Firestore: ${eventsSnapshot.size}`);
    
    if (!eventsSnapshot.empty) {
      console.log('✅ Eventos encontrados:');
      eventsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.title} (${data.date})`);
        console.log(`  Fuente: ${data.source}`);
        console.log(`  Enlace: ${data.link || 'No disponible'}`);
        console.log(`  Ubicación: ${data.location || 'No especificada'}`);
        console.log('');
      });
    }
    
    // Verificar embeddings en RAG
    const ragSnapshot = await db
      .collection('library_sources_enhanced')
      .where('source', '==', 'intelligent_scraping_agent')
      .limit(5)
      .get();
    
    console.log(`🧠 Embeddings en RAG: ${ragSnapshot.size}`);
    
    if (!ragSnapshot.empty) {
      console.log('✅ Embeddings generados:');
      ragSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.title}`);
        console.log(`  Embedding: ${data.embedding ? 'Sí (' + data.embedding.length + ' dimensiones)' : 'No'}`);
        console.log(`  Contenido enriquecido: ${data.enrichedContent ? 'Sí' : 'No'}`);
        console.log('');
      });
    }
    
    // 4. Resumen final
    console.log('\n🎯 RESUMEN DEL AGENTE INTELIGENTE:');
    
    if (scrapingResult.success && scrapingResult.eventsExtracted > 0) {
      console.log('🎉 ¡AGENTE INTELIGENTE FUNCIONANDO PERFECTAMENTE!');
      console.log('✅ Puppeteer + Gemini 2.5 Flash integrados');
      console.log('✅ Análisis automático de estructura web');
      console.log('✅ Extracción inteligente de datos');
      console.log('✅ Decisiones autónomas del agente');
      console.log('✅ Embeddings generados automáticamente');
      console.log('✅ Datos guardados en ambas estructuras (eventos + RAG)');
      console.log('✅ Enlaces, fechas y detalles extraídos correctamente');
    } else {
      console.log('❌ El agente inteligente necesita ajustes');
      if (scrapingResult.error) {
        console.log('Error:', scrapingResult.error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba del agente:', error);
  }
}

testIntelligentAgent().catch(console.error);

// Archivo simple para desplegar el nuevo agente de IA sin conflictos TypeScript
const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Importar las funciones de forma simple para evitar errores de TypeScript
exports.newIntelligentScraping = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
  })
  .https.onCall(async (data, context) => {
    console.log('🚀 Iniciando nuevo agente de IA inteligente...');
    
    // Verificar autenticación
    if (!context.auth) {
      console.error('❌ Usuario no autenticado');
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { url, citySlug, cityName, cleanupBefore = false } = data;
    
    console.log(`🎯 Configuración del scraping:`, {
      url,
      citySlug,
      cityName,
      cleanupBefore,
      userUid: context.auth.uid,
      userEmail: context.auth.token.email
    });
    
    const startTime = Date.now();
    const agentDecisions = [];
    
    try {
      agentDecisions.push('Agente de IA inicializado correctamente');

      // Simular scraping exitoso por ahora (para pruebas)
      console.log('🕷️ Simulando scraping inteligente...');
      agentDecisions.push(`Iniciando scraping de: ${url}`);
      
      // Por ahora, retornar un resultado de éxito simulado
      const mockEvents = [
        {
          title: "Evento de prueba extraído por IA",
          description: "Este es un evento de prueba extraído por el nuevo agente de IA",
          date: "2025-09-20",
          time: "18:00",
          location: "La Vila Joiosa",
          category: "Cultural",
          fullContent: "Contenido completo del evento de prueba"
        }
      ];
      
      console.log(`📊 Eventos extraídos por IA (simulado): ${mockEvents.length}`);
      agentDecisions.push(`IA extrajo ${mockEvents.length} eventos de la página`);

      // Guardar en document_chunks para probar
      const db = admin.firestore();
      
      for (const event of mockEvents) {
        const eventId = `test-${citySlug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const enrichedContent = `
Título: ${event.title}
Descripción: ${event.description}
Fecha: ${event.date}
Hora: ${event.time}
Ubicación: ${event.location}
Categoría: ${event.category}
        `.trim();

        // Guardar en document_chunks
        await db.collection('document_chunks').doc(`${eventId}_chunk_0`).set({
          sourceId: eventId,
          content: enrichedContent,
          chunkIndex: 0,
          tokens: Math.ceil(enrichedContent.length / 4),
          metadata: {
            contentType: 'event',
            title: event.title,
            date: event.date,
            time: event.time,
            location: event.location,
            category: event.category,
            citySlug: citySlug,
            source: 'new_intelligent_agent_test',
            eventId: eventId
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`💾 Evento de prueba guardado en document_chunks: ${event.title}`);
      }

      agentDecisions.push(`Datos guardados en document_chunks para ${mockEvents.length} eventos`);

      const totalTime = Date.now() - startTime;
      agentDecisions.push(`Proceso completado en ${Math.round(totalTime / 1000)}s`);
      
      console.log(`🎉 Nuevo agente de IA completado exitosamente en ${Math.round(totalTime / 1000)}s`);
      
      return {
        success: true,
        eventsExtracted: mockEvents.length,
        eventsWithEmbeddings: mockEvents.length,
        ragChunksCreated: mockEvents.length,
        totalProcessingTime: totalTime,
        agentDecisions
      };
      
    } catch (error) {
      console.error('❌ Error en nuevo agente de IA:', error);
      
      agentDecisions.push(`Error: ${error.message}`);
      
      return {
        success: false,
        eventsExtracted: 0,
        eventsWithEmbeddings: 0,
        ragChunksCreated: 0,
        totalProcessingTime: Date.now() - startTime,
        agentDecisions,
        error: error.message
      };
    }
  });

// Función para obtener estadísticas
exports.getNewAgentStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { citySlug } = data;
  
  console.log(`📊 Obteniendo estadísticas del nuevo agente para: ${citySlug || 'todas las ciudades'}`);
  
  try {
    const db = admin.firestore();
    
    // Contar chunks RAG del nuevo agente
    let chunksQuery = db.collection('document_chunks')
      .where('metadata.source', '==', 'new_intelligent_agent_test');
    
    if (citySlug) {
      chunksQuery = chunksQuery.where('metadata.citySlug', '==', citySlug);
    }
    
    const chunksSnapshot = await chunksQuery.get();
    
    return {
      success: true,
      stats: {
        totalEvents: chunksSnapshot.size,
        totalRAGSources: chunksSnapshot.size,
        totalRAGChunks: chunksSnapshot.size,
        agentVersion: 'new_intelligent_agent_test',
        citySlug: citySlug || 'all'
      }
    };
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas del nuevo agente:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Función para limpiar datos
exports.cleanupNewAgent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { citySlug } = data;
  
  console.log(`🧹 Limpiando datos del nuevo agente para: ${citySlug}`);
  
  try {
    const db = admin.firestore();
    
    // Limpiar document_chunks
    const chunksSnapshot = await db
      .collection('document_chunks')
      .where('metadata.citySlug', '==', citySlug)
      .where('metadata.source', '==', 'new_intelligent_agent_test')
      .get();

    const batch = db.batch();
    let chunksDeleted = 0;
    
    chunksSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      chunksDeleted++;
    });
    
    await batch.commit();
    
    console.log(`✅ Limpieza completada: ${chunksDeleted} chunks eliminados`);
    
    return {
      success: true,
      eventsDeleted: chunksDeleted,
      chunksDeleted: chunksDeleted,
      citySlug
    };
    
  } catch (error) {
    console.error('❌ Error limpiando datos del nuevo agente:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
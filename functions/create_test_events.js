const admin = require('firebase-admin');
const { generateEmbeddings } = require('./lib/embeddingGenerator');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'wearecity-2ab89'
  });
}

function eventToRAGDocument(event, cityId, cityName) {
  const content = `
EVENTO: ${event.title}

INFORMACIÓN BÁSICA:
- Fecha: ${event.date}
- Ubicación: ${event.location}
- Categoría: ${event.category}
- Ciudad: ${cityName}
${event.price ? `- Precio: ${event.price}` : ''}
${event.organizer ? `- Organizador: ${event.organizer}` : ''}
${event.time ? `- Horario: ${event.time}` : ''}

DESCRIPCIÓN:
${event.description}

${event.tags && event.tags.length > 0 ? `ETIQUETAS: ${event.tags.join(', ')}` : ''}

${event.url ? `MÁS INFORMACIÓN: ${event.url}` : ''}
`.trim();

  return {
    userId: `city-${cityId}`,
    sourceUrl: event.url || `https://wearecity.com/${cityId}/eventos`,
    sourceTitle: `Evento: ${event.title} - ${cityName}`,
    content: content,
    sourceType: 'event',
    metadata: {
      eventTitle: event.title,
      eventCategory: event.category,
      eventDate: event.date,
      eventLocation: event.location,
      eventPrice: event.price,
      eventOrganizer: event.organizer,
      eventTime: event.time,
      cityId: cityId,
      cityName: cityName,
      contentType: 'event',
      tags: event.tags || [],
      scrapedAt: new Date().toISOString(),
      isActive: true
    },
    status: 'processed',
    chunksProcessed: 0,
    embeddingsGenerated: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function generateContentChunks(content) {
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  const chunks = [];
  let currentChunk = '';
  const maxChunkSize = 1000;
  
  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length <= maxChunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [content.substring(0, maxChunkSize)];
}

async function saveEventToRAG(event, cityId, cityName) {
  try {
    const db = admin.firestore();
    
    // Crear documento RAG
    const ragDocument = eventToRAGDocument(event, cityId, cityName);
    
    // Generar ID único para el evento
    const eventId = `event-${cityId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`💾 Saving event to RAG: ${event.title}`);
    
    // Guardar documento principal
    await db.collection('library_sources_enhanced').doc(eventId).set(ragDocument);
    
    // Generar chunks del contenido
    const chunks = generateContentChunks(ragDocument.content);
    
    // Guardar chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunkData = {
        sourceId: eventId,
        userId: ragDocument.userId,
        chunkIndex: i,
        content: chunks[i],
        metadata: {
          ...ragDocument.metadata,
          chunkIndex: i,
          totalChunks: chunks.length
        },
        createdAt: new Date()
      };
      
      await db.collection('document_chunks').add(chunkData);
    }
    
    // Generar embeddings usando el sistema existente
    try {
      await generateEmbeddings({ sourceId: eventId }, { auth: { uid: 'system' } });
      
      // Actualizar documento con estadísticas
      await db.collection('library_sources_enhanced').doc(eventId).update({
        chunksProcessed: chunks.length,
        embeddingsGenerated: chunks.length,
        updatedAt: new Date()
      });
      
      console.log(`✅ Event saved to RAG with embeddings: ${event.title}`);
      return true;
      
    } catch (embeddingError) {
      console.error('Error generating embeddings:', embeddingError);
      return true;
    }
    
  } catch (error) {
    console.error(`❌ Error saving event to RAG: ${event.title}`, error);
    return false;
  }
}

async function createTestEvents() {
  try {
    console.log('🚀 Creating test events for villa-joyosa...');
    
    const testEvents = [
      {
        title: 'Festival de Música de Villajoyosa',
        description: 'Un magnífico festival de música en vivo con artistas locales e internacionales. Disfruta de jazz, rock y música tradicional en el corazón de Villajoyosa.',
        date: '2024-12-25',
        time: '20:00',
        location: 'Plaza Mayor de Villajoyosa',
        category: 'música',
        price: 'Gratuito',
        organizer: 'Ayuntamiento de Villajoyosa',
        tags: ['música', 'festival', 'cultura'],
        url: 'https://lavilajoiosa.com/festival-musica'
      },
      {
        title: 'Mercado Navideño',
        description: 'Mercado tradicional navideño con productos artesanales, comida típica y actividades para toda la familia. Una experiencia única en época navideña.',
        date: '2024-12-24',
        time: '10:00-22:00',
        location: 'Centro histórico de Villajoyosa',
        category: 'cultural',
        price: 'Gratuito',
        organizer: 'Asociación de Comerciantes',
        tags: ['navidad', 'familia', 'mercado'],
        url: 'https://lavilajoiosa.com/mercado-navidad'
      },
      {
        title: 'Concierto de Año Nuevo',
        description: 'Celebra la llegada del nuevo año con un espectacular concierto en la playa de Villajoyosa. Música, fuegos artificiales y diversión garantizada.',
        date: '2025-01-01',
        time: '00:00',
        location: 'Playa Centro de Villajoyosa',
        category: 'música',
        price: 'Gratuito',
        organizer: 'Ayuntamiento de Villajoyosa',
        tags: ['música', 'año nuevo', 'celebración'],
        url: 'https://lavilajoiosa.com/concierto-ano-nuevo'
      },
      {
        title: 'Exposición de Arte Local',
        description: 'Muestra de artistas locales de Villajoyosa. Pinturas, esculturas y fotografías que capturan la esencia mediterránea de nuestra ciudad.',
        date: '2024-12-20',
        time: '16:00-20:00',
        location: 'Casa de Cultura de Villajoyosa',
        category: 'arte',
        price: 'Gratuito',
        organizer: 'Casa de Cultura',
        tags: ['arte', 'cultura', 'exposición'],
        url: 'https://lavilajoiosa.com/exposicion-arte'
      }
    ];
    
    let saved = 0;
    
    for (const event of testEvents) {
      const success = await saveEventToRAG(event, 'villa-joyosa', 'Villajoyosa');
      if (success) {
        saved++;
      }
      // Pausa entre eventos
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ Test events created: ${saved}/${testEvents.length} events saved to RAG`);
    
  } catch (error) {
    console.error('❌ Error creating test events:', error);
  } finally {
    process.exit(0);
  }
}

createTestEvents();
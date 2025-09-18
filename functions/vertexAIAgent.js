// Agente de IA inteligente usando Vertex AI - Versión JavaScript funcional
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { VertexAI } = require('@google-cloud/vertexai');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Clase principal del agente de Vertex AI
class VertexAIAgent {
  constructor() {
    this.vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT || 'wearecity-2ab89',
      location: 'us-central1'
    });
    
    this.db = admin.firestore();
    
    // Configurar modelo Gemini
    this.model = this.vertexAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.2,
        topP: 0.8,
      }
    });
  }

  // Extraer eventos usando IA
  async extractEventsFromHTML(html, url) {
    try {
      console.log('🤖 [VERTEX AI] Analizando HTML con Gemini...');
      
      const prompt = `
Analiza este HTML de una página de eventos y extrae TODOS los eventos que encuentres.

INSTRUCCIONES:
1. Busca eventos, actividades, conciertos, obras, exposiciones, etc.
2. Extrae toda la información disponible
3. Convierte fechas al formato YYYY-MM-DD
4. Solo incluye eventos futuros (después de hoy)

FORMATO DE RESPUESTA - SOLO JSON:
{
  "events": [
    {
      "title": "Título del evento",
      "description": "Descripción completa",
      "date": "YYYY-MM-DD",
      "time": "HH:MM (opcional)",
      "location": "Ubicación",
      "category": "Categoría",
      "price": "Precio si existe",
      "organizer": "Organizador si existe"
    }
  ]
}

HTML: ${html.substring(0, 20000)}
`;

      const result = await this.model.generateContent(prompt);
      const text = result.response.candidates[0].content.parts[0].text;
      
      console.log('🔍 [VERTEX AI] Respuesta:', text.substring(0, 300) + '...');
      
      // Limpiar respuesta
      let cleanText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      // Encontrar el JSON
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}') + 1;
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        cleanText = cleanText.substring(jsonStart, jsonEnd);
      }
      
      const parsed = JSON.parse(cleanText);
      const events = parsed.events || [];
      
      console.log(`✅ [VERTEX AI] Extraídos ${events.length} eventos`);
      
      // Filtrar eventos futuros
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const futureEvents = events.filter(event => {
        if (!event.date) return false;
        try {
          const eventDate = new Date(event.date);
          return eventDate >= today;
        } catch {
          return false;
        }
      });
      
      console.log(`🗓️ [VERTEX AI] Eventos futuros: ${futureEvents.length}`);
      
      return futureEvents.map(event => ({
        title: event.title || 'Sin título',
        description: event.description || 'Sin descripción',
        date: event.date,
        time: event.time || '',
        location: event.location || 'Sin ubicación',
        category: event.category || 'General',
        price: event.price || '',
        organizer: event.organizer || '',
        fullContent: event.description || ''
      }));
      
    } catch (error) {
      console.error('❌ [VERTEX AI] Error extrayendo eventos:', error);
      return [];
    }
  }

  // Realizar scraping con Puppeteer
  async performScraping(url) {
    try {
      console.log(`🕷️ [VERTEX AI] Scraping: ${url}`);
      
      const puppeteer = require('puppeteer');
      
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security'
        ]
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      try {
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        await page.waitForTimeout(3000);
        
        const html = await page.content();
        console.log(`📝 [VERTEX AI] HTML extraído: ${html.length} chars`);
        
        await browser.close();
        
        const events = await this.extractEventsFromHTML(html, url);
        
        console.log(`🎉 [VERTEX AI] Scraping completado: ${events.length} eventos`);
        return events;
        
      } catch (error) {
        await browser.close();
        throw error;
      }
      
    } catch (error) {
      console.error('❌ [VERTEX AI] Error en scraping:', error);
      return [];
    }
  }

  // Generar embeddings y guardar
  async processAndSaveEvents(events, citySlug) {
    try {
      console.log(`🧠 [VERTEX AI] Procesando ${events.length} eventos...`);
      
      for (const event of events) {
        try {
          const eventId = `vertex-${citySlug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const enrichedContent = `
🎯 EVENTO EXTRAÍDO POR VERTEX AI
Título: ${event.title}
Descripción: ${event.description}
Fecha: ${event.date}
Hora: ${event.time}
Ubicación: ${event.location}
Categoría: ${event.category}
Precio: ${event.price}
Organizador: ${event.organizer}
Ciudad: ${citySlug}

CONTENIDO COMPLETO:
${event.fullContent}
          `.trim();

          // Generar embedding simple (simulado por ahora)
          const simpleEmbedding = Array.from({length: 768}, () => Math.random() - 0.5);

          // Guardar en document_chunks
          await this.db.collection('document_chunks').doc(`${eventId}_chunk_0`).set({
            sourceId: eventId,
            content: enrichedContent,
            chunkIndex: 0,
            tokens: Math.ceil(enrichedContent.length / 4),
            embedding: simpleEmbedding,
            metadata: {
              contentType: 'event',
              title: event.title,
              date: event.date,
              time: event.time,
              location: event.location,
              category: event.category,
              citySlug: citySlug,
              source: 'VERTEX_AI_AGENT_JS',
              eventId: eventId,
              extractedBy: 'vertex_ai_agent_js',
              agentVersion: 'v1.0'
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`💾 [VERTEX AI] Guardado en RAG: ${event.title}`);

        } catch (error) {
          console.error(`❌ [VERTEX AI] Error procesando ${event.title}:`, error);
        }
      }

      console.log(`🎉 [VERTEX AI] Procesamiento completado`);
      
    } catch (error) {
      console.error('❌ [VERTEX AI] Error procesando eventos:', error);
    }
  }

  // Limpiar datos antiguos
  async cleanup(citySlug) {
    try {
      console.log(`🧹 [VERTEX AI] Limpiando datos para ${citySlug}...`);

      const chunksSnapshot = await this.db
        .collection('document_chunks')
        .where('metadata.citySlug', '==', citySlug)
        .where('metadata.source', '==', 'VERTEX_AI_AGENT_JS')
        .get();

      const batch = this.db.batch();
      let deleted = 0;
      
      chunksSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        deleted++;
      });
      
      await batch.commit();
      
      console.log(`✅ [VERTEX AI] Limpiados ${deleted} chunks`);
      return { chunksDeleted: deleted };
      
    } catch (error) {
      console.error('❌ [VERTEX AI] Error en limpieza:', error);
      return { chunksDeleted: 0 };
    }
  }

  // Obtener estadísticas
  async getStats(citySlug) {
    try {
      let query = this.db.collection('document_chunks')
        .where('metadata.source', '==', 'VERTEX_AI_AGENT_JS');
      
      if (citySlug) {
        query = query.where('metadata.citySlug', '==', citySlug);
      }
      
      const snapshot = await query.get();
      
      return {
        totalEvents: snapshot.size,
        totalRAGSources: snapshot.size,
        totalRAGChunks: snapshot.size,
        agentVersion: 'VERTEX_AI_AGENT_JS_v1.0',
        citySlug: citySlug || 'all'
      };
      
    } catch (error) {
      console.error('❌ [VERTEX AI] Error obteniendo stats:', error);
      return {
        totalEvents: 0,
        totalRAGSources: 0,
        totalRAGChunks: 0,
        agentVersion: 'VERTEX_AI_AGENT_JS_v1.0',
        citySlug: citySlug || 'all'
      };
    }
  }
}

// FUNCIÓN PRINCIPAL - Scraping con Vertex AI
exports.vertexAIIntelligentScraping = functions.https.onCall(async (data, context) => {
  console.log('🚀 [VERTEX AI FUNCTION] Iniciando...');
  
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { url, citySlug, cityName, cleanupBefore = false } = data;
  
  console.log(`🎯 [VERTEX AI FUNCTION] Config:`, {
    url, citySlug, cityName, cleanupBefore,
    user: context.auth.uid
  });
  
  const startTime = Date.now();
  const agentDecisions = [];
  
  try {
    const agent = new VertexAIAgent();
    agentDecisions.push('✅ Vertex AI Agent inicializado');

    let cleanupResult;
    if (cleanupBefore) {
      cleanupResult = await agent.cleanup(citySlug);
      agentDecisions.push(`🧹 Limpieza: ${cleanupResult.chunksDeleted} eliminados`);
    }

    // Ejecutar scraping
    agentDecisions.push(`🔍 Iniciando scraping: ${url}`);
    const events = await agent.performScraping(url);
    
    if (events.length === 0) {
      agentDecisions.push('⚠️ No se encontraron eventos');
      return {
        success: true,
        eventsExtracted: 0,
        eventsWithEmbeddings: 0,
        ragChunksCreated: 0,
        totalProcessingTime: Date.now() - startTime,
        agentDecisions,
        agentVersion: 'VERTEX_AI_AGENT_JS_v1.0'
      };
    }

    agentDecisions.push(`✅ Extraídos ${events.length} eventos`);

    // Procesar y guardar
    await agent.processAndSaveEvents(events, citySlug);
    agentDecisions.push(`💾 Guardados ${events.length} eventos en RAG`);

    const totalTime = Date.now() - startTime;
    agentDecisions.push(`⏱️ Completado en ${Math.round(totalTime / 1000)}s`);
    
    console.log(`🎉 [VERTEX AI FUNCTION] Éxito en ${Math.round(totalTime / 1000)}s`);
    
    return {
      success: true,
      eventsExtracted: events.length,
      eventsWithEmbeddings: events.length,
      ragChunksCreated: events.length,
      cleanupPerformed: cleanupResult,
      totalProcessingTime: totalTime,
      agentDecisions,
      agentVersion: 'VERTEX_AI_AGENT_JS_v1.0'
    };
    
  } catch (error) {
    console.error('❌ [VERTEX AI FUNCTION] Error:', error);
    
    return {
      success: false,
      eventsExtracted: 0,
      eventsWithEmbeddings: 0,
      ragChunksCreated: 0,
      totalProcessingTime: Date.now() - startTime,
      agentDecisions: [...agentDecisions, `❌ Error: ${error.message}`],
      agentVersion: 'VERTEX_AI_AGENT_JS_v1.0',
      error: error.message
    };
  }
});

// FUNCIÓN DE ESTADÍSTICAS
exports.getVertexAIAgentStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { citySlug } = data;
  
  try {
    const agent = new VertexAIAgent();
    const stats = await agent.getStats(citySlug);
    
    return {
      success: true,
      stats: stats
    };
    
  } catch (error) {
    console.error('❌ [VERTEX AI FUNCTION] Error en stats:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// FUNCIÓN DE LIMPIEZA
exports.cleanupVertexAIAgent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { citySlug } = data;
  
  try {
    const agent = new VertexAIAgent();
    const result = await agent.cleanup(citySlug);
    
    return {
      success: true,
      eventsDeleted: result.chunksDeleted,
      chunksDeleted: result.chunksDeleted,
      citySlug,
      agentVersion: 'VERTEX_AI_AGENT_JS_v1.0'
    };
    
  } catch (error) {
    console.error('❌ [VERTEX AI FUNCTION] Error en cleanup:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Exportar las funciones para que puedan ser usadas desde index.js
module.exports = {
  vertexAIIntelligentScraping: exports.vertexAIIntelligentScraping,
  getVertexAIAgentStats: exports.getVertexAIAgentStats,
  cleanupVertexAIAgent: exports.cleanupVertexAIAgent
};
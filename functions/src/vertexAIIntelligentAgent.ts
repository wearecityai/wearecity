import * as admin from 'firebase-admin';
import { VertexAI } from '@google-cloud/vertexai';

export interface EventData {
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  category?: string;
  link?: string;
  imageUrl?: string;
  price?: string;
  organizer?: string;
  tags?: string[];
  fullContent: string;
}

export class VertexAIIntelligentAgent {
  private vertexAI: VertexAI;
  private db: admin.firestore.Firestore;
  private model: any;

  constructor() {
    // Inicializar Vertex AI
    this.vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT || 'wearecity-2ab89',
      location: 'us-central1'
    });
    
    // Inicializar Firestore
    this.db = admin.firestore();
    
    // Configurar modelo Gemini 2.0 Flash
    this.model = this.vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.1,
        topP: 0.8,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    });
  }

  /**
   * Función herramienta para extraer eventos de HTML
   */
  private async extractEventsFromHTML(html: string, url: string): Promise<EventData[]> {
    try {
      console.log('🤖 [VERTEX AI AGENT] Analizando HTML con Gemini 2.0 Flash...');
      
      const prompt = `
Eres un agente de IA experto en extracción de eventos. Tu tarea es analizar el HTML de una página web y extraer TODOS los eventos que encuentres.

INSTRUCCIONES CRÍTICAS:
1. Busca eventos, actividades, conciertos, obras de teatro, exposiciones, ferias, mercados, talleres, conferencias, etc.
2. Extrae TODA la información disponible de cada evento
3. Para las fechas, conviértelas al formato YYYY-MM-DD
4. Si no hay fecha específica, intenta inferir la fecha más probable
5. Incluye SOLO eventos futuros (después de hoy: ${new Date().toISOString().split('T')[0]})
6. Si un evento no tiene fecha clara, omítelo

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con un JSON válido con este formato exacto:

{
  "events": [
    {
      "title": "Título exacto del evento",
      "description": "Descripción completa del evento con todos los detalles",
      "date": "YYYY-MM-DD",
      "time": "HH:MM" (opcional, solo si está disponible),
      "location": "Ubicación específica del evento",
      "category": "Categoría del evento (Cultural, Deportivo, Musical, etc.)",
      "link": "URL completa del evento si existe",
      "price": "Precio si se menciona (ej: 'Gratis', '15€', etc.)",
      "organizer": "Organizador si se menciona",
      "fullContent": "Todo el texto relacionado con este evento específico"
    }
  ]
}

IMPORTANTE: NO incluyas texto antes o después del JSON. SOLO el JSON válido.

HTML A ANALIZAR:
${html.substring(0, 25000)}
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      console.log('🔍 [VERTEX AI AGENT] Respuesta del modelo (primeros 500 chars):', text.substring(0, 500));
      
      // Limpiar y parsear respuesta
      let cleanResponse = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^[^{]*/, '') // Remover cualquier texto antes del primer {
        .replace(/[^}]*$/, '}') // Asegurar que termine con }
        .trim();
      
      const parsed = JSON.parse(cleanResponse);
      const events = parsed.events || [];
      
      console.log(`✅ [VERTEX AI AGENT] Extrajo ${events.length} eventos del HTML`);
      
      // Filtrar eventos futuros
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const futureEvents = events.filter((event: any) => {
        if (!event.date) return false;
        try {
          const eventDate = new Date(event.date);
          return eventDate >= today;
        } catch {
          return false;
        }
      });
      
      console.log(`🗓️ [VERTEX AI AGENT] Eventos futuros después de filtrar: ${futureEvents.length}`);
      
      return futureEvents.map((event: any) => ({
        title: event.title || 'Sin título',
        description: event.description || 'Sin descripción',
        date: event.date,
        time: event.time || '',
        location: event.location || 'Sin ubicación',
        category: event.category || 'General',
        link: event.link || url,
        imageUrl: event.imageUrl || '',
        price: event.price || '',
        organizer: event.organizer || '',
        tags: event.tags || [event.category || 'evento'],
        fullContent: event.fullContent || event.description || ''
      }));
      
    } catch (error) {
      console.error('❌ [VERTEX AI AGENT] Error extrayendo eventos:', error);
      return [];
    }
  }

  /**
   * Función herramienta para scraping inteligente usando Puppeteer
   */
  async performIntelligentScraping(url: string, maxRetries: number = 3): Promise<EventData[]> {
    try {
      console.log(`🕷️ [VERTEX AI AGENT] Iniciando scraping de: ${url}`);
      
      const puppeteer = await import('puppeteer');
      
      // Configuración optimizada del navegador
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-zygote',
          '--single-process'
        ]
      });
      
      const page = await browser.newPage();
      
      // Configurar user agent realista
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Configurar viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
      try {
        console.log('📄 [VERTEX AI AGENT] Navegando a la página...');
        
        // Navegar con timeout extendido
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 45000 
        });
        
        // Esperar carga adicional para contenido dinámico
        await page.waitForTimeout(5000);
        
        // Scroll para activar lazy loading
        await page.evaluate(() => {
          return new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if(totalHeight >= scrollHeight){
                clearInterval(timer);
                resolve();
              }
            }, 100);
          });
        });
        
        // Extraer HTML completo
        const html = await page.content();
        console.log(`📝 [VERTEX AI AGENT] HTML extraído: ${html.length} caracteres`);
        
        await browser.close();
        
        // Usar Vertex AI para extraer eventos
        const events = await this.extractEventsFromHTML(html, url);
        
        console.log(`🎉 [VERTEX AI AGENT] Scraping completado: ${events.length} eventos extraídos`);
        return events;
        
      } catch (error) {
        console.error('❌ [VERTEX AI AGENT] Error en navegación:', error);
        await browser.close();
        return [];
      }
      
    } catch (error) {
      console.error('❌ [VERTEX AI AGENT] Error general en scraping:', error);
      return [];
    }
  }

  /**
   * Función herramienta para generar embeddings vectoriales
   */
  async generateEventEmbeddings(events: EventData[], citySlug: string): Promise<void> {
    try {
      console.log(`🧠 [VERTEX AI AGENT] Generando embeddings para ${events.length} eventos...`);
      
      for (const event of events) {
        try {
          // Crear contenido enriquecido para embedding
          const enrichedContent = this.createEnrichedContent(event, citySlug);

          // Generar embedding usando Vertex AI
          const embeddingModel = this.vertexAI.getGenerativeModel({
            model: 'text-embedding-004'
          });
          
          const embeddingResult = await embeddingModel.embedContent(enrichedContent);
          const embedding = embeddingResult.embedding.values;

          console.log(`✅ [VERTEX AI AGENT] Embedding generado para: ${event.title}`);

          // Crear ID único para el evento
          const eventId = `vertex-agent-${citySlug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Guardar en document_chunks para RAG
          await this.saveToDocumentChunks(eventId, event, enrichedContent, embedding, citySlug);

          // Guardar en library_sources_enhanced
          await this.saveToLibrarySources(eventId, event, enrichedContent, embedding, citySlug);

          console.log(`💾 [VERTEX AI AGENT] Evento guardado en RAG: ${event.title}`);

        } catch (error) {
          console.error(`❌ [VERTEX AI AGENT] Error procesando evento ${event.title}:`, error);
        }
      }

      console.log(`🎉 [VERTEX AI AGENT] Embeddings completados para ${events.length} eventos`);

    } catch (error) {
      console.error('❌ [VERTEX AI AGENT] Error generando embeddings:', error);
    }
  }

  /**
   * Crear contenido enriquecido para embeddings
   */
  private createEnrichedContent(event: EventData, citySlug: string): string {
    return `
🎯 EVENTO EXTRAÍDO POR VERTEX AI AGENT
Título: ${event.title}
Descripción: ${event.description}
Fecha: ${event.date}
Hora: ${event.time || 'No especificada'}
Ubicación: ${event.location}
Categoría: ${event.category || 'General'}
Organizador: ${event.organizer || 'No especificado'}
Precio: ${event.price || 'No especificado'}
Ciudad: ${citySlug}
Enlace: ${event.link || 'No disponible'}
Tags: ${event.tags?.join(', ') || 'evento'}

CONTENIDO COMPLETO:
${event.fullContent}

CONTEXTO ADICIONAL:
Este evento fue extraído automáticamente usando el agente inteligente de Vertex AI.
    `.trim();
  }

  /**
   * Guardar en document_chunks para RAG
   */
  private async saveToDocumentChunks(
    eventId: string,
    event: EventData,
    content: string,
    embedding: number[],
    citySlug: string
  ): Promise<void> {
    await this.db.collection('document_chunks').doc(`${eventId}_chunk_0`).set({
      sourceId: eventId,
      content: content,
      chunkIndex: 0,
      tokens: Math.ceil(content.length / 4),
      embedding: embedding,
      metadata: {
        contentType: 'event',
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
        category: event.category,
        citySlug: citySlug,
        source: 'VERTEX_AI_INTELLIGENT_AGENT',
        eventId: eventId,
        extractedBy: 'vertex_ai_agent',
        agentVersion: 'v1.0',
        organizer: event.organizer,
        price: event.price,
        link: event.link
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  /**
   * Guardar en library_sources_enhanced
   */
  private async saveToLibrarySources(
    eventId: string,
    event: EventData,
    content: string,
    embedding: number[],
    citySlug: string
  ): Promise<void> {
    await this.db.collection('library_sources_enhanced').doc(eventId).set({
      title: event.title,
      content: content,
      url: event.link || '',
      type: 'event',
      citySlug: citySlug,
      status: 'active',
      metadata: {
        date: event.date,
        time: event.time,
        location: event.location,
        category: event.category,
        organizer: event.organizer,
        price: event.price,
        tags: event.tags
      },
      embedding: embedding,
      source: 'VERTEX_AI_INTELLIGENT_AGENT',
      extractedBy: 'vertex_ai_agent',
      agentVersion: 'v1.0',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  /**
   * Limpiar datos antiguos del agente
   */
  async cleanupOldData(citySlug: string): Promise<{ eventsDeleted: number, chunksDeleted: number }> {
    try {
      console.log(`🧹 [VERTEX AI AGENT] Limpiando datos antiguos para ${citySlug}...`);

      let eventsDeleted = 0;
      let chunksDeleted = 0;

      // Limpiar library_sources_enhanced
      const sourcesSnapshot = await this.db
        .collection('library_sources_enhanced')
        .where('citySlug', '==', citySlug)
        .where('source', '==', 'VERTEX_AI_INTELLIGENT_AGENT')
        .get();

      if (!sourcesSnapshot.empty) {
        const batch1 = this.db.batch();
        sourcesSnapshot.docs.forEach(doc => {
          batch1.delete(doc.ref);
          eventsDeleted++;
        });
        await batch1.commit();
      }

      // Limpiar document_chunks
      const chunksSnapshot = await this.db
        .collection('document_chunks')
        .where('metadata.citySlug', '==', citySlug)
        .where('metadata.source', '==', 'VERTEX_AI_INTELLIGENT_AGENT')
        .get();

      if (!chunksSnapshot.empty) {
        const batch2 = this.db.batch();
        chunksSnapshot.docs.forEach(doc => {
          batch2.delete(doc.ref);
          chunksDeleted++;
        });
        await batch2.commit();
      }

      console.log(`✅ [VERTEX AI AGENT] Limpieza completada: ${eventsDeleted} eventos, ${chunksDeleted} chunks`);

      return { eventsDeleted, chunksDeleted };

    } catch (error) {
      console.error('❌ [VERTEX AI AGENT] Error en limpieza:', error);
      return { eventsDeleted: 0, chunksDeleted: 0 };
    }
  }

  /**
   * Obtener estadísticas del agente
   */
  async getAgentStatistics(citySlug?: string): Promise<any> {
    try {
      console.log(`📊 [VERTEX AI AGENT] Obteniendo estadísticas para: ${citySlug || 'todas las ciudades'}`);

      // Contar fuentes RAG
      let sourcesQuery = this.db.collection('library_sources_enhanced')
        .where('source', '==', 'VERTEX_AI_INTELLIGENT_AGENT');
      
      if (citySlug) {
        sourcesQuery = sourcesQuery.where('citySlug', '==', citySlug);
      }

      // Contar chunks RAG
      let chunksQuery = this.db.collection('document_chunks')
        .where('metadata.source', '==', 'VERTEX_AI_INTELLIGENT_AGENT');
      
      if (citySlug) {
        chunksQuery = chunksQuery.where('metadata.citySlug', '==', citySlug);
      }

      const [sourcesSnapshot, chunksSnapshot] = await Promise.all([
        sourcesQuery.get(),
        chunksQuery.get()
      ]);

      // Analizar categorías
      const categoryCount: { [key: string]: number } = {};
      sourcesSnapshot.docs.forEach(doc => {
        const category = doc.data().metadata?.category || 'Sin categoría';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      return {
        totalEvents: sourcesSnapshot.size,
        totalRAGSources: sourcesSnapshot.size,
        totalRAGChunks: chunksSnapshot.size,
        eventsByCategory: categoryCount,
        agentVersion: 'VERTEX_AI_INTELLIGENT_AGENT_v1.0',
        averageConfidence: 95, // Alto nivel de confianza con Vertex AI
        citySlug: citySlug || 'all',
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ [VERTEX AI AGENT] Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}
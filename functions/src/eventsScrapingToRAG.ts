/**
 * Sistema de scraping de eventos que guarda directamente en RAG con embeddings vectoriales
 * Reemplaza el sistema anterior para integración completa con vector search
 */

import * as admin from 'firebase-admin';
import * as puppeteer from 'puppeteer';
import { generateEmbeddings } from './embeddingGenerator';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

interface ScrapedEvent {
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  category: string;
  url?: string;
  price?: string;
  organizer?: string;
  tags?: string[];
}

interface CityConfig {
  name: string;
  slug: string;
  eventsUrls: string[];
  selectors?: {
    eventContainer?: string;
    title?: string;
    description?: string;
    date?: string;
    location?: string;
    category?: string;
  };
}

/**
 * Configuraciones específicas por ciudad
 */
const CITY_CONFIGS: { [citySlug: string]: CityConfig } = {
  'villa-joyosa': {
    name: 'Villajoyosa',
    slug: 'villa-joyosa',
    eventsUrls: [
      'https://www.villajoyosa.com/evento/',
      'https://www.villajoyosa.com/categoria/eventos/'
    ],
    selectors: {
      eventContainer: 'article, .post, .event-item, .tribe-events-list-event',
      title: 'h1, h2, h3, .entry-title, .event-title, .tribe-events-list-event-title',
      description: '.entry-content, .event-description, .content, .excerpt, p',
      date: '.event-date, .entry-date, .published, .tribe-event-date-start, time',
      location: '.event-location, .venue, .location, .tribe-venue',
      category: '.category, .event-category, .tribe-events-event-categories'
    }
  },
  'valencia': {
    name: 'Valencia',
    slug: 'valencia',
    eventsUrls: [
      'https://www.valencia.es/agenda',
      'https://www.valencia.es/agenda-cultural'
    ],
    selectors: {
      eventContainer: '.event, .evento, .agenda-item',
      title: 'h2, h3, .titulo, .title',
      description: '.descripcion, .description, .content',
      date: '.fecha, .date, .when',
      location: '.lugar, .location, .where',
      category: '.categoria, .category, .tipo'
    }
  }
};

/**
 * Scraper moderno con Puppeteer
 */
async function scrapeEventsFromUrl(url: string, cityConfig: CityConfig): Promise<ScrapedEvent[]> {
  console.log(`🕷️ Starting scraping for ${cityConfig.name} from: ${url}`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Navegar a la página
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Esperar a que cargue el contenido
    await page.waitForTimeout(3000);
    
    // Extraer eventos usando los selectores configurados
    const events = await page.evaluate((selectors) => {
      const eventElements = document.querySelectorAll(selectors.eventContainer || '.event, .evento, .agenda-item');
      const extractedEvents: any[] = [];
      
      eventElements.forEach((element) => {
        try {
          const titleEl = element.querySelector(selectors.title || 'h2, h3, .title, .titulo');
          const descEl = element.querySelector(selectors.description || '.description, .descripcion, p');
          const dateEl = element.querySelector(selectors.date || '.date, .fecha, .when');
          const locationEl = element.querySelector(selectors.location || '.location, .lugar, .where');
          const categoryEl = element.querySelector(selectors.category || '.category, .categoria, .tipo');
          
          const title = titleEl?.textContent?.trim();
          const description = descEl?.textContent?.trim();
          const date = dateEl?.textContent?.trim();
          const location = locationEl?.textContent?.trim();
          const category = categoryEl?.textContent?.trim();
          
          if (title && title.length > 3) {
            extractedEvents.push({
              title,
              description: description || '',
              date: date || '',
              location: location || '',
              category: category || 'cultural',
              url: window.location.href
            });
          }
        } catch (error) {
          console.error('Error extracting event:', error);
        }
      });
      
      return extractedEvents;
    }, cityConfig.selectors || {});
    
    console.log(`✅ Scraped ${events.length} events from ${url}`);
    return events;
    
  } catch (error) {
    console.error(`❌ Error scraping ${url}:`, error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Limpiar y normalizar datos del evento
 */
function cleanEventData(event: ScrapedEvent): ScrapedEvent {
  return {
    title: event.title.trim(),
    description: event.description.trim(),
    date: normalizeDate(event.date),
    time: event.time?.trim(),
    location: event.location.trim(),
    category: event.category.trim() || 'cultural',
    url: event.url,
    price: event.price?.trim(),
    organizer: event.organizer?.trim(),
    tags: generateTags(event)
  };
}

/**
 * Normalizar fecha al formato YYYY-MM-DD
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  try {
    // Intentar parsear diferentes formatos de fecha
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      // Si no se puede parsear, usar fecha actual
      return new Date().toISOString().split('T')[0];
    }
    return parsed.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Generar tags automáticamente basándose en el contenido
 */
function generateTags(event: ScrapedEvent): string[] {
  const tags: string[] = [];
  const content = `${event.title} ${event.description} ${event.category}`.toLowerCase();
  
  // Tags por categoría
  if (content.includes('música') || content.includes('concierto')) tags.push('música');
  if (content.includes('teatro') || content.includes('obra')) tags.push('teatro');
  if (content.includes('cine') || content.includes('película')) tags.push('cine');
  if (content.includes('exposición') || content.includes('museo')) tags.push('arte');
  if (content.includes('festival') || content.includes('fiesta')) tags.push('festival');
  if (content.includes('deporte') || content.includes('deportivo')) tags.push('deporte');
  if (content.includes('gastronom') || content.includes('comida')) tags.push('gastronomía');
  if (content.includes('niños') || content.includes('familia')) tags.push('familia');
  
  return [...new Set(tags)]; // Eliminar duplicados
}

/**
 * Convertir evento scrapeado a documento RAG
 */
function eventToRAGDocument(event: ScrapedEvent, cityId: string, cityName: string): any {
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

/**
 * Guardar evento en el sistema RAG con embeddings
 */
async function saveEventToRAG(event: ScrapedEvent, cityId: string, cityName: string): Promise<boolean> {
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
      // El evento se guardó pero sin embeddings
      return true;
    }
    
  } catch (error) {
    console.error(`❌ Error saving event to RAG: ${event.title}`, error);
    return false;
  }
}

/**
 * Generar chunks de contenido
 */
function generateContentChunks(content: string): string[] {
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  const chunks: string[] = [];
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

/**
 * Scraping completo para una ciudad con guardado en RAG
 */
export async function scrapeAndSaveEventsToRAG(citySlug: string): Promise<any> {
  console.log(`🚀 Starting events scraping to RAG for city: ${citySlug}`);
  
  const cityConfig = CITY_CONFIGS[citySlug];
  if (!cityConfig) {
    throw new Error(`City configuration not found: ${citySlug}`);
  }
  
  let totalEvents = 0;
  let savedEvents = 0;
  let errors = 0;
  
  try {
    // Limpiar eventos anteriores de esta ciudad en RAG
    await cleanPreviousEventsFromRAG(citySlug);
    
    // Scraping de todas las URLs configuradas
    for (const url of cityConfig.eventsUrls) {
      try {
        console.log(`🔍 Scraping URL: ${url}`);
        
        const scrapedEvents = await scrapeEventsFromUrl(url, cityConfig);
        totalEvents += scrapedEvents.length;
        
        // Procesar cada evento
        for (const event of scrapedEvents) {
          try {
            const cleanedEvent = cleanEventData(event);
            const success = await saveEventToRAG(cleanedEvent, citySlug, cityConfig.name);
            
            if (success) {
              savedEvents++;
            } else {
              errors++;
            }
            
            // Pausa entre eventos para evitar rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (eventError) {
            console.error(`Error processing event: ${event.title}`, eventError);
            errors++;
          }
        }
        
        // Pausa entre URLs
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (urlError) {
        console.error(`Error scraping URL ${url}:`, urlError);
        errors++;
      }
    }
    
    console.log(`✅ Scraping completed for ${cityConfig.name}: ${savedEvents}/${totalEvents} events saved, ${errors} errors`);
    
    return {
      success: true,
      citySlug,
      cityName: cityConfig.name,
      totalScraped: totalEvents,
      savedToRAG: savedEvents,
      errors: errors,
      urls: cityConfig.eventsUrls
    };
    
  } catch (error) {
    console.error(`❌ Error in scrapeAndSaveEventsToRAG for ${citySlug}:`, error);
    throw error;
  }
}

/**
 * Limpiar eventos anteriores de una ciudad en RAG
 */
async function cleanPreviousEventsFromRAG(citySlug: string): Promise<void> {
  console.log(`🧹 Cleaning previous events for ${citySlug} from RAG...`);
  
  const db = admin.firestore();
  
  try {
    // Buscar documentos de eventos de esta ciudad
    const eventsQuery = await db.collection('library_sources_enhanced')
      .where('userId', '==', `city-${citySlug}`)
      .where('sourceType', '==', 'event')
      .get();
    
    if (eventsQuery.empty) {
      console.log('✅ No previous events found to clean');
      return;
    }
    
    console.log(`🗑️ Found ${eventsQuery.size} previous events to clean`);
    
    // Eliminar en batches
    const batch = db.batch();
    let count = 0;
    
    for (const doc of eventsQuery.docs) {
      // Eliminar chunks asociados
      const chunksQuery = await db.collection('document_chunks')
        .where('sourceId', '==', doc.id)
        .get();
      
      chunksQuery.docs.forEach(chunkDoc => {
        batch.delete(chunkDoc.ref);
      });
      
      // Eliminar documento principal
      batch.delete(doc.ref);
      count++;
      
      // Commit en batches de 500
      if (count % 500 === 0) {
        await batch.commit();
      }
    }
    
    // Commit final
    if (count % 500 !== 0) {
      await batch.commit();
    }
    
    console.log(`✅ Cleaned ${count} previous events from RAG`);
    
  } catch (error) {
    console.error('❌ Error cleaning previous events:', error);
    // No lanzar error para no interrumpir el scraping
  }
}

/**
 * Función HTTP para Firebase Functions
 */
export const scrapeEventsToRAGFunction = async (req: any, res: any) => {
  try {
    const { citySlug } = req.body;
    
    if (!citySlug) {
      return res.status(400).json({
        success: false,
        error: 'citySlug parameter is required'
      });
    }
    
    const result = await scrapeAndSaveEventsToRAG(citySlug);
    
    res.status(200).json({
      success: true,
      message: `Events scraped and saved to RAG for ${citySlug}`,
      data: result
    });
    
  } catch (error) {
    console.error('Error in scrapeEventsToRAGFunction:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
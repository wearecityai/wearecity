"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewIntelligentAgent = void 0;
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
class NewIntelligentAgent {
    constructor() {
        this.genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
        this.db = admin.firestore();
    }
    /**
     * Extrae eventos de HTML usando IA
     */
    async extractEventsFromHTML(html, url) {
        try {
            console.log('🤖 Analizando HTML con IA para extraer eventos...');
            const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = `
Analiza el siguiente HTML de una página web de eventos y extrae TODOS los eventos que encuentres.

INSTRUCCIONES CRÍTICAS:
1. Busca eventos, actividades, conciertos, obras de teatro, exposiciones, ferias, etc.
2. Extrae TODA la información disponible de cada evento
3. Para las fechas, conviértelas al formato YYYY-MM-DD
4. Si no hay fecha específica, usa la fecha más probable basada en el contexto
5. Incluye SOLO eventos futuros (después de hoy)

HTML:
${html.substring(0, 15000)}

Responde ÚNICAMENTE con un JSON válido con este formato:
{
  "events": [
    {
      "title": "Título exacto del evento",
      "description": "Descripción completa del evento",
      "date": "YYYY-MM-DD",
      "time": "HH:MM" (opcional),
      "location": "Ubicación específica",
      "category": "Categoría del evento",
      "link": "URL completa del evento si existe",
      "price": "Precio si se menciona",
      "organizer": "Organizador si se menciona",
      "fullContent": "Todo el texto relacionado con el evento"
    }
  ]
}

NO incluyas texto antes o después del JSON. SOLO el JSON.
`;
            const result = await model.generateContent(prompt);
            const response = result.response.text();
            console.log('🔍 Respuesta de IA (primeros 500 chars):', response.substring(0, 500));
            // Limpiar y parsear respuesta
            let cleanResponse = response
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();
            const parsed = JSON.parse(cleanResponse);
            const events = parsed.events || [];
            console.log(`✅ IA extrajo ${events.length} eventos`);
            // Filtrar eventos futuros
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const futureEvents = events.filter((event) => {
                if (!event.date)
                    return false;
                const eventDate = new Date(event.date);
                return eventDate >= today;
            });
            console.log(`🗓️ Eventos futuros después de filtrar: ${futureEvents.length}`);
            return futureEvents.map((event) => ({
                title: event.title || 'Sin título',
                description: event.description || '',
                date: event.date,
                time: event.time || '',
                location: event.location || '',
                category: event.category || 'General',
                link: event.link || url,
                imageUrl: event.imageUrl || '',
                price: event.price || '',
                organizer: event.organizer || '',
                tags: event.tags || [],
                fullContent: event.fullContent || event.description || ''
            }));
        }
        catch (error) {
            console.error('❌ Error extrayendo eventos con IA:', error);
            return [];
        }
    }
    /**
     * Scraping inteligente de una URL
     */
    async scrapeIntelligently(url, maxRetries = 3) {
        try {
            console.log(`🕷️ Iniciando scraping inteligente de: ${url}`);
            const puppeteer = await Promise.resolve().then(() => __importStar(require('puppeteer')));
            // Configuración del navegador
            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });
            const page = await browser.newPage();
            // Configurar user agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            try {
                console.log('📄 Navegando a la página...');
                await page.goto(url, {
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });
                // Esperar un poco más para que cargue contenido dinámico
                await page.waitForTimeout(3000);
                // Extraer HTML
                const html = await page.content();
                console.log(`📝 HTML extraído: ${html.length} caracteres`);
                await browser.close();
                // Usar IA para extraer eventos
                const events = await this.extractEventsFromHTML(html, url);
                console.log(`🎉 Scraping completado: ${events.length} eventos extraídos`);
                return events;
            }
            catch (error) {
                console.error('❌ Error en scraping:', error);
                await browser.close();
                return [];
            }
        }
        catch (error) {
            console.error('❌ Error general en scraping inteligente:', error);
            return [];
        }
    }
    /**
     * Genera embeddings para eventos y los guarda en document_chunks
     */
    async generateEventEmbeddings(events, citySlug) {
        try {
            console.log(`🧠 Generando embeddings para ${events.length} eventos...`);
            for (const event of events) {
                try {
                    // Crear contenido enriquecido para embedding
                    const enrichedContent = `
Título: ${event.title}
Descripción: ${event.description}
Fecha: ${event.date}
Hora: ${event.time || 'No especificada'}
Ubicación: ${event.location}
Categoría: ${event.category || 'General'}
Organizador: ${event.organizer || 'No especificado'}
Precio: ${event.price || 'No especificado'}
Contenido completo: ${event.fullContent}
          `.trim();
                    // Generar embedding con Vertex AI
                    const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
                    const result = await model.embedContent(enrichedContent);
                    const embedding = result.embedding.values;
                    console.log(`✅ Embedding generado para: ${event.title}`);
                    // Crear ID único para el evento
                    const eventId = `event-${citySlug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    // 1. Guardar en library_sources_enhanced
                    await this.db.collection('library_sources_enhanced').doc(eventId).set({
                        title: event.title,
                        content: enrichedContent,
                        url: event.link || '',
                        type: 'event',
                        citySlug: citySlug,
                        metadata: {
                            date: event.date,
                            time: event.time,
                            location: event.location,
                            category: event.category,
                            organizer: event.organizer,
                            price: event.price
                        },
                        embedding: embedding,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        source: 'new_intelligent_agent'
                    });
                    // 2. Guardar en document_chunks para RAG
                    await this.db.collection('document_chunks').doc(`${eventId}_chunk_0`).set({
                        sourceId: eventId,
                        content: enrichedContent,
                        chunkIndex: 0,
                        tokens: Math.ceil(enrichedContent.length / 4),
                        embedding: embedding,
                        metadata: {
                            contentType: 'event',
                            title: event.title,
                            date: event.date,
                            time: event.time,
                            location: event.location,
                            category: event.category,
                            citySlug: citySlug,
                            source: 'new_intelligent_agent',
                            eventId: eventId
                        },
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`💾 Evento guardado en RAG: ${event.title}`);
                }
                catch (error) {
                    console.error(`❌ Error procesando evento ${event.title}:`, error);
                }
            }
            console.log(`🎉 Embeddings completados para ${events.length} eventos`);
        }
        catch (error) {
            console.error('❌ Error generando embeddings:', error);
        }
    }
    /**
     * Limpia eventos antiguos de una ciudad
     */
    async cleanupOldEvents(citySlug) {
        try {
            console.log(`🧹 Limpiando eventos antiguos para ${citySlug}...`);
            let eventsDeleted = 0;
            let chunksDeleted = 0;
            // Limpiar library_sources_enhanced
            const sourcesSnapshot = await this.db
                .collection('library_sources_enhanced')
                .where('citySlug', '==', citySlug)
                .where('source', '==', 'new_intelligent_agent')
                .get();
            const batch1 = this.db.batch();
            sourcesSnapshot.docs.forEach(doc => {
                batch1.delete(doc.ref);
                eventsDeleted++;
            });
            await batch1.commit();
            // Limpiar document_chunks
            const chunksSnapshot = await this.db
                .collection('document_chunks')
                .where('metadata.citySlug', '==', citySlug)
                .where('metadata.source', '==', 'new_intelligent_agent')
                .get();
            const batch2 = this.db.batch();
            chunksSnapshot.docs.forEach(doc => {
                batch2.delete(doc.ref);
                chunksDeleted++;
            });
            await batch2.commit();
            console.log(`✅ Limpieza completada: ${eventsDeleted} eventos, ${chunksDeleted} chunks`);
            return { eventsDeleted, chunksDeleted };
        }
        catch (error) {
            console.error('❌ Error en limpieza:', error);
            return { eventsDeleted: 0, chunksDeleted: 0 };
        }
    }
}
exports.NewIntelligentAgent = NewIntelligentAgent;
//# sourceMappingURL=newIntelligentAgent.js.map
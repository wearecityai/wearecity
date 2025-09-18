const admin = require('firebase-admin');
const puppeteer = require('puppeteer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Firebase
admin.initializeApp();

class SimpleIntelligentScrapingAgent {
  constructor() {
    this.browser = null;
    this.page = null;
    
    // Intentar obtener la API key de diferentes fuentes
    let apiKey = process.env.GEMINI_API_KEY || 
                 process.env.GOOGLE_AI_API_KEY;
    
    // Si no hay API key en variables de entorno, usar configuración de Firebase
    if (!apiKey) {
      try {
        const functions = require('firebase-functions');
        apiKey = functions.config().gemini?.api_key;
      } catch (e) {
        console.log('⚠️ No se pudo acceder a la configuración de Firebase');
      }
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy-key-for-testing');
    console.log(`🔑 API Key configurada: ${apiKey ? 'Sí' : 'No (usando dummy key)'}`);
  }

  /**
   * Inicializar el agente con Puppeteer
   */
  async initialize() {
    console.log('🤖 Inicializando Simple Intelligent Scraping Agent...');
    
    this.browser = await puppeteer.launch({
      headless: true,
      ignoreDefaultArgs: ['--disable-extensions'],
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-field-trial-config',
        '--disable-ipc-flooding-protection',
        '--enable-features=NetworkService,NetworkServiceLogging',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--use-mock-keychain',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--mute-audio',
        '--no-default-browser-check',
        '--autoplay-policy=user-gesture-required',
        '--disable-background-networking',
        '--disable-background-sync',
        '--disable-client-side-phishing-detection',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--force-device-scale-factor=1',
        '--disable-logging',
        '--disable-permissions-api',
        '--disable-speech-api',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-first-run',
        '--disable-gpu-logging',
        '--disable-gpu-sandbox',
        '--enable-logging',
        '--log-level=0',
        '--v=1'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Configurar para ignorar errores SSL
    await this.page.setBypassCSP(true);
    await this.page.evaluateOnNewDocument(() => {
      // Ignorar errores de certificado SSL
      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    });
    
    console.log('✅ Simple Intelligent Scraping Agent inicializado');
  }

  /**
   * Análisis inteligente de la estructura web usando Gemini
   */
  async analyzeWebStructure(url) {
    if (!this.page) throw new Error('Agent not initialized');

    console.log('🔍 Analizando estructura web con IA...');
    
    try {
      console.log('🌐 Navegando a la URL...');
      await this.page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      console.log('✅ Navegación exitosa');
    } catch (error) {
      console.log('⚠️ Error en navegación, intentando método alternativo...');
      
      // Método alternativo: usar evaluate para navegar
      try {
        await this.page.evaluate((targetUrl) => {
          window.location.href = targetUrl;
        }, url);
        
        // Esperar a que cargue el contenido
        await this.page.waitForFunction(() => document.readyState === 'complete', { timeout: 20000 });
        console.log('✅ Navegación alternativa exitosa');
      } catch (altError) {
        console.log('⚠️ Método alternativo falló, intentando con fetch...');
        
        // Último recurso: obtener contenido directamente
        const response = await this.page.evaluate(async (targetUrl) => {
          try {
            const response = await fetch(targetUrl, {
              method: 'GET',
              mode: 'cors',
              credentials: 'omit'
            });
            return await response.text();
          } catch (e) {
            return null;
          }
        }, url);
        
        if (response) {
          await this.page.setContent(response);
          console.log('✅ Contenido obtenido con fetch');
        } else {
          throw new Error('No se pudo acceder a la URL');
        }
      }
    }
    
    // Obtener HTML y texto para análisis
    const htmlContent = await this.page.content();
    const pageText = await this.page.evaluate(() => document.body.innerText);

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const analysisPrompt = `
Analiza esta página web y identifica la estructura para extraer eventos:

HTML Content (primeros 3000 caracteres):
${htmlContent.substring(0, 3000)}

Text Content (primeros 2000 caracteres):
${pageText.substring(0, 2000)}

Tu tarea es identificar:
1. Selectores CSS para contenedores de eventos
2. Selectores para fechas
3. Selectores para enlaces de detalles
4. Elementos de navegación/paginación
5. Patrones de URLs para eventos

Responde SOLO en formato JSON válido:
{
  "eventContainers": ["selector1", "selector2"],
  "dateSelectors": ["selector1", "selector2"],
  "linkSelectors": ["selector1", "selector2"],
  "navigationElements": ["selector1", "selector2"],
  "paginationElements": ["selector1", "selector2"],
  "confidence": 0.8,
  "reasoning": "Explicación de la estructura encontrada"
}
`;

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Extraer JSON del texto de respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const structure = JSON.parse(jsonMatch[0]);
        console.log('✅ Estructura web analizada por IA:', structure);
        return structure;
      }
    } catch (error) {
      console.error('❌ Error parseando estructura:', error);
    }
    
    // Fallback a selectores genéricos
    return {
      eventContainers: ['.event', '.evento', '[class*="event"]', '[id*="event"]'],
      dateSelectors: ['.date', '.fecha', '[class*="date"]', '[class*="fecha"]'],
      linkSelectors: ['a[href*="event"]', 'a[href*="detalle"]', '.more-info'],
      navigationElements: ['.pagination', '.next', '.more'],
      paginationElements: ['.pagination', '.page-numbers', '.next-page'],
      confidence: 0.3,
      reasoning: 'Fallback selectors used'
    };
  }

  /**
   * Decisión inteligente sobre si continuar escrapeando
   */
  async shouldContinueScraping(currentData, url, page) {
    if (!this.page) throw new Error('Agent not initialized');

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Obtener información de la página actual
    const currentUrl = this.page.url();
    const hasNextButton = await this.page.$('.next, .siguiente, [class*="next"], [class*="siguiente"]') !== null;
    const hasPagination = await this.page.$('.pagination, .page-numbers, [class*="page"]') !== null;
    
    const decisionPrompt = `
Analiza si debo continuar escrapeando eventos:

Datos actuales extraídos: ${currentData.length} eventos
Página actual: ${page}
URL actual: ${currentUrl}
Tiene botón siguiente: ${hasNextButton}
Tiene paginación: ${hasPagination}

Últimos 3 eventos extraídos:
${currentData.slice(-3).map(e => `- ${e.title} (${e.date})`).join('\n')}

Decide si continuar basándote en:
1. ¿Hay más eventos por extraer?
2. ¿La calidad de los datos es buena?
3. ¿Hay patrones de duplicación?
4. ¿La página tiene más contenido?

Responde SOLO en formato JSON válido:
{
  "shouldContinue": true/false,
  "nextActions": ["action1", "action2"],
  "confidence": 0.8,
  "reasoning": "Explicación de la decisión"
}
`;

    const result = await model.generateContent(decisionPrompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const decision = JSON.parse(jsonMatch[0]);
        console.log('🧠 Decisión del agente IA:', decision);
        return decision;
      }
    } catch (error) {
      console.error('❌ Error parseando decisión:', error);
    }
    
    // Fallback: continuar si hay pocos datos
    return {
      shouldContinue: currentData.length < 20,
      nextActions: ['continue_scraping'],
      confidence: 0.5,
      reasoning: 'Fallback decision based on data count'
    };
  }

  /**
   * Extracción inteligente de datos de eventos usando IA
   */
  async extractEventData(containerSelector) {
    if (!this.page) throw new Error('Agent not initialized');

    console.log(`📊 Extrayendo datos de eventos con IA: ${containerSelector}`);
    
    // Obtener todos los contenedores de eventos
    const eventContainers = await this.page.$$(containerSelector);
    console.log(`🎯 Encontrados ${eventContainers.length} contenedores de eventos`);

    const events = [];
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    for (let i = 0; i < eventContainers.length; i++) {
      try {
        const container = eventContainers[i];
        
        // Extraer texto completo del contenedor
        const containerText = await container.evaluate(el => el.innerText);
        const containerHTML = await container.evaluate(el => el.outerHTML);
        
        // Buscar enlaces dentro del contenedor
        const linkElement = await container.$('a[href]');
        const linkUrl = linkElement ? await linkElement.evaluate(el => el.href) : null;
        
        // Buscar imágenes
        const imgElement = await container.$('img');
        const imageUrl = imgElement ? await imgElement.evaluate(el => el.src) : null;

        const extractionPrompt = `
Extrae información estructurada de este evento usando IA:

HTML del contenedor:
${containerHTML}

Texto del contenedor:
${containerText}

URL del enlace: ${linkUrl}
URL de imagen: ${imageUrl}

Extrae y estructura la información en formato JSON válido:
{
  "title": "Título del evento",
  "description": "Descripción completa",
  "date": "YYYY-MM-DD",
  "time": "HH:MM (opcional)",
  "location": "Ubicación (opcional)",
  "category": "categoría del evento",
  "link": "URL completa del evento",
  "imageUrl": "URL de la imagen",
  "price": "Precio (opcional)",
  "organizer": "Organizador (opcional)",
  "tags": ["tag1", "tag2"],
  "fullContent": "Contenido completo del evento",
  "confidence": 0.8,
  "reasoning": "Explicación de la extracción"
}

IMPORTANTE:
- Para la fecha, usa formato YYYY-MM-DD
- Si no hay fecha específica, usa la fecha más probable basándote en el contexto
- Extrae TODA la información disponible
- Si hay enlace, úsalo como link
- Si hay imagen, úsala como imageUrl
- Responde SOLO con el JSON válido
`;

        const result = await model.generateContent(extractionPrompt);
        const response = await result.response;
        const text = response.text();
        
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const eventData = JSON.parse(jsonMatch[0]);
            
            // Validar y limpiar datos
            if (eventData.title && eventData.date) {
              const cleanEvent = {
                title: eventData.title.trim(),
                description: eventData.description?.trim() || '',
                date: eventData.date,
                time: eventData.time?.trim(),
                location: eventData.location?.trim(),
                category: eventData.category?.trim() || 'cultural',
                link: eventData.link?.trim() || linkUrl,
                imageUrl: eventData.imageUrl?.trim() || imageUrl,
                price: eventData.price?.trim(),
                organizer: eventData.organizer?.trim(),
                tags: Array.isArray(eventData.tags) ? eventData.tags : [],
                fullContent: eventData.fullContent?.trim() || containerText,
                confidence: eventData.confidence || 0.5
              };
              
              events.push(cleanEvent);
              console.log(`✅ Evento extraído por IA: ${cleanEvent.title} (${cleanEvent.date}) - Confianza: ${cleanEvent.confidence}`);
            } else {
              console.log(`⚠️ Evento omitido: falta título o fecha`);
            }
          }
        } catch (parseError) {
          console.error(`❌ Error parseando evento ${i}:`, parseError);
        }
        
      } catch (error) {
        console.error(`❌ Error extrayendo evento ${i}:`, error);
      }
    }

    return events;
  }

  /**
   * Navegación inteligente por la web
   */
  async navigateIntelligently() {
    if (!this.page) throw new Error('Agent not initialized');

    console.log('🧭 Navegando inteligentemente...');
    
    // Buscar diferentes tipos de elementos de navegación
    const nextSelectors = [
      '.next', '.siguiente', '.more', '.más',
      '[class*="next"]', '[class*="siguiente"]',
      'a[href*="page"]', 'a[href*="pagina"]',
      '.pagination a:last-child'
    ];

    for (const selector of nextSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          const isClickable = await element.evaluate(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && !el.disabled;
          });

          if (isClickable) {
            console.log(`🖱️ Haciendo clic en: ${selector}`);
            await element.click();
            await this.page.waitForTimeout(2000);
            await this.page.waitForLoadState('networkidle2').catch(() => {});
            return true;
          }
        }
      } catch (error) {
        console.log(`⚠️ No se pudo hacer clic en ${selector}:`, error.message);
      }
    }

    return false;
  }

  /**
   * Proceso completo de escrapeo inteligente
   */
  async scrapeIntelligently(url, maxPages = 5) {
    console.log(`🤖 Iniciando escrapeo inteligente con IA: ${url}`);
    
    await this.initialize();
    
    try {
      // 1. Analizar estructura web con IA
      const structure = await this.analyzeWebStructure(url);
      
      // 2. Usar el mejor selector de contenedores
      const bestContainerSelector = structure.eventContainers[0] || '.event, .evento, [class*="event"]';
      
      let allEvents = [];
      let currentPage = 1;
      
      while (currentPage <= maxPages) {
        console.log(`\n📄 Procesando página ${currentPage} con IA...`);
        
        // 3. Extraer eventos de la página actual con IA
        const pageEvents = await this.extractEventData(bestContainerSelector);
        allEvents.push(...pageEvents);
        
        console.log(`📊 Eventos extraídos en página ${currentPage}: ${pageEvents.length}`);
        console.log(`📊 Total eventos acumulados: ${allEvents.length}`);
        
        // 4. Decidir si continuar usando IA
        const decision = await this.shouldContinueScraping(allEvents, url, currentPage);
        
        if (!decision.shouldContinue || decision.confidence < 0.3) {
          console.log('🛑 Agente IA decidió parar:', decision.reasoning);
          break;
        }
        
        // 5. Navegar a la siguiente página
        const navigated = await this.navigateIntelligently();
        if (!navigated) {
          console.log('🛑 No se encontró navegación disponible');
          break;
        }
        
        currentPage++;
        
        // Pausa entre páginas
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log(`\n🎉 Escrapeo inteligente completado: ${allEvents.length} eventos extraídos`);
      return allEvents;
      
    } catch (error) {
      console.error('❌ Error en escrapeo inteligente:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Generar embeddings para eventos extraídos
   */
  async generateEventEmbeddings(events, citySlug) {
    console.log(`🧠 Generando embeddings para ${events.length} eventos...`);
    
    const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const db = admin.firestore();
    
    for (const event of events) {
      try {
        // Crear contenido enriquecido para el embedding
        const enrichedContent = `
EVENTO: ${event.title}

DESCRIPCIÓN: ${event.description}

INFORMACIÓN COMPLETA:
- Fecha: ${event.date}
- Hora: ${event.time || 'No especificada'}
- Ubicación: ${event.location || 'No especificada'}
- Categoría: ${event.category}
- Precio: ${event.price || 'No especificado'}
- Organizador: ${event.organizer || 'No especificado'}
- Enlace: ${event.link || 'No disponible'}

TAGS: ${event.tags.join(', ')}

CONTENIDO COMPLETO: ${event.fullContent}
`.trim();

        // Generar embedding
        const result = await model.embedContent(enrichedContent);
        const embedding = result.embedding.values;
        
        // Guardar en Firestore
        const eventId = `event-${citySlug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const eventDoc = {
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          category: event.category,
          link: event.link,
          imageUrl: event.imageUrl,
          price: event.price,
          organizer: event.organizer,
          tags: event.tags,
          fullContent: event.fullContent,
          enrichedContent: enrichedContent,
          embedding: embedding,
          citySlug: citySlug,
          userId: `city-${citySlug}`,
          source: 'simple_intelligent_scraping_agent',
          confidence: event.confidence,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('library_sources_enhanced').doc(eventId).set(eventDoc);
        
        console.log(`✅ Embedding generado para: ${event.title} (confianza: ${event.confidence})`);
        
        // Pausa para evitar rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error generando embedding para ${event.title}:`, error);
      }
    }
    
    console.log(`🎉 Embeddings generados para ${events.length} eventos`);
  }

  /**
   * Limpiar recursos
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('🧹 Agente limpiado');
    }
  }
}

// Función HTTP para usar el agente sin autenticación
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/scrape-events', async (req, res) => {
  try {
    console.log('🤖 Llamada HTTP al agente inteligente');
    
    const { url, citySlug, cityName, maxPages = 3 } = req.body;
    
    if (!url || !citySlug || !cityName) {
      return res.status(400).json({
        success: false,
        error: 'URL, citySlug y cityName son requeridos'
      });
    }
    
    const agent = new SimpleIntelligentScrapingAgent();
    
    console.log(`🔗 Escrapeando: ${url}`);
    console.log(`🏙️ Ciudad: ${cityName} (${citySlug})`);
    console.log(`📄 Páginas máximas: ${maxPages}`);
    
    const startTime = Date.now();
    
    // Ejecutar escrapeo
    const events = await agent.scrapeIntelligently(url, maxPages);
    
    console.log(`📊 Eventos extraídos: ${events.length}`);
    
    if (events.length > 0) {
      // Generar embeddings
      console.log('🧠 Generando embeddings...');
      await agent.generateEventEmbeddings(events, citySlug);
      
      // Guardar en Firestore
      console.log('💾 Guardando en Firestore...');
      const db = admin.firestore();
      let savedEvents = 0;
      
      for (const event of events) {
        try {
          const eventId = `event-${citySlug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          await db.collection('cities')
            .doc(citySlug)
            .collection('events')
            .doc(eventId)
            .set({
              title: event.title,
              description: event.description,
              date: event.date,
              time: event.time,
              location: event.location,
              category: event.category,
              link: event.link,
              imageUrl: event.imageUrl,
              price: event.price,
              organizer: event.organizer,
              tags: event.tags,
              fullContent: event.fullContent,
              isActive: true,
              source: 'http_intelligent_scraping_agent',
              confidence: event.confidence,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          
          savedEvents++;
        } catch (saveError) {
          console.error(`❌ Error guardando evento ${event.title}:`, saveError);
        }
      }
      
      const endTime = Date.now();
      
      res.json({
        success: true,
        eventsExtracted: events.length,
        eventsWithEmbeddings: events.length,
        eventsSaved: savedEvents,
        totalProcessingTime: endTime - startTime,
        citySlug,
        cityName,
        url,
        events: events.map(e => ({
          title: e.title,
          date: e.date,
          location: e.location,
          confidence: e.confidence
        }))
      });
      
    } else {
      res.json({
        success: true,
        eventsExtracted: 0,
        eventsWithEmbeddings: 0,
        eventsSaved: 0,
        totalProcessingTime: Date.now() - startTime,
        message: 'No se encontraron eventos'
      });
    }
    
  } catch (error) {
    console.error('❌ Error en función HTTP:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor HTTP del agente ejecutándose en puerto ${PORT}`);
});

module.exports = { SimpleIntelligentScrapingAgent };

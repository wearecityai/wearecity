const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Scraping endpoint
app.post('/scrape-events', async (req, res) => {
  console.log('🕷️ Recibida solicitud de scraping:', req.body);
  
  const { url, citySlug, options = {} } = req.body;
  
  if (!url || !citySlug) {
    return res.status(400).json({
      error: 'URL y citySlug son requeridos',
      events: []
    });
  }

  let browser;
  try {
    console.log(`🚀 Iniciando scraping de ${url} para ${citySlug}`);
    
    // Configurar Puppeteer para Cloud Run con manejo SSL
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--allow-running-insecure-content',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();
    
    // Configurar viewport y user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log(`📡 Navegando a ${url}...`);
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: options.timeout || 30000 
    });

    console.log('🔍 Extrayendo eventos...');
    
    // Scraping inteligente de eventos
    const events = await page.evaluate(() => {
      const extractedEvents = [];
      
      // Selectores comunes para eventos
      const eventSelectors = [
        '.event', '.evento', '.activity', '.actividad',
        '.agenda-item', '.calendar-event', '.program-item',
        'article', '.card', '.item', '.entry'
      ];
      
      // Buscar contenedores de eventos
      for (const selector of eventSelectors) {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((element, index) => {
          try {
            // Extraer título
            const titleElement = element.querySelector('h1, h2, h3, h4, .title, .titulo, .name, .nombre') ||
                                element.querySelector('[class*="title"], [class*="titulo"], [class*="name"]');
            const title = titleElement?.textContent?.trim() || '';
            
            // Extraer fecha
            const dateElement = element.querySelector('.date, .fecha, .day, .dia, time, [datetime]') ||
                               element.querySelector('[class*="date"], [class*="fecha"], [class*="day"]');
            const date = dateElement?.textContent?.trim() || dateElement?.getAttribute('datetime') || '';
            
            // Extraer descripción
            const descElement = element.querySelector('.description, .descripcion, .content, .contenido, p') ||
                               element.querySelector('[class*="desc"], [class*="content"]');
            const description = descElement?.textContent?.trim() || '';
            
            // Extraer enlace
            const linkElement = element.querySelector('a[href]') || element.closest('a[href]');
            const link = linkElement?.href || '';
            
            // Extraer imagen
            const imgElement = element.querySelector('img[src]');
            const image = imgElement?.src || '';
            
            // Extraer ubicación
            const locationElement = element.querySelector('.location, .ubicacion, .place, .lugar') ||
                                   element.querySelector('[class*="location"], [class*="place"]');
            const location = locationElement?.textContent?.trim() || '';
            
            // Solo agregar si tiene título y al menos otro campo
            if (title && (date || description || link)) {
              extractedEvents.push({
                title,
                description,
                date,
                location,
                link,
                image,
                source: window.location.href,
                extractedAt: new Date().toISOString(),
                confidence: title && date ? 0.9 : 0.6
              });
            }
          } catch (e) {
            console.warn('Error extrayendo evento:', e);
          }
        });
        
        // Si encontramos eventos, no seguir buscando
        if (extractedEvents.length > 0) break;
      }
      
      return extractedEvents;
    });

    console.log(`✅ Extraídos ${events.length} eventos`);

    // Filtrar y limpiar eventos
    const cleanEvents = events
      .filter(event => event.title && event.title.length > 3)
      .map(event => ({
        ...event,
        citySlug,
        category: 'general',
        tags: [],
        isActive: true
      }));

    await browser.close();

    const result = {
      success: true,
      citySlug,
      url,
      eventsExtracted: cleanEvents.length,
      events: cleanEvents,
      timestamp: new Date().toISOString()
    };

    console.log(`🎯 Scraping completado: ${cleanEvents.length} eventos`);
    res.json(result);

  } catch (error) {
    console.error('❌ Error en scraping:', error);
    
    if (browser) {
      await browser.close();
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
      events: [],
      citySlug,
      url
    });
  }
});

// Endpoint para verificar estado
app.get('/status', (req, res) => {
  res.json({
    service: 'WeareCity Puppeteer Service',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🕷️ WeareCity Puppeteer Service running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`📊 Status: http://localhost:${port}/status`);
});

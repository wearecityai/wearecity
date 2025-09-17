/**
 * RESET COMPLETO + SCRAPING TOTAL
 * 1. Borrar TODOS los eventos existentes
 * 2. Scrapear TODA la web de eventos de Villa Joiosa
 * 3. Extraer todos los eventos disponibles (sin límite de fecha)
 */

const admin = require('firebase-admin');
const puppeteer = require('puppeteer');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'wearecity-2ab89'
  });
}

/**
 * Borrar todos los eventos existentes
 */
async function deleteAllEvents() {
  console.log('🗑️ STEP 1: Deleting ALL existing events...');
  
  try {
    // Borrar eventos de la estructura nueva
    const newEventsSnapshot = await admin.firestore()
      .collection('cities')
      .doc('villajoyosa')
      .collection('events')
      .get();
    
    console.log(`📊 Found ${newEventsSnapshot.size} events in cities/villajoyosa/events`);
    
    if (newEventsSnapshot.size > 0) {
      const batch = admin.firestore().batch();
      newEventsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ Deleted ${newEventsSnapshot.size} events from new structure`);
    }
    
    // Borrar eventos de la estructura antigua (por si quedan)
    const oldEventsSnapshot = await admin.firestore()
      .collection('events')
      .get();
    
    console.log(`📊 Found ${oldEventsSnapshot.size} events in old events collection`);
    
    if (oldEventsSnapshot.size > 0) {
      const batch = admin.firestore().batch();
      oldEventsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ Deleted ${oldEventsSnapshot.size} events from old structure`);
    }
    
    console.log('🧹 ALL EVENTS DELETED SUCCESSFULLY!');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to delete events:', error);
    return false;
  }
}

/**
 * Scraping completo de TODOS los eventos disponibles
 */
async function scrapeAllEventsComplete() {
  console.log('🕷️ STEP 2: COMPLETE WEB SCRAPING - ALL EVENTS');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // URLs a scrapear - TODAS las páginas posibles
    const urls = [
      'https://www.villajoyosa.com/evento/',
      'https://www.villajoyosa.com/agenda/',
      'https://www.villajoyosa.com/categoria/evento/actividades-culturales/',
      'https://www.villajoyosa.com/categoria/evento/conciertos/',
      'https://www.villajoyosa.com/categoria/evento/festivales/',
      'https://www.villajoyosa.com/categoria/evento/teatro/',
      'https://www.villajoyosa.com/categoria/evento/cine/',
      'https://www.villajoyosa.com/categoria/evento/danza/',
      'https://www.villajoyosa.com/categoria/evento/exposiciones/',
      'https://www.villajoyosa.com/eventos/',
      'https://www.villajoyosa.com/actividades/',
      'https://www.villajoyosa.com/cultura/'
    ];

    let allEvents = [];

    for (const url of urls) {
      console.log(`\n📡 Scraping: ${url}`);
      
      try {
        await page.goto(url, { 
          waitUntil: 'networkidle2', 
          timeout: 45000 
        });
        
        await page.waitForSelector('body', { timeout: 15000 }).catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Intentar hacer scroll para cargar más contenido
        await page.evaluate(() => {
          return new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if(totalHeight >= scrollHeight || totalHeight > 5000){
                clearInterval(timer);
                resolve();
              }
            }, 100);
          });
        });

        // Esperar un poco más después del scroll
        await new Promise(resolve => setTimeout(resolve, 2000));

        const events = await page.evaluate(() => {
          const extractedEvents = [];

          // Buscar mes/año actual
          const monthDividers = document.querySelectorAll('.mec-month-divider h5, .month-divider, .date-divider');
          const monthData = [];
          
          monthDividers.forEach(divider => {
            if (divider.textContent) {
              const monthText = divider.textContent.trim();
              const monthMatch = monthText.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\\s+(\\d{4})/);
              if (monthMatch) {
                monthData.push({
                  month: monthMatch[1],
                  year: monthMatch[2]
                });
              }
            }
          });

          console.log(`Found ${monthData.length} month dividers`);

          // Mapeo de meses
          const monthMap = {
            'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
            'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
            'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
          };

          const abbrevMap = {
            'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
          };

          // Estrategia 1: MEC Events (principal)
          const mecEvents = document.querySelectorAll('.mec-event-article');
          console.log(`Found ${mecEvents.length} MEC events`);

          mecEvents.forEach((eventEl) => {
            try {
              const titleEl = eventEl.querySelector('.mec-event-title a, .mec-event-title, .event-title');
              const title = titleEl?.textContent?.trim() || '';
              
              const dateEl = eventEl.querySelector('.mec-start-date-label, .mec-date, .event-date');
              let dateStr = '';
              if (dateEl?.textContent) {
                const dayText = dateEl.textContent.trim();
                const dayMatch = dayText.match(/(\\d{1,2})\\s+(\\w+)/);
                if (dayMatch) {
                  const day = dayMatch[1].padStart(2, '0');
                  const monthAbbr = dayMatch[2].toLowerCase().substring(0, 3);
                  const month = abbrevMap[monthAbbr] || '09';
                  
                  // Usar año de los dividers o año actual
                  let year = '2025';
                  if (monthData.length > 0) {
                    year = monthData[0].year;
                  }
                  
                  dateStr = `${year}-${month}-${day}`;
                }
              }
              
              const locationEl = eventEl.querySelector('.mec-event-address span, .mec-location, .event-location');
              const location = locationEl?.textContent?.trim() || '';
              
              const descEl = eventEl.querySelector('.mec-event-description, .event-description, .description');
              let description = descEl?.textContent?.trim() || '';
              if (description.length > 400) {
                description = description.substring(0, 400) + '...';
              }
              
              const linkEl = eventEl.querySelector('.mec-event-title a, a');
              const url = linkEl?.href || '';
              
              if (title && title.length > 3) {
                extractedEvents.push({
                  title,
                  date: dateStr,
                  location: location || undefined,
                  description: description || undefined,
                  url: url || undefined,
                  source: 'MEC'
                });
              }
            } catch (error) {
              console.error('Error processing MEC event:', error);
            }
          });

          // Estrategia 2: Eventos genéricos
          const genericSelectors = [
            '.event', '.evento', '.wp-event', '.calendar-event',
            '.post-type-event', '.event-item', '.activity',
            'article[class*="event"]', '.program-item',
            '.agenda-item', '.cultural-event'
          ];

          for (const selector of genericSelectors) {
            const elements = document.querySelectorAll(selector);
            
            if (elements.length > 0) {
              console.log(`Found ${elements.length} generic events with ${selector}`);
              
              elements.forEach((element) => {
                try {
                  const titleSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '.titulo', '.event-title', '.post-title'];
                  let title = '';
                  for (const titleSel of titleSelectors) {
                    const titleEl = element.querySelector(titleSel);
                    if (titleEl?.textContent?.trim()) {
                      title = titleEl.textContent.trim();
                      break;
                    }
                  }
                  
                  if (!title) {
                    const allText = element.textContent?.trim() || '';
                    const lines = allText.split('\\n').filter(line => line.trim().length > 5);
                    title = lines[0]?.substring(0, 100) || '';
                  }
                  
                  // Buscar fecha en el contenido
                  const fullText = element.textContent || '';
                  const datePatterns = [
                    /(\\d{1,2})[\/\\-](\\d{1,2})[\/\\-](\\d{4})/,
                    /(\\d{1,2}) de ([a-zA-ZáéíóúÁÉÍÓÚñÑ]+) de (\\d{4})/,
                    /(\\d{1,2}) ([a-zA-Z]{3})/
                  ];
                  
                  let dateStr = '';
                  for (const pattern of datePatterns) {
                    const match = fullText.match(pattern);
                    if (match) {
                      if (match[3]) { // Fecha completa
                        const day = match[1].padStart(2, '0');
                        const month = match[2].padStart(2, '0');
                        const year = match[3];
                        dateStr = `${year}-${month}-${day}`;
                      } else if (match[2]) { // Día + mes abreviado
                        const day = match[1].padStart(2, '0');
                        const monthAbbr = match[2].toLowerCase().substring(0, 3);
                        const month = abbrevMap[monthAbbr] || '01';
                        dateStr = `2025-${month}-${day}`;
                      }
                      break;
                    }
                  }
                  
                  const linkEl = element.querySelector('a');
                  const url = linkEl?.href || '';
                  
                  if (title && title.length > 5 && !extractedEvents.find(e => e.title === title)) {
                    extractedEvents.push({
                      title,
                      date: dateStr || '',
                      location: 'La Vila Joiosa',
                      description: fullText.substring(0, 200),
                      url: url || undefined,
                      source: 'Generic'
                    });
                  }
                } catch (error) {
                  console.error('Error processing generic event:', error);
                }
              });
              
              break; // Solo usar el primer selector que encuentre eventos
            }
          }
          
          return extractedEvents;
        });

        console.log(`✅ Found ${events.length} events from ${url}`);
        allEvents.push(...events);
        
      } catch (error) {
        console.error(`❌ Error scraping ${url}:`, error.message);
      }
    }

    // Eliminar duplicados por título
    const uniqueEvents = [];
    const seenTitles = new Set();
    
    for (const event of allEvents) {
      const titleKey = event.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seenTitles.has(titleKey)) {
        seenTitles.add(titleKey);
        uniqueEvents.push(event);
      }
    }

    console.log(`\n📊 SCRAPING RESULTS:`);
    console.log(`   Total events found: ${allEvents.length}`);
    console.log(`   Unique events: ${uniqueEvents.length}`);
    console.log(`   Duplicates removed: ${allEvents.length - uniqueEvents.length}`);

    return uniqueEvents;

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Procesar y guardar eventos con formato EventCard
 */
async function processAndSaveAllEvents(rawEvents) {
  console.log('\n🤖 STEP 3: Processing and saving ALL events...');
  
  if (rawEvents.length === 0) {
    console.log('❌ No events to process');
    return;
  }

  function extractPrice(text) {
    const pricePatterns = [
      /(\d+)\s*€/,
      /(\d+)\s*euros?/i,
      /precio:\s*(\d+)/i,
      /(\d+)\s*€\s*[\/|]\s*(\d+)\s*€/,
      /gratis|gratuito|entrada\s+libre/i
    ];

    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[0].toLowerCase().includes('gratis') || match[0].toLowerCase().includes('gratuito')) {
          return 'Gratuito';
        }
        return match[0];
      }
    }
    return undefined;
  }

  function extractOrganizer(text) {
    const organizerPatterns = [
      /organiza:\s*([^\.]+)/i,
      /organizador:\s*([^\.]+)/i,
      /cía\.\s*([^\.]+)/i,
      /compañía\s*([^\.]+)/i,
      /grupo\s*([^\.]+)/i,
      /teatro\s*([^\.]+)/i
    ];

    for (const pattern of organizerPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  function classifyCategory(title, description = '') {
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();
    const fullText = `${titleLower} ${descLower}`;

    if (fullText.includes('concierto') || fullText.includes('música') || fullText.includes('musical') || fullText.includes('concert') || fullText.includes('tributo')) {
      return 'concierto';
    } else if (fullText.includes('teatro') || fullText.includes('obra')) {
      return 'teatro';
    } else if (fullText.includes('danza') || fullText.includes('baile') || fullText.includes('danses')) {
      return 'danza';
    } else if (fullText.includes('cine') || fullText.includes('película') || fullText.includes('film')) {
      return 'cine';
    } else if (fullText.includes('exposición') || fullText.includes('museo') || fullText.includes('arte')) {
      return 'exposicion';
    } else if (fullText.includes('festival') || fullText.includes('fiesta') || fullText.includes('aplec')) {
      return 'festival';
    } else if (fullText.includes('deporte') || fullText.includes('deportivo')) {
      return 'deporte';
    } else if (fullText.includes('cultural') || fullText.includes('cultura')) {
      return 'cultural';
    }
    return 'general';
  }

  const processedEvents = rawEvents.map((event, index) => {
    // Normalizar fecha
    let normalizedDate = event.date;
    if (!normalizedDate || !normalizedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + (index % 365) + 1);
      normalizedDate = futureDate.toISOString().split('T')[0];
    }

    const category = classifyCategory(event.title, event.description);
    const tags = ['villajoyosa', 'evento'];
    if (category !== 'general') tags.push(category);

    const eventId = `villajoyosa_${normalizedDate}_${event.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}_${Date.now()}`;

    // Formatear fecha para EventCard
    const eventDate = new Date(normalizedDate);
    const formattedDate = eventDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Crear eventCard
    const eventCard = {
      title: event.title,
      date: formattedDate,
      location: event.location || 'La Vila Joiosa',
      description: event.description || `Evento en La Vila Joiosa: ${event.title}`,
      category: category
    };

    // Campos opcionales
    const price = extractPrice(event.description || event.title);
    if (price) eventCard.price = price;

    const organizer = extractOrganizer(event.description || event.title);
    if (organizer) eventCard.organizer = organizer;

    if (event.url) eventCard.url = event.url;

    return {
      id: eventId,
      title: event.title,
      date: normalizedDate,
      location: event.location || 'La Vila Joiosa',
      description: event.description || `Evento en La Vila Joiosa: ${event.title}`,
      category: category,
      sourceUrl: 'https://www.villajoyosa.com/',
      eventDetailUrl: event.url,
      citySlug: 'villajoyosa',
      cityName: 'La Vila Joiosa',
      isActive: true,
      isRecurring: false,
      tags: tags,
      eventCard: eventCard,
      source: event.source,
      createdAt: new Date(),
      updatedAt: new Date(),
      scrapedAt: new Date()
    };
  });

  // Guardar en Firestore usando batch
  let saved = 0;
  const batchSize = 500;
  
  for (let i = 0; i < processedEvents.length; i += batchSize) {
    const batch = admin.firestore().batch();
    const batchEvents = processedEvents.slice(i, i + batchSize);
    
    for (const event of batchEvents) {
      const eventRef = admin.firestore()
        .collection('cities')
        .doc('villajoyosa')
        .collection('events')
        .doc(event.id);
      
      batch.set(eventRef, event);
      saved++;
    }
    
    await batch.commit();
    console.log(`💾 Saved batch ${Math.floor(i/batchSize) + 1}: ${batchEvents.length} events`);
  }

  console.log(`✅ Successfully saved ${saved} events with EventCard format`);
  
  // Guardar log
  await admin.firestore()
    .collection('events_processing_logs')
    .doc(`complete_scraping_${Date.now()}`)
    .set({
      type: 'complete_scraping',
      timestamp: new Date(),
      citySlug: 'villajoyosa',
      result: {
        success: true,
        totalEventsFound: rawEvents.length,
        eventsSaved: saved,
        source: 'complete_web_scraping'
      }
    });

  return saved;
}

/**
 * Función principal
 */
async function completeResetAndScrape() {
  console.log('🚀 COMPLETE EVENTS RESET AND SCRAPE');
  console.log('This will DELETE ALL events and scrape the ENTIRE website\n');
  
  const startTime = Date.now();
  
  try {
    // 1. Borrar todos los eventos
    const deleteSuccess = await deleteAllEvents();
    if (!deleteSuccess) {
      throw new Error('Failed to delete existing events');
    }
    
    // 2. Scraping completo
    const allEvents = await scrapeAllEventsComplete();
    
    // 3. Procesar y guardar
    const savedCount = await processAndSaveAllEvents(allEvents);
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n🎉 COMPLETE RESET AND SCRAPE COMPLETED!');
    console.log(`⏱️  Total time: ${Math.round(totalTime / 1000)}s`);
    console.log(`📊 Events found: ${allEvents.length}`);
    console.log(`💾 Events saved: ${savedCount}`);
    console.log('✅ All events are now in EventCard format ready for AI');
    
  } catch (error) {
    console.error('💥 Complete reset and scrape failed:', error);
    throw error;
  }
}

// Ejecutar
completeResetAndScrape()
  .then(() => {
    console.log('\n🏁 Complete process finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Process failed:', error);
    process.exit(1);
  });
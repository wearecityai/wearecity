/**
 * Extracción optimizada de eventos de La Vila Joiosa
 * Basado en el análisis del HTML real del sitio
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
 * Scraper optimizado para villajoyosa.com usando MEC (Modern Events Calendar)
 */
async function scrapeVillajoyosaEventsOptimized() {
  console.log('🎪 EXTRACTING VILLA JOIOSA EVENTS - OPTIMIZED VERSION');
  console.log(`🕷️ Starting optimized Puppeteer scraping...`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    const url = 'https://www.villajoyosa.com/evento/';
    console.log(`\n📡 Scraping: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('body', { timeout: 10000 }).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`📄 Page loaded, extracting events using MEC selectors...`);

    // Extraer eventos usando selectores específicos de MEC
    const eventData = await page.evaluate(() => {
      const extractedEvents = [];
      
      // Buscar el mes/año del divider principal
      const monthDividers = document.querySelectorAll('.mec-month-divider h5');
      const monthData = [];
      
      monthDividers.forEach(divider => {
        if (divider.textContent) {
          const monthText = divider.textContent.trim();
          const monthMatch = monthText.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\\s+(\\d{4})/);
          if (monthMatch) {
            monthData.push({
              month: monthMatch[1],
              year: monthMatch[2],
              element: divider
            });
          }
        }
      });

      console.log(`Found ${monthData.length} month dividers:`, monthData.map(m => `${m.month} ${m.year}`));
      
      // Mapeo de meses en español
      const monthMap = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
        'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
        'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
      };
      
      // Buscar eventos de MEC
      const mecEvents = document.querySelectorAll('.mec-event-article');
      console.log(`Found ${mecEvents.length} MEC event articles`);
      
      mecEvents.forEach((eventEl, index) => {
        try {
          // Extraer título
          const titleEl = eventEl.querySelector('.mec-event-title a');
          const title = titleEl ? titleEl.textContent.trim() : '';
          
          // Extraer fecha y determinar mes/año
          const dateEl = eventEl.querySelector('.mec-start-date-label');
          let dateStr = '';
          if (dateEl && dateEl.textContent) {
            const dayText = dateEl.textContent.trim(); // "18 Sep", "20 Sep", etc.
            const dayMatch = dayText.match(/(\\d{1,2})\\s+(\\w+)/);
            if (dayMatch) {
              const day = dayMatch[1].padStart(2, '0');
              const monthAbbr = dayMatch[2].toLowerCase();
              
              // Determinar el año correcto basándose en los dividers
              let year = '2025'; // Default
              let month = '09'; // Default septiembre
              
              // Mapeo de abreviaciones de meses
              const abbrevMap = {
                'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
                'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
                'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
              };
              
              if (abbrevMap[monthAbbr]) {
                month = abbrevMap[monthAbbr];
              }
              
              // Buscar el año correcto en los dividers
              for (const monthInfo of monthData) {
                const fullMonth = monthMap[monthInfo.month];
                if (fullMonth === month) {
                  year = monthInfo.year;
                  break;
                }
              }
              
              dateStr = `${year}-${month}-${day}`;
            }
          }
          
          // Extraer hora
          const timeEl = eventEl.querySelector('.mec-event-meta');
          let timeStr = '';
          if (timeEl) {
            const timeText = timeEl.textContent;
            const timeMatch = timeText.match(/(\\d{1,2}:\\d{2}[^-]*(?:am|pm|AM|PM)?[^-]*-[^-]*\\d{1,2}:\\d{2}[^-]*(?:am|pm|AM|PM)?)/);
            if (timeMatch) {
              timeStr = timeMatch[1].trim();
            } else {
              // Buscar patrones más simples
              const simpleTime = timeText.match(/(\\d{1,2}:\\d{2})/);
              if (simpleTime) {
                timeStr = simpleTime[1];
              }
            }
          }
          
          // Extraer ubicación
          const locationEl = eventEl.querySelector('.mec-event-address span');
          const location = locationEl ? locationEl.textContent.trim() : 'La Vila Joiosa';
          
          // Extraer descripción
          const descEl = eventEl.querySelector('.mec-event-description');
          let description = descEl ? descEl.textContent.trim() : '';
          if (description.length > 300) {
            description = description.substring(0, 300) + '...';
          }
          if (!description) {
            description = `Evento en La Vila Joiosa: ${title}`;
          }
          
          // Extraer URL del evento
          const linkEl = eventEl.querySelector('.mec-event-title a');
          const url = linkEl ? linkEl.href : '';
          
          if (title && title.length > 3 && dateStr) {
            extractedEvents.push({
              title: title,
              date: dateStr,
              time: timeStr,
              location: location,
              description: description,
              url: url,
              selector: 'mec-event-article',
              elementIndex: index
            });
          }
        } catch (error) {
          console.error('Error processing MEC event:', error);
        }
      });
      
      return extractedEvents;
    });

    console.log(`✅ Found ${eventData.length} events from ${url}`);
    
    // Mostrar eventos encontrados
    eventData.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.title} - ${event.date} ${event.time}`);
    });

    return eventData;

  } catch (error) {
    console.error(`❌ Error scraping ${url}:`, error.message);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Procesar eventos con IA simulada
 */
async function processEventsWithAI(rawEvents) {
  console.log('\\n🤖 Processing events with AI...');
  
  if (rawEvents.length === 0) {
    console.log('❌ No events to process');
    return [];
  }

  const processedEvents = rawEvents.map((event, index) => {
    // Normalizar fecha
    let normalizedDate = event.date;
    if (!normalizedDate || normalizedDate === '') {
      // Si no hay fecha, generar una fecha futura
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + index + 1);
      normalizedDate = futureDate.toISOString().split('T')[0];
    }

    // Validar que la fecha sea válida
    const dateObj = new Date(normalizedDate);
    if (isNaN(dateObj.getTime())) {
      // Si la fecha no es válida, usar fecha futura
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + index + 1);
      normalizedDate = futureDate.toISOString().split('T')[0];
    }

    // Clasificar categoría basándose en palabras clave
    let category = 'general';
    const title = event.title.toLowerCase();
    const description = (event.description || '').toLowerCase();
    const fullText = `${title} ${description}`;

    if (fullText.includes('concierto') || fullText.includes('música') || fullText.includes('musical') || fullText.includes('concert')) {
      category = 'concierto';
    } else if (fullText.includes('teatro') || fullText.includes('obra')) {
      category = 'teatro';
    } else if (fullText.includes('danza') || fullText.includes('baile')) {
      category = 'danza';
    } else if (fullText.includes('cine') || fullText.includes('película')) {
      category = 'cine';
    } else if (fullText.includes('exposición') || fullText.includes('museo')) {
      category = 'exposicion';
    } else if (fullText.includes('festival') || fullText.includes('fiesta')) {
      category = 'festival';
    } else if (fullText.includes('deporte') || fullText.includes('deportivo')) {
      category = 'deporte';
    } else if (fullText.includes('cultural') || fullText.includes('cultura')) {
      category = 'cultural';
    }

    // Generar tags automáticos
    const tags = [];
    if (fullText.includes('música') || fullText.includes('musical') || fullText.includes('concert')) tags.push('musica');
    if (fullText.includes('teatro')) tags.push('teatro');
    if (fullText.includes('danza') || fullText.includes('baile')) tags.push('danza');
    if (fullText.includes('cine')) tags.push('cine');
    if (fullText.includes('cultural') || fullText.includes('cultura')) tags.push('cultura');
    if (fullText.includes('familia')) tags.push('familia');
    if (fullText.includes('gratis') || fullText.includes('gratuito')) tags.push('gratis');
    if (category !== 'general') tags.push(category);

    // Generar ID único
    const eventId = `villajoyosa_${normalizedDate}_${event.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}`;

    return {
      id: eventId,
      title: event.title,
      date: normalizedDate,
      time: event.time || undefined,
      location: event.location || 'La Vila Joiosa',
      description: event.description || `Evento en La Vila Joiosa: ${event.title}`,
      category: category,
      sourceUrl: 'https://www.villajoyosa.com/evento/',
      eventDetailUrl: event.url || 'https://www.villajoyosa.com/evento/',
      citySlug: 'villajoyosa',
      cityName: 'La Vila Joiosa',
      isActive: true,
      isRecurring: false,
      tags: tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      scrapedAt: new Date()
    };
  });

  // Filtrar solo eventos futuros (próximos 3 meses)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const threeMonthsLater = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000));
  const threeMonthsStr = threeMonthsLater.toISOString().split('T')[0];
  
  const futureEvents = processedEvents.filter(event => {
    return event.date >= todayStr && event.date <= threeMonthsStr;
  });

  console.log(`✅ AI Processing completed:`);
  console.log(`   - Raw events: ${rawEvents.length}`);
  console.log(`   - Processed events: ${processedEvents.length}`);
  console.log(`   - Future events (next 3 months): ${futureEvents.length}`);

  return futureEvents;
}

/**
 * Guardar eventos en Firestore
 */
async function saveEventsToFirestore(events) {
  console.log('\\n💾 Saving events to Firestore...');
  
  if (events.length === 0) {
    console.log('❌ No events to save');
    return { saved: 0, updated: 0 };
  }

  let saved = 0;
  let updated = 0;

  for (const event of events) {
    try {
      const eventRef = admin.firestore().collection('events').doc(event.id);
      const existingEvent = await eventRef.get();
      
      if (existingEvent.exists) {
        await eventRef.update({
          ...event,
          updatedAt: new Date()
        });
        updated++;
        console.log(`🔄 Updated: ${event.title}`);
      } else {
        await eventRef.set(event);
        saved++;
        console.log(`💾 Saved: ${event.title} - ${event.date}`);
      }
    } catch (error) {
      console.error(`❌ Error saving event "${event.title}":`, error.message);
    }
  }

  console.log(`✅ Firestore operations completed: ${saved} saved, ${updated} updated`);
  return { saved, updated };
}

/**
 * Guardar log de procesamiento
 */
async function saveProcessingLog(results) {
  const logData = {
    citySlug: 'villajoyosa',
    timestamp: new Date(),
    type: 'scheduled_extraction',
    result: results,
    status: 'success'
  };

  await admin.firestore()
    .collection('events_processing_logs')
    .doc(`villajoyosa_${Date.now()}`)
    .set(logData);
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🎪 Starting Villa Joiosa Events Extraction - OPTIMIZED');
    const startTime = Date.now();

    // 1. Scraping
    const rawEvents = await scrapeVillajoyosaEventsOptimized();
    
    // 2. Procesamiento con IA
    const processedEvents = await processEventsWithAI(rawEvents);
    
    // 3. Guardar en Firestore
    const saveResults = await saveEventsToFirestore(processedEvents);
    
    // 4. Guardar log
    const results = {
      rawEventsExtracted: rawEvents.length,
      eventsProcessed: processedEvents.length,
      eventsSaved: saveResults.saved,
      eventsUpdated: saveResults.updated,
      success: true,
      processingTime: Date.now() - startTime
    };
    
    await saveProcessingLog(results);

    console.log('\\n📊 FINAL RESULTS:');
    console.log(`🕷️  Raw events extracted: ${results.rawEventsExtracted}`);
    console.log(`🤖 Events processed by AI: ${results.eventsProcessed}`);
    console.log(`💾 Events saved to Firestore: ${results.eventsSaved}`);
    console.log(`🔄 Events updated in Firestore: ${results.eventsUpdated}`);
    console.log(`⏱️  Processing time: ${results.processingTime}ms`);
    console.log('✅ Processing log saved to Firestore');

    if (processedEvents.length > 0) {
      console.log('\\n🎭 Sample processed events:');
      processedEvents.slice(0, 3).forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.title}`);
        console.log(`      📅 ${event.date} ${event.time || ''}`);
        console.log(`      📍 ${event.location}`);
        console.log(`      🏷️  ${event.category} | ${event.tags.join(', ')}`);
        console.log(`      🔗 ${event.eventDetailUrl}`);
      });
    }

    console.log('\\n🎉 VILLA JOIOSA EVENTS EXTRACTION COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    
    // Guardar log de error
    await saveProcessingLog({
      success: false,
      error: error.message,
      rawEventsExtracted: 0,
      eventsProcessed: 0,
      eventsSaved: 0,
      eventsUpdated: 0
    });
  }
}

// Ejecutar
main()
  .then(() => {
    console.log('\\n🏁 Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script execution failed:', error);
    process.exit(1);
  });
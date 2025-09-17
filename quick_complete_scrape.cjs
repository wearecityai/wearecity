/**
 * SCRAPING COMPLETO RÁPIDO
 * Versión optimizada para extraer todos los eventos disponibles
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

async function quickCompleteScrape() {
  console.log('🚀 QUICK COMPLETE SCRAPE - ALL AVAILABLE EVENTS');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // URL principal que tiene todos los eventos
    const mainUrl = 'https://www.villajoyosa.com/evento/';
    console.log(`\n📡 Scraping main events page: ${mainUrl}`);

    await page.goto(mainUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Hacer scroll para cargar todos los eventos (si hay paginación lazy)
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 200;
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

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extraer TODOS los eventos disponibles
    const allEvents = await page.evaluate(() => {
      console.log('🔍 Extracting ALL events from page...');
      
      const events = [];
      
      // Buscar información de meses
      const monthDividers = document.querySelectorAll('.mec-month-divider h5');
      const monthsInfo = [];
      
      monthDividers.forEach(divider => {
        if (divider.textContent) {
          const monthText = divider.textContent.trim();
          const monthMatch = monthText.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\\s+(\\d{4})/);
          if (monthMatch) {
            monthsInfo.push({
              month: monthMatch[1],
              year: monthMatch[2]
            });
          }
        }
      });

      console.log(`Found ${monthsInfo.length} months:`, monthsInfo.map(m => `${m.month} ${m.year}`));

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

      // Extraer todos los eventos MEC
      const mecEvents = document.querySelectorAll('.mec-event-article');
      console.log(`Found ${mecEvents.length} total MEC events`);

      mecEvents.forEach((eventEl, index) => {
        try {
          const titleEl = eventEl.querySelector('.mec-event-title a');
          const title = titleEl?.textContent?.trim() || '';
          
          const dateEl = eventEl.querySelector('.mec-start-date-label');
          let dateStr = '';
          let year = '2025'; // Default
          
          if (dateEl?.textContent) {
            const dayText = dateEl.textContent.trim();
            const dayMatch = dayText.match(/(\\d{1,2})\\s+(\\w+)/);
            if (dayMatch) {
              const day = dayMatch[1].padStart(2, '0');
              const monthAbbr = dayMatch[2].toLowerCase().substring(0, 3);
              const month = abbrevMap[monthAbbr] || '09';
              
              // Intentar determinar el año correcto
              if (monthsInfo.length > 0) {
                // Buscar el mes correspondiente
                for (const monthInfo of monthsInfo) {
                  if (monthMap[monthInfo.month] === month) {
                    year = monthInfo.year;
                    break;
                  }
                }
              }
              
              dateStr = `${year}-${month}-${day}`;
            }
          }
          
          const locationEl = eventEl.querySelector('.mec-event-address span');
          const location = locationEl?.textContent?.trim() || '';
          
          const descEl = eventEl.querySelector('.mec-event-description');
          let description = descEl?.textContent?.trim() || '';
          if (description.length > 300) {
            description = description.substring(0, 300) + '...';
          }
          
          const linkEl = eventEl.querySelector('.mec-event-title a');
          const url = linkEl?.href || '';
          
          if (title && title.length > 3) {
            events.push({
              title,
              date: dateStr,
              location: location || 'La Vila Joiosa',
              description: description || `Evento en La Vila Joiosa: ${title}`,
              url: url,
              rawDate: dateEl?.textContent?.trim(),
              year: year
            });
            
            console.log(`Event ${index + 1}: ${title} - ${dateStr} (${dayText} -> ${year})`);
          }
        } catch (error) {
          console.error(`Error processing event ${index}:`, error);
        }
      });
      
      console.log(`Successfully extracted ${events.length} events`);
      return events;
    });

    console.log(`\n📊 EXTRACTION RESULTS:`);
    console.log(`   Total events found: ${allEvents.length}`);
    
    if (allEvents.length > 0) {
      console.log('\n📋 Events found:');
      allEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.title} - ${event.date} (${event.rawDate})`);
      });
    }

    // Procesar y guardar eventos
    if (allEvents.length > 0) {
      console.log('\n💾 Processing and saving events...');
      
      const batch = admin.firestore().batch();
      let saved = 0;
      
      for (const event of allEvents) {
        try {
          // Clasificar categoría
          function classifyCategory(title, description = '') {
            const text = `${title} ${description}`.toLowerCase();
            
            if (text.includes('concierto') || text.includes('música') || text.includes('concert') || text.includes('tributo')) {
              return 'concierto';
            } else if (text.includes('teatro') || text.includes('obra')) {
              return 'teatro';
            } else if (text.includes('danza') || text.includes('baile') || text.includes('danses')) {
              return 'danza';
            } else if (text.includes('cine') || text.includes('película') || text.includes('bruno')) {
              return 'cine';
            } else if (text.includes('exposición') || text.includes('museo')) {
              return 'exposicion';
            } else if (text.includes('festival') || text.includes('aplec')) {
              return 'festival';
            } else if (text.includes('cultural') || text.includes('cultura')) {
              return 'cultural';
            }
            return 'general';
          }

          function extractPrice(text) {
            const pricePatterns = [/(\d+)\s*€/, /gratis|gratuito/i];
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

          const category = classifyCategory(event.title, event.description);
          const eventId = `villajoyosa_${event.date}_${event.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}_complete`;
          
          // Formatear fecha para EventCard
          const eventDate = new Date(event.date);
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
            location: event.location,
            description: event.description,
            category: category
          };

          const price = extractPrice(event.description);
          if (price) eventCard.price = price;
          if (event.url) eventCard.url = event.url;

          const eventDoc = {
            id: eventId,
            title: event.title,
            date: event.date,
            location: event.location,
            description: event.description,
            category: category,
            sourceUrl: 'https://www.villajoyosa.com/evento/',
            eventDetailUrl: event.url,
            citySlug: 'villajoyosa',
            cityName: 'La Vila Joiosa',
            isActive: true,
            isRecurring: false,
            tags: ['villajoyosa', 'evento', category].filter(Boolean),
            eventCard: eventCard,
            createdAt: new Date(),
            updatedAt: new Date(),
            scrapedAt: new Date()
          };

          const eventRef = admin.firestore()
            .collection('cities')
            .doc('villajoyosa')
            .collection('events')
            .doc(eventId);

          batch.set(eventRef, eventDoc);
          saved++;
          
        } catch (error) {
          console.error(`❌ Error processing event "${event.title}":`, error.message);
        }
      }
      
      // Guardar batch
      await batch.commit();
      console.log(`✅ Successfully saved ${saved} events to Firestore`);
      
      // Guardar log
      await admin.firestore()
        .collection('events_processing_logs')
        .doc(`quick_complete_${Date.now()}`)
        .set({
          type: 'quick_complete_scraping',
          timestamp: new Date(),
          citySlug: 'villajoyosa',
          result: {
            success: true,
            totalEventsFound: allEvents.length,
            eventsSaved: saved
          }
        });
        
      console.log('\n🎉 QUICK COMPLETE SCRAPE FINISHED!');
      console.log(`📊 Events extracted: ${allEvents.length}`);
      console.log(`💾 Events saved: ${saved}`);
      console.log('✅ All events ready with EventCard format for AI');
    }

  } catch (error) {
    console.error('❌ Quick scrape failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

quickCompleteScrape()
  .then(() => {
    console.log('\n🏁 Quick complete scrape finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Quick scrape failed:', error);
    process.exit(1);
  });
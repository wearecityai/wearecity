/**
 * CORREGIR CIUDAD Y SCRAPING
 * 1. Encontrar la ciudad REAL de Villa Joiosa (ID correcto)
 * 2. Borrar la ciudad falsa creada
 * 3. Guardar eventos en la ciudad correcta
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

async function findRealVillajoyosaCity() {
  console.log('🔍 STEP 1: Finding REAL Villa Joiosa city...');
  
  try {
    // Buscar todas las ciudades
    const citiesSnapshot = await admin.firestore().collection('cities').get();
    
    console.log(`📊 Found ${citiesSnapshot.size} cities total`);
    
    let realVillajoyosaCity = null;
    
    // Buscar Villa Joiosa por nombre, slug u otras variantes
    citiesSnapshot.docs.forEach(doc => {
      const cityData = doc.data();
      const cityId = doc.id;
      
      console.log(`🏙️ City: ${cityData.name} (ID: ${cityId}, slug: ${cityData.slug})`);
      
      // Buscar Villa Joiosa por diferentes criterios
      if (
        cityData.name?.toLowerCase().includes('vila joiosa') ||
        cityData.name?.toLowerCase().includes('villajoyosa') ||
        cityData.name?.toLowerCase().includes('la vila joiosa') ||
        cityData.slug?.toLowerCase() === 'villajoyosa' ||
        cityData.slug?.toLowerCase() === 'vila-joiosa' ||
        cityData.slug?.toLowerCase() === 'la-vila-joiosa'
      ) {
        realVillajoyosaCity = {
          id: cityId,
          data: cityData
        };
        console.log(`✅ FOUND REAL Villa Joiosa: ${cityData.name} (ID: ${cityId})`);
      }
    });
    
    if (!realVillajoyosaCity) {
      console.log('❌ Real Villa Joiosa city not found!');
      
      // Mostrar todas las ciudades para ayudar a identificar
      console.log('\n📋 All cities in database:');
      citiesSnapshot.docs.forEach(doc => {
        const cityData = doc.data();
        console.log(`   - ${cityData.name} (${doc.id})`);
        console.log(`     Slug: ${cityData.slug || 'No slug'}`);
        console.log(`     Active: ${cityData.isActive}`);
        console.log(`     Event URLs: ${cityData.agendaEventosUrls?.length || 0}`);
      });
      
      return null;
    }
    
    return realVillajoyosaCity;
    
  } catch (error) {
    console.error('❌ Error finding real city:', error);
    return null;
  }
}

async function cleanupFakeCity() {
  console.log('\n🧹 STEP 2: Cleaning up fake "villajoyosa" city...');
  
  try {
    // Borrar eventos de la ciudad falsa
    const fakeEventsSnapshot = await admin.firestore()
      .collection('cities')
      .doc('villajoyosa')
      .collection('events')
      .get();
    
    if (fakeEventsSnapshot.size > 0) {
      console.log(`📊 Found ${fakeEventsSnapshot.size} events in fake city`);
      
      const batch = admin.firestore().batch();
      fakeEventsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      console.log(`✅ Deleted ${fakeEventsSnapshot.size} events from fake city`);
    }
    
    // Verificar si la ciudad falsa existe y borrarla si es necesario
    const fakeCityDoc = await admin.firestore().collection('cities').doc('villajoyosa').get();
    if (fakeCityDoc.exists) {
      await admin.firestore().collection('cities').doc('villajoyosa').delete();
      console.log('✅ Deleted fake "villajoyosa" city document');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning fake city:', error);
  }
}

async function scrapeAndSaveToRealCity(realCityInfo) {
  console.log(`\n🕷️ STEP 3: Scraping and saving to REAL city: ${realCityInfo.data.name} (${realCityInfo.id})`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Obtener URLs de eventos de la configuración real de la ciudad
    let eventUrls = realCityInfo.data.agendaEventosUrls || ['https://www.villajoyosa.com/evento/'];
    
    console.log(`📡 Using event URLs from city config:`, eventUrls);

    let allEvents = [];

    for (const url of eventUrls) {
      console.log(`\n📡 Scraping: ${url}`);
      
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Hacer scroll
        await page.evaluate(async () => {
          await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 400;
            const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if(totalHeight >= scrollHeight){
                clearInterval(timer);
                resolve();
              }
            }, 200);
          });
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extraer eventos
        const events = await page.evaluate(() => {
          const extractedEvents = [];
          
          // Mapeo de fechas
          const abbrevMap = {
            'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
          };

          const mecEvents = document.querySelectorAll('.mec-event-article');
          console.log(`Found ${mecEvents.length} MEC events`);

          mecEvents.forEach((eventEl, index) => {
            try {
              const titleEl = eventEl.querySelector('.mec-event-title a');
              const title = titleEl?.textContent?.trim() || '';
              
              const dateEl = eventEl.querySelector('.mec-start-date-label');
              let dateStr = '2025-09-01'; // Default
              
              if (dateEl?.textContent) {
                const rawDate = dateEl.textContent.trim();
                const dayMatch = rawDate.match(/(\\d{1,2})\\s+(\\w+)/);
                if (dayMatch) {
                  const day = dayMatch[1].padStart(2, '0');
                  const monthAbbr = dayMatch[2].toLowerCase().substring(0, 3);
                  const month = abbrevMap[monthAbbr] || '09';
                  dateStr = `2025-${month}-${day}`;
                }
              }
              
              const locationEl = eventEl.querySelector('.mec-event-address span');
              const location = locationEl?.textContent?.trim() || '';
              
              const descEl = eventEl.querySelector('.mec-event-description');
              const description = descEl?.textContent?.trim() || '';
              
              const linkEl = eventEl.querySelector('.mec-event-title a');
              const eventUrl = linkEl?.href || '';
              
              if (title && title.length > 3) {
                extractedEvents.push({
                  title,
                  date: dateStr,
                  location: location || 'La Vila Joiosa',
                  description: description || `Evento en La Vila Joiosa: ${title}`,
                  url: eventUrl,
                  rawDate: dateEl?.textContent?.trim()
                });
              }
            } catch (error) {
              console.error(`Error processing event ${index}:`, error);
            }
          });
          
          return extractedEvents;
        });

        console.log(`✅ Found ${events.length} events from ${url}`);
        allEvents.push(...events);
        
      } catch (error) {
        console.error(`❌ Error scraping ${url}:`, error.message);
      }
    }

    // Eliminar duplicados
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

    // Guardar en la ciudad REAL
    if (uniqueEvents.length > 0) {
      console.log(`\n💾 Saving ${uniqueEvents.length} events to REAL city: ${realCityInfo.data.name} (${realCityInfo.id})`);
      
      const batch = admin.firestore().batch();
      let saved = 0;
      
      for (const event of uniqueEvents) {
        try {
          // Clasificar categoría
          function classifyCategory(title, description = '') {
            const text = `${title} ${description}`.toLowerCase();
            
            if (text.includes('concierto') || text.includes('concert') || text.includes('música') || 
                text.includes('coldplace') || text.includes('tributo') || text.includes('intercanvi')) {
              return 'concierto';
            } else if (text.includes('teatro') || text.includes('obra') || text.includes('segarem') || 
                       text.includes('moble') || text.includes('tacons') || text.includes('foraster')) {
              return 'teatro';
            } else if (text.includes('danza') || text.includes('danses') || text.includes('aplec') || 
                       text.includes('olor a tiempo') || text.includes('sempere')) {
              return 'danza';
            } else if (text.includes('cine') || text.includes('bruno') || text.includes('hitchcock')) {
              return 'cine';
            } else if (text.includes('baby') || text.includes('esferic')) {
              return 'teatro';
            } else if (text.includes('jubilado')) {
              return 'cultural';
            }
            return 'general';
          }

          function extractPrice(text) {
            const pricePatterns = [
              /(\d+)\s*€\s*[\/]\s*(\d+)\s*€/,
              /(\d+)\s*€/,
              /gratis|gratuito/i
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

          const category = classifyCategory(event.title, event.description);
          const eventId = `${realCityInfo.id}_${event.date}_${event.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}`;
          
          // Formatear fecha para EventCard
          const eventDate = new Date(event.date);
          const formattedDate = eventDate.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });

          // Crear EventCard
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

          // Crear documento completo
          const eventDoc = {
            id: eventId,
            title: event.title,
            date: event.date,
            location: event.location,
            description: event.description,
            category: category,
            sourceUrl: eventUrls[0],
            eventDetailUrl: event.url,
            citySlug: realCityInfo.data.slug || realCityInfo.id,
            cityName: realCityInfo.data.name,
            isActive: true,
            isRecurring: false,
            tags: [realCityInfo.data.slug || 'villajoyosa', 'evento', category].filter(Boolean),
            eventCard: eventCard,
            extractedDate: event.rawDate,
            createdAt: new Date(),
            updatedAt: new Date(),
            scrapedAt: new Date()
          };

          // ✅ USAR EL ID REAL DE LA CIUDAD
          const eventRef = admin.firestore()
            .collection('cities')
            .doc(realCityInfo.id)  // <-- ID REAL, no 'villajoyosa'
            .collection('events')
            .doc(eventId);

          batch.set(eventRef, eventDoc);
          saved++;
          
          console.log(`✅ Prepared: ${event.title} for REAL city ${realCityInfo.id}`);
          
        } catch (error) {
          console.error(`❌ Error processing "${event.title}":`, error.message);
        }
      }
      
      await batch.commit();
      console.log(`\n💾 Successfully saved ${saved} events to REAL city: ${realCityInfo.data.name}`);
      
      // Verificar que se guardaron correctamente
      const verifySnapshot = await admin.firestore()
        .collection('cities')
        .doc(realCityInfo.id)
        .collection('events')
        .limit(3)
        .get();
      
      console.log(`\n✅ VERIFICATION: Found ${verifySnapshot.size} events in cities/${realCityInfo.id}/events`);
      
      if (verifySnapshot.size > 0) {
        console.log('📋 Sample events in REAL city:');
        verifySnapshot.docs.forEach((doc, index) => {
          const event = doc.data();
          console.log(`   ${index + 1}. ${event.title} - ${event.eventCard?.date}`);
        });
      }
      
      return saved;
    }

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    return 0;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Función principal
 */
async function fixCityAndScrape() {
  console.log('🔧 FIX CITY AND SCRAPE CORRECTLY');
  
  try {
    // 1. Encontrar ciudad real
    const realCity = await findRealVillajoyosaCity();
    if (!realCity) {
      console.log('❌ Cannot proceed without real city. Please check city configuration.');
      return;
    }
    
    // 2. Limpiar ciudad falsa
    await cleanupFakeCity();
    
    // 3. Scraping y guardado correcto
    const savedCount = await scrapeAndSaveToRealCity(realCity);
    
    console.log('\n🎉 FIX COMPLETED SUCCESSFULLY!');
    console.log(`✅ Real city used: ${realCity.data.name} (${realCity.id})`);
    console.log(`💾 Events saved: ${savedCount}`);
    console.log(`🏗️  Correct structure: cities/${realCity.id}/events`);
    console.log('✅ Fake city cleaned up');
    console.log('✅ Events now in correct location');
    
  } catch (error) {
    console.error('💥 Fix process failed:', error);
  }
}

// Ejecutar
fixCityAndScrape()
  .then(() => {
    console.log('\n🏁 Fix process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix process failed:', error);
    process.exit(1);
  });
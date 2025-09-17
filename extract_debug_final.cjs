/**
 * Script final con debug para extraer eventos de Villa Joiosa
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

async function extractVillajoyosaEventsFinal() {
  console.log('🎪 FINAL DEBUG EXTRACTION - Villa Joiosa Events');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const url = 'https://www.villajoyosa.com/evento/';
    console.log(`\n📡 Loading: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Extraer eventos con debug completo
    const events = await page.evaluate(() => {
      const results = {
        monthDividers: [],
        mecEvents: [],
        extractedEvents: []
      };

      // 1. Buscar dividers de meses
      const dividers = document.querySelectorAll('.mec-month-divider h5');
      dividers.forEach((div, index) => {
        results.monthDividers.push({
          index,
          text: div.textContent?.trim() || '',
          html: div.outerHTML.substring(0, 200)
        });
      });

      console.log('📅 Month dividers found:', results.monthDividers.length);

      // 2. Buscar artículos de eventos MEC
      const articles = document.querySelectorAll('.mec-event-article');
      articles.forEach((article, index) => {
        const eventInfo = {
          index,
          className: article.className,
          hasTitle: !!article.querySelector('.mec-event-title'),
          hasDate: !!article.querySelector('.mec-start-date-label'),
          hasMeta: !!article.querySelector('.mec-event-meta'),
          html: article.outerHTML.substring(0, 300)
        };

        // Extraer detalles si están presentes
        const titleEl = article.querySelector('.mec-event-title a');
        const dateEl = article.querySelector('.mec-start-date-label');
        const locationEl = article.querySelector('.mec-event-address span');
        const descEl = article.querySelector('.mec-event-description');
        const urlEl = article.querySelector('.mec-event-title a');

        if (titleEl) {
          eventInfo.title = titleEl.textContent?.trim() || '';
        }
        if (dateEl) {
          eventInfo.dateLabel = dateEl.textContent?.trim() || '';
        }
        if (locationEl) {
          eventInfo.location = locationEl.textContent?.trim() || '';
        }
        if (descEl) {
          eventInfo.description = (descEl.textContent?.trim() || '').substring(0, 100);
        }
        if (urlEl) {
          eventInfo.url = urlEl.href || '';
        }

        results.mecEvents.push(eventInfo);
      });

      console.log('🎭 MEC event articles found:', results.mecEvents.length);

      // 3. Procesar eventos válidos
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

      // Obtener año del primer divider
      let defaultYear = '2025';
      if (results.monthDividers.length > 0) {
        const yearMatch = results.monthDividers[0].text.match(/(\\d{4})/);
        if (yearMatch) {
          defaultYear = yearMatch[1];
        }
      }

      results.mecEvents.forEach((event, index) => {
        if (event.title && event.dateLabel) {
          // Procesar fecha
          let dateStr = '';
          const dayMatch = event.dateLabel.match(/(\d{1,2})\s+(\w+)/);
          if (dayMatch) {
            const day = dayMatch[1].padStart(2, '0');
            const monthAbbr = dayMatch[2].toLowerCase().substring(0, 3);
            const month = abbrevMap[monthAbbr] || '09';
            dateStr = `${defaultYear}-${month}-${day}`;
            console.log(`Processing date: "${event.dateLabel}" -> ${dateStr} (day: ${day}, month: ${monthAbbr})`);
          } else {
            console.log(`Failed to match date: "${event.dateLabel}"`);
          }

          if (dateStr) {
            results.extractedEvents.push({
              title: event.title,
              date: dateStr,
              location: event.location || 'La Vila Joiosa',
              description: event.description || `Evento: ${event.title}`,
              url: event.url || '',
              originalDateLabel: event.dateLabel
            });
          }
        }
      });

      console.log('✅ Valid events extracted:', results.extractedEvents.length);
      return results;
    });

    console.log(`\n📊 EXTRACTION RESULTS:`);
    console.log(`   Month dividers: ${events.monthDividers.length}`);
    console.log(`   MEC articles: ${events.mecEvents.length}`);
    console.log(`   Valid events: ${events.extractedEvents.length}`);

    if (events.monthDividers.length > 0) {
      console.log(`\n📅 Month dividers found:`);
      events.monthDividers.forEach(div => {
        console.log(`   - "${div.text}"`);
      });
    }

    if (events.mecEvents.length > 0) {
      console.log(`\n🎭 MEC Events found:`);
      events.mecEvents.slice(0, 5).forEach(event => {
        console.log(`   - Title: ${event.title || 'No title'}`);
        console.log(`     Date: ${event.dateLabel || 'No date'}`);
        console.log(`     Location: ${event.location || 'No location'}`);
        console.log(`     URL: ${event.url ? 'Yes' : 'No'}`);
      });
    }

    if (events.extractedEvents.length > 0) {
      console.log(`\n✅ Successfully extracted events:`);
      events.extractedEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.title}`);
        console.log(`      📅 ${event.date} (original: ${event.originalDateLabel})`);
        console.log(`      📍 ${event.location}`);
        console.log(`      🔗 ${event.url}`);
      });

      // Procesar y guardar en Firestore
      console.log(`\n💾 Processing and saving to Firestore...`);
      
      let saved = 0;
      for (const event of events.extractedEvents) {
        try {
          const eventId = `villajoyosa_${event.date}_${event.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}`;
          
          // Clasificar categoría
          let category = 'general';
          const title = event.title.toLowerCase();
          if (title.includes('teatro')) category = 'teatro';
          else if (title.includes('concert') || title.includes('tributo')) category = 'concierto';
          else if (title.includes('danza') || title.includes('danses')) category = 'danza';
          else if (title.includes('cine') || title.includes('bruno')) category = 'cine';
          else if (title.includes('cultural')) category = 'cultural';

          // Generar tags
          const tags = ['villajoyosa', 'evento'];
          if (category !== 'general') tags.push(category);
          if (title.includes('música') || title.includes('musical')) tags.push('musica');
          if (title.includes('teatro')) tags.push('teatro');
          if (title.includes('cultural')) tags.push('cultura');

          const firestoreEvent = {
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
            tags: tags,
            createdAt: new Date(),
            updatedAt: new Date(),
            scrapedAt: new Date()
          };

          await admin.firestore().collection('events').doc(eventId).set(firestoreEvent);
          saved++;
          console.log(`   ✅ Saved: ${event.title}`);
        } catch (error) {
          console.log(`   ❌ Failed to save: ${event.title} - ${error.message}`);
        }
      }

      console.log(`\n🎉 EXTRACTION COMPLETED:`);
      console.log(`   📊 Events found: ${events.extractedEvents.length}`);
      console.log(`   💾 Events saved: ${saved}`);

      // Guardar log
      await admin.firestore().collection('events_processing_logs').doc(`villajoyosa_${Date.now()}`).set({
        citySlug: 'villajoyosa',
        timestamp: new Date(),
        type: 'manual_extraction',
        result: {
          success: true,
          rawEventsExtracted: events.extractedEvents.length,
          eventsSaved: saved
        }
      });

    } else {
      console.log('\n❌ No valid events found');
    }

  } catch (error) {
    console.error('❌ Extraction failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

extractVillajoyosaEventsFinal()
  .then(() => {
    console.log('\n🏁 Final extraction completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Final extraction failed:', error);
    process.exit(1);
  });
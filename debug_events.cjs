/**
 * Debug script para ver los eventos extraídos en detalle
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

async function debugVillajoyosaEvents() {
  console.log('🔍 DEBUG: Analyzing Villa Joiosa events in detail...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    const url = 'https://www.villajoyosa.com/evento/';
    console.log(`\n🔍 Analyzing: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('body', { timeout: 10000 }).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extraer información detallada de eventos
    const eventDetails = await page.evaluate(() => {
      const events = [];
      
      // Buscar todos los elementos que podrían contener eventos
      const selectors = [
        '.event',
        '.evento',
        '[class*="event"]',
        '.post',
        '.entry',
        'article',
        '.card',
        '.item'
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        
        if (elements.length > 0) {
          console.log(`🎯 Found ${elements.length} elements with selector: ${selector}`);
          
          elements.forEach((element, index) => {
            const event = {
              selector: selector,
              index: index,
              html: element.innerHTML.substring(0, 500),
              text: element.textContent?.trim().substring(0, 200) || '',
              className: element.className,
              id: element.id
            };

            // Buscar fechas específicamente
            const datePatterns = [
              /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
              /(\d{1,2}) de ([a-zA-ZáéíóúÁÉÍÓÚñÑ]+) de (\d{4})/g,
              /(\d{4})-(\d{1,2})-(\d{1,2})/g,
              /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) (\d{4})/gi
            ];

            event.foundDates = [];
            for (const pattern of datePatterns) {
              const matches = [...event.text.matchAll(pattern)];
              event.foundDates.push(...matches.map(match => match[0]));
            }

            // Buscar título más preciso
            const titleSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '.titulo', '.event-title'];
            event.possibleTitles = [];
            for (const titleSel of titleSelectors) {
              const titleEl = element.querySelector(titleSel);
              if (titleEl) {
                event.possibleTitles.push(titleEl.textContent?.trim());
              }
            }

            events.push(event);
          });
          
          break; // Solo usar el primer selector que funcione
        }
      }

      return events;
    });

    console.log(`\n📊 Found ${eventDetails.length} detailed events:`);
    
    eventDetails.forEach((event, index) => {
      console.log(`\n--- EVENT ${index + 1} ---`);
      console.log(`Selector: ${event.selector}`);
      console.log(`Class: ${event.className}`);
      console.log(`Text: ${event.text}`);
      console.log(`Dates found: ${event.foundDates.join(', ') || 'None'}`);
      console.log(`Possible titles: ${event.possibleTitles.join(', ') || 'None'}`);
      console.log(`HTML preview: ${event.html.substring(0, 150)}...`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugVillajoyosaEvents()
  .then(() => {
    console.log('\n🏁 Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
  });
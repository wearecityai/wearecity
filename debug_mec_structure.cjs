/**
 * Debug de estructura MEC
 */
const puppeteer = require('puppeteer');

async function debugMECStructure() {
  console.log('🔍 DEBUGGING MEC STRUCTURE');
  console.log('==========================');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://www.villajoyosa.com/evento/', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Esperar a que la página cargue
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Analizar la estructura de los primeros 3 eventos MEC
    const eventStructures = await page.evaluate(() => {
      const mecEvents = document.querySelectorAll('.mec-event-article');
      const structures = [];
      
      for (let i = 0; i < Math.min(3, mecEvents.length); i++) {
        const event = mecEvents[i];
        
        // Analizar todos los elementos hijos
        const structure = {
          index: i,
          innerHTML: event.innerHTML.substring(0, 1000), // Primeros 1000 caracteres
          allSelectors: {},
          textContent: event.textContent?.substring(0, 500) || ''
        };
        
        // Probar selectores específicos
        const selectors = [
          '.mec-event-title',
          '.mec-event-title a', 
          '.mec-start-date-label',
          '.mec-event-date',
          '.mec-date',
          '.date',
          'h3',
          'h3 a',
          '.mec-event-address',
          '.mec-event-description',
          'time'
        ];
        
        selectors.forEach(selector => {
          const elements = event.querySelectorAll(selector);
          structure.allSelectors[selector] = {
            count: elements.length,
            texts: Array.from(elements).map(el => el.textContent?.trim() || '').slice(0, 3)
          };
        });
        
        structures.push(structure);
      }
      
      return structures;
    });
    
    console.log('🔍 MEC Event Structures:');
    console.log('========================');
    
    eventStructures.forEach(structure => {
      console.log(`\\n📋 Event ${structure.index + 1}:`);
      console.log(`Text content: "${structure.textContent}"`);
      console.log(`HTML preview: "${structure.innerHTML.substring(0, 200)}..."`);
      
      console.log('\\n🎯 Selector Results:');
      Object.entries(structure.allSelectors).forEach(([selector, data]) => {
        if (data.count > 0) {
          console.log(`   ✅ ${selector}: ${data.count} found`);
          data.texts.forEach(text => {
            if (text) console.log(`      - "${text}"`);
          });
        } else {
          console.log(`   ❌ ${selector}: not found`);
        }
      });
      
      console.log('\\n' + '='.repeat(50));
    });
    
  } finally {
    await browser.close();
  }
}

debugMECStructure();

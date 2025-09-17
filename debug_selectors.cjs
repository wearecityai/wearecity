/**
 * Debug de selectores CSS
 */
const puppeteer = require('puppeteer');

async function debugSelectors() {
  console.log('🔍 DEBUGGING CSS SELECTORS');
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
    
    // Probar diferentes selectores
    const results = await page.evaluate(() => {
      const selectors = [
        'article',
        '.evento',
        '[class*="event"]',
        '.post',
        '.entry',
        'h2 a',
        'h3 a',
        'a[href*="/evento/"]',
        '.mec-event-article'
      ];
      
      const results = {};
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        results[selector] = {
          count: elements.length,
          samples: []
        };
        
        // Obtener muestras de los primeros 3 elementos
        for (let i = 0; i < Math.min(3, elements.length); i++) {
          const el = elements[i];
          results[selector].samples.push({
            tagName: el.tagName,
            className: el.className,
            textPreview: el.textContent?.substring(0, 100) || '',
            hasDateText: /\\d{1,2}\\s+(Sep|Oct|Nov|Dec)/i.test(el.textContent || '')
          });
        }
      });
      
      return results;
    });
    
    console.log('🔍 Selector Results:');
    console.log('===================');
    
    Object.entries(results).forEach(([selector, data]) => {
      console.log(`\\n📋 ${selector}: ${data.count} elements`);
      data.samples.forEach((sample, i) => {
        console.log(`   ${i + 1}. ${sample.tagName}.${sample.className}`);
        console.log(`      Text: "${sample.textPreview}..."`);
        console.log(`      Has date: ${sample.hasDateText}`);
      });
    });
    
  } finally {
    await browser.close();
  }
}

debugSelectors();

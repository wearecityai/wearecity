// Simple Puppeteer test to verify it works
import puppeteer from 'puppeteer';

async function testPuppeteer() {
  console.log('🧪 TESTING PUPPETEER BASIC FUNCTIONALITY');
  console.log('=========================================');
  
  let browser;
  
  try {
    console.log('🚀 Launching browser...');
    
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
        '--disable-gpu'
      ]
    });

    console.log('✅ Browser launched successfully');

    const page = await browser.newPage();
    console.log('📄 New page created');

    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('🌐 Navigating to Villa Joiosa events page...');
    await page.goto('https://www.villajoyosa.com/evento/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    console.log('✅ Page loaded successfully');

    // Get page title
    const title = await page.title();
    console.log('📋 Page title:', title);

    // Get page URL
    const url = await page.url();
    console.log('🔗 Current URL:', url);

    // Check if page contains events
    const pageContent = await page.content();
    const hasEvents = pageContent.includes('evento') || pageContent.includes('Event');
    console.log('🎪 Page contains event content:', hasEvents);

    // Try to find event elements
    const eventElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('h1, h2, h3, h4, .title, .titulo, [class*="title"]');
      return Array.from(elements).slice(0, 10).map(el => el.textContent?.trim()).filter(text => text && text.length > 3);
    });

    console.log('\n📊 FOUND CONTENT ELEMENTS:');
    eventElements.forEach((text, index) => {
      console.log(`${index + 1}. ${text}`);
    });

    // Look for specific event indicators
    const eventIndicators = await page.evaluate(() => {
      const content = document.body.textContent || '';
      const indicators = ['septiembre', 'octubre', 'teatro', 'concierto', 'evento', '2025'];
      return indicators.filter(indicator => content.toLowerCase().includes(indicator.toLowerCase()));
    });

    console.log('\n🎯 EVENT INDICATORS FOUND:', eventIndicators);

    if (eventIndicators.length > 0) {
      console.log('\n✅ PUPPETEER TEST SUCCESSFUL!');
      console.log('✅ Successfully accessed the events page');
      console.log('✅ Found event-related content');
      console.log('✅ Puppeteer is working correctly');
    } else {
      console.log('\n⚠️ Page accessed but no event indicators found');
      console.log('This might indicate the page structure has changed');
    }

  } catch (error) {
    console.error('\n❌ PUPPETEER TEST FAILED:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n🔒 Browser closed');
    }
  }
}

// Run the test
console.log('Starting Puppeteer test...\n');
testPuppeteer().then(() => {
  console.log('\n🏁 Test completed');
}).catch(error => {
  console.error('\n💥 Test crashed:', error);
});

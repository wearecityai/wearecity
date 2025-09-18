const admin = require('firebase-admin');
const { scrapeAndSaveEventsToRAG } = require('./lib/eventsScrapingToRAG');

// Inicializar Firebase Admin con credenciales por defecto
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'wearecity-2ab89'
  });
}

async function executeScraping() {
  try {
    console.log('🚀 Starting scraping for villa-joyosa...');
    
    const result = await scrapeAndSaveEventsToRAG('villa-joyosa');
    
    console.log('✅ Scraping completed successfully!');
    console.log('Results:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error during scraping:', error);
  } finally {
    process.exit(0);
  }
}

executeScraping();
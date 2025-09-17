/**
 * Test del scraper corregido
 */
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'wearecity-2ab89'
  });
}

async function testFixedScraper() {
  console.log('🧪 TESTING FIXED SCRAPER');
  console.log('=======================');
  
  try {
    // Primero obtener la configuración de la ciudad
    const citiesRef = admin.firestore().collection('cities');
    const citySnapshot = await citiesRef.where('slug', '==', 'la-vila-joiosa').get();
    
    if (citySnapshot.empty) {
      console.log('❌ City not found');
      return;
    }
    
    const cityDoc = citySnapshot.docs[0];
    const cityConfig = {
      id: cityDoc.id,
      ...cityDoc.data()
    };
    
    console.log('🔍 Starting manual scraping for La Vila Joiosa...');
    console.log('🏛️ City config:', cityConfig.name, cityConfig.eventsUrl);
    
    // Llamar al servicio de scraping
    const { DailyEventsScrapingService } = require('./functions/lib/dailyEventsScrapingService.js');
    const scrapingService = new DailyEventsScrapingService(admin.firestore());
    
    // Scrapear eventos manualmente
    const result = await scrapingService.processCityEvents(cityConfig);
    
    console.log('✅ Scraping result:', result);
    
    // Verificar los eventos en Firestore
    console.log('\\n🔍 Checking events in Firestore...');
    
    if (!citySnapshot.empty) {
      const cityId = cityConfig.id;
      const eventsQuery = admin.firestore()
        .collection('cities')
        .doc(cityId)
        .collection('events');
      
      const eventsSnapshot = await eventsQuery.get();
      
      console.log(`📊 Total events in Firestore: ${eventsSnapshot.size}`);
      
      // Mostrar las primeras 5 fechas
      let count = 0;
      eventsSnapshot.forEach(doc => {
        if (count < 5) {
          const event = doc.data();
          console.log(`📅 Event ${count + 1}: ${event.title} - ${event.date}`);
          count++;
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFixedScraper();

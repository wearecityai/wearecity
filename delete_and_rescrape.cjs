/**
 * Borrar eventos antiguos y hacer scraping nuevo
 */
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'wearecity-2ab89'
  });
}

async function deleteAndRescrape() {
  console.log('🗑️ DELETING OLD EVENTS AND RESCAPING');
  console.log('====================================');
  
  try {
    // 1. Encontrar La Vila Joiosa
    console.log('🔍 Step 1: Finding La Vila Joiosa...');
    const citiesRef = admin.firestore().collection('cities');
    const citySnapshot = await citiesRef.where('slug', '==', 'la-vila-joiosa').get();
    
    if (citySnapshot.empty) {
      console.log('❌ City not found');
      return;
    }
    
    const cityDoc = citySnapshot.docs[0];
    const cityId = cityDoc.id;
    const cityData = cityDoc.data();
    
    console.log(`✅ Found city: ${cityData.name} (${cityId})`);
    
    // 2. Borrar todos los eventos existentes
    console.log('\\n🗑️ Step 2: Deleting all existing events...');
    const eventsRef = admin.firestore()
      .collection('cities')
      .doc(cityId)
      .collection('events');
    
    const eventsSnapshot = await eventsRef.get();
    console.log(`📊 Found ${eventsSnapshot.size} events to delete`);
    
    const batch = admin.firestore().batch();
    eventsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('✅ All old events deleted');
    
    // 3. Ejecutar scraping nuevo
    console.log('\\n🕷️ Step 3: Running fresh scraping...');
    const { DailyEventsScrapingService } = require('./functions/lib/dailyEventsScrapingService.js');
    const scrapingService = new DailyEventsScrapingService(admin.firestore());
    
    const cityConfig = {
      id: cityId,
      ...cityData
    };
    
    const result = await scrapingService.processCityEvents(cityConfig);
    console.log('✅ Scraping result:', result);
    
    // 4. Verificar eventos nuevos
    console.log('\\n🔍 Step 4: Verifying new events...');
    const newEventsSnapshot = await eventsRef.get();
    console.log(`📊 New events count: ${newEventsSnapshot.size}`);
    
    // Mostrar primeras 5 fechas
    let count = 0;
    newEventsSnapshot.forEach(doc => {
      if (count < 5) {
        const event = doc.data();
        console.log(`📅 Event ${count + 1}: ${event.title} - ${event.date}`);
        count++;
      }
    });
    
    console.log('\\n🎉 PROCESS COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

deleteAndRescrape();

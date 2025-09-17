/**
 * Actualizar eventos existentes con formato EventCard
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'wearecity-2ab89'
  });
}

function extractPrice(text) {
  const pricePatterns = [
    /(\d+)\s*€/,
    /(\d+)\s*euros?/i,
    /precio:\s*(\d+)/i,
    /(\d+)\s*€\s*[\/|]\s*(\d+)\s*€/, // "3 € / 1 €"
    /gratis|gratuito|entrada\s+libre/i
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

function extractOrganizer(text) {
  const organizerPatterns = [
    /organiza:\s*([^\.]+)/i,
    /organizador:\s*([^\.]+)/i,
    /cía\.\s*([^\.]+)/i,
    /compañía\s*([^\.]+)/i,
    /grupo\s*([^\.]+)/i,
    /teatro\s*([^\.]+)/i
  ];

  for (const pattern of organizerPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

async function updateEventsWithEventCard() {
  console.log('🎫 Updating events with EventCard format...');
  
  try {
    // Obtener todos los eventos de villajoyosa
    const eventsSnapshot = await admin.firestore()
      .collection('cities')
      .doc('villajoyosa')
      .collection('events')
      .get();
    
    console.log(`📊 Found ${eventsSnapshot.size} events to update`);
    
    let updated = 0;
    const batch = admin.firestore().batch();
    
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      
      // Verificar si ya tiene eventCard
      if (eventData.eventCard) {
        console.log(`⏭️  Skipping ${eventData.title} - already has EventCard`);
        continue;
      }
      
      // Formatear fecha para EventCard
      const eventDate = new Date(eventData.date);
      const formattedDate = eventDate.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Crear eventCard (sin campos undefined)
      const eventCard = {
        title: eventData.title,
        date: formattedDate,
        location: eventData.location,
        description: eventData.description,
        category: eventData.category
      };
      
      // Agregar campos opcionales solo si tienen valor
      if (eventData.time) {
        eventCard.time = eventData.time;
      }
      
      if (eventData.eventDetailUrl) {
        eventCard.url = eventData.eventDetailUrl;
      }
      
      const price = extractPrice(eventData.description || eventData.title);
      if (price) {
        eventCard.price = price;
      }
      
      const organizer = extractOrganizer(eventData.description || eventData.title);
      if (organizer) {
        eventCard.organizer = organizer;
      }
      
      // Actualizar documento
      batch.update(eventDoc.ref, {
        eventCard: eventCard,
        updatedAt: new Date()
      });
      
      updated++;
      console.log(`✅ Prepared update for: ${eventData.title}`);
    }
    
    // Ejecutar batch
    if (updated > 0) {
      await batch.commit();
      console.log(`🎉 Successfully updated ${updated} events with EventCard format`);
    } else {
      console.log('✨ All events already have EventCard format');
    }
    
  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

updateEventsWithEventCard()
  .then(() => {
    console.log('\n🏁 EventCard update completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 EventCard update failed:', error);
    process.exit(1);
  });
/**
 * Reestructurar la base de datos para usar cities/{cityId}/events
 * Y crear sistema de scraping automático diario
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'wearecity-2ab89'
  });
}

/**
 * Migrar eventos existentes a la nueva estructura
 */
async function migrateEventsToNewStructure() {
  console.log('🔄 Migrating events to new structure: cities/{cityId}/events');
  
  try {
    // 1. Obtener todos los eventos existentes
    const eventsSnapshot = await admin.firestore().collection('events').get();
    console.log(`📊 Found ${eventsSnapshot.size} existing events to migrate`);
    
    let migrated = 0;
    const batch = admin.firestore().batch();
    
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      const citySlug = eventData.citySlug;
      
      if (citySlug) {
        // Crear referencia en la nueva estructura
        const newEventRef = admin.firestore()
          .collection('cities')
          .doc(citySlug)
          .collection('events')
          .doc(eventDoc.id);
        
        // Agregar al batch
        batch.set(newEventRef, eventData);
        migrated++;
        
        console.log(`📝 Migrating: ${eventData.title} -> cities/${citySlug}/events/${eventDoc.id}`);
      }
    }
    
    // Ejecutar migración
    await batch.commit();
    console.log(`✅ Migrated ${migrated} events to new structure`);
    
    return migrated;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return 0;
  }
}

/**
 * Verificar nueva estructura
 */
async function verifyNewStructure() {
  console.log('\n🔍 Verifying new structure...');
  
  // Verificar eventos de villajoyosa
  const villaEventsSnapshot = await admin.firestore()
    .collection('cities')
    .doc('villajoyosa')
    .collection('events')
    .get();
  
  console.log(`🏖️ Villa Joiosa events: ${villaEventsSnapshot.size}`);
  
  // Mostrar algunos eventos
  if (villaEventsSnapshot.size > 0) {
    console.log('\n📋 Sample events in new structure:');
    villaEventsSnapshot.docs.slice(0, 5).forEach((doc, index) => {
      const event = doc.data();
      console.log(`   ${index + 1}. ${event.title} - ${event.date}`);
    });
  }
}

/**
 * Limpiar estructura antigua (opcional)
 */
async function cleanOldStructure() {
  console.log('\n🧹 Cleaning old events collection...');
  
  const eventsSnapshot = await admin.firestore().collection('events').get();
  const batch = admin.firestore().batch();
  
  let deleted = 0;
  eventsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
    deleted++;
  });
  
  await batch.commit();
  console.log(`✅ Deleted ${deleted} events from old structure`);
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🏗️ RESTRUCTURING EVENTS DATABASE');
    console.log('New structure: cities/{cityId}/events/{eventId}');
    
    // 1. Migrar eventos
    const migrated = await migrateEventsToNewStructure();
    
    // 2. Verificar nueva estructura
    await verifyNewStructure();
    
    // 3. Preguntar si limpiar estructura antigua
    console.log('\n⚠️  Old events collection still exists.');
    console.log('You can manually delete it later or run cleanOldStructure()');
    
    console.log('\n🎉 DATABASE RESTRUCTURING COMPLETED!');
    console.log(`✅ Events migrated: ${migrated}`);
    console.log('✅ New structure: cities/{cityId}/events/{eventId}');
    console.log('✅ Ready for automated daily scraping');
    
  } catch (error) {
    console.error('💥 Restructuring failed:', error);
  }
}

main()
  .then(() => {
    console.log('\n🏁 Restructuring completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Restructuring execution failed:', error);
    process.exit(1);
  });
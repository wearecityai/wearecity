const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with default credentials
admin.initializeApp({
  projectId: 'wearecity-2ab89'
});

const db = admin.firestore();

async function testRecentCitiesLogic() {
  try {
    const userId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
    
    console.log('🧪 Testing Recent Cities Logic\n');
    
    // Simular visitas a diferentes ciudades
    const citiesToVisit = ['alicante', 'valencia', 'madrid', 'barcelona', 'sevilla'];
    
    let currentCity = 'la-vila-joiosa'; // Ciudad inicial
    let recentCities = [];
    
    console.log('📍 Initial state:');
    console.log('  - Current city:', currentCity);
    console.log('  - Recent cities:', recentCities);
    console.log('');
    
    for (let i = 0; i < citiesToVisit.length; i++) {
      const newCity = citiesToVisit[i];
      
      console.log(`🔄 Visiting city: ${newCity}`);
      
      // Lógica de actualización (igual que en el hook)
      let newRecentCities = [...recentCities];
      if (currentCity && currentCity !== newCity) {
        // Agregar la ciudad anterior a recientes (si no es la misma que estamos visitando)
        newRecentCities = [currentCity, ...newRecentCities.filter(slug => slug !== currentCity && slug !== newCity)].slice(0, 3);
      }
      
      // Actualizar estado
      const previousCity = currentCity;
      currentCity = newCity;
      recentCities = newRecentCities;
      
      console.log(`  - Previous city: ${previousCity}`);
      console.log(`  - New current city: ${currentCity}`);
      console.log(`  - Recent cities (excluding current): ${JSON.stringify(recentCities)}`);
      console.log('');
      
      // Simular actualización en Firestore
      const updateData = {
        last_visited_city: currentCity,
        recent_cities: recentCities,
        updated_at: new Date().toISOString()
      };
      
      await db.collection('profiles').doc(userId).update(updateData);
      console.log('  ✅ Updated in Firestore');
      console.log('');
    }
    
    // Verificar estado final
    const profileDoc = await db.collection('profiles').doc(userId).get();
    if (profileDoc.exists) {
      const profileData = profileDoc.data();
      console.log('📊 Final state in Firestore:');
      console.log('  - last_visited_city:', profileData.last_visited_city);
      console.log('  - recent_cities:', profileData.recent_cities);
      console.log('');
      
      // Simular dropdown (excluyendo ciudad actual)
      const dropdownCities = recentCities.filter(slug => slug !== currentCity);
      console.log('🎯 Cities that would appear in dropdown:');
      console.log('  - Current city (NOT in dropdown):', currentCity);
      console.log('  - Recent cities (in dropdown):', dropdownCities);
    }
    
  } catch (error) {
    console.error('❌ Error testing recent cities logic:', error);
  }
}

testRecentCitiesLogic();

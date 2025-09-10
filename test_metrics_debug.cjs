const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'wearecity-app'
  });
}

const db = admin.firestore();

async function debugMetricsFlow() {
  console.log('🔍 Debugging metrics flow...\n');

  try {
    // 1. Check cities collection
    console.log('1. Checking cities collection...');
    const citiesSnapshot = await db.collection('cities').get();
    console.log(`   Found ${citiesSnapshot.docs.length} cities`);
    
    citiesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - City ID: ${doc.id}`);
      console.log(`     Slug: ${data.slug}`);
      console.log(`     Admin User ID: ${data.admin_user_id}`);
      console.log(`     Name: ${data.name}`);
      console.log('');
    });

    // 2. Check chat_analytics collection
    console.log('2. Checking chat_analytics collection...');
    const analyticsSnapshot = await db.collection('chat_analytics').get();
    console.log(`   Found ${analyticsSnapshot.docs.length} analytics records`);
    
    // Group by city_id
    const cityIds = {};
    analyticsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const cityId = data.city_id;
      if (!cityIds[cityId]) {
        cityIds[cityId] = 0;
      }
      cityIds[cityId]++;
    });
    
    console.log('   Analytics by city_id:');
    Object.entries(cityIds).forEach(([cityId, count]) => {
      console.log(`   - ${cityId}: ${count} records`);
    });
    console.log('');

    // 3. Check chat_categories collection
    console.log('3. Checking chat_categories collection...');
    const categoriesSnapshot = await db.collection('chat_categories').get();
    console.log(`   Found ${categoriesSnapshot.docs.length} categories`);
    
    categoriesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - Category ID: ${doc.id}`);
      console.log(`     Name: ${data.name}`);
      console.log(`     Description: ${data.description}`);
    });
    console.log('');

    // 4. Test the exact query that AdminMetrics.tsx uses
    console.log('4. Testing AdminMetrics.tsx query...');
    
    // Find a city with analytics data
    const cityWithData = Object.keys(cityIds)[0];
    if (cityWithData) {
      console.log(`   Testing query for city_id: ${cityWithData}`);
      
      const testQuery = db.collection('chat_analytics')
        .where('city_id', '==', cityWithData);
      
      const testSnapshot = await testQuery.get();
      console.log(`   Query result: ${testSnapshot.docs.length} records found`);
      
      if (testSnapshot.docs.length > 0) {
        const sampleDoc = testSnapshot.docs[0];
        const sampleData = sampleDoc.data();
        console.log('   Sample record:');
        console.log(`     - ID: ${sampleDoc.id}`);
        console.log(`     - city_id: ${sampleData.city_id}`);
        console.log(`     - user_id: ${sampleData.user_id}`);
        console.log(`     - category_id: ${sampleData.category_id}`);
        console.log(`     - created_at: ${sampleData.created_at?.toDate?.() || sampleData.created_at}`);
        console.log(`     - response_time_ms: ${sampleData.response_time_ms}`);
      }
    } else {
      console.log('   No cities with analytics data found');
    }

    // 5. Check if there's a mismatch between city document IDs and city_id in analytics
    console.log('\n5. Checking for city ID mismatches...');
    const cityDocIds = citiesSnapshot.docs.map(doc => doc.id);
    const citySlugs = citiesSnapshot.docs.map(doc => doc.data().slug);
    const analyticsCityIds = Object.keys(cityIds);
    
    console.log('   City document IDs:', cityDocIds);
    console.log('   City slugs:', citySlugs);
    console.log('   Analytics city_ids:', analyticsCityIds);
    
    // Check if any analytics city_id matches a city document ID
    const matchingDocIds = analyticsCityIds.filter(id => cityDocIds.includes(id));
    console.log('   Analytics city_ids that match document IDs:', matchingDocIds);
    
    // Check if any analytics city_id matches a city slug
    const matchingSlugs = analyticsCityIds.filter(id => citySlugs.includes(id));
    console.log('   Analytics city_ids that match slugs:', matchingSlugs);

  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

debugMetricsFlow().then(() => {
  console.log('\n✅ Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});

// Test the frontend metrics exactly as the component does
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

// Configuración exacta del frontend
const firebaseConfig = {
  apiKey: 'AIzaSyAbtbgtjuKbmz2FM7JCxkHwTc_UuIc45Yk',
  authDomain: 'wearecity-2ab89.firebaseapp.com',
  projectId: 'wearecity-2ab89',
  storageBucket: 'wearecity-2ab89.firebasestorage.app',
  messagingSenderId: '294062779330',
  appId: '1:294062779330:web:05fd845d214b7a905ac45b'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFrontendMetrics() {
  try {
    console.log('🧪 Testing frontend metrics access...');
    
    // Simulate user login
    const userId = 's6W4RkEofUMgzlPnkgeCIoKfGOR2';
    console.log('👤 Simulating admin user:', userId);
    
    // Step 1: Find city (as in useEffect)
    const citiesRef = collection(db, 'cities');
    const q = query(citiesRef, where('admin_user_id', '==', userId));
    const querySnapshot = await getDocs(q);
    
    let cityId = null;
    if (!querySnapshot.empty) {
      const cityDoc = querySnapshot.docs[0];
      cityId = cityDoc.data().slug;
      console.log('✅ Found city:', cityDoc.id, 'slug:', cityId);
    } else {
      console.log('❌ No city found for admin');
      return;
    }
    
    // Step 2: Fetch metrics (as in fetchMetrics useEffect)  
    const analyticsQuery = query(
      collection(db, 'chat_analytics'),
      where('city_id', '==', cityId)
    );
    
    const analyticsSnapshot = await getDocs(analyticsQuery);
    const analyticsData = analyticsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('📊 Analytics data found:', analyticsData.length, 'records');
    
    if (analyticsData.length > 0) {
      // Step 3: Process data (as in component)
      const totalMessages = analyticsData.length;
      const uniqueUsers = new Set(analyticsData.map(a => a.user_id).filter(Boolean)).size;
      const uniqueSessions = new Set(analyticsData.map(a => a.session_id)).size;
      
      console.log('📈 Processed metrics:');
      console.log('   Total Messages:', totalMessages);
      console.log('   Unique Users:', uniqueUsers);
      console.log('   Total Conversations:', uniqueSessions);
      
      // Test categories
      const categoriesQuery = query(collection(db, 'chat_categories'));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('📂 Categories found:', categoriesData.length);
      
      // Category stats
      const categoryStats = categoriesData.map(category => {
        const categoryMessages = analyticsData.filter(a => a.category_id === category.id);
        return {
          name: category.name,
          count: categoryMessages.length,
          percentage: Math.round((categoryMessages.length / totalMessages) * 100)
        };
      }).filter(cat => cat.count > 0);
      
      console.log('📊 Category statistics:', categoryStats);
      
      console.log('\\n✅ Frontend should show real data!');
    } else {
      console.log('❌ No analytics data found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFrontendMetrics();
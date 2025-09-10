import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'wearecity-2ab89'
    });
}

const db = admin.firestore();

async function debugAdminMetricsFlow() {
    try {
        console.log('🔍 === DEBUGGING ADMIN METRICS FLOW ===\n');
        
        // 1. Simular buscar admin user
        const testUserId = 's6W4RkEofUMgzlPnkgeCIoKfGOR2'; // El que acabamos de crear
        console.log('👤 Usuario admin simulado:', testUserId);
        
        // 2. Buscar ciudad del admin (exactamente como hace el frontend)
        console.log('🔍 Buscando ciudad con admin_user_id:', testUserId);
        
        const citiesRef = db.collection('cities');
        const q = citiesRef.where('admin_user_id', '==', testUserId);
        const querySnapshot = await q.get();
        
        console.log('🔍 Query result:', querySnapshot.docs.length, 'cities found');
        
        let cityId = null;
        if (!querySnapshot.empty) {
            const cityDoc = querySnapshot.docs[0];
            console.log('🏙️ City found:', cityDoc.id, 'data:', cityDoc.data());
            cityId = cityDoc.data().slug;
        } else {
            console.log('❌ No city found for admin user');
            // Try alternative approach (como hace el frontend)
            const alternativeCityId = `city_${testUserId}`;
            console.log('🔍 Trying alternative city ID:', alternativeCityId);
            cityId = alternativeCityId;
        }
        
        console.log('🎯 Final cityId to use:', cityId);
        
        // 3. Buscar métricas (exactamente como hace el frontend)
        console.log('\\n📊 Buscando métricas para cityId:', cityId);
        
        const analyticsRef = db.collection('chat_analytics');
        const analyticsQuery = analyticsRef.where('city_id', '==', cityId);
        const analyticsSnapshot = await analyticsQuery.get();
        
        console.log('📈 Analytics found:', analyticsSnapshot.docs.length, 'records');
        
        if (analyticsSnapshot.docs.length > 0) {
            console.log('📈 Sample analytics data:');
            analyticsSnapshot.docs.slice(0, 3).forEach((doc, i) => {
                console.log(`   ${i + 1}.`, doc.data());
            });
        }
        
        // 4. Ver TODOS los city_id disponibles en analytics
        console.log('\\n🔍 TODOS los city_ids en analytics:');
        const allAnalyticsSnapshot = await db.collection('chat_analytics').get();
        const cityIds = new Set();
        allAnalyticsSnapshot.docs.forEach(doc => {
            cityIds.add(doc.data().city_id);
        });
        console.log('Available city_ids:', Array.from(cityIds));
        
        // 5. Ver TODOS los usuarios admin disponibles
        console.log('\\n👥 TODOS los usuarios admin:');
        const usersSnapshot = await db.collection('users').get();
        usersSnapshot.docs.forEach(doc => {
            const userData = doc.data();
            if (userData.role === 'administrativo') {
                console.log('Admin user:', doc.id, userData.name, userData.email);
            }
        });
        
        // 6. Ver TODAS las ciudades disponibles
        console.log('\\n🏙️ TODAS las ciudades:');
        const allCitiesSnapshot = await db.collection('cities').get();
        allCitiesSnapshot.docs.forEach(doc => {
            const cityData = doc.data();
            console.log('City:', doc.id, {
                name: cityData.name,
                slug: cityData.slug,
                admin_user_id: cityData.admin_user_id
            });
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debugAdminMetricsFlow();
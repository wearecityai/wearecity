import { firestoreClient } from '@/integrations/firebase/database';
import { City } from '@/types';

// Script para crear ciudades de prueba en Firebase
export const createTestCities = async () => {
  try {
    console.log('🏗️ Creating test cities in Firebase...');
    
    const testCities: Partial<City>[] = [
      {
        name: 'Madrid',
        slug: 'madrid',
        admin_user_id: 'test-admin-madrid',
        assistant_name: 'AsistenteMadrid',
        system_instruction: '', // Instructions now handled securely in backend
        service_tags: ['tramites', 'turismo', 'transportes', 'cultura'],
        is_active: true,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        enable_google_search: true,
        allow_map_display: true,
        allow_geolocation: true,
        current_language_code: 'es',
        lat: 40.4168,
        lng: -3.7038
      },
      {
        name: 'Barcelona',
        slug: 'barcelona',
        admin_user_id: 'test-admin-barcelona',
        assistant_name: 'AsistenteBarcelona',
        system_instruction: '', // Instructions now handled securely in backend
        service_tags: ['tramites', 'turismo', 'transportes', 'playa'],
        is_active: true,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        enable_google_search: true,
        allow_map_display: true,
        allow_geolocation: true,
        current_language_code: 'es',
        lat: 41.3851,
        lng: 2.1734
      },
      {
        name: 'Valencia',
        slug: 'valencia',
        admin_user_id: 'test-admin-valencia',
        assistant_name: 'AsistenteValencia',
        system_instruction: '', // Instructions now handled securely in backend
        service_tags: ['tramites', 'turismo', 'paella', 'fallas'],
        is_active: true,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        enable_google_search: true,
        allow_map_display: true,
        allow_geolocation: true,
        current_language_code: 'es',
        lat: 39.4699,
        lng: -0.3763
      }
    ];

    for (const city of testCities) {
      const result = await firestoreClient.insert('cities', city);
      if (result.error) {
        console.error('❌ Error creating city:', city.name, result.error);
      } else {
        console.log('✅ Created city:', city.name, result.data?.[0]?.id);
      }
    }

    console.log('🏙️ Test cities creation completed!');
  } catch (error) {
    console.error('❌ Error in createTestCities:', error);
  }
};

// Function to delete ALL cities except the real admin city
export const deleteTestCities = async () => {
  try {
    console.log('🗑️ Deleting ALL fake cities...');
    
    const result = await firestoreClient
      .from('cities')
      .select('*')
      .execute();
    
    if (result.error) {
      console.error('❌ Error fetching cities for deletion:', result.error);
      return;
    }

    const realAdminUserId = 'k8aescDQi5dF03AhL3UybC1tpmX2'; // ID del admin real (Antoni)
    const cities = result.data || [];
    
    for (const city of cities) {
      // Eliminar cualquier ciudad que NO sea del administrador real
      if (city.admin_user_id !== realAdminUserId) {
        const deleteResult = await firestoreClient.delete('cities', city.id);
        if (deleteResult.error) {
          console.error('❌ Error deleting fake city:', city.name, deleteResult.error);
        } else {
          console.log('🗑️ Deleted fake city:', city.name);
        }
      } else {
        console.log('✅ Keeping real admin city:', city.name);
      }
    }

    console.log('🧹 Fake cities cleanup completed!');
  } catch (error) {
    console.error('❌ Error in deleteTestCities:', error);
  }
};
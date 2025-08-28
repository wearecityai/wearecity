import { firestoreClient } from '@/integrations/firebase/database';

// Script para limpiar Firebase y dejar solo la ciudad real
export const cleanupAllFakeCities = async () => {
  try {
    console.log('🧹 STARTING CLEANUP: Removing all fake cities from Firebase...');
    
    // Obtener todas las ciudades existentes
    const result = await firestoreClient
      .from('cities')
      .select('*')
      .execute();
    
    if (result.error) {
      console.error('❌ Error fetching cities for cleanup:', result.error);
      return false;
    }

    const allCities = result.data || [];
    console.log(`🔍 Found ${allCities.length} cities in Firebase`);
    
    const realAdminUserId = 'k8aescDQi5dF03AhL3UybC1tpmX2'; // ID del admin real (Antoni)
    let deletedCount = 0;
    let keptCount = 0;
    
    // Eliminar todas las ciudades que NO pertenezcan al admin real
    for (const city of allCities) {
      console.log(`🔍 Checking city: "${city.name}" (admin: ${city.admin_user_id})`);
      
      if (city.admin_user_id !== realAdminUserId) {
        console.log(`🗑️ DELETING fake city: ${city.name}`);
        const deleteResult = await firestoreClient.delete('cities', city.id);
        
        if (deleteResult.error) {
          console.error('❌ Error deleting city:', city.name, deleteResult.error);
        } else {
          console.log(`✅ Deleted: ${city.name}`);
          deletedCount++;
        }
      } else {
        console.log(`✅ KEEPING real admin city: ${city.name}`);
        keptCount++;
      }
    }
    
    console.log(`🧹 CLEANUP COMPLETE: Deleted ${deletedCount} fake cities, kept ${keptCount} real cities`);
    return true;
    
  } catch (error) {
    console.error('❌ Error in cleanupAllFakeCities:', error);
    return false;
  }
};

// Crear la ciudad real de Villajoyosa si no existe
export const createRealVilaJoiosaCity = async () => {
  try {
    console.log('🏗️ Creating real Vila Joiosa city...');
    
    const realAdminUserId = 'k8aescDQi5dF03AhL3UybC1tpmX2';
    
    // Verificar si ya existe una ciudad para este admin
    const existingResult = await firestoreClient
      .from('cities')
      .select('*')
      .eq('admin_user_id', realAdminUserId)
      .execute();
    
    if (existingResult.error) {
      console.error('❌ Error checking existing city:', existingResult.error);
      return false;
    }
    
    const existingCities = existingResult.data || [];
    if (existingCities.length > 0) {
      console.log('🏙️ Admin city already exists, will update it:', existingCities[0].name);
      
      // Actualizar la ciudad existente con los datos correctos de Vila Joiosa
      const existingCity = existingCities[0];
      const updatedCity = {
        name: 'La Vila Joiosa',
        slug: 'la-vila-joiosa',
        assistant_name: 'AsistenteVila',
        system_instruction: '', // Instructions now handled securely in backend
        service_tags: ['tramites', 'turismo', 'playa', 'ayuntamiento', 'alicante'],
        is_active: true,
        is_public: true,
        updated_at: new Date().toISOString(),
        enable_google_search: true,
        allow_map_display: true,
        allow_geolocation: true,
        current_language_code: 'es',
        lat: 38.5073,
        lng: -0.2336
      };
      
      const updateResult = await firestoreClient.update('cities', updatedCity, existingCity.id);
      if (updateResult.error) {
        console.error('❌ Error updating city to Vila Joiosa:', updateResult.error);
        return false;
      }
      
      console.log('✅ Updated city to Vila Joiosa');
      return true;
    }
    
    // Crear la ciudad real
    const vilaJoiosaCity = {
      name: 'La Vila Joiosa',
      slug: 'la-vila-joiosa',
      admin_user_id: realAdminUserId,
      assistant_name: 'AsistenteVila',
      system_instruction: '', // Instructions now handled securely in backend
      service_tags: ['tramites', 'turismo', 'playa', 'ayuntamiento', 'alicante'],
      is_active: true,
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      enable_google_search: true,
      allow_map_display: true,
      allow_geolocation: true,
      current_language_code: 'es',
      lat: 38.5073,
      lng: -0.2336
    };
    
    const createResult = await firestoreClient.insert('cities', vilaJoiosaCity);
    
    if (createResult.error) {
      console.error('❌ Error creating Vila Joiosa city:', createResult.error);
      return false;
    }
    
    console.log('✅ Created Vila Joiosa city:', createResult.data?.[0]?.id);
    return true;
    
  } catch (error) {
    console.error('❌ Error in createRealVilaJoiosaCity:', error);
    return false;
  }
};

// Función completa de limpieza y setup
export const setupRealCitiesOnly = async () => {
  console.log('🚀 STARTING COMPLETE FIREBASE CITIES SETUP...');
  
  // 1. Limpiar todas las ciudades falsas
  const cleanupSuccess = await cleanupAllFakeCities();
  if (!cleanupSuccess) {
    console.error('❌ Cleanup failed, aborting...');
    return false;
  }
  
  // 2. Crear la ciudad real si no existe
  const createSuccess = await createRealVilaJoiosaCity();
  if (!createSuccess) {
    console.error('❌ City creation failed');
    return false;
  }
  
  console.log('🎉 SETUP COMPLETE! Only Vila Joiosa should exist now.');
  return true;
};
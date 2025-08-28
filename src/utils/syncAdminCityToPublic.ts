import { firestoreClient } from '@/integrations/firebase/database';

// Función para sincronizar la ciudad del admin a la colección pública
export const syncAdminCityToPublic = async () => {
  try {
    console.log('🔄 Syncing admin city to public collection...');
    
    const adminUserId = 'k8aescDQi5dF03AhL3UybC1tpmX2'; // Antoni
    
    // 1. Obtener la configuración del admin desde su documento de ciudad
    const cityDocId = `city_${adminUserId}`;
    const adminConfigResult = await firestoreClient.getById('cities', cityDocId);
    
    if (adminConfigResult.error) {
      console.error('❌ Error getting admin config:', adminConfigResult.error);
      return false;
    }
    
    if (!adminConfigResult.data) {
      console.log('❌ No admin city config found');
      return false;
    }
    
    const adminConfig = adminConfigResult.data;
    console.log('🔍 Found admin config:', {
      assistantName: adminConfig.assistantName,
      systemInstruction: adminConfig.systemInstruction?.slice(0, 50) + '...'
    });
    
    // 2. Verificar si ya existe una ciudad pública para este admin
    const existingCitiesResult = await firestoreClient
      .from('cities')
      .select('*')
      .eq('admin_user_id', adminUserId)
      .execute();
    
    if (existingCitiesResult.error) {
      console.error('❌ Error checking existing cities:', existingCitiesResult.error);
      return false;
    }
    
    const existingCities = existingCitiesResult.data || [];
    
    // 3. Crear/actualizar la ciudad pública
    const publicCityData = {
      name: 'La Vila Joiosa',
      slug: 'la-vila-joiosa',
      admin_user_id: adminUserId,
      assistant_name: adminConfig.assistantName || 'AsistenteVila',
      system_instruction: '', // Instructions now handled securely in backend
      service_tags: adminConfig.serviceTags || ['tramites', 'turismo', 'playa', 'ayuntamiento'],
      is_active: true,
      is_public: true, // IMPORTANTE: debe ser público para que aparezca en el selector
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      enable_google_search: adminConfig.enableGoogleSearch !== false,
      allow_map_display: adminConfig.allowMapDisplay !== false,
      allow_geolocation: adminConfig.allowGeolocation !== false,
      current_language_code: adminConfig.currentLanguageCode || 'es',
      lat: 38.5073, // Coordenadas de La Vila Joiosa
      lng: -0.2336
    };
    
    if (existingCities.length > 0) {
      // Actualizar ciudad existente
      const existingCity = existingCities[0];
      console.log('🔄 Updating existing public city:', existingCity.name);
      
      const updateResult = await firestoreClient.update('cities', publicCityData, existingCity.id);
      
      if (updateResult.error) {
        console.error('❌ Error updating public city:', updateResult.error);
        return false;
      }
      
      console.log('✅ Updated public city successfully');
    } else {
      // Crear nueva ciudad pública
      console.log('🏗️ Creating new public city');
      
      const createResult = await firestoreClient.insert('cities', publicCityData);
      
      if (createResult.error) {
        console.error('❌ Error creating public city:', createResult.error);
        return false;
      }
      
      console.log('✅ Created new public city:', createResult.data?.[0]?.id);
    }
    
    console.log('🎉 Admin city sync completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error in syncAdminCityToPublic:', error);
    return false;
  }
};
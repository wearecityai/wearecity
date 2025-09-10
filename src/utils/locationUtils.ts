// Supabase removed - functions now return null or empty results

// Calcular distancia entre dos puntos usando la fórmula de Haversine
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distancia en km
};

// Buscar ciudad por place_id en el campo restricted_city
export const findCityByPlaceId = async (placeId) => {
  try {
    console.log('findCityByPlaceId: Function disabled (Supabase removed)');
    return null;
  } catch (error) {
    console.error('Error finding city by place_id:', error);
    return null;
  }
};

// Buscar ciudad por nombre de municipio
export const findCityByMunicipalityName = async (municipalityName) => {
  try {
    console.log('findCityByMunicipalityName: Function disabled (Supabase removed)');
    return null;
  } catch (error) {
    console.error('Error finding city by municipality name:', error);
    return null;
  }
};

// Modificar findNearestCity para intentar primero por place_id, luego por nombre, y finalmente por distancia
export const findNearestCity = async (userLat, userLng, placeId = null, municipalityName = null) => {
  // 1. Si hay placeId, buscar primero por placeId
  if (placeId) {
    const cityByPlaceId = await findCityByPlaceId(placeId);
    if (cityByPlaceId) {
      console.log('Ciudad encontrada por place_id:', cityByPlaceId.name);
      return { ...cityByPlaceId, distance: 0 };
    }
  }
  
  // 2. Si hay nombre de municipio, buscar por nombre
  if (municipalityName) {
    const cityByName = await findCityByMunicipalityName(municipalityName);
    if (cityByName) {
      console.log('Ciudad encontrada por nombre de municipio:', cityByName.name);
      return { ...cityByName, distance: 0 };
    }
  }
  
  // 3. Distance-based search disabled (Supabase removed)
  try {
    console.log('findNearestCity: Distance-based search disabled (Supabase removed)');
    return null;
  } catch (error) {
    console.error('Error finding nearest city:', error);
    return null;
  }
}; 
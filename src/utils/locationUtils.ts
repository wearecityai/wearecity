import { supabase } from '@/integrations/supabase/client';

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
    const { data: cities, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_public', true)
      .not('restricted_city', 'is', null);
    if (error) {
      console.error('Error fetching cities:', error);
      return null;
    }
    if (!cities || cities.length === 0) return null;
    // Buscar coincidencia exacta de place_id
    const city = cities.find(city => {
      try {
        const rc = typeof city.restricted_city === 'string' ? JSON.parse(city.restricted_city) : city.restricted_city;
        return rc && rc.place_id === placeId;
      } catch {
        return false;
      }
    });
    return city || null;
  } catch (error) {
    console.error('Error finding city by place_id:', error);
    return null;
  }
};

// Buscar ciudad por nombre de municipio
export const findCityByMunicipalityName = async (municipalityName) => {
  try {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_public', true)
      .not('restricted_city', 'is', null);
    if (error) {
      console.error('Error fetching cities:', error);
      return null;
    }
    if (!cities || cities.length === 0) return null;
    // Buscar coincidencia por nombre de municipio
    const city = cities.find(city => {
      try {
        const rc = typeof city.restricted_city === 'string' ? JSON.parse(city.restricted_city) : city.restricted_city;
        if (!rc || !rc.name) return false;
        // Comparar nombres de municipio (ignorar mayúsculas y espacios)
        const cityName = rc.name.toLowerCase().replace(/\s+/g, '');
        const searchName = municipalityName.toLowerCase().replace(/\s+/g, '');
        return cityName.includes(searchName) || searchName.includes(cityName);
      } catch {
        return false;
      }
    });
    return city || null;
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
  
  // 3. Si no hay coincidencias, buscar por distancia (si tienes lat/lng en la base de datos)
  try {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_public', true)
      .not('lat', 'is', null)
      .not('lng', 'is', null);

    if (error) {
      console.error('Error fetching cities:', error);
      return null;
    }

    if (!cities || cities.length === 0) {
      console.log('No cities found with coordinates');
      return null;
    }

    let nearestCity = null;
    let shortestDistance = Infinity;

    cities.forEach(city => {
      const distance = calculateDistance(userLat, userLng, city.lat, city.lng);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestCity = { ...city, distance };
      }
    });

    if (nearestCity) {
      console.log('Ciudad encontrada por distancia:', nearestCity.name, 'a', Math.round(nearestCity.distance), 'km');
    }
    return nearestCity;
  } catch (error) {
    console.error('Error finding nearest city:', error);
    return null;
  }
}; 
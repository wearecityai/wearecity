// Configuración para la API del tiempo (OpenMeteo - 100% gratuita)
export const WEATHER_CONFIG = {
  // OpenMeteo - API 100% gratuita sin límites
  BASE_URL: 'https://api.open-meteo.com/v1',
  
  // Configuración por defecto
  DEFAULT_CITY: 'Benidorm',
  DEFAULT_COUNTRY: 'ES',
  DEFAULT_UNITS: 'celsius', // Celsius
  DEFAULT_LANGUAGE: 'es', // Español
  
  // Tiempo de actualización en milisegundos (5 minutos)
  UPDATE_INTERVAL: 5 * 60 * 1000,
  
  // Configuración de fallback para desarrollo
  FALLBACK_WEATHER: {
    temperature: 24,
    description: 'Soleado',
    humidity: 58,
    windSpeed: 8,
    visibility: 12,
    icon: '01d',
    city: 'Benidorm',
    country: 'ES'
  }
};

// Función para obtener coordenadas de la ciudad
const getCityCoordinates = async (city: string): Promise<{lat: number, lon: number} | null> => {
  try {
    console.log(`📍 [getCityCoordinates] Buscando coordenadas para: ${city}`);
    
    // Mapeo de nombres de ciudades problemáticas
    const cityMappings: { [key: string]: string } = {
      'La Vila Joiosa': 'Villajoyosa',
      'Villajoyosa': 'Villajoyosa',
      'Benidorm': 'Benidorm',
      'Finestrat': 'Finestrat'
    };
    
    const searchName = cityMappings[city] || city;
    console.log(`📍 [getCityCoordinates] Nombre de búsqueda: ${searchName}`);
    
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchName)}&count=1&language=es&format=json`);
    const data = await response.json();
    
    console.log(`📍 [getCityCoordinates] Respuesta para ${searchName}:`, data);
    
    if (data.results && data.results.length > 0) {
      const coords = {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude
      };
      console.log(`✅ [getCityCoordinates] Coordenadas para ${searchName}:`, coords);
      return coords;
    }
    
    console.log(`❌ [getCityCoordinates] No se encontraron coordenadas para ${searchName}`);
    return null;
  } catch (error) {
    console.error(`❌ [getCityCoordinates] Error para ${city}:`, error);
    return null;
  }
};

// Función para obtener la URL de la API de OpenMeteo
export const getWeatherApiUrl = async (city: string): Promise<string | null> => {
  console.log(`🔗 [getWeatherApiUrl] Generando URL para: ${city}`);
  const coords = await getCityCoordinates(city);
  if (!coords) {
    console.log(`❌ [getWeatherApiUrl] No se pudieron obtener coordenadas para ${city}`);
    return null;
  }
  
  const url = `${WEATHER_CONFIG.BASE_URL}/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&wind_speed_unit=ms&timezone=auto`;
  console.log(`✅ [getWeatherApiUrl] URL generada para ${city}:`, url);
  return url;
};

// Función para mapear códigos de tiempo de OpenMeteo a iconos adaptativos
export const mapWeatherCodeToIcon = (code: number, isNight: boolean = false): string => {
  // Códigos de OpenMeteo: https://open-meteo.com/en/docs
  
  switch (code) {
    // Cielo despejado
    case 0: return isNight ? 'moon' : 'sun'; // Luna o Sol
    
    // Parcialmente nublado
    case 1: return isNight ? 'cloud-moon' : 'cloud-sun'; // Nube con luna o nube con sol
    case 2: return isNight ? 'cloud-moon' : 'cloud-sun'; // Nube con luna o nube con sol
    
    // Nublado
    case 3: return 'cloud'; // Nube
    
    // Niebla
    case 45: return 'cloud-fog'; // Nube con niebla
    case 48: return 'cloud-fog'; // Nube con niebla
    
    // Llovizna
    case 51: return 'cloud-drizzle'; // Nube con llovizna
    case 53: return 'cloud-drizzle'; // Nube con llovizna
    case 55: return 'cloud-drizzle'; // Nube con llovizna
    
    // Llovizna helada
    case 56: return 'cloud-drizzle'; // Nube con llovizna
    case 57: return 'cloud-drizzle'; // Nube con llovizna
    
    // Lluvia
    case 61: return 'cloud-rain'; // Nube con lluvia
    case 63: return 'cloud-rain'; // Nube con lluvia
    case 65: return 'cloud-rain'; // Nube con lluvia
    
    // Lluvia helada
    case 66: return 'cloud-rain'; // Nube con lluvia
    case 67: return 'cloud-rain'; // Nube con lluvia
    
    // Nieve
    case 71: return 'cloud-snow'; // Nube con nieve
    case 73: return 'cloud-snow'; // Nube con nieve
    case 75: return 'cloud-snow'; // Nube con nieve
    case 77: return 'cloud-snow'; // Nube con nieve
    
    // Chubascos de lluvia
    case 80: return 'cloud-rain'; // Nube con lluvia
    case 81: return 'cloud-rain'; // Nube con lluvia
    case 82: return 'cloud-rain'; // Nube con lluvia
    
    // Chubascos de nieve
    case 85: return 'cloud-snow'; // Nube con nieve
    case 86: return 'cloud-snow'; // Nube con nieve
    
    // Tormentas
    case 95: return 'cloud-lightning'; // Nube con rayo
    case 96: return 'cloud-lightning'; // Nube con rayo
    case 99: return 'cloud-lightning'; // Nube con rayo
    
    default: return isNight ? 'moon' : 'sun';
  }
};

// Función para detectar si es de noche basado en la hora actual
export const isNightTime = (): boolean => {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 20; // Noche entre 20:00 y 6:00
};

// Función para mapear códigos de tiempo a descripciones
export const mapWeatherCodeToDescription = (code: number): string => {
  switch (code) {
    case 0: return 'Despejado';
    case 1: return 'Mayormente despejado';
    case 2: return 'Parcialmente nublado';
    case 3: return 'Nublado';
    case 45: return 'Niebla';
    case 48: return 'Niebla con escarcha';
    case 51: return 'Llovizna ligera';
    case 53: return 'Llovizna moderada';
    case 55: return 'Llovizna intensa';
    case 56: return 'Llovizna helada ligera';
    case 57: return 'Llovizna helada intensa';
    case 61: return 'Lluvia ligera';
    case 63: return 'Lluvia moderada';
    case 65: return 'Lluvia intensa';
    case 66: return 'Lluvia helada ligera';
    case 67: return 'Lluvia helada intensa';
    case 71: return 'Nieve ligera';
    case 73: return 'Nieve moderada';
    case 75: return 'Nieve intensa';
    case 77: return 'Granizo';
    case 80: return 'Chubascos ligeros';
    case 81: return 'Chubascos moderados';
    case 82: return 'Chubascos intensos';
    case 85: return 'Chubascos de nieve ligeros';
    case 86: return 'Chubascos de nieve intensos';
    case 95: return 'Tormenta';
    case 96: return 'Tormenta con granizo ligero';
    case 99: return 'Tormenta con granizo intenso';
    default: return 'Despejado';
  }
};

// Función para validar la respuesta de la API
export const validateWeatherResponse = (data: any): boolean => {
  return data && 
         data.current && 
         typeof data.current.temperature_2m === 'number';
};

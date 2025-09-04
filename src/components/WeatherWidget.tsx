import React, { useState, useEffect } from 'react';
import { 
  Cloud, Sun, Moon, CloudSun, CloudMoon, CloudRain, CloudSnow, 
  CloudDrizzle, CloudFog, CloudLightning, Wind, Droplets, Thermometer, Eye 
} from 'lucide-react';
import { WEATHER_CONFIG, getWeatherApiUrl, validateWeatherResponse, mapWeatherCodeToIcon, mapWeatherCodeToDescription, isNightTime } from '../config/weather';

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  icon: string;
  city: string;
  country: string;
}

interface WeatherWidgetProps {
  city?: string;
  className?: string;
  compact?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ 
  city = "Benidorm", 
  className = "",
  compact = false
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener el icono del tiempo (colores neutros)
  const getWeatherIcon = (iconCode: string, compact: boolean = false) => {
    const size = compact ? 'w-5 h-5' : 'w-6 h-6';
    const color = 'text-gray-600 dark:text-gray-300';
    

    
    switch (iconCode) {
      case 'sun':
        return <Sun className={`${size} ${color}`} />;
      case 'moon':
        return <Moon className={`${size} ${color}`} />;
      case 'cloud':
        return <Cloud className={`${size} ${color}`} />;
      case 'cloud-sun':
        return <CloudSun className={`${size} ${color}`} />;
      case 'cloud-moon':
        return <CloudMoon className={`${size} ${color}`} />;
      case 'cloud-rain':
        return <CloudRain className={`${size} ${color}`} />;
      case 'cloud-snow':
        return <CloudSnow className={`${size} ${color}`} />;
      case 'cloud-drizzle':
        return <CloudDrizzle className={`${size} ${color}`} />;
      case 'cloud-fog':
        return <CloudFog className={`${size} ${color}`} />;
      case 'cloud-lightning':
        return <CloudLightning className={`${size} ${color}`} />;
      default:
        return <Sun className={`${size} ${color}`} />;
    }
  };

  // Función para obtener el color del background según el tiempo (colores del sistema)
  const getBackgroundClass = (iconCode: string) => {
    switch (iconCode) {
      case '01d':
      case '01n':
        return 'bg-background/80 dark:bg-background/80';
      case '02d':
      case '02n':
      case '03d':
      case '03n':
      case '04d':
      case '04n':
        return 'bg-muted/60 dark:bg-muted/60';
      case '09d':
      case '09n':
      case '10d':
      case '10n':
        return 'bg-muted/80 dark:bg-muted/80';
      case '11d':
      case '11n':
        return 'bg-muted dark:bg-muted';
      case '13d':
      case '13n':
        return 'bg-muted/60 dark:bg-muted/60';
      case '50d':
      case '50n':
        return 'bg-background/80 dark:bg-background/80';
      default:
        return 'bg-background/80 dark:bg-background/80';
    }
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        console.log(`🌤️ [WeatherWidget] Iniciando fetchWeather para: ${city}`);
        setLoading(true);
        setError(null);

        // Usar la API gratuita de OpenMeteo (sin registro ni API key)
        const apiUrl = await getWeatherApiUrl(city);
        console.log(`🔗 [WeatherWidget] URL generada: ${apiUrl}`);
        
        if (!apiUrl) {
          console.error(`❌ [WeatherWidget] No se pudieron obtener las coordenadas para ${city}`);
          throw new Error('No se pudieron obtener las coordenadas de la ciudad');
        }
        
        console.log(`📡 [WeatherWidget] Haciendo petición a: ${apiUrl}`);
        const response = await fetch(apiUrl);
        console.log(`📡 [WeatherWidget] Respuesta HTTP:`, response.status, response.statusText);

        if (!response.ok) {
          console.error(`❌ [WeatherWidget] Error HTTP:`, response.status, response.statusText);
          throw new Error('No se pudo obtener el tiempo');
        }

        const data = await response.json();
        console.log(`📊 [WeatherWidget] Datos recibidos para ${city}:`, data);
        
        if (!validateWeatherResponse(data)) {
          throw new Error('Respuesta de API inválida');
        }
        
        const weatherData = {
          temperature: Math.round(data.current.temperature_2m),
          description: mapWeatherCodeToDescription(data.current.weather_code),
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          visibility: 10, // Valor por defecto ya que no está disponible en la API simplificada
          icon: mapWeatherCodeToIcon(data.current.weather_code, isNightTime()),
          city: city,
          country: 'ES'
        };
        
        setWeather(weatherData);
      } catch (err) {
        console.error(`❌ [WeatherWidget] Error para ${city}:`, err);
        console.error(`❌ [WeatherWidget] Error stack:`, err instanceof Error ? err.stack : 'No stack available');
        console.error(`❌ [WeatherWidget] Error message:`, err instanceof Error ? err.message : 'No message available');
        
        // Si es un error de API key o red, usar fallback
        if (err instanceof Error && (err.message.includes('401') || err.message.includes('403'))) {
          setError('API no disponible');
        } else {
          setError('No se pudo cargar el tiempo');
        }
        
        // Usar datos de ejemplo para desarrollo
        setWeather({
          ...WEATHER_CONFIG.FALLBACK_WEATHER,
          city: city
        });
        setError(null); // Limpiar el error para mostrar datos de ejemplo
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city, compact]); // Agregar compact como dependencia

  if (loading) {
    return (
      <div className={`bg-muted/60 dark:bg-muted/60 rounded-lg ${compact ? 'p-3' : 'p-4'} border border-border shadow-sm backdrop-blur-sm ${className}`}>
        <div className="flex items-center space-x-3">
          <div className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} bg-gray-300 dark:bg-gray-600 rounded animate-pulse`}></div>
          <div className="flex-1 space-y-2">
            <div className={`${compact ? 'h-3' : 'h-4'} bg-gray-300 dark:bg-gray-600 rounded animate-pulse`}></div>
            <div className={`${compact ? 'h-2' : 'h-3'} bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-2/3`}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className={`bg-muted/60 dark:bg-muted/60 rounded-lg ${compact ? 'p-3' : 'p-4'} border border-border shadow-sm backdrop-blur-sm ${className}`}>
        <div className="flex items-center space-x-3">
          <Cloud className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-500 dark:text-gray-400`} />
          <div className="space-y-1">
            <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-gray-300`}>
              Tiempo no disponible
            </p>
            <p className={`${compact ? 'text-xs' : 'text-xs'} text-gray-500 dark:text-gray-400`}>
              {error || 'Error al cargar'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${getBackgroundClass(weather.icon)} rounded-lg ${compact ? 'p-3' : 'p-4'} border border-border shadow-sm backdrop-blur-sm ${className}`}>
      {compact ? (
        // Versión compacta
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3">
            {getWeatherIcon(weather.icon, true)}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {weather.description}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {weather.temperature}°C
            </p>
          </div>
        </div>
      ) : (
        // Versión completa
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getWeatherIcon(weather.icon)}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {weather.description}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {weather.temperature}°C
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border">
            <div className="flex items-center space-x-2">
              <Droplets className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{weather.humidity}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Wind className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{weather.windSpeed} m/s</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{weather.visibility} km</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Building2, Users, Sparkles, MessageCircle, Clock, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useCitiesFirebase } from '@/hooks/useCitiesFirebase';
import { City } from '@/types';
import { WeatherWidget } from './WeatherWidget';

interface CitySelectorProps {
  onCitySelect?: (city: City) => void;
}

export const CitySelector: React.FC<CitySelectorProps> = ({ onCitySelect }) => {
  const navigate = useNavigate();
  const { cities, isLoading, error, loadCities } = useCitiesFirebase();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestCity, setNearestCity] = useState<City | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Recargar ciudades cada vez que el componente se monta
  useEffect(() => {
    loadCities();
  }, [loadCities]);

  useEffect(() => {
    if (cities.length > 0) {
      console.log('🔍 [CitySelector] Datos de ciudades cargadas:', cities.map(city => ({
        name: city.name,
        profileImageUrl: city.profileImageUrl,
        profile_image_url: city.profile_image_url,
        slug: city.slug
      })));
      
      const filtered = cities.filter(city =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  }, [cities, searchTerm]);

  const handleCitySelect = async (city: City) => {
    if (onCitySelect) {
      onCitySelect(city);
    } else {
      // Navegar a la nueva ciudad
      navigate(`/chat/${city.slug}`);
      
      // Esperar un poco para que se cargue la nueva configuración
      setTimeout(async () => {
        try {
          console.log('✅ Navegando a nueva ciudad:', city.name);
        } catch (error) {
          console.error('Error navegando a nueva ciudad:', error);
        }
      }, 500);
    }
  };

  const getCityInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCityLocation = (cityName: string) => {
    // Mapeo de ciudades a provincia y país
    const cityLocationMap: { [key: string]: { province: string; country: string } } = {
      'La Vila Joiosa': { province: 'Alicante', country: 'España' },
      'Benidorm': { province: 'Alicante', country: 'España' },
      'Alicante': { province: 'Alicante', country: 'España' },
      'Elche': { province: 'Alicante', country: 'España' },
      'Torrevieja': { province: 'Alicante', country: 'España' },
      'Orihuela': { province: 'Alicante', country: 'España' },
      'Elda': { province: 'Alicante', country: 'España' },
      'Alcoy': { province: 'Alicante', country: 'España' },
      'San Vicente del Raspeig': { province: 'Alicante', country: 'España' },
      'Petrel': { province: 'Alicante', country: 'España' },
      'Villena': { province: 'Alicante', country: 'España' },
      'Denia': { province: 'Alicante', country: 'España' },
      'Calpe': { province: 'Alicante', country: 'España' },
      'Xàbia': { province: 'Alicante', country: 'España' },
      'Pilar de la Horadada': { province: 'Alicante', country: 'España' },
      'Santa Pola': { province: 'Alicante', country: 'España' },
      'Crevillente': { province: 'Alicante', country: 'España' },
      'Ibi': { province: 'Alicante', country: 'España' },
      'Altea': { province: 'Alicante', country: 'España' },
      'Finestrat': { province: 'Alicante', country: 'España' },
      'Callosa de Segura': { province: 'Alicante', country: 'España' },
      'Rojales': { province: 'Alicante', country: 'España' },
      'Guardamar del Segura': { province: 'Alicante', country: 'España' },
      'Pego': { province: 'Alicante', country: 'España' },
      'Teulada': { province: 'Alicante', country: 'España' },
      'Benissa': { province: 'Alicante', country: 'España' },
      'L\'Alfàs del Pi': { province: 'Alicante', country: 'España' },
      'Polop': { province: 'Alicante', country: 'España' },
      'La Nucía': { province: 'Alicante', country: 'España' },
      'Orba': { province: 'Alicante', country: 'España' },
      'Tàrbena': { province: 'Alicante', country: 'España' },
      'Bolulla': { province: 'Alicante', country: 'España' },
      'Callosa d\'En Sarrià': { province: 'Alicante', country: 'España' },
      'Tormos': { province: 'Alicante', country: 'España' },
      'Famorca': { province: 'Alicante', country: 'España' },
      'Castell de Castells': { province: 'Alicante', country: 'España' },
      'Benigembla': { province: 'Alicante', country: 'España' },
      'Murla': { province: 'Alicante', country: 'España' },
      'Parcent': { province: 'Alicante', country: 'España' },
      'Alcalalí': { province: 'Alicante', country: 'España' },
      'Xaló': { province: 'Alicante', country: 'España' },
      'Lliber': { province: 'Alicante', country: 'España' },
      'Senija': { province: 'Alicante', country: 'España' },
      'Calp': { province: 'Alicante', country: 'España' }
    };
    
    return cityLocationMap[cityName] || { province: 'Alicante', country: 'España' };
  };

  // Coordenadas aproximadas de las ciudades (para calcular distancia)
  const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
    'La Vila Joiosa': { lat: 38.5075, lng: -0.2335 },
    'Benidorm': { lat: 38.5382, lng: -0.1310 },
    'Alicante': { lat: 38.3452, lng: -0.4815 },
    'Elche': { lat: 38.2622, lng: -0.7012 },
    'Torrevieja': { lat: 37.9785, lng: -0.6822 },
    'Orihuela': { lat: 38.0846, lng: -0.9445 },
    'Elda': { lat: 38.4778, lng: -0.7917 },
    'Alcoy': { lat: 38.6986, lng: -0.4812 },
    'San Vicente del Raspeig': { lat: 38.3964, lng: -0.5255 },
    'Petrel': { lat: 38.4778, lng: -0.7917 },
    'Villena': { lat: 38.6372, lng: -0.8654 },
    'Denia': { lat: 38.8408, lng: 0.1057 },
    'Calpe': { lat: 38.6447, lng: 0.0455 },
    'Xàbia': { lat: 38.7894, lng: 0.1667 },
    'Pilar de la Horadada': { lat: 37.8656, lng: -0.7922 },
    'Santa Pola': { lat: 38.1917, lng: -0.5583 },
    'Crevillente': { lat: 38.2494, lng: -0.8097 },
    'Ibi': { lat: 38.6250, lng: -0.5722 },
    'Altea': { lat: 38.5989, lng: -0.0514 },
    'Finestrat': { lat: 38.5675, lng: -0.2125 },
    'Callosa de Segura': { lat: 38.1250, lng: -0.8778 },
    'Rojales': { lat: 38.0875, lng: -0.7250 },
    'Guardamar del Segura': { lat: 38.0875, lng: -0.6556 },
    'Pego': { lat: 38.8431, lng: -0.1172 },
    'Teulada': { lat: 38.7289, lng: 0.1033 },
    'Benissa': { lat: 38.7147, lng: 0.0489 },
    'L\'Alfàs del Pi': { lat: 38.5806, lng: -0.1033 },
    'Polop': { lat: 38.6222, lng: -0.1306 },
    'La Nucía': { lat: 38.6167, lng: -0.1222 },
    'Orba': { lat: 38.7806, lng: -0.0639 },
    'Tàrbena': { lat: 38.6958, lng: -0.1014 },
    'Bolulla': { lat: 38.6750, lng: -0.1111 },
    'Callosa d\'En Sarrià': { lat: 38.6500, lng: -0.1222 },
    'Tormos': { lat: 38.8014, lng: -0.0722 },
    'Famorca': { lat: 38.7319, lng: -0.2472 },
    'Castell de Castells': { lat: 38.7250, lng: -0.1944 },
    'Benigembla': { lat: 38.7569, lng: -0.1083 },
    'Murla': { lat: 38.7603, lng: -0.0833 },
    'Parcent': { lat: 38.7458, lng: -0.0667 },
    'Alcalalí': { lat: 38.7500, lng: -0.0417 },
    'Xaló': { lat: 38.7403, lng: -0.0111 },
    'Lliber': { lat: 38.7425, lng: 0.0056 },
    'Senija': { lat: 38.7281, lng: 0.0389 },
    'Calp': { lat: 38.6447, lng: 0.0455 }
  };

  // Calcular distancia entre dos puntos (fórmula de Haversine)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Detectar ubicación del usuario y encontrar ciudad más cercana
  const detectUserLocation = async () => {
    if (!navigator.geolocation) {
      console.log('Geolocalización no soportada');
      return;
    }

    setIsDetectingLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      
      console.log('📍 Ubicación detectada:', { lat: latitude, lng: longitude });
      
      // Encontrar la ciudad más cercana
      let closestCity: City | null = null;
      let minDistance = Infinity;
      
      cities.forEach(city => {
        const cityCoords = cityCoordinates[city.name];
        if (cityCoords) {
          const distance = calculateDistance(latitude, longitude, cityCoords.lat, cityCoords.lng);
          if (distance < minDistance) {
            minDistance = distance;
            closestCity = city;
          }
        }
      });
      
      if (closestCity) {
        setNearestCity(closestCity);
        console.log(`🎯 Ciudad más cercana: ${closestCity.name} (${minDistance.toFixed(1)} km)`);
      }
      
    } catch (error) {
      console.error('Error detectando ubicación:', error);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <span className="text-muted-foreground">Cargando ciudades...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Error al cargar las ciudades</h3>
            <p className="text-muted-foreground">No se pudieron cargar las ciudades disponibles</p>
          </div>
          <Button variant="outline" onClick={loadCities}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">


      {/* Search inspirado en el chat input */}
      <div className="max-w-lg mx-auto">
        <Card className="w-full rounded-[2rem] border-[0.5px] border-muted-foreground/30 bg-sidebar shadow-lg">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
              <div className="flex-1 relative">
                <Input
                  placeholder="¿Qué ciudad quieres explorar?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-none bg-transparent focus:border-none focus-visible:outline-none text-base placeholder:text-muted-foreground/70 h-auto p-0"
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                {isDetectingLocation ? (
                  <div className="flex items-center gap-1 text-primary">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                    <span className="text-xs">Detectando...</span>
                  </div>
                ) : nearestCity ? (
                  <div className="flex items-center gap-1 text-primary">
                    <Navigation className="h-3 w-3" />
                    <span className="text-xs">{nearestCity.name}</span>
                  </div>
                                ) : (
                  <button
                    onClick={detectUserLocation}
                    className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Navigation className="h-3 w-3" />
                    <span className="text-xs"></span>
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cities Grid mejorado */}
      {filteredCities.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mx-auto mb-6">
            <Building2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-3">
            {searchTerm ? 'No se encontraron ciudades' : 'No hay ciudades disponibles'}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {searchTerm 
              ? 'Intenta con otro término de búsqueda'
              : 'Pronto estarán disponibles más ciudades'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCities.map((city) => (
            <Card 
              key={city.id} 
              className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01] border border-border hover:border-border/60 overflow-hidden"
              onClick={() => handleCitySelect(city)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border-2 border-gray-400 dark:border-input">
                    <AvatarImage 
                      src={city.profileImageUrl || city.profile_image_url} 
                      alt={city.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-lg font-bold border-2 border-gray-400 dark:border-input">
                      {getCityInitials(city.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-2">
                    <CardTitle className="text-xl font-bold truncate group-hover:text-primary transition-colors">
                      {city.name}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {getCityLocation(city.name).province}, {getCityLocation(city.name).country}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* Widget del tiempo */}
                  <WeatherWidget 
                    city={city.name}
                    compact={true}
                    className="w-full"
                  />
                  
                  {city.service_tags && Array.isArray(city.service_tags) && city.service_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {city.service_tags.slice(0, 3).map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs bg-muted/50">
                          {tag}
                        </Badge>
                      ))}
                      {city.service_tags.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-muted/50">
                          +{city.service_tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                <Button 
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium transition-all duration-200 group-hover:shadow-lg"
                  size="lg"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chatear
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats mejorado */}
      {cities.length > 0 && (
        <div className="text-center pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            {filteredCities.length} de {cities.length} ciudades disponibles
          </p>
        </div>
      )}
    </div>
  );
}; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Building2, Users, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useCities } from '@/hooks/useCities';
import { City } from '@/types';

interface CitySelectorProps {
  onCitySelect?: (city: City) => void;
}

export const CitySelector: React.FC<CitySelectorProps> = ({ onCitySelect }) => {
  const navigate = useNavigate();
  const { cities, isLoading, error, loadCities } = useCities();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (cities.length > 0) {
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
          // Crear un nuevo chat automáticamente para la nueva ciudad
          // Nota: Aquí no tenemos acceso directo a handleNewChat, 
          // pero el PersistentLayout se encargará de esto
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Cargando ciudades...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <Building2 className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Error al cargar las ciudades</p>
          <Button variant="outline" onClick={loadCities}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">Selecciona tu ciudad</h1>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto">
          Encuentra el asistente virtual de tu municipio y comienza a interactuar con tu ciudad
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Cities Grid */}
      {filteredCities.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? 'No se encontraron ciudades' : 'No hay ciudades disponibles'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? 'Intenta con otro término de búsqueda'
              : 'Pronto estarán disponibles más ciudades'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCities.map((city) => (
            <Card 
              key={city.id} 
                              className="md:hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => handleCitySelect(city)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getCityInitials(city.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{city.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {city.is_public ? 'Público' : 'Privado'}
                      </Badge>
                      {city.assistant_name && (
                        <Badge variant="outline" className="text-xs">
                          {city.assistant_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    <span>Asistente IA disponible</span>
                  </div>
                  {city.service_tags && Array.isArray(city.service_tags) && city.service_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {city.service_tags.slice(0, 3).map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {city.service_tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{city.service_tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <Button 
                  className="w-full mt-4 md:group-hover:bg-primary md:group-hover:text-primary-foreground"
                  variant="outline"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Chatear
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {cities.length > 0 && (
        <div className="text-center pt-8">
          <p className="text-sm text-muted-foreground">
            {filteredCities.length} de {cities.length} ciudades disponibles
          </p>
        </div>
      )}
    </div>
  );
}; 
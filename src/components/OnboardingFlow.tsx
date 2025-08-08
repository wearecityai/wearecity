import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MapPin, 
  MessageCircle, 
  ArrowRight, 
  Building2,
  Sparkles,
  Users,
  Globe
} from 'lucide-react';
import { City } from '@/types';
import { useCities } from '@/hooks/useCities';

interface OnboardingFlowProps {
  onComplete: (city: City) => void;
  onSkip: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const navigate = useNavigate();
  const { cities, isLoading, error, loadCities } = useCities();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  React.useEffect(() => {
    loadCities();
  }, []);

  React.useEffect(() => {
    if (cities.length > 0) {
      const filtered = cities.filter(city =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  }, [cities, searchTerm]);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
  };

  const handleContinue = () => {
    if (selectedCity) {
      onComplete(selectedCity);
    }
  };

  const handleSkip = () => {
    onSkip();
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Cargando ciudades...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold">¡Bienvenido a CityChat!</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre tu ciudad y comienza a interactuar con el asistente virtual de tu municipio
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardHeader className="pb-3">
              <div className="flex justify-center mb-2">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">Chat Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Pregunta sobre trámites, servicios y eventos de tu ciudad
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-3">
              <div className="flex justify-center mb-2">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">Información Local</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Accede a información actualizada de tu municipio
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-3">
              <div className="flex justify-center mb-2">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">Servicio Ciudadano</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Resuelve dudas y gestiona trámites de forma sencilla
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* City Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Selecciona tu ciudad
            </CardTitle>
            <CardDescription>
              Encuentra el asistente virtual de tu municipio para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ciudad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Cities Grid */}
            {filteredCities.length === 0 ? (
              <div className="text-center py-8">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {filteredCities.map((city) => (
                  <Card 
                    key={city.id} 
                    className={`md:hover:shadow-lg transition-all duration-200 cursor-pointer group ${
                      selectedCity?.id === city.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleCitySelect(city)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                          {getCityInitials(city.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{city.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {city.assistant_name || `Asistente de ${city.name}`}
                          </p>
                        </div>
                        {selectedCity?.id === city.id && (
                          <Badge variant="secondary" className="ml-2">
                            Seleccionada
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={handleSkip}
            className="flex items-center gap-2"
          >
            Continuar sin seleccionar
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={!selectedCity}
            className="flex items-center gap-2"
          >
            Continuar con {selectedCity?.name}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 
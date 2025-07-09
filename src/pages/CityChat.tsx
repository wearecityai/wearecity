import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Users, MessageCircle } from 'lucide-react';
import { useCities } from '@/hooks/useCities';
import { City } from '@/types';

export const CityChat: React.FC = () => {
  const { citySlug } = useParams<{ citySlug: string }>();
  const { loadCityBySlug } = useCities();
  
  const [city, setCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCity = async () => {
      if (!citySlug) {
        setError('Slug de ciudad no válido');
        setIsLoading(false);
        return;
      }

      try {
        const cityData = await loadCityBySlug(citySlug);
        if (cityData) {
          setCity(cityData);
        } else {
          setError('Ciudad no encontrada');
        }
      } catch (err) {
        console.error('Error loading city:', err);
        setError('Error al cargar la ciudad');
      } finally {
        setIsLoading(false);
      }
    };

    loadCity();
  }, [citySlug, loadCityBySlug]);

  if (!citySlug) {
    return <Navigate to="/404" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Cargando información de la ciudad...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !city) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <div className="text-6xl mb-4">🏙️</div>
            <h2 className="text-2xl font-bold mb-2">Ciudad no encontrada</h2>
            <p className="text-muted-foreground mb-4">
              La ciudad "{citySlug}" no existe o no está disponible.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <Card className="mb-8">
            <CardHeader className="text-center">
              <div className="text-6xl mb-4">🏙️</div>
              <CardTitle className="text-3xl mb-2">
                Bienvenido a {city.name}
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                Chatea con el asistente virtual de la ciudad y obtén información 
                sobre servicios, eventos y lugares de interés.
              </p>
            </CardHeader>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="text-center p-6">
                <MapPin className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Información Local</h3>
                <p className="text-sm text-muted-foreground">
                  Encuentra lugares, servicios y puntos de interés en {city.name}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center p-6">
                <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Servicios Públicos</h3>
                <p className="text-sm text-muted-foreground">
                  Accede a información sobre trámites y servicios municipales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center p-6">
                <MessageCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Asistencia 24/7</h3>
                <p className="text-sm text-muted-foreground">
                  Obtén ayuda inmediata con nuestro asistente virtual
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <Card>
            <CardContent className="text-center p-8">
              <h3 className="text-xl font-semibold mb-4">
                ¿Listo para empezar?
              </h3>
              <p className="text-muted-foreground mb-6">
                Inicia una conversación con el asistente de {city.name} 
                y descubre todo lo que la ciudad tiene para ofrecerte.
              </p>
              <Button 
                size="lg" 
                onClick={() => {
                  // Por ahora redirigir a la página principal con el contexto de la ciudad
                  window.location.href = `/?city=${city.slug}`;
                }}
                className="gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Iniciar Chat
              </Button>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="text-center text-sm text-muted-foreground mt-8">
            <p>
              Este es el chat público de {city.name}. 
              No necesitas registrarte para usar el servicio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 
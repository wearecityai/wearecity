import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Users, MessageCircle, Lock } from 'lucide-react';
import { useCities } from '@/hooks/useCities';
import { useAuth } from '@/hooks/useAuth';
import { City } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const CityChat: React.FC = () => {
  const { citySlug } = useParams<{ citySlug: string }>();
  const { loadCityBySlug } = useCities();
  const { user, profile } = useAuth();
  
  const [city, setCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const loadCity = async () => {
      if (!citySlug) {
        setError('Slug de ciudad no válido');
        setIsLoading(false);
        return;
      }

      try {
        // Primero intentar cargar la ciudad sin restricciones
        const cityData = await loadCityBySlug(citySlug);
        
        if (!cityData) {
          setError('Ciudad no encontrada');
          setIsLoading(false);
          return;
        }

        setCity(cityData);

        // Verificar si la ciudad es pública
        if (cityData.is_public) {
          // Si es pública, redirigir al chat público
          window.location.href = `/chat/${citySlug}`;
          return;
        }

        // Si es privada, verificar si el usuario está autenticado y es el admin
        if (!user) {
          setError('Esta ciudad es privada. Necesitas iniciar sesión para acceder.');
          setIsLoading(false);
          return;
        }

        if (user.id !== cityData.admin_user_id) {
          setError('No tienes permisos para acceder a esta ciudad privada.');
          setIsLoading(false);
          return;
        }

        // Usuario autorizado
        setIsAuthorized(true);
        setIsLoading(false);

      } catch (err) {
        console.error('Error loading city:', err);
        setError('Error al cargar la ciudad');
        setIsLoading(false);
      }
    };

    loadCity();
  }, [citySlug, loadCityBySlug, user]);

  if (!citySlug) {
    return <Navigate to="/404" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Verificando acceso...</span>
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
            <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'La ciudad no existe o no tienes permisos para acceder.'}
            </p>
            {!user && (
              <Button onClick={() => window.location.href = '/auth'} className="mr-2">
                Iniciar Sesión
              </Button>
            )}
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si el usuario está autorizado, redirigir al chat principal con el contexto de la ciudad
  if (isAuthorized) {
    window.location.href = `/?city=${city.slug}`;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Redirigiendo al chat...</span>
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
                Esta es una ciudad privada. Solo el administrador puede acceder al chat.
              </p>
            </CardHeader>
          </Card>

          {/* Access Info */}
          <Card className="mb-8">
            <CardContent className="text-center p-8">
              <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-4">
                Ciudad Privada
              </h3>
              <p className="text-muted-foreground mb-6">
                Esta ciudad está configurada como privada. Solo el administrador 
                puede acceder al chat y modificar la configuración.
              </p>
              {!user ? (
                <Button onClick={() => window.location.href = '/auth'}>
                  Iniciar Sesión
                </Button>
              ) : (
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  Volver al inicio
                </Button>
              )}
            </CardContent>
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

          {/* Footer Info */}
          <div className="text-center text-sm text-muted-foreground mt-8">
            <p>
              Esta es la página de información de {city.name}. 
              El chat está disponible solo para el administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 
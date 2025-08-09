import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Users, MessageCircle, Lock } from 'lucide-react';
import { useCities } from '@/hooks/useCities';
import { useAuth } from '@/hooks/useAuth';
import { City } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const CityChat: React.FC = () => {
  const { t } = useTranslation();
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
        setError(t('publicChat.invalidSlugTitle', { defaultValue: 'Invalid chat slug' }));
        setIsLoading(false);
        return;
      }

      try {
        // Primero intentar cargar la ciudad sin restricciones
        const cityData = await loadCityBySlug(citySlug);
        
        if (!cityData) {
          setError(t('publicChat.cityNotFoundTitle', { defaultValue: 'City not found' }));
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
          setError(t('city.privateNeedsLogin', { defaultValue: 'This city is private. You must log in to access.' }));
          setIsLoading(false);
          return;
        }

        if (user.id !== cityData.admin_user_id) {
          setError(t('city.privateNoPermission', { defaultValue: 'You do not have permissions to access this private city.' }));
          setIsLoading(false);
          return;
        }

        // Usuario autorizado
        setIsAuthorized(true);
        setIsLoading(false);

      } catch (err) {
        console.error('Error loading city:', err);
        setError(t('city.errorLoading', { defaultValue: 'Error loading city' }));
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
            <span>{t('city.verifyingAccess', { defaultValue: 'Verifying access...' })}</span>
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
            <h2 className="text-2xl font-bold mb-2">{t('city.accessDenied', { defaultValue: 'Access Denied' })}</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'La ciudad no existe o no tienes permisos para acceder.'}
            </p>
            {!user && (
              <Button onClick={() => window.location.href = '/auth'} className="mr-2">
                {t('auth.login')}
              </Button>
            )}
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              {t('errors.backToHome')}
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
            <span>{t('city.redirecting', { defaultValue: 'Redirecting to chat...' })}</span>
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
                {t('city.welcomeTo', { city: city.name, defaultValue: 'Welcome to {{city}}' })}
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                {t('city.privateInfo', { defaultValue: 'This is a private city. Only the administrator can access the chat.' })}
              </p>
            </CardHeader>
          </Card>

          {/* Access Info */}
          <Card className="mb-8">
            <CardContent className="text-center p-8">
              <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-4">
                {t('city.privateCity', { defaultValue: 'Private City' })}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('city.privateCityDesc', { defaultValue: 'This city is configured as private. Only the administrator can access the chat and modify settings.' })}
              </p>
              {!user ? (
                <Button onClick={() => window.location.href = '/auth'}>
                  {t('auth.login')}
                </Button>
              ) : (
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  {t('errors.backToHome')}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="text-center p-6">
                <MapPin className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">{t('features.localInfo', { defaultValue: 'Local Information' })}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('city.findPlaces', { city: city.name, defaultValue: 'Find places, services and points of interest in {{city}}' })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center p-6">
                <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">{t('city.publicServices', { defaultValue: 'Public Services' })}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('city.accessMunicipalInfo', { defaultValue: 'Access information about municipal procedures and services' })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center p-6">
                <MessageCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">{t('city.assistance247', { defaultValue: '24/7 Assistance' })}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('city.instantHelp', { defaultValue: 'Get immediate help with our virtual assistant' })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Footer Info */}
          <div className="text-center text-sm text-muted-foreground mt-8">
            <p>
              {t('city.infoPage', { city: city.name, defaultValue: 'This is the info page for {{city}}. The chat is only available to the administrator.' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 
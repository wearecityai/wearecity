import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Bug, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const CityDebug: React.FC = () => {
  const [cities, setCities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCities = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error loading cities:', error);
        setError('Error al cargar ciudades');
        return;
      }

      setCities(data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar ciudades');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCities();
  }, []);

  const getCityUrl = (slug: string) => {
    return `${window.location.origin}/chat/${slug}`;
  };

  const testCityUrl = (slug: string) => {
    window.open(getCityUrl(slug), '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <p>Cargando ciudades...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug de Ciudades
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={loadCities}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-muted-foreground">
          Total de ciudades activas: {cities.length}
        </p>

        {cities.length === 0 ? (
          <Alert>
            <AlertDescription>No hay ciudades activas en la base de datos</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {cities.map((city, index) => (
              <Card key={city.id} className="border">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{city.name}</h4>
                    <div className="flex gap-2">
                      {city.is_public ? (
                        <Badge className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Pública
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <EyeOff className="h-3 w-3" />
                          Privada
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Slug: <code className="bg-muted px-1 rounded">{city.slug}</code>
                  </p>
                  
                  <p className="text-sm text-muted-foreground">
                    Admin: <code className="bg-muted px-1 rounded">{city.admin_user_id}</code>
                  </p>
                  
                  <p className="text-sm text-muted-foreground">
                    URL: <code className="bg-muted px-1 rounded text-xs">{getCityUrl(city.slug)}</code>
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testCityUrl(city.slug)}
                      disabled={!city.is_public}
                    >
                      Probar URL
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(getCityUrl(city.slug))}
                    >
                      Copiar URL
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 
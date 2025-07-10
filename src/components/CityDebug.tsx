import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  Alert,
  Stack,
  Chip
} from '@mui/material';
import { BugReport, Refresh, Visibility, VisibilityOff } from '@mui/icons-material';
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
          <Typography>Cargando ciudades...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReport sx={{ fontSize: 20 }} />
            <Typography variant="h6">Debug de Ciudades</Typography>
          </Box>
        }
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={loadCities}
            disabled={isLoading}
          >
            Actualizar
          </Button>
        }
      />
      <CardContent>
        <Stack spacing={2}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary">
            Total de ciudades activas: {cities.length}
          </Typography>

          {cities.length === 0 ? (
            <Alert severity="warning">
              No hay ciudades activas en la base de datos
            </Alert>
          ) : (
            <Stack spacing={2}>
              {cities.map((city, index) => (
                <Card key={city.id} variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                          {city.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {city.is_public ? (
                            <Chip
                              icon={<Visibility />}
                              label="Pública"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<VisibilityOff />}
                              label="Privada"
                              color="warning"
                              size="small"
                            />
                          )}
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        Slug: <code>{city.slug}</code>
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        Admin: <code>{city.admin_user_id}</code>
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        URL: <code>{getCityUrl(city.slug)}</code>
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => testCityUrl(city.slug)}
                          disabled={!city.is_public}
                        >
                          Probar URL
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigator.clipboard.writeText(getCityUrl(city.slug))}
                        >
                          Copiar URL
                        </Button>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}; 
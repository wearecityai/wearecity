import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Edit2, ExternalLink } from 'lucide-react';
import { useCities } from '@/hooks/useCities';
import { useAuth } from '@/hooks/useAuthFirebase';

interface CityManagerProps {
  onCityCreated?: (city: any) => void;
}

export const CityManager: React.FC<CityManagerProps> = ({ onCityCreated }) => {
  const { user } = useAuth();
  const { currentCity, isLoading, error, createAdminChat, setError } = useCitiesFirebase();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [cityName, setCityName] = useState('');
  const [citySlug, setCitySlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Auto-generar slug cuando cambia el nombre
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  };

  useEffect(() => {
    if (cityName && !citySlug) {
      setCitySlug(generateSlug(cityName));
    }
  }, [cityName, citySlug]);

  // Mostrar form de creación si el usuario no tiene ciudad
  useEffect(() => {
    if (user && !currentCity && !isLoading) {
      setShowCreateForm(true);
    }
  }, [user, currentCity, isLoading]);

  const handleCreateCity = async () => {
    if (!cityName.trim() || !citySlug.trim()) {
      setValidationError('El nombre y slug son requeridos');
      return;
    }

    if (citySlug.length < 3) {
      setValidationError('El slug debe tener al menos 3 caracteres');
      return;
    }

    setIsCreating(true);
    setValidationError('');
    setError(null);

    try {
      const newCity = await createAdminChat(cityName.trim());
      if (newCity) {
        setShowCreateForm(false);
        setCityName('');
        setCitySlug('');
        onCityCreated?.(newCity);
      }
    } catch (err) {
      console.error('Error creating city:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSlugChange = (value: string) => {
    // Validar y limpiar slug en tiempo real
    const cleanSlug = generateSlug(value);
    setCitySlug(cleanSlug);
  };

  const getCityUrl = (slug: string) => {
    return `${window.location.origin}/city/${slug}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando información de la ciudad...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ciudad actual */}
      {currentCity && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Tu Ciudad: {currentCity.name}</span>
              <Button className="rounded-full"
                variant="outline"
                size="sm"
                onClick={() => window.open(getCityUrl(currentCity.slug), '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Ver Chat Público
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>URL del Chat Público</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={getCityUrl(currentCity.slug)}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button className="rounded-full"
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(getCityUrl(currentCity.slug))}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <Input value={currentCity.name} readOnly />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={currentCity.slug} readOnly />
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Creada el: {new Date(currentCity.created_at).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario de creación */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crear Tu Ciudad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cityName">Nombre de la Ciudad</Label>
                <Input
                  id="cityName"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="Ej: Madrid, Barcelona, Valencia..."
                  disabled={isCreating}
                />
              </div>
              
              <div>
                <Label htmlFor="citySlug">URL de la Ciudad</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {window.location.origin}/city/
                  </span>
                  <Input
                    id="citySlug"
                    value={citySlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="madrid"
                    disabled={isCreating}
                    className="font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Solo letras, números y guiones. Mínimo 3 caracteres.
                </p>
              </div>

              {(validationError || error) && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {validationError || error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateCity}
                  disabled={isCreating || !cityName.trim() || !citySlug.trim()}
                  className="flex-1 rounded-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Ciudad
                    </>
                  )}
                </Button>
                
                {currentCity && (
                  <Button className="rounded-full"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={isCreating}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón para mostrar formulario si ya tiene ciudad */}
      {currentCity && !showCreateForm && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Cada administrador puede gestionar una ciudad. 
                Ya tienes "{currentCity.name}" asignada.
              </p>
              <Button className="rounded-full"
                variant="outline"
                onClick={() => setShowCreateForm(true)}
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Gestionar Ciudad
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 
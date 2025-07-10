import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCities } from '@/hooks/useCities';
import { usePublicChats } from '@/hooks/usePublicChats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Link, Settings, ExternalLink } from 'lucide-react';

export const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const { currentCity, createAdminChat, updateCityName, isLoading: cityLoading } = useCities();
  const { 
    userChats, 
    currentConfig, 
    loadChatConfig, 
    updateChatConfig, 
    isLoading: chatLoading 
  } = usePublicChats();

  const [cityName, setCityName] = useState('');
  const [assistantName, setAssistantName] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (currentCity) {
      setCityName(currentCity.name);
      setAssistantName(currentCity.assistant_name || 'Asistente de Ciudad');
      setSystemInstruction(currentCity.system_instruction || '');
      
      // Cargar configuración del chat si existe
      if (currentCity.chat_id) {
        loadChatConfig(currentCity.chat_id);
      }
    }
  }, [currentCity, loadChatConfig]);

  useEffect(() => {
    if (currentConfig) {
      setAssistantName(currentConfig.assistant_name);
      setSystemInstruction(currentConfig.system_instruction);
    }
  }, [currentConfig]);

  const handleCreateCity = async () => {
    const success = await createAdminChat('Mi Chat de Ciudad');
    if (success) {
      toast.success('¡Ciudad creada exitosamente!');
    }
  };

  const handleUpdateConfig = async () => {
    if (!currentCity?.chat_id) return;

    const success = await updateChatConfig(currentCity.chat_id, {
      assistant_name: assistantName,
      system_instruction: systemInstruction
    });

    if (success) {
      toast.success('Configuración actualizada');
      setIsEditing(false);
    }
  };

  const handleUpdateCityName = async () => {
    if (!currentCity?.chat_id) return;

    const success = await updateCityName(currentCity.chat_id, cityName);
    if (success) {
      toast.success('Nombre de ciudad actualizado');
    }
  };

  if (profile?.role !== 'administrativo') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              Solo los usuarios administradores pueden acceder a esta sección.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!currentCity) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Crear Tu Ciudad</CardTitle>
            <CardDescription>
              Como administrador, puedes crear tu propia ciudad con chat personalizado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCreateCity} 
              disabled={cityLoading}
              className="w-full"
            >
              {cityLoading ? 'Creando...' : 'Crear Mi Ciudad'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cityUrl = `${window.location.origin}/city/${currentCity.slug}`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <Button
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Settings className="w-4 h-4 mr-2" />
          {isEditing ? 'Cancelar' : 'Configurar'}
        </Button>
      </div>

      {/* Información de la Ciudad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Mi Ciudad: {currentCity.name}
          </CardTitle>
          <CardDescription>
            URL Pública: {cityUrl}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(cityUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Chat Público
            </Button>
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(cityUrl)}
            >
              Copiar Enlace
            </Button>
          </div>

          {isEditing && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label htmlFor="cityName">Nombre de la Ciudad</Label>
                <div className="flex gap-2">
                  <Input
                    id="cityName"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="Nombre de tu ciudad"
                  />
                  <Button onClick={handleUpdateCityName} disabled={cityLoading}>
                    Actualizar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuración del Asistente */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Asistente</CardTitle>
          <CardDescription>
            Personaliza cómo se comporta tu asistente de ciudad.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="assistantName">Nombre del Asistente</Label>
            <Input
              id="assistantName"
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
              placeholder="Ej: Asistente de Barcelona"
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="systemInstruction">Instrucciones del Sistema</Label>
            <Textarea
              id="systemInstruction"
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              placeholder="Define cómo debe comportarse tu asistente..."
              rows={6}
              disabled={!isEditing}
            />
          </div>

          {isEditing && (
            <div className="flex gap-2">
              <Button 
                onClick={handleUpdateConfig} 
                disabled={chatLoading}
              >
                {chatLoading ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Copy,
  ExternalLink,
  Globe,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { useAssistantConfig } from '@/hooks/useAssistantConfig';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const CityLinkManager: React.FC = () => {
  const { user } = useAuth();
  const { config, saveConfig } = useAssistantConfig();
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  
  // Generar slug basado en el nombre del asistente
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const currentSlug = generateSlug(config.assistantName);
  const publicUrl = `${window.location.origin}/chat/${currentSlug}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const togglePrivacy = async () => {
    if (!user) return;
    
    setIsUpdatingPrivacy(true);
    try {
      // Alternar el estado público/privado en la base de datos
      const { error } = await supabase
        .from('cities')
        .update({ 
          is_public: !isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('admin_user_id', user.id);

      if (error) {
        console.error('Error updating privacy:', error);
      } else {
        // Recargar la configuración para actualizar el estado
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating privacy:', error);
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const [isPublic, setIsPublic] = useState(true);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Link Público de tu Ciudad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-primary" />
                <span className="font-medium">Configuración Actual</span>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Nombre:</strong> {config.assistantName}</p>
                <p><strong>Slug:</strong> {currentSlug}</p>
                <p><strong>Idioma:</strong> {config.currentLanguageCode === 'es' ? 'Español' : config.currentLanguageCode}</p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">URL Pública</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={publicUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(publicUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(publicUrl, '_blank')}
                  disabled={!isPublic}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                El slug se actualiza automáticamente cuando cambias el nombre del asistente.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <>
                    <Eye className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Público</span>
                    <Badge variant="default" className="ml-2">
                      <Globe className="h-3 w-3 mr-1" />
                      Accesible para todos
                    </Badge>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Privado</span>
                    <Badge variant="secondary" className="ml-2">
                      Solo para ti
                    </Badge>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={togglePrivacy}
                disabled={isUpdatingPrivacy}
              >
                {isPublic ? 'Hacer Privado' : 'Hacer Público'}
              </Button>
            </div>

            {isPublic && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">Chat Público Activo</span>
                </div>
                <p className="text-sm text-green-600">
                  Tu ciudad es accesible públicamente. Cualquier usuario puede chatear con tu asistente
                  usando el link de arriba, pero no podrán modificar la configuración.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
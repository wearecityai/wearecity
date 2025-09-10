import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthFirebase';
import { useAssistantConfig } from '@/hooks/useAssistantConfig';
import { CityLinkManager } from './CityLinkManager';

export const UserProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const { config } = useAssistantConfig();

  return (
    <div className="space-y-6">
      {/* Información del Usuario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información del Usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ''} readOnly />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input value={profile?.first_name || 'No especificado'} readOnly />
              </div>
              <div>
                <Label>Apellido</Label>
                <Input value={profile?.last_name || 'No especificado'} readOnly />
              </div>
            </div>
            
            <div>
              <Label>Rol</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={profile?.role === 'administrativo' ? 'default' : 'secondary'}>
                  {profile?.role === 'administrativo' ? 'Administrador' : 'Ciudadano'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Público (solo para administradores) */}
      {profile?.role === 'administrativo' && (
        <CityLinkManager />
      )}

      {/* Información para ciudadanos */}
      {profile?.role === 'ciudadano' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Como ciudadano, puedes acceder a los chats públicos creados por los administradores.
              </p>
              <Button className="rounded-full"
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Ir al Chat Principal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  MessageCircle,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const UserProfile: React.FC = () => {
  const { user, profile } = useAuth();

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
                  {profile?.role === 'administrativo' && <Shield className="h-3 w-3 mr-1" />}
                  {profile?.role === 'administrativo' ? 'Administrador' : 'Ciudadano'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información específica por rol */}
      {profile?.role === 'administrativo' ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Panel Administrativo</h3>
              <p className="text-muted-foreground mb-4">
                Como administrador, tienes acceso a funciones avanzadas para gestionar 
                el sistema de chat de tu municipio.
              </p>
              <Badge variant="default" className="mb-4">
                Funcionalidades próximamente disponibles
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Acceso Ciudadano</h3>
              <p className="text-muted-foreground mb-4">
                Como ciudadano, puedes acceder a información municipal y realizar 
                consultas sobre servicios de tu ciudad.
              </p>
              <Badge variant="secondary" className="mb-4">
                Chat próximamente disponible
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información del sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Autenticación:</span>
              <Badge variant="default">✓ Configurada</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base de datos:</span>
              <Badge variant="default">✓ Conectada</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Perfil de usuario:</span>
              <Badge variant="default">✓ Cargado</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
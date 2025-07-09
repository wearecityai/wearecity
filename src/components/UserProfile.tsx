import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  ExternalLink, 
  Copy, 
  Edit2, 
  MessageCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePublicChats } from '@/hooks/usePublicChats';
import { PublicChat } from '@/types';

export const UserProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const { userChats, isLoading } = usePublicChats();
  const [mainChat, setMainChat] = useState<PublicChat | null>(null);

  useEffect(() => {
    if (userChats.length > 0) {
      // Mostrar el chat más reciente o el primero
      setMainChat(userChats[0]);
    }
  }, [userChats]);

  const getChatUrl = (slug: string) => {
    return `${window.location.origin}/chat/${slug}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Cargando perfil...</span>
        </CardContent>
      </Card>
    );
  }

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
      {profile?.role === 'administrativo' && mainChat && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Tu Chat Público
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Asistente</Label>
                <Input value={mainChat.assistant_name} readOnly />
              </div>
              
              <div>
                <Label>URL del Chat</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={getChatUrl(mainChat.chat_slug)}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(getChatUrl(mainChat.chat_slug))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(getChatUrl(mainChat.chat_slug), '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Estado</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={mainChat.is_public ? 'default' : 'secondary'}>
                      {mainChat.is_public ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Público
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Test
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Gestionar
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Creado: {new Date(mainChat.created_at).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acceso Rápido */}
      {profile?.role === 'administrativo' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                {mainChat 
                  ? 'Gestiona tus chats públicos y configuraciones desde el panel administrativo.'
                  : 'Crea tu primer chat público desde el panel administrativo.'
                }
              </p>
              <Button
                onClick={() => window.location.href = '/profile'}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Ir al Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información para ciudadanos */}
      {profile?.role === 'ciudadano' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Como ciudadano, puedes acceder a los chats públicos creados por los administradores.
              </p>
              <Button
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
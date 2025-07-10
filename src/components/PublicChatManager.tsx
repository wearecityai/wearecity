import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  ExternalLink, 
  Copy,
  Eye,
  EyeOff,
  Settings,
  Globe
} from 'lucide-react';
import { usePublicChats } from '@/hooks/usePublicChats';
import { useAuth } from '@/hooks/useAuth';
import { useAssistantConfig } from '@/hooks/useAssistantConfig';
import { PublicChat } from '@/types';

interface PublicChatManagerProps {
  onChatCreated?: (chat: PublicChat) => void;
}

export const PublicChatManager: React.FC<PublicChatManagerProps> = ({ onChatCreated }) => {
  const { user } = useAuth();
  const { config } = useAssistantConfig();
  const { 
    userChats, 
    isLoading, 
    error, 
    createPublicChat, 
    updateChatSlug, 
    generateSlug, 
    setError 
  } = usePublicChats();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChat, setEditingChat] = useState<PublicChat | null>(null);
  const [customSlug, setCustomSlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Auto-generar slug usando el nombre del asistente de la configuración
  useEffect(() => {
    if (config.assistantName && !customSlug && !editingChat) {
      setCustomSlug(generateSlug(config.assistantName));
    }
  }, [config.assistantName, customSlug, generateSlug, editingChat]);

  // Mostrar form de creación si no hay chats
  useEffect(() => {
    if (user && userChats.length === 0 && !isLoading) {
      setShowCreateForm(true);
    }
  }, [user, userChats.length, isLoading]);

  const handleCreateChat = async () => {
    if (customSlug.length < 3) {
      setValidationError('El slug debe tener al menos 3 caracteres');
      return;
    }

    setIsCreating(true);
    setValidationError('');
    setError(null);

    try {
      // Usar la configuración existente de la ciudad
      const newChat = await createPublicChat(
        config.assistantName, // Usar el nombre del asistente como nombre de configuración
        config.assistantName,
        config.systemInstruction,
        true // Siempre público
      );
      
      if (newChat) {
        setShowCreateForm(false);
        resetForm();
        onChatCreated?.(newChat);
      }
    } catch (err) {
      console.error('Error creating chat:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateChat = async () => {
    if (!editingChat) return;

    if (!customSlug.trim()) {
      setValidationError('El slug es requerido');
      return;
    }

    setIsUpdating(true);
    setValidationError('');
    setError(null);

    try {
      const success = await updateChatSlug(
        editingChat.id,
        customSlug.trim(),
        true // Siempre público
      );
      
      if (success) {
        setEditingChat(null);
        resetForm();
      }
    } catch (err) {
      console.error('Error updating chat:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const resetForm = () => {
    setCustomSlug('');
    setValidationError('');
  };

  const handleEditChat = (chat: PublicChat) => {
    setEditingChat(chat);
    setCustomSlug(chat.chat_slug);
    setShowCreateForm(false);
  };

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
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Cargando tus chats...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de chats existentes */}
      {userChats.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tus Chats Públicos</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCreateForm(true);
                setEditingChat(null);
                resetForm();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Chat
            </Button>
          </div>

          <div className="grid gap-4">
            {userChats.map((chat) => (
              <Card key={chat.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{chat.assistant_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{chat.config_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        <Globe className="h-3 w-3 mr-1" />
                        Público
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditChat(chat)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">URL del Chat</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={getChatUrl(chat.chat_slug)}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(getChatUrl(chat.chat_slug))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getChatUrl(chat.chat_slug), '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Creado: {new Date(chat.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de creación/edición simplificado */}
      {(showCreateForm || editingChat) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {editingChat ? 'Editar Chat Público' : 'Crear Nuevo Chat Público'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium">Configuración del Chat</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Se usará la configuración actual de tu asistente:
                </p>
                <div className="text-sm">
                  <p><strong>Asistente:</strong> {config.assistantName}</p>
                  <p><strong>Idioma:</strong> {config.currentLanguageCode === 'es' ? 'Español' : config.currentLanguageCode}</p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="customSlug">URL del Chat Público</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {window.location.origin}/chat/
                  </span>
                  <Input
                    id="customSlug"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="mi-ciudad-chat"
                    disabled={isCreating || isUpdating}
                    className="font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Solo letras, números y guiones. Mínimo 3 caracteres.
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">Chat Público</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Este chat será accesible para cualquier usuario sin necesidad de autenticación y sin opciones de personalización del asistente.
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
                  onClick={editingChat ? handleUpdateChat : handleCreateChat}
                  disabled={isCreating || isUpdating}
                  className="flex-1"
                >
                  {(isCreating || isUpdating) ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {editingChat ? 'Actualizando...' : 'Creando...'}
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      {editingChat ? 'Actualizar Chat' : 'Crear Chat Público'}
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingChat(null);
                    resetForm();
                  }}
                  disabled={isCreating || isUpdating}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón para mostrar formulario si ya tiene chats */}
      {userChats.length > 0 && !showCreateForm && !editingChat && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Crea chats públicos usando tu configuración actual de asistente. Serán accesibles para cualquier usuario.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(true);
                  setEditingChat(null);
                  resetForm();
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Crear Nuevo Chat Público
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 
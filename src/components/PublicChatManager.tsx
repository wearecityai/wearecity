import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Plus, 
  Edit2, 
  ExternalLink, 
  Copy,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { usePublicChats } from '@/hooks/usePublicChats';
import { useAuth } from '@/hooks/useAuth';
import { PublicChat } from '@/types';

interface PublicChatManagerProps {
  onChatCreated?: (chat: PublicChat) => void;
}

export const PublicChatManager: React.FC<PublicChatManagerProps> = ({ onChatCreated }) => {
  const { user } = useAuth();
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
  const [configName, setConfigName] = useState('');
  const [assistantName, setAssistantName] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Auto-generar slug cuando cambia el nombre del asistente
  useEffect(() => {
    if (assistantName && !customSlug) {
      setCustomSlug(generateSlug(assistantName));
    }
  }, [assistantName, customSlug, generateSlug]);

  // Mostrar form de creación si no hay chats
  useEffect(() => {
    if (user && userChats.length === 0 && !isLoading) {
      setShowCreateForm(true);
    }
  }, [user, userChats.length, isLoading]);

  const handleCreateChat = async () => {
    if (!configName.trim() || !assistantName.trim() || !systemInstruction.trim()) {
      setValidationError('Todos los campos son requeridos');
      return;
    }

    if (customSlug.length < 3) {
      setValidationError('El slug debe tener al menos 3 caracteres');
      return;
    }

    setIsCreating(true);
    setValidationError('');
    setError(null);

    try {
      const newChat = await createPublicChat(
        configName.trim(),
        assistantName.trim(),
        systemInstruction.trim(),
        isPublic
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
        isPublic
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
    setConfigName('');
    setAssistantName('');
    setSystemInstruction('');
    setIsPublic(false);
    setCustomSlug('');
    setValidationError('');
  };

  const handleEditChat = (chat: PublicChat) => {
    setEditingChat(chat);
    setConfigName(chat.config_name);
    setAssistantName(chat.assistant_name);
    setSystemInstruction(chat.system_instruction);
    setIsPublic(chat.is_public);
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
                      <Badge variant={chat.is_public ? "default" : "secondary"}>
                        {chat.is_public ? (
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

      {/* Formulario de creación/edición */}
      {(showCreateForm || editingChat) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {editingChat ? 'Editar Chat' : 'Crear Nuevo Chat'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="configName">Nombre de la Configuración</Label>
                <Input
                  id="configName"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="Mi Chat Personalizado"
                  disabled={isCreating || isUpdating}
                />
              </div>
              
              <div>
                <Label htmlFor="assistantName">Nombre del Asistente</Label>
                <Input
                  id="assistantName"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  placeholder="Asistente de La Vila Joiosa"
                  disabled={isCreating || isUpdating}
                />
              </div>
              
              <div>
                <Label htmlFor="systemInstruction">Instrucción del Sistema</Label>
                <textarea
                  id="systemInstruction"
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  placeholder="Eres un asistente virtual especializado en..."
                  className="w-full min-h-[100px] p-3 border border-input rounded-md resize-none"
                  disabled={isCreating || isUpdating}
                />
              </div>
              
              <div>
                <Label htmlFor="customSlug">URL Personalizada</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {window.location.origin}/chat/
                  </span>
                  <Input
                    id="customSlug"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="lavilajoiosa"
                    disabled={isCreating || isUpdating}
                    className="font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Solo letras, números y guiones. Mínimo 3 caracteres.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  disabled={isCreating || isUpdating}
                />
                <Label htmlFor="isPublic">
                  Chat Público (cualquier usuario puede acceder)
                </Label>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {isPublic ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Eye className="h-4 w-4" />
                    <span>Modo Público: Cualquier usuario puede acceder a tu chat</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-600">
                    <EyeOff className="h-4 w-4" />
                    <span>Modo Test: Solo tú puedes acceder a tu chat</span>
                  </div>
                )}
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
                      <Settings className="h-4 w-4 mr-2" />
                      {editingChat ? 'Actualizar Chat' : 'Crear Chat'}
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
                Puedes crear múltiples chats públicos con diferentes configuraciones.
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
                Crear Nuevo Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 
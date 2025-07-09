import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, ArrowLeft } from 'lucide-react';
import { usePublicChats } from '@/hooks/usePublicChats';
import { PublicChat } from '@/types';

export const PublicChatPage: React.FC = () => {
  const { chatSlug } = useParams<{ chatSlug: string }>();
  const { loadChatBySlug } = usePublicChats();
  
  const [chat, setChat] = useState<PublicChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const loadChat = async () => {
      if (!chatSlug) {
        setError('Slug de chat no válido');
        setIsLoading(false);
        return;
      }

      try {
        const chatData = await loadChatBySlug(chatSlug);
        if (chatData) {
          setChat(chatData);
        } else {
          setError('Chat no encontrado');
        }
      } catch (err) {
        console.error('Error loading chat:', err);
        setError('Error al cargar el chat');
      } finally {
        setIsLoading(false);
      }
    };

    loadChat();
  }, [chatSlug, loadChatBySlug]);

  if (!chatSlug) {
    return <Navigate to="/404" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Cargando chat...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold mb-2">Chat no encontrado</h2>
            <p className="text-muted-foreground mb-4">
              El chat "{chatSlug}" no existe o no está disponible.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showChat) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChat(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{chat.assistant_name}</h1>
                <p className="text-sm text-muted-foreground">{chat.config_name}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Aquí iría el ChatContainer con la configuración específica */}
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🚧</div>
              <h3 className="text-lg font-semibold mb-2">Chat en Desarrollo</h3>
              <p className="text-muted-foreground">
                El chat con {chat.assistant_name} estará disponible pronto.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                <h4 className="font-medium mb-2">Configuración del Asistente:</h4>
                <p className="text-sm text-muted-foreground">
                  {chat.system_instruction}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <Card className="mb-8">
            <CardHeader className="text-center">
              <div className="text-6xl mb-4">🤖</div>
              <CardTitle className="text-3xl mb-2">
                {chat.assistant_name}
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                {chat.config_name}
              </p>
            </CardHeader>
          </Card>

          {/* Chat Info */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Sobre este Asistente</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  {chat.system_instruction}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status Badge */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-2">Estado del Chat</h3>
                  <p className="text-sm text-muted-foreground">
                    {chat.is_public 
                      ? 'Este chat es público y está disponible para todos los usuarios.'
                      : 'Este chat está en modo test y solo es accesible para el administrador.'
                    }
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  chat.is_public 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {chat.is_public ? 'Público' : 'Test'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card>
            <CardContent className="text-center p-8">
              <h3 className="text-xl font-semibold mb-4">
                ¿Listo para chatear?
              </h3>
              <p className="text-muted-foreground mb-6">
                Inicia una conversación con {chat.assistant_name} 
                y descubre cómo puede ayudarte.
              </p>
              <Button 
                size="lg" 
                onClick={() => setShowChat(true)}
                className="gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Iniciar Chat
              </Button>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="text-center text-sm text-muted-foreground mt-8">
            <p>
              Creado el {new Date(chat.created_at).toLocaleDateString()}
              {chat.updated_at && chat.updated_at !== chat.created_at && (
                <span> • Actualizado el {new Date(chat.updated_at).toLocaleDateString()}</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 
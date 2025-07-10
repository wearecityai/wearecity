import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, ArrowLeft } from 'lucide-react';
import { usePublicChats } from '@/hooks/usePublicChats';
import { useAuth } from '@/hooks/useAuth';
import { useApiInitialization } from '@/hooks/useApiInitialization';
import { useAppState } from '@/hooks/useAppState';
import AppContainer from '@/components/AppContainer';
import { PublicChat } from '@/types';

export const PublicChatPage: React.FC = () => {
  const { chatSlug } = useParams<{ chatSlug: string }>();
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { isGeminiReady, appError, setAppError, setIsGeminiReady } = useApiInitialization();
  const { loadChatBySlug, loadChatConfig } = usePublicChats();
  
  const [chat, setChat] = useState<PublicChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  // App state hooks para el chat funcional
  const {
    theme,
    isMobile,
    currentView,
    setCurrentView,
    chatTitles,
    selectedChatIndex,
    setSelectedChatIndex,
    isMenuOpen,
    setIsMenuOpen,
    chatConfig,
    setChatConfig,
    saveConfig,
    userLocation,
    geolocationStatus,
    googleMapsScriptLoaded,
    messages,
    isLoading: chatIsLoading,
    handleSendMessage,
    handleSeeMoreEvents,
    clearMessages,
    currentThemeMode,
    toggleTheme,
    handleNewChat,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    deleteConversation,
    shouldShowChatContainer
  } = useAppState();

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
          
          // Cargar configuración del chat y aplicarla
          const config = await loadChatConfig(chatData.id);
          if (config) {
            const newChatConfig = {
              assistantName: config.assistant_name,
              systemInstruction: config.system_instruction,
              recommendedPrompts: config.recommended_prompts || [],
              serviceTags: config.service_tags || [],
              enableGoogleSearch: config.enable_google_search,
              allowMapDisplay: config.allow_map_display,
              allowGeolocation: config.allow_geolocation,
              currentLanguageCode: config.current_language_code,
              procedureSourceUrls: config.procedure_source_urls || [],
              uploadedProcedureDocuments: config.uploaded_procedure_documents || {},
              sedeElectronicaUrl: config.sede_electronica_url,
              restrictedCity: config.restricted_city,
              profileImageUrl: undefined
            };
            setChatConfig(newChatConfig);
          }
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
  }, [chatSlug, loadChatBySlug, loadChatConfig, setChatConfig]);

  const handleLogin = () => {
    navigate('/auth');
  };

  if (!chatSlug) {
    return <Navigate to="/404" replace />;
  }

  // Show loading state while auth or chat is initializing
  if (authLoading || isLoading) {
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

  // Si el chat está listo y se solicita mostrarlo, usar AppContainer completo
  if (showChat) {
    return (
      <AppContainer
        toggleTheme={toggleTheme}
        currentThemeMode={currentThemeMode}
        user={user}
        profile={profile}
        onLogin={handleLogin}
        theme={theme}
        isMobile={isMobile}
        isGeminiReady={isGeminiReady}
        appError={appError}
        currentView="chat"  // Forzar vista de chat
        setCurrentView={() => {}}  // No permitir cambios de vista
        chatTitles={chatTitles}
        selectedChatIndex={selectedChatIndex}
        setSelectedChatIndex={setSelectedChatIndex}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        chatConfig={chatConfig}
        setChatConfig={setChatConfig}
        saveConfig={saveConfig}
        userLocation={userLocation}
        geolocationStatus={geolocationStatus}
        googleMapsScriptLoaded={googleMapsScriptLoaded}
        messages={messages}
        isLoading={chatIsLoading}
        handleSendMessage={handleSendMessage}
        handleSeeMoreEvents={handleSeeMoreEvents}
        clearMessages={clearMessages}
        setAppError={setAppError}
        setIsGeminiReady={setIsGeminiReady}
        handleNewChat={handleNewChat}
        conversations={conversations}
        currentConversationId={currentConversationId}
        setCurrentConversationId={setCurrentConversationId}
        deleteConversation={deleteConversation}
        shouldShowChatContainer={shouldShowChatContainer}
        isPublicChat={true}  // Marcar como chat público
      />
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
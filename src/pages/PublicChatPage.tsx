import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApiInitialization } from '@/hooks/useApiInitialization';
import { useAppState } from '@/hooks/useAppState';
import AppContainer from '@/components/AppContainer';
import { supabase } from '@/integrations/supabase/client';

interface CityChat {
  id: string;
  name: string;
  slug: string;
  assistant_name: string | null;
  system_instruction: string | null;
  recommended_prompts: any;
  service_tags: any;
  enable_google_search: boolean | null;
  allow_map_display: boolean | null;
  allow_geolocation: boolean | null;
  current_language_code: string | null;
  procedure_source_urls: any;
  uploaded_procedure_documents: any;
  sede_electronica_url: string | null;
  restricted_city: any;
  created_at: string | null;
  updated_at: string | null;
}

export const PublicChatPage: React.FC = () => {
  const { chatSlug } = useParams<{ chatSlug: string }>();
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { isGeminiReady, appError, setAppError, setIsGeminiReady } = useApiInitialization();
  
  const [city, setCity] = useState<CityChat | null>(null);
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
    const loadCity = async () => {
      if (!chatSlug) {
        setError('Slug de ciudad no válido');
        setIsLoading(false);
        return;
      }

      try {
        // Cargar ciudad por slug directamente desde la tabla cities
        const { data: cityData, error: cityError } = await supabase
          .from('cities')
          .select('*')
          .eq('slug', chatSlug)
          .eq('is_active', true)
          .maybeSingle();

        if (cityError) {
          console.error('Error loading city:', cityError);
          setError('Error al cargar la ciudad');
          return;
        }

        if (cityData) {
          setCity(cityData);
          
          // Helper functions para parsear datos JSON
          const safeParseJsonArray = (value: any, fallback: any[]): any[] => {
            if (Array.isArray(value)) return value;
            if (typeof value === 'string') {
              try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : fallback;
              } catch {
                return fallback;
              }
            }
            return fallback;
          };

          const safeParseJsonObject = (value: any, fallback: any): any => {
            if (typeof value === 'object' && value !== null) return value;
            if (typeof value === 'string') {
              try {
                return JSON.parse(value);
              } catch {
                return fallback;
              }
            }
            return fallback;
          };
          
          // Aplicar configuración de la ciudad al chat
          const newChatConfig = {
            assistantName: cityData.assistant_name || 'Asistente de Ciudad',
            systemInstruction: cityData.system_instruction || 'Soy un asistente inteligente que ayuda a los ciudadanos.',
            recommendedPrompts: safeParseJsonArray(cityData.recommended_prompts, []),
            serviceTags: safeParseJsonArray(cityData.service_tags, []),
            enableGoogleSearch: cityData.enable_google_search ?? true,
            allowMapDisplay: cityData.allow_map_display ?? true,
            allowGeolocation: cityData.allow_geolocation ?? true,
            currentLanguageCode: cityData.current_language_code || 'es',
            procedureSourceUrls: safeParseJsonArray(cityData.procedure_source_urls, []),
            uploadedProcedureDocuments: safeParseJsonObject(cityData.uploaded_procedure_documents, {}),
            sedeElectronicaUrl: cityData.sede_electronica_url || '',
            restrictedCity: safeParseJsonObject(cityData.restricted_city, null),
            profileImageUrl: undefined
          };
          setChatConfig(newChatConfig);
        } else {
          setError('Ciudad no encontrada');
        }
      } catch (err) {
        console.error('Error loading city:', err);
        setError('Error al cargar la ciudad');
      } finally {
        setIsLoading(false);
      }
    };

    loadCity();
  }, [chatSlug, setChatConfig]);

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

  if (error || !city) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold mb-2">Ciudad no encontrada</h2>
            <p className="text-muted-foreground mb-4">
              La ciudad "{chatSlug}" no existe o no está disponible.
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
                {city.assistant_name || city.name}
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                {city.name}
              </p>
            </CardHeader>
          </Card>

          {/* Chat Info */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Sobre este Asistente</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  {city.system_instruction || 'Soy un asistente inteligente que ayuda a los ciudadanos.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* City Info */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-2">Información de la Ciudad</h3>
                  <p className="text-sm text-muted-foreground">
                    Este asistente está configurado para ayudar específicamente con información sobre {city.name}.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Público
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
                Inicia una conversación con {city.assistant_name || city.name} 
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
              Creado el {city.created_at ? new Date(city.created_at).toLocaleDateString() : 'Fecha no disponible'}
              {city.updated_at && city.updated_at !== city.created_at && (
                <span> • Actualizado el {new Date(city.updated_at).toLocaleDateString()}</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 
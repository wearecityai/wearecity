import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApiInitialization } from '@/hooks/useApiInitialization';
import { useAppState } from '@/hooks/useAppState';
import AppContainer from '@/components/AppContainer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';


export const PublicChatPage: React.FC = () => {
  const { chatSlug } = useParams<{ chatSlug: string }>();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { isGeminiReady, appError, setAppError, setIsGeminiReady } = useApiInitialization();
  
  const [city, setCity] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    shouldShowChatContainer,
    handleToggleLocation
  } = useAppState(chatSlug); // Pasar el citySlug al hook

  useEffect(() => {
    const loadCity = async () => {
      if (!chatSlug) {
        setError('Slug de ciudad no válido');
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 [PublicChatPage] Buscando ciudad con slug:', chatSlug);
        console.log('🔍 [PublicChatPage] Usuario autenticado:', !!user);
        console.log('🔍 [PublicChatPage] Estado de carga de auth:', authLoading);
        
        // Cargar ciudad por slug directamente desde la tabla cities
        const { data: cityData, error: cityError } = await supabase
          .from('cities')
          .select('*')
          .eq('slug', chatSlug)
          .eq('is_active', true)
          .eq('is_public', true)
          .maybeSingle();

        console.log('📊 [PublicChatPage] Resultado de la búsqueda:', { 
          cityData, 
          cityError,
          hasData: !!cityData,
          errorMessage: cityError?.message,
          errorCode: cityError?.code
        });

        if (cityError) {
          console.error('❌ [PublicChatPage] Error loading city:', cityError);
          setError(`Error al cargar la ciudad: ${cityError.message}`);
          return;
        }

        if (cityData) {
          console.log('✅ [PublicChatPage] Ciudad encontrada:', {
            id: cityData.id,
            slug: cityData.slug,
            assistant_name: cityData.assistant_name,
            is_active: cityData.is_active,
            is_public: cityData.is_public
          });
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
          
          // Aplicar configuración de la ciudad al chat - usando la misma lógica que useAssistantConfig
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
          
          console.log('🔧 Configuración del chat público cargada:', {
            assistantName: newChatConfig.assistantName,
            systemInstruction: newChatConfig.systemInstruction,
            recommendedPrompts: newChatConfig.recommendedPrompts,
            serviceTags: newChatConfig.serviceTags,
            enableGoogleSearch: newChatConfig.enableGoogleSearch,
            allowMapDisplay: newChatConfig.allowMapDisplay,
            allowGeolocation: newChatConfig.allowGeolocation,
            currentLanguageCode: newChatConfig.currentLanguageCode
          });
          
          setChatConfig(newChatConfig);
        } else {
          setError('Ciudad no encontrada o no es pública');
        }
      } catch (err) {
        console.error('Error loading city:', err);
        setError('Error al cargar la ciudad');
      } finally {
        setIsLoading(false);
      }
    };

    loadCity();
  }, [chatSlug, setChatConfig]); // Añadir setChatConfig como dependencia

  const handleLogin = () => {
    window.location.href = '/auth';
  };

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

  // Handle missing chatSlug more gracefully
  if (!chatSlug) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">Slug de chat no válido</h2>
            <p className="text-muted-foreground mb-4">
              La URL del chat no es válida. Verifica que el enlace sea correcto.
            </p>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Volver al inicio
            </Button>
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
              La ciudad "{chatSlug}" no existe o no está disponible públicamente.
            </p>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Usar AppContainer directamente - igual que la home pero con la config de la ciudad
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
      currentView="chat"
      setCurrentView={setCurrentView}
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
      isPublicChat={true}
      handleToggleLocation={handleToggleLocation}
    />
  );
}; 
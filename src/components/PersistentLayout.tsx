import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApiInitialization } from '@/hooks/useApiInitialization';
import { useAppState } from '@/hooks/useAppState';
import { SidebarProvider, SidebarTrigger, SidebarInset } from './ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { NavActions } from './nav-actions';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from './ui/breadcrumb';
import { Separator } from './ui/separator';
import { useAppHandlers } from '@/hooks/useAppHandlers';
import { useAppAuth } from '@/hooks/useAppAuth';
import { CitySelector } from './CitySelector';
import { OnboardingFlow } from './OnboardingFlow';
import MainContent from './MainContent';
import FinetuningPage from './FinetuningPage';
import { City } from '@/types';
import { Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { useSimpleViewport } from '@/hooks/useSimpleViewport';

interface User {
  id: string;
  email?: string;
}

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'ciudadano' | 'administrativo';
  created_at: string;
  updated_at: string;
}

const PersistentLayout: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { isGeminiReady, appError, setAppError, setIsGeminiReady } = useApiInitialization();
  const { viewportHeight, isSafari, isKeyboardOpen } = useSimpleViewport();
  
  // Estado para el onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  
  // Estado para controlar la vista de búsqueda de ciudades
  const [showCitySearch, setShowCitySearch] = useState(false);
  
  // Extraer citySlug de la URL
  const getCitySlug = () => {
    const path = location.pathname;
    if (path.startsWith('/chat/') || path.startsWith('/city/')) {
      // Extraer el slug de la ruta, ignorando parámetros de búsqueda
      const pathParts = path.split('/');
      const slug = pathParts[2]; // /chat/valencia -> valencia
      return slug || params.chatSlug || params.citySlug;
    }
    return undefined;
  };

  const citySlug = getCitySlug();

  // App state hooks
  const {
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
    isLoading,
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
  } = useAppState(citySlug);

  const {
    handleNewChat: handleNewChatClick,
    handleSelectChat,
    handleMenuToggle,
    handleOpenFinetuning,
    handleOpenSettings
  } = useAppHandlers({
    chatConfig,
    setChatConfig,
    saveConfig,
    setCurrentView,
    setIsMenuOpen,
    setSelectedChatIndex,
    selectedChatIndex,
    isMobile,
    appError,
    setAppError,
    clearMessages,
    handleNewChat,
    setCurrentConversationId,
    conversations
  });

  const { handleOpenFinetuningWithAuth } = useAppAuth({
    user,
    profile,
    onLogin: () => navigate('/auth'),
    handleOpenFinetuning
  });

  const handleCitySelect = async (city: City) => {
    // Cerrar la vista de búsqueda
    setShowCitySearch(false);
    
    // Navegar a la nueva ciudad (sin parámetros de búsqueda)
    navigate(`/chat/${city.slug}`);
    
    // Esperar un poco para que se cargue la nueva configuración
    setTimeout(async () => {
      try {
        // Crear un nuevo chat automáticamente para la nueva ciudad
        await handleNewChat();
        console.log('✅ Nuevo chat creado automáticamente para:', city.name);
      } catch (error) {
        console.error('Error creando nuevo chat automáticamente:', error);
      }
    }, 500); // Esperar 500ms para que se cargue la configuración de la ciudad
  };

  // Función para mostrar la vista de búsqueda de ciudades
  const handleShowCitySearch = () => {
    setShowCitySearch(true);
  };

  // Función para volver al chat de la ciudad actual
  const handleBackToChat = () => {
    setShowCitySearch(false);
  };

  // Función para manejar nuevo chat cuando estás en modo búsqueda
  const handleNewChatInSearchMode = async () => {
    setShowCitySearch(false);
    // Crear nuevo chat para la ciudad actual
    await handleNewChat();
  };

  // Función para manejar selección de conversación cuando estás en modo búsqueda
  const handleSelectChatInSearchMode = (index: number) => {
    setShowCitySearch(false);
    handleSelectChat(index);
  };

  // Detectar si el usuario es nuevo (no tiene conversaciones)
  useEffect(() => {
    const checkIfNewUser = async () => {
      // Solo verificar si el usuario está autenticado y no hemos verificado aún
      if (user && !hasCheckedOnboarding && !authLoading) {
        try {
          // Verificar si el usuario tiene conversaciones
          const { data: conversations, error } = await supabase
            .from('conversations')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

          if (error) {
            console.error('Error checking user conversations:', error);
            return;
          }

          // Si no tiene conversaciones, mostrar onboarding
          if (!conversations || conversations.length === 0) {
            console.log('👋 Usuario nuevo detectado, mostrando onboarding');
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error('Error checking if user is new:', error);
        } finally {
          setHasCheckedOnboarding(true);
        }
      }
    };

    checkIfNewUser();
  }, [user, authLoading, hasCheckedOnboarding]);

  // Manejar la selección de ciudad en el onboarding
  const handleOnboardingComplete = async (city: City) => {
    setShowOnboarding(false);
    await handleCitySelect(city);
  };

  // Manejar el skip del onboarding
  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    // Navegar a la página principal
    navigate('/');
  };

  // Cargar configuración de la ciudad cuando cambia la URL
  React.useEffect(() => {
    const loadCityConfig = async () => {
      const citySlug = getCitySlug();
      
      // Cargar si hay un citySlug válido (independientemente de la vista)
      if (citySlug) {
        try {
          console.log('🔍 Cargando configuración para ciudad:', citySlug);
          
          // Cargar datos de la ciudad desde Supabase
          const { data: cityData, error } = await supabase
            .from('cities')
            .select('*')
            .eq('slug', citySlug)
            .eq('is_public', true)
            .single();

          if (error) {
            console.error('Error cargando ciudad:', error);
            return;
          }

          if (cityData) {
            // Función helper para parsear JSON de forma segura
            const safeParseJsonArray = (value: any, defaultValue: any[] = []) => {
              if (!value) return defaultValue;
              try {
                return typeof value === 'string' ? JSON.parse(value) : value;
              } catch {
                return defaultValue;
              }
            };

            const safeParseJsonObject = (value: any, defaultValue: any = null) => {
              if (!value) return defaultValue;
              try {
                return typeof value === 'string' ? JSON.parse(value) : value;
              } catch {
                return defaultValue;
              }
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
              profileImageUrl: cityData.profile_image_url || undefined
            };

            console.log('🔧 Configuración de ciudad cargada:', {
              cityName: cityData.name,
              assistantName: newChatConfig.assistantName,
              restrictedCity: newChatConfig.restrictedCity
            });

            setChatConfig(newChatConfig);
          }
        } catch (error) {
          console.error('Error cargando configuración de ciudad:', error);
        }
      }
    };

    loadCityConfig();
  }, [location.pathname, location.search]); // Incluir location.search para detectar cambios en parámetros

  // Determinar qué contenido mostrar basado en la ruta actual
  const getCurrentContent = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const isDiscoverPage = searchParams.get('focus') === 'search';

    // Mostrar onboarding si está activo
    if (showOnboarding) {
      return (
        <OnboardingFlow 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      );
    }

    // Vista de búsqueda de ciudades (estado local)
    if (showCitySearch) {
      return (
        <div className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto px-4 py-8">
            <CitySelector onCitySelect={handleCitySelect} />
          </div>
        </div>
      );
    }

    // Vista de descubrir ciudades (cuando focus=search está presente) - mantener para compatibilidad
    if (isDiscoverPage) {
      return (
        <div className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto px-4 py-8">
            <CitySelector onCitySelect={handleCitySelect} />
          </div>
        </div>
      );
    }

    // Página principal y admin - selector de ciudades
    if (path === '/' || path === '/admin') {
      return (
        <div className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto px-4 py-8">
            <CitySelector onCitySelect={handleCitySelect} />
          </div>
        </div>
      );
    }

    // Página de chat específico - mostrar el chat real de la ciudad
    if (path.startsWith('/chat/') || path.startsWith('/city/')) {
      return (
        <MainContent
          theme={null}
          isMobile={isMobile}
          isMenuOpen={isMenuOpen}
          handleMenuToggle={handleMenuToggle}
          currentThemeMode={currentThemeMode}
          toggleTheme={toggleTheme}
          handleOpenSettings={handleOpenSettings}
          user={user}
          onLogin={() => navigate('/auth')}
          messages={messages}
          isLoading={isLoading}
          appError={appError}
          chatConfig={chatConfig}
          handleSendMessage={handleSendMessage}
          handleDownloadPdf={() => {}} // Implementar si es necesario
          handleSeeMoreEvents={handleSeeMoreEvents}
          handleSetCurrentLanguageCode={() => {}} // Implementar si es necesario
          shouldShowChatContainer={shouldShowChatContainer}
          handleToggleLocation={handleToggleLocation}
        />
      );
    }

    // Página de finetuning (configuración)
    if (currentView === 'finetuning') {
      return (
        <FinetuningPage
          currentConfig={chatConfig}
          onSave={handleOpenFinetuning}
          onCancel={() => setCurrentView('chat')}
          googleMapsScriptLoaded={googleMapsScriptLoaded}
          apiKeyForMaps=""
          profileImagePreview={undefined}
          setProfileImagePreview={() => {}}
          activeTab={0}
          onTabChange={() => {}}
        />
      );
    }

    // Contenido por defecto
    return (
      <div className="flex-1 overflow-auto bg-background">
        <div className="container mx-auto px-4 py-8">
          <CitySelector onCitySelect={handleCitySelect} />
        </div>
      </div>
    );
  };

  // Determinar el título del breadcrumb
  const getBreadcrumbTitle = () => {
    return (
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg text-foreground">
          CityCore
        </span>
        <Badge variant="outline" className="text-xs">1.0</Badge>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div 
        className="overflow-hidden bg-background flex w-full"
        style={{ 
          height: viewportHeight,
          minHeight: viewportHeight
        }}
      >
        <AppSidebar 
          onNewChat={showCitySearch ? handleNewChatInSearchMode : handleNewChatClick}
          onOpenFinetuning={handleOpenFinetuningWithAuth}
          chatTitles={chatTitles}
          chatIds={conversations.map(c => c.id)}
          selectedChatIndex={selectedChatIndex}
          onSelectChat={showCitySearch ? handleSelectChatInSearchMode : handleSelectChat}
          onDeleteChat={deleteConversation}
          chatConfig={chatConfig}
          userLocation={userLocation}
          geolocationStatus={geolocationStatus}
          isPublicChat={false}
          handleToggleLocation={handleToggleLocation}
          onCitySelect={handleCitySelect}
          onShowCitySearch={handleShowCitySearch}
          isInSearchMode={showCitySearch}
        />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    {typeof getBreadcrumbTitle() === 'string' ? (
                      <BreadcrumbPage className="line-clamp-1">
                        {getBreadcrumbTitle()}
                      </BreadcrumbPage>
                    ) : (
                      <div className="flex items-center gap-2">
                        {getBreadcrumbTitle()}
                      </div>
                    )}
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto px-3">
              <NavActions />
            </div>
          </header>
          
          <div className="flex flex-1 flex-col overflow-hidden">
            {getCurrentContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default PersistentLayout; 
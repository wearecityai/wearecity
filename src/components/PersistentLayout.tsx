import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApiInitialization } from '@/hooks/useApiInitialization';
import { useAppState } from '@/hooks/useAppState';
import { useCityNavigation } from '@/hooks/useCityNavigation';
import { useInitialNavigation } from '@/hooks/useInitialNavigation';
import { useSidebarVisibility } from '@/hooks/useSidebarVisibility';
import { LoadingScreen } from './ui/loading-screen';
import { ChatSkeleton } from './ui/chat-skeleton';
import { ChatPreloader } from './ui/chat-preloader';
import { FullScreenLoader } from './ui/full-screen-loader';
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
import AdminMetrics from '@/pages/AdminMetrics';
import { City } from '@/types';
import { Sparkles, Building2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { db } from '@/integrations/firebase/config';
import { doc, getDoc, setDoc, query, where, collection, getDocs, limit } from 'firebase/firestore';
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
  console.log('🚀 PersistentLayout component rendering...');
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { user, profile, isLoading: authLoading } = useAuth();
  
  console.log('🔐 PersistentLayout auth state:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    authLoading, 
    profileRole: profile?.role 
  });
  const { isGeminiReady, appError, setAppError, setIsGeminiReady } = useApiInitialization();
  const { viewportHeight, isSafari, isKeyboardOpen } = useSimpleViewport();
  // Evitar flashes de loaders al volver de background
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [safetyTimeout, setSafetyTimeout] = useState(false);
  
  // Estado para el onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  // Pestaña activa de Finetuning: 0=customize, 1=share
  const [finetuningActiveTab, setFinetuningActiveTab] = useState(0);
  // Estado de ciudad del admin
  const [adminCitySlug, setAdminCitySlug] = useState<string | null>(null);
  const [adminCityLoading, setAdminCityLoading] = useState(false);
  
  // Estado para controlar la vista de búsqueda de ciudades
  const [showCitySearch, setShowCitySearch] = useState(false);
  
  // Hook para manejar la navegación de ciudades
  const {
    updateLastVisitedCity,
    loading: cityNavigationLoading
  } = useCityNavigation();
  
  // Hook para controlar la visibilidad del sidebar
  const { shouldShowSidebar } = useSidebarVisibility();
  
  // Usar hook para navegación inicial
  const { isNavigating } = useInitialNavigation();

  // Verificación más estricta de todos los estados necesarios
  // Separar la carga inicial de la app de la carga del chat
  const isAppInitialized = user && 
    profile && 
    !authLoading && 
    !cityNavigationLoading && 
    !isNavigating;
    
  // Verificar si la autenticación está en progreso
  const isAuthInProgress = authLoading || (!user && !profile);

  // Al volver a la pestaña, dar un margen para evitar flashes de loaders
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        setIsResuming(true);
        window.setTimeout(() => setIsResuming(false), 800);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Extraer citySlug de la URL
  const getCitySlug = () => {
    const path = location.pathname;
    if (path.startsWith('/chat/') || path.startsWith('/city/') || path.startsWith('/admin/')) {
      // Extraer el slug de la ruta, ignorando parámetros de búsqueda
      const pathParts = path.split('/');
      const slug = pathParts[2];
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
    isFullyLoaded,
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

  // Verificación más estable que no cambie durante el uso normal de la app
  const isAppFullyInitialized = isAppInitialized && chatConfig;
  
  // Asegurar que chatConfig tenga un valor válido
  const safeChatConfig = chatConfig || {
    assistantName: 'City Assistant',
    systemInstruction: 'Eres un asistente de ciudad amigable y útil.',
    currentLanguageCode: 'es',
    restrictedCity: null,
    recommendedPrompts: [],
    uploadedProcedureDocuments: []
  };
  
  // Debug logging para entender el estado de inicialización
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.log('🔍 Debug - Initialization state:', {
        user: !!user,
        profile: !!profile,
        authLoading,
        cityNavigationLoading,
        isNavigating,
        chatConfig: !!chatConfig,
        isAppInitialized,
        isAppFullyInitialized,
        isFullyLoaded,
        isLoading
      });
    }
  }, [user, profile, authLoading, cityNavigationLoading, isNavigating, chatConfig, isAppInitialized, isAppFullyInitialized, isFullyLoaded, isLoading]);

  // Redirigir a autenticación si no hay usuario después de un tiempo razonable
  useEffect(() => {
    if (!user && !authLoading && !isResuming) {
      const timer = setTimeout(() => {
        console.log('🔍 No user found after timeout, redirecting to auth');
        window.location.href = '/auth';
      }, 5000); // 5 segundos de espera

      return () => clearTimeout(timer);
    }
  }, [user, authLoading, isResuming]);

  // Additional safety timeout that depends on chatConfig (after it's declared)
  useEffect(() => {
    // Only run this effect if chatConfig is available
    if (!chatConfig) return;
    
    // No activar timeout si la app ya está funcionando normalmente
    if (isAppInitialized && chatConfig) {
      return;
    }
    
    const timer = setTimeout(() => {
      if (!isAppFullyInitialized && !isResuming) {
        console.log('🔍 Production Debug - App not fully initialized:', {
          user: !!user,
          profile: !!profile,
          authLoading,
          cityNavigationLoading,
          isNavigating,
          chatConfig: !!chatConfig,
          restrictedCity: !!chatConfig?.restrictedCity,
          isFullyLoaded,
          isLoading
        });
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [chatConfig, isAppInitialized, isAppFullyInitialized, isResuming, user, profile, authLoading, cityNavigationLoading, isNavigating, isFullyLoaded, isLoading]);

  // Safety timeout para evitar carga infinita en producción
  useEffect(() => {
    // Solo activar timeout si realmente hay un problema de inicialización
    // No activar si la app ya está funcionando normalmente
    if (isAppInitialized && chatConfig) {
      return; // La app ya está funcionando, no necesitamos timeout
    }

    const timer = setTimeout(() => {
      if (!isAppFullyInitialized && !isResuming) {
        console.warn('⚠️ Safety timeout triggered - forcing app initialization');
        console.log('🔍 Debug - Current state:', {
          user: !!user,
          profile: !!profile,
          authLoading,
          cityNavigationLoading,
          isNavigating,
          chatConfig: !!chatConfig,
          isFullyLoaded,
          isLoading
        });
        setSafetyTimeout(true);
      }
    }, 15000); // Aumentado a 15 segundos para ser menos agresivo

    // Timeout extremo solo para casos realmente críticos
    const extremeTimer = setTimeout(() => {
      if (!isAppInitialized) {
        console.error('🚨 EXTREME TIMEOUT - Force app to work without full config');
        setSafetyTimeout(true);
      }
    }, 30000); // Aumentado a 30 segundos

    return () => {
      clearTimeout(timer);
      clearTimeout(extremeTimer);
    };
  }, [isAppInitialized, isAppFullyInitialized, isResuming, user, profile, authLoading, cityNavigationLoading, isNavigating, chatConfig, isFullyLoaded, isLoading]);

  // Cargar ciudad del admin y redirigir a /admin/:slug si existe
  useEffect(() => {
    const loadAdminCity = async () => {
      if (!user || profile?.role !== 'administrativo') return;
      setAdminCityLoading(true);
      try {
        // Buscar ciudad del admin en Firebase
        const cityId = `city_${user.id}`;
        const cityDoc = await getDoc(doc(db, 'cities', cityId));
        
        if (cityDoc.exists()) {
          const cityData = cityDoc.data();
          if (cityData.isActive) {
            setAdminCitySlug(cityData.slug);
            // En cualquier ruta admin distinta, navegar a su slug
            if (location.pathname.startsWith('/admin') && location.pathname !== `/admin/${cityData.slug}`) {
              navigate(`/admin/${cityData.slug}`, { replace: true });
            }
          } else {
            setAdminCitySlug(null);
          }
        } else {
          setAdminCitySlug(null);
        }
      } catch (e) {
        console.error('Error loading admin city:', e);
        setAdminCitySlug(null);
      } finally {
        setAdminCityLoading(false);
      }
    };

    loadAdminCity();
  }, [user, profile?.role]);

  // Enforce admin-only access to their own admin route; allow admins to view public chats under /chat/:slug
  useEffect(() => {
    if (profile?.role !== 'administrativo') return;
    const path = location.pathname;
    // Admins can access public chats at /chat/:slug like any citizen
    // If admin on /admin/:slug but slug doesn't match their own, redirect to own
    if (path.startsWith('/admin/')) {
      const current = getCitySlug();
      if (adminCitySlug && current && current !== adminCitySlug) {
        navigate(`/admin/${adminCitySlug}`, { replace: true });
      }
    }
  }, [profile?.role, location.pathname, adminCitySlug, adminCityLoading]);

  // Crear ciudad para admin
  const handleCreateAdminCity = async () => {
    if (!user || profile?.role !== 'administrativo') return;
    setAdminCityLoading(true);
    try {
      const defaultName = 'Mi Ciudad';
      // Generar slug local
      const newSlug = defaultName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      // Crear ciudad en Firebase con ID predictible
      const cityId = `city_${user.id}`;
      const cityData = {
        name: defaultName,
        slug: newSlug,
        adminUserId: user.id,
        isActive: true,
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        assistantName: defaultName,
        systemInstruction: '',
        recommendedPrompts: [],
        serviceTags: [],
        enableGoogleSearch: true,
        allowMapDisplay: true,
        allowGeolocation: true,
        currentLanguageCode: 'es',
        procedureSourceUrls: [],
        uploadedProcedureDocuments: [],
        restrictedCity: null,
        sedeElectronicaUrl: null,
        agendaEventosUrls: null,
        profileImageUrl: null
      };
      
      await setDoc(doc(db, 'cities', cityId), cityData);
      
      setAdminCitySlug(newSlug);
      navigate(`/admin/${newSlug}`, { replace: true });
      // Opcional: abrir configuración justo después de crear
      setCurrentView('finetuning');
    } catch (error) {
      console.error('Error creating admin city:', error);
    } finally {
      setAdminCityLoading(false);
    }
  };

  const {
    handleNewChat: handleNewChatClick,
    handleSelectChat,
    handleMenuToggle,
    handleSaveCustomization,
    handleOpenFinetuning,
    handleOpenSettings,
    handleOpenMetrics
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

  // Wrapper to ensure views open over any search overlays
  const openFinetuningFromSidebar = () => {
    console.log('🎯 Opening finetuning view via auth wrapper');
    setShowCitySearch(false);
    handleOpenFinetuningWithAuth();
  };

  const openMetricsFromSidebar = () => {
    console.log('🎯 Opening metrics view');
    setShowCitySearch(false);
    handleOpenMetrics();
  };

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

  // Detectar si el usuario es nuevo (no tiene conversaciones) - TEMPORAL DISABLED
  useEffect(() => {
    // Temporalmente deshabilitado durante la migración Firebase
    // TODO: Reimplementar con Firebase cuando sea necesario
    if (user && !hasCheckedOnboarding && !authLoading) {
      setHasCheckedOnboarding(true);
      console.log('🔧 Onboarding check disabled during Firebase migration');
      // No mostrar onboarding por ahora para facilitar pruebas
    }
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
          
          // Cargar datos de la ciudad desde Firebase
          const citiesQuery = query(
            collection(db, 'cities'),
            where('slug', '==', citySlug),
            where('isPublic', '==', true),
            limit(1)
          );
          const citySnapshot = await getDocs(citiesQuery);
          
          if (citySnapshot.empty) {
            console.warn('Ciudad pública no encontrada:', citySlug, '- usando configuración admin');
            // Para admins, si no hay ciudad pública, usar la configuración que ya se cargó
            if (profile?.role === 'administrativo') {
              return; // La configuración admin ya se cargó desde useAssistantConfig
            }
            return;
          }
          
          const cityData = citySnapshot.docs[0].data();

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

            // Aplicar configuración de la ciudad al chat (Firebase usa camelCase)
            const newChatConfig = {
              assistantName: cityData.assistantName || 'Asistente de Ciudad',
              systemInstruction: cityData.systemInstruction || 'Soy un asistente inteligente que ayuda a los ciudadanos.',
              recommendedPrompts: cityData.recommendedPrompts || [],
              serviceTags: cityData.serviceTags || [],
              enableGoogleSearch: cityData.enableGoogleSearch ?? true,
              allowMapDisplay: cityData.allowMapDisplay ?? true,
              allowGeolocation: cityData.allowGeolocation ?? true,
              currentLanguageCode: cityData.currentLanguageCode || 'es',
              procedureSourceUrls: cityData.procedureSourceUrls || [],
              uploadedProcedureDocuments: cityData.uploadedProcedureDocuments || {},
              sedeElectronicaUrl: cityData.sedeElectronicaUrl || '',
              agendaEventosUrls: cityData.agendaEventosUrls || [],
              restrictedCity: cityData.restrictedCity || null,
              profileImageUrl: cityData.profileImageUrl || undefined
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
  }, [location.pathname, location.search]);

  // Actualizar última ciudad visitada cuando cambie la ciudad
  useEffect(() => {
    const updateLastVisited = async () => {
      if (!user || profile?.role !== 'ciudadano' || !citySlug) {
        return;
      }

      try {
        await updateLastVisitedCity(citySlug);
      } catch (error) {
        console.error('Error updating last visited city:', error);
      }
    };

    updateLastVisited();
  }, [citySlug, user, profile?.role, updateLastVisitedCity]);

  // Determinar qué contenido mostrar basado en la ruta actual
  const getCurrentContent = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const isDiscoverPage = searchParams.get('focus') === 'search';
    
    console.log('🔍 getCurrentContent called:', { 
      currentView, 
      path, 
      isAppInitialized, 
      isResuming,
      safetyTimeout,
      chatConfigExists: !!chatConfig,
      isNavigating,
      isFullyLoaded,
      restrictedCity: chatConfig?.restrictedCity,
      profileRole: profile?.role,
      showOnboarding,
      showCitySearch,
      isAppFullyInitialized
    });

    // ABSOLUTE PRIORITY: Vista controls override ALL other conditions
    // These must be checked first before any loading or config conditions
    console.log('🎯 HIGHEST PRIORITY: Checking currentView first');
    
    // Página de finetuning (configuración) tiene prioridad ABSOLUTA
    if (currentView === 'finetuning') {
      console.log('🎯 Rendering FinetuningPage view - ABSOLUTE PRIORITY');
      return (
        <FinetuningPage
          currentConfig={chatConfig}
          onSave={handleSaveCustomization}
          onCancel={() => setCurrentView('chat')}
          googleMapsScriptLoaded={googleMapsScriptLoaded}
          apiKeyForMaps=""
          profileImagePreview={undefined}
          setProfileImagePreview={() => {}}
          activeTab={finetuningActiveTab}
          onTabChange={setFinetuningActiveTab}
        />
      );
    }

    // Página de métricas (solo admins) tiene prioridad ABSOLUTA
    if (currentView === 'metrics') {
      console.log('🎯 Rendering AdminMetrics view - ABSOLUTE PRIORITY');
      return <AdminMetrics />;
    }

    // Verificación adicional: solo mostrar loading inicial si no estamos reanudando
    // O si se activó el safety timeout
    if ((!isAppInitialized && !isResuming) || safetyTimeout) {
      console.log('🔄 EARLY RETURN: App initialization or safety timeout condition met');
      if (safetyTimeout && !isAppInitialized) {
        console.log('🚨 Safety timeout active - showing fallback content');
        return (
          <div className="flex-1 overflow-auto bg-background">
            <div className="container mx-auto px-4 py-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Problema de Carga</h2>
                <p className="text-muted-foreground mb-6">
                  La aplicación está tardando más de lo esperado en cargar. 
                  Intenta recargar la página o contacta con soporte.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Recargar Página
                </Button>
              </div>
            </div>
          </div>
        );
      }
      console.log('🔄 EARLY RETURN: Full screen loader');
      return (
        <FullScreenLoader size="md" />
      );
    }

    // Si estamos navegando inicialmente, mostrar skeleton del chat para mantener layout
    if (isNavigating) {
      console.log('🔄 EARLY RETURN: Navigation in progress');
      return (
        <div className="flex-1 overflow-auto bg-background">
          <ChatSkeleton />
        </div>
      );
    }
    
    // Solo mostrar ChatPreloader durante la carga inicial de la app, no durante el chat
    if (!isFullyLoaded && !isResuming && !isAppInitialized) {
      console.log('🔄 EARLY RETURN: ChatPreloader');
      return (
        <div className="flex-1 overflow-auto bg-background">
          <ChatPreloader 
            cityName={chatConfig?.restrictedCity?.name || "tu ciudad"}
          />
        </div>
      );
    }

    // Para administradores: verificar si tienen configuración básica, no restrictedCity
    if (profile?.role === 'administrativo' && (!chatConfig || !chatConfig.assistantName)) {
      console.log('🔄 EARLY RETURN: Admin without basic config');
      return (
        <div className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Configura tu Ciudad</h2>
              <p className="text-muted-foreground mb-6">
                Para comenzar, necesitas configurar tu ciudad en el panel de administración.
              </p>
              <Button onClick={() => setCurrentView('finetuning')}>
                Configurar Ciudad
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Para administradores con configuración válida: ir directamente al chat
    if (profile?.role === 'administrativo' && chatConfig && chatConfig.assistantName) {
      console.log('✅ Admin with valid config - proceeding to chat view');
      // Los administradores van directamente al chat, continúa con el flujo normal
    }

    // Si no hay configuración de ciudad y el usuario es ciudadano, mostrar selector
    if (!chatConfig?.restrictedCity && profile?.role === 'ciudadano') {
      console.log('🔄 EARLY RETURN: Citizen without city config');
      return (
        <div className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto px-4 py-8">
            <CitySelector onCitySelect={handleCitySelect} />
          </div>
        </div>
      );
    }

    // Si no hay configuración de ciudad pero la app está inicializada, mostrar chat básico (solo para ciudadanos)
    if (!chatConfig?.restrictedCity && isAppFullyInitialized && profile?.role !== 'administrativo') {
      console.log('🔄 EARLY RETURN: No city config but app initialized (citizen)');
      return (
        <div className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Bienvenido a City Chat</h2>
              <p className="text-muted-foreground mb-6">
                Selecciona una ciudad para comenzar a chatear.
              </p>
              <Button onClick={() => setShowCitySearch(true)}>
                Seleccionar Ciudad
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Mostrar onboarding si está activo
    if (showOnboarding) {
      console.log('🔄 EARLY RETURN: Onboarding active');
      return (
        <OnboardingFlow 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      );
    }

    // Vista de búsqueda de ciudades (estado local)
    if (showCitySearch) {
      console.log('🔄 EARLY RETURN: City search active');
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

    // Página principal y admin: si hay slug de admin, mostrar chat;
    // si no, mostrar selector o vacío admin.
    if (path === '/' || path === '/admin' || path.startsWith('/admin/')) {
      const slug = getCitySlug();
      // Si admin y no tiene ciudad creada, mostrar estado vacío con botón de crear
      if (profile?.role === 'administrativo' && !adminCityLoading && !adminCitySlug) {
        return (
          <div className="flex-1 overflow-auto bg-background">
            <div className="container mx-auto px-4 py-10 flex flex-col items-center text-center gap-4">
              <div className="flex items-center justify-center w-20 h-20 rounded-full border border-border/40 bg-muted/30">
                <Building2 className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <div className="text-xl font-semibold">{t('city.noCityConfigured', { defaultValue: 'No hay ninguna ciudad configurada' })}</div>
                <div className="text-sm text-muted-foreground">{t('city.createCityHint', { defaultValue: 'Crea tu ciudad para comenzar a configurar tu asistente' })}</div>
              </div>
              <Button onClick={handleCreateAdminCity} disabled={adminCityLoading}>
                {t('city.createCity', { defaultValue: 'Crear ciudad' })}
              </Button>
            </div>
          </div>
        );
      }

      if (path.startsWith('/admin/') && slug) {
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
            handleDownloadPdf={() => {}}
            handleSeeMoreEvents={handleSeeMoreEvents}
            handleSetCurrentLanguageCode={() => {}}
            shouldShowChatContainer={shouldShowChatContainer}
            handleToggleLocation={handleToggleLocation}
            geolocationStatus={geolocationStatus}
          />
        );
      }
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
          geolocationStatus={geolocationStatus}
        />
      );
    }

    // (finetuning ya tratado arriba)

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
          WeAreCity
        </span>
        <Badge variant="outline" className="text-xs">Beta</Badge>
      </div>
    );
  };

  // Solo considerar isFullyLoaded para la carga inicial, no para el chat
  const isCompletelyReady = isAppFullyInitialized && isFullyLoaded;

  // Solo mostrar loader general si la app no está inicializada
  if (!isAppInitialized && !isResuming) {
    // Log para debugging en producción
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.log('🔍 Production Debug - App not initialized:', {
        user: !!user,
        profile: !!profile,
        authLoading,
        cityNavigationLoading,
        isNavigating,
        chatConfig: !!chatConfig,
        restrictedCity: !!chatConfig?.restrictedCity
      });
    }
    
    // Si no hay usuario y no está cargando, redirigir a autenticación
    console.log('🔍 Checking auth redirect condition:', { user: !!user, authLoading });
    // DISABLED: This was causing incorrect redirects for authenticated users
    // if (!user && !authLoading) {
    //   console.log('🔍 No user found, redirecting to auth');
    //   window.location.href = '/auth';
    //   return null;
    // }
    
    // Si la autenticación está en progreso, mostrar loader
    if (isAuthInProgress) {
      return (
        <FullScreenLoader size="lg" />
      );
    }
    
    // Si hay un problema con la autenticación, mostrar mensaje de error
    if (!user && !authLoading) {
      return (
        <div className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Error de Autenticación</h2>
              <p className="text-muted-foreground mb-6">
                No se pudo autenticar tu sesión. Por favor, inicia sesión nuevamente.
              </p>
              <Button onClick={() => window.location.href = '/auth'}>
                Ir a Autenticación
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <FullScreenLoader size="lg" />
    );
  }

  return (
    <SidebarProvider>
      <div 
        className="overflow-hidden bg-background flex w-full layout-transition layout-stable"
        style={{ 
          height: viewportHeight,
          minHeight: viewportHeight
        }}
      >
        {shouldShowSidebar && (
          <AppSidebar 
            onNewChat={showCitySearch ? handleNewChatInSearchMode : handleNewChatClick}
            onOpenFinetuning={openFinetuningFromSidebar}
            onOpenMetrics={openMetricsFromSidebar}
            chatTitles={chatTitles}
            chatIds={conversations.map(c => c.id)}
            selectedChatIndex={selectedChatIndex}
            onSelectChat={showCitySearch ? handleSelectChatInSearchMode : handleSelectChat}
            onDeleteChat={deleteConversation}
            chatConfig={safeChatConfig}
            userLocation={userLocation}
            geolocationStatus={geolocationStatus}
            isPublicChat={false}
            handleToggleLocation={handleToggleLocation}
            onCitySelect={handleCitySelect}
            onShowCitySearch={handleShowCitySearch}
            isInSearchMode={showCitySearch}
            className="sidebar-transition sidebar-stable"
          />
        )}
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 layout-transition">
            <div className="flex flex-1 items-center gap-2 px-3">
              {shouldShowSidebar && <SidebarTrigger />}
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
          
          <div className="flex flex-1 flex-col overflow-hidden fade-in chat-transition">
            {getCurrentContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default PersistentLayout; 
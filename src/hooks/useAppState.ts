import { useEffect, useState, useRef } from 'react';
import { useThemeContext } from '../theme/ThemeProvider';
import { useGeolocation } from './useGeolocation';
import { useApiInitialization } from './useApiInitialization';
import { useGoogleMaps } from './useGoogleMaps';
import { useChatManager } from './useChatManager';
import { useAssistantConfig } from './useAssistantConfig';
import { useConversations } from './useConversations';
import { MessageRole, CustomChatConfig } from '../types';
import { supabase } from '../integrations/supabase/client';
import { DEFAULT_CHAT_CONFIG } from '../constants';

// Custom hook for mobile detection to replace MUI's useMediaQuery
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  return isMobile;
};

export const useAppState = (citySlug?: string) => {
  const isMobile = useIsMobile();
  
  // Use theme context instead of local state
  const { currentThemeMode, toggleTheme } = useThemeContext();
  
  // Track processed place cards to prevent infinite loops
  const processedCardsRef = useRef<Set<string>>(new Set());
  
  const [currentView, setCurrentView] = useState<'chat' | 'finetuning'>('chat');
  const [selectedChatIndex, setSelectedChatIndex] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);

  const { isGeminiReady, setIsGeminiReady, appError, setAppError } = useApiInitialization();
  
  // Gestión de configuración: usar hook para admin o estado local para chats públicos
  const assistantConfigHook = useAssistantConfig();
  const [publicChatConfig, setPublicChatConfig] = useState<CustomChatConfig>(DEFAULT_CHAT_CONFIG);
  
  // Mantener la última ciudad configurada para cuando estemos en la página de descubrir
  const [lastCityConfig, setLastCityConfig] = useState<CustomChatConfig | null>(null);
  
  // Decidir qué configuración usar según si es chat público o no
  // Si no hay citySlug (página de descubrir), usar la última ciudad configurada
  const effectiveCitySlug = citySlug;
  const chatConfig = effectiveCitySlug ? publicChatConfig : assistantConfigHook.config;
  const setChatConfig = effectiveCitySlug ? setPublicChatConfig : assistantConfigHook.setConfig;
  
  // Guardar la configuración actual como última ciudad cuando cambie
  useEffect(() => {
    if (citySlug && chatConfig?.restrictedCity) {
      setLastCityConfig(chatConfig);
    }
  }, [citySlug, chatConfig?.restrictedCity]);
  
  const saveConfig = effectiveCitySlug ? 
    // Para chats públicos, solo guardar en localStorage
    async (config: CustomChatConfig) => {
      localStorage.setItem('chatConfig', JSON.stringify(config));
      setPublicChatConfig(config);
      return true;
    } : 
    assistantConfigHook.saveConfig;

  const { userLocation, geolocationError, geolocationStatus, startLocationTracking, stopLocationTracking } = useGeolocation();

  const { googleMapsScriptLoaded, fetchPlaceDetailsAndUpdateMessage, loadGoogleMapsScript, placesServiceRef, testGooglePlacesAPI } = useGoogleMaps(
    userLocation,
    chatConfig.currentLanguageCode || 'es',
    setAppError
  );

  // Fetch Google Maps API key from backend
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        // Get the API key from the backend edge function
        const response = await fetch('https://irghpvvoparqettcnpnh.functions.supabase.co/chat-ia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage: 'test',
            requestType: 'get_api_key'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.apiKey) {
            console.log('✅ Retrieved Google Maps API key from backend');
            setGoogleMapsApiKey(data.apiKey);
            return;
          }
        }
        
        console.warn('⚠️ Could not retrieve API key from backend, using fallback');
        setGoogleMapsApiKey('AIzaSyBHL5n8B2vCcQIZKVVLE2zVBgS4aYclt7g');
      } catch (error) {
        console.error('❌ Error fetching API key:', error);
        setGoogleMapsApiKey('AIzaSyBHL5n8B2vCcQIZKVVLE2zVBgS4aYclt7g');
      }
    };

    if (!googleMapsApiKey) {
      fetchApiKey();
    }
  }, []); // Remove googleMapsApiKey dependency to prevent infinite loops

  // Load Google Maps script on app initialization
  useEffect(() => {
    if (googleMapsApiKey && !googleMapsScriptLoaded) {
      console.log('🔍 Loading Google Maps script with API key:', googleMapsApiKey ? `${googleMapsApiKey.substring(0, 10)}...` : 'NO API KEY');
      loadGoogleMapsScript(googleMapsApiKey);
    } else if (!googleMapsApiKey) {
      console.log('⏳ Waiting for Google Maps API key...');
    }
  }, [googleMapsApiKey, googleMapsScriptLoaded, loadGoogleMapsScript]);

  // Test Google Places API when script is loaded
  useEffect(() => {
    if (googleMapsScriptLoaded) {
      console.log('🔍 Google Maps script loaded, testing Places API...');
      // Delay the test to ensure everything is initialized
      setTimeout(() => {
        testGooglePlacesAPI();
      }, 1000);
    }
  }, [googleMapsScriptLoaded, testGooglePlacesAPI]);

  // Use conversations hook directly here with citySlug
  const { 
    conversations, 
    currentConversationId, 
    setCurrentConversationId,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    loadConversations
  } = useConversations(citySlug);

  const { 
    messages, 
    isLoading, 
    handleSendMessage, 
    handleSeeMoreEvents, 
    clearMessages, 
    setMessages,
    handleNewChat
  } = useChatManager(
    chatConfig,
    userLocation,
    isGeminiReady,
    setAppError,
    setIsGeminiReady,
    // Pass conversation functions to useChatManager
    {
      conversations,
      currentConversationId,
      setCurrentConversationId,
      createConversation,
      updateConversationTitle
    },
    citySlug
  );

  // Clear processed cards when starting a new conversation
  useEffect(() => {
    if (messages.length === 0) {
      processedCardsRef.current.clear();
    }
  }, [messages.length]);

  // Handle menu overflow effect
  useEffect(() => {
    if (isMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen, isMobile]);

  // Handle place cards loading - Fixed to prevent infinite loops
  useEffect(() => {
    if (!googleMapsScriptLoaded) {
      return;
    }
    
    if (!placesServiceRef.current) {
      return;
    }
    
    // Clear processed cards when messages change significantly
    if (messages.length === 0) {
      processedCardsRef.current.clear();
      return;
    }
    
    messages.forEach((msg, msgIndex) => {
      if (msg.role === MessageRole.Model && msg.placeCards) {
        msg.placeCards.forEach((card, cardIndex) => {
          // Create a unique identifier for this card
          const cardKey = `${msg.id}-${card.id}`;
          
          // Solo cargar si:
          // 1. Está en estado de carga
          // 2. Tiene placeId o searchQuery
          // 3. NO ha sido procesada antes
          // 4. NO tiene datos ya cargados
          if (card.isLoadingDetails && 
              (card.placeId || card.searchQuery) && 
              !processedCardsRef.current.has(cardKey) &&
              !card.rating && 
              !card.address && 
              !card.errorDetails) {
            
            console.log(`✅ Processing place card: ${card.name}`);
            processedCardsRef.current.add(cardKey);
            
            fetchPlaceDetailsAndUpdateMessage(msg.id, card.id, card.placeId, card.searchQuery, setMessages);
          }
        });
      }
    });
  }, [messages, googleMapsScriptLoaded]); // Removed problematic dependencies

  // Update selectedChatIndex when currentConversationId changes
  useEffect(() => {
    if (currentConversationId) {
      const index = conversations.findIndex(c => c.id === currentConversationId);
      if (index !== -1 && index !== selectedChatIndex) {
        setSelectedChatIndex(index);
      }
    }
  }, [currentConversationId, conversations, selectedChatIndex]);

  // --- INICIO: Estado para controlar la visibilidad del ChatContainer ---
  const [shouldShowChatContainer, setShouldShowChatContainer] = useState(false);
  
  // Resetear shouldShowChatContainer cuando no hay mensajes
  useEffect(() => {
    if (messages.length === 0) {
      setShouldShowChatContainer(false);
    }
  }, [messages.length]);
  
  // Envoltorio para handleSendMessage que añade y elimina el mensaje temporal
  const handleSendMessageWithTyping = async (inputText: string) => {
    // Si es el primer mensaje, activar inmediatamente el ChatContainer
    if (messages.length === 0) {
      setShouldShowChatContainer(true);
    }
    
    try {
      // Llamar a handleSendMessage que añadirá el mensaje del usuario
      await handleSendMessage(inputText);
    } catch (error) {
      console.error('Error in handleSendMessageWithTyping:', error);
      // En caso de error, resetear el estado si no hay mensajes
      if (messages.length === 0) {
        setShouldShowChatContainer(false);
      }
      throw error;
    }
  };
  // --- FIN: Estado para controlar la visibilidad del ChatContainer ---

  // Función para manejar el toggle de geolocalización
  const handleToggleLocation = async (enabled: boolean) => {
    const updatedConfig = { ...chatConfig, allowGeolocation: enabled };
    setChatConfig(updatedConfig);
    
    if (enabled) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
    
    await saveConfig(updatedConfig);
  };

  return {
    isMobile,
    currentThemeMode,
    toggleTheme,
    isGeminiReady,
    setIsGeminiReady,
    appError,
    setAppError,
    currentView,
    setCurrentView,
    chatTitles: conversations.map(c => c.title),
    selectedChatIndex,
    setSelectedChatIndex,
    isMenuOpen,
    setIsMenuOpen,
    chatConfig,
    setChatConfig,
    saveConfig,
    userLocation,
    geolocationError,
    geolocationStatus,
    googleMapsScriptLoaded,
    messages,
    isLoading,
    handleSendMessage: handleSendMessageWithTyping,
    handleSeeMoreEvents,
    clearMessages,
    setMessages,
    handleNewChat,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    deleteConversation,
    shouldShowChatContainer,
    handleToggleLocation
  };
};

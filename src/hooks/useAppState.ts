import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useThemeContext } from '../theme/ThemeProvider';
import { useAutoGeolocation } from './useAutoGeolocation';
import { usePersistentGeolocation } from './usePersistentGeolocation';
import { useApiInitialization } from './useApiInitialization';
import { useGoogleMaps } from './useGoogleMaps';
import { useChatManager } from './useChatManager';
import { useAssistantConfig } from './useAssistantConfig';
import { useConversations } from './useConversations';
import { useAuth } from './useAuth';
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
  const { profile } = useAuth();
  
  // Use theme context instead of local state
  const { currentThemeMode, toggleTheme } = useThemeContext();
  
  // Track processed place cards to prevent infinite loops
  const processedCardsRef = useRef<Set<string>>(new Set());
  
  const [currentView, setCurrentView] = useState<'chat' | 'finetuning' | 'metrics'>('chat');
  const [selectedChatIndex, setSelectedChatIndex] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);

  const { isGeminiReady, setIsGeminiReady, appError, setAppError } = useApiInitialization();
  
  // Gestión de configuración: usar hook para admin o estado local para chats públicos
  const assistantConfigHook = useAssistantConfig();
  const [publicChatConfig, setPublicChatConfig] = useState<CustomChatConfig>(DEFAULT_CHAT_CONFIG);
  
  // Mantener la última ciudad configurada para cuando estemos en la página de descubrir
  const [lastCityConfig, setLastCityConfig] = useState<CustomChatConfig | null>(null);
  
  // Decidir qué configuración usar según el rol del usuario
  // Los administradores siempre usan su configuración personal, ciudadanos usan configuración pública
  const isAdmin = profile?.role === 'administrativo';
  console.log('🔍 useAppState config decision:', { citySlug, isAdmin, profileRole: profile?.role });
  
  const chatConfig = isAdmin ? assistantConfigHook.config : publicChatConfig;
  const setChatConfig = isAdmin ? assistantConfigHook.setConfig : setPublicChatConfig;
  
  // Agregar estado de carga inicial para administradores
  const configHasLoadedInitially = isAdmin ? assistantConfigHook.hasLoadedInitially : true;
  
  // Guardar la configuración actual como última ciudad cuando cambie
  useEffect(() => {
    if (citySlug && chatConfig?.restrictedCity) {
      setLastCityConfig(chatConfig);
    }
  }, [citySlug, chatConfig?.restrictedCity]);
  
  const saveConfig = isAdmin ? 
    // Para administradores, usar la función de guardado de Firebase
    assistantConfigHook.saveConfig :
    // Para ciudadanos, solo guardar en localStorage
    async (config: CustomChatConfig) => {
      localStorage.setItem('chatConfig', JSON.stringify(config));
      setPublicChatConfig(config);
      return true;
    };

  // Usar geolocalización persistente en lugar de auto-geolocalización
  const { userLocation, geolocationStatus, isHealthy: geolocationHealthy } = usePersistentGeolocation();

  const { googleMapsScriptLoaded, fetchPlaceDetailsAndUpdateMessage, loadGoogleMapsScript, placesServiceRef, testGooglePlacesAPI } = useGoogleMaps(
    userLocation,
    chatConfig.currentLanguageCode || 'es',
    setAppError
  );

  // Geolocalización ya se inicia automáticamente con useAutoGeolocation

  // Use fallback Google Maps API key (Supabase backend no longer available)
  useEffect(() => {
    if (!googleMapsApiKey) {
      console.log('🗝️ Using fallback Google Maps API key');
      setGoogleMapsApiKey('AIzaSyBHL5n8B2vCcQIZKVVLE2zVBgS4aYclt7g');
    }
  }, [googleMapsApiKey]);

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
    isLoading: conversationsLoading
  } = useConversations(citySlug);

  const { 
    messages, 
    isLoading: chatLoading, 
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

  // Combinar estados de carga para evitar parpadeos
  // Solo usar chatLoading para el estado de carga del chat, no conversationsLoading
  const isLoading = chatLoading;
  
  // Estado adicional para verificar si la configuración está completamente cargada
  // No requerir restrictedCity para evitar bucles infinitos
  const isConfigReady = chatConfig && chatConfig.assistantName;
  
  // Estado de carga consolidado que incluye la configuración
  const isFullyLoaded = !isLoading && isConfigReady;

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
        console.log(`🔍 DEBUG - Message ${msgIndex} has ${msg.placeCards.length} place cards:`, msg.placeCards.map(c => ({ name: c.name, isLoadingDetails: c.isLoadingDetails, placeId: c.placeId, searchQuery: c.searchQuery })));
        
        msg.placeCards.forEach((card, cardIndex) => {
          // Create a unique identifier for this card
          const cardKey = `${msg.id}-${card.id}`;
          
          console.log(`🔍 DEBUG - Processing place card ${cardIndex}: ${card.name}`, {
            cardKey,
            isLoadingDetails: card.isLoadingDetails,
            hasPlaceId: !!card.placeId,
            hasSearchQuery: !!card.searchQuery,
            alreadyProcessed: processedCardsRef.current.has(cardKey),
            hasRating: !!card.rating,
            hasAddress: !!card.address,
            hasPhotoUrl: !!card.photoUrl,
            hasWebsite: !!card.website,
            hasError: !!card.errorDetails
          });
          
          // Solo cargar si:
          // 1. Está en estado de carga
          // 2. Tiene placeId o searchQuery
          // 3. NO ha sido procesada antes
          // 4. NO tiene datos ya cargados (rating, address, photoUrl, etc.)
          // 5. NO tiene error
          if (card.isLoadingDetails && 
              (card.placeId || card.searchQuery) && 
              !processedCardsRef.current.has(cardKey) &&
              !card.rating && 
              !card.address && 
              !card.photoUrl &&
              !card.website &&
              !card.errorDetails) {
            
            console.log(`✅ Processing place card: ${card.name}`);
            processedCardsRef.current.add(cardKey);
            
            fetchPlaceDetailsAndUpdateMessage(msg.id, card.id, card.placeId, card.searchQuery, setMessages);
          } else if (processedCardsRef.current.has(cardKey) && card.isLoadingDetails) {
            // Si la tarjeta ya fue procesada pero sigue en estado de carga,
            // marcar como no procesada para reintentar
            console.log(`🔄 Re-processing place card: ${card.name} (was marked as processed but still loading)`);
            processedCardsRef.current.delete(cardKey);
          } else {
            console.log(`⏭️ Skipping place card: ${card.name} - conditions not met`);
          }
        });
      } else if (msg.role === MessageRole.Model) {
        console.log(`🔍 DEBUG - Message ${msgIndex} has no place cards`);
      }
    });
  }, [messages, googleMapsScriptLoaded]);

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
    
    // Con useAutoGeolocation, la ubicación se gestiona automáticamente
    console.log(`📍 Geolocalización ${enabled ? 'activada' : 'desactivada'}`);
    
    await saveConfig(updatedConfig);
  };

  // Hook para detectar visibilidad de la pestaña
  const usePageVisibility = () => {
    const [isVisible, setIsVisible] = useState(!document.hidden);
    
    useEffect(() => {
      const handleVisibilityChange = () => {
        setIsVisible(!document.hidden);
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);
    
    return isVisible;
  };

  const isPageVisible = usePageVisibility();

  // Función para reintentar cargar PlaceCard que estén en estado de carga infinita
  const retryStuckPlaceCards = useCallback(() => {
    if (!googleMapsScriptLoaded) return;
    
    console.log('🔄 Retrying stuck place cards due to page visibility change...');
    
    messages.forEach((msg) => {
      if (msg.role === MessageRole.Model && msg.placeCards) {
        msg.placeCards.forEach((card) => {
          // Si la tarjeta está en estado de carga pero no tiene datos y no tiene error
          if (card.isLoadingDetails && 
              !card.rating && 
              !card.address && 
              !card.photoUrl &&
              !card.website &&
              !card.errorDetails &&
              (card.placeId || card.searchQuery)) {
            
            console.log(`🔄 Retrying stuck place card: ${card.name}`);
            
            // Remover de la lista de procesadas para reintentar
            const cardKey = `${msg.id}-${card.id}`;
            processedCardsRef.current.delete(cardKey);
            
            // Reintentar cargar los detalles
            fetchPlaceDetailsAndUpdateMessage(msg.id, card.id, card.placeId, card.searchQuery, setMessages);
          }
        });
      }
    });
  }, [messages, googleMapsScriptLoaded, fetchPlaceDetailsAndUpdateMessage]);

  // Efecto para reintentar PlaceCard cuando la pestaña vuelve a estar activa
  useEffect(() => {
    if (isPageVisible && googleMapsScriptLoaded) {
      // Pequeño delay para asegurar que la página esté completamente cargada
      const timeoutId = setTimeout(() => {
        retryStuckPlaceCards();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isPageVisible, googleMapsScriptLoaded, retryStuckPlaceCards]);

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
    geolocationStatus,
    googleMapsScriptLoaded,
    messages,
    isLoading,
    isFullyLoaded,
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

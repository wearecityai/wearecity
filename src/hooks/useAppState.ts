import { useEffect, useState, useRef } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { useThemeContext } from '../theme/ThemeProvider';
import { useGeolocation } from './useGeolocation';
import { useApiInitialization } from './useApiInitialization';
import { useGoogleMaps } from './useGoogleMaps';
import { useChatManager } from './useChatManager';
import { useAssistantConfig } from './useAssistantConfig';
import { useConversations } from './useConversations';
import { MessageRole } from '../types';
import { supabase } from '../integrations/supabase/client';

export const useAppState = (citySlug?: string) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Incluir tablet como mobile
  
  // Use theme context instead of local state
  const { currentThemeMode, toggleTheme } = useThemeContext();
  
  // Track processed place cards to prevent infinite loops
  const processedCardsRef = useRef<Set<string>>(new Set());
  
  const [currentView, setCurrentView] = useState<'chat' | 'finetuning'>('chat');
  const [selectedChatIndex, setSelectedChatIndex] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);

  const { isGeminiReady, setIsGeminiReady, appError, setAppError } = useApiInitialization();
  
  // Usar el nuevo hook de configuración
  const { config: chatConfig, setConfig: setChatConfig, saveConfig } = useAssistantConfig();

  const { userLocation, geolocationError, geolocationStatus } = useGeolocation(chatConfig.allowGeolocation);

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
  }, [googleMapsApiKey]);

  // Load Google Maps script on app initialization
  useEffect(() => {
    if (googleMapsApiKey && !googleMapsScriptLoaded) {
      console.log('🔍 Loading Google Maps script with API key:', googleMapsApiKey ? `${googleMapsApiKey.substring(0, 10)}...` : 'NO API KEY');
      loadGoogleMapsScript(googleMapsApiKey);
    } else if (!googleMapsApiKey) {
      console.warn('❌ Google Maps API key not found');
    }
  }, [loadGoogleMapsScript, googleMapsScriptLoaded, googleMapsApiKey]);

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
    }
  );

  // Clear processed cards when starting a new conversation
  useEffect(() => {
    if (messages.length === 0) {
      processedCardsRef.current.clear();
      console.log('🧹 Cleared processed cards cache - new conversation started');
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
    console.log('🔍 Place cards useEffect triggered:', {
      googleMapsScriptLoaded,
      messagesCount: messages.length,
      placesServiceAvailable: !!placesServiceRef.current
    });
    
    if (!googleMapsScriptLoaded) {
      console.log('❌ Google Maps script not loaded yet');
      return;
    }
    
    if (!placesServiceRef.current) {
      console.log('❌ Google Places service not initialized');
      return;
    }
    
    // Clear processed cards when messages change significantly
    if (messages.length === 0) {
      processedCardsRef.current.clear();
      return;
    }
    
    messages.forEach((msg, msgIndex) => {
      if (msg.role === MessageRole.Model && msg.placeCards) {
        console.log(`🔍 Message ${msgIndex} has ${msg.placeCards.length} place cards`);
        msg.placeCards.forEach((card, cardIndex) => {
          // Create a unique identifier for this card
          const cardKey = `${msg.id}-${card.id}`;
          
          console.log(`🔍 Place card ${cardIndex}:`, {
            name: card.name,
            placeId: card.placeId,
            searchQuery: card.searchQuery,
            isLoadingDetails: card.isLoadingDetails,
            errorDetails: card.errorDetails,
            photoUrl: card.photoUrl,
            rating: card.rating,
            address: card.address,
            cardKey,
            alreadyProcessed: processedCardsRef.current.has(cardKey)
          });
          
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
            
            console.log(`✅ Processing card for first time: ${card.name} (${cardKey})`);
            processedCardsRef.current.add(cardKey);
            
            fetchPlaceDetailsAndUpdateMessage(msg.id, card.id, card.placeId, card.searchQuery, setMessages);
          } else {
            console.log(`⚠️ Skipping card ${card.name} - already processed or has data`);
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
        console.log('Updating selectedChatIndex to:', index, 'for conversation:', currentConversationId);
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
      console.log('First message detected, showing ChatContainer immediately');
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
    await saveConfig(updatedConfig);
  };

  return {
    theme,
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

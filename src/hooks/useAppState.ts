import { useEffect, useState } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { useThemeContext } from '../theme/ThemeProvider';
import { useGeolocation } from './useGeolocation';
import { useApiInitialization } from './useApiInitialization';
import { useGoogleMaps } from './useGoogleMaps';
import { useChatManager } from './useChatManager';
import { useAssistantConfig } from './useAssistantConfig';
import { useConversations } from './useConversations';
import { MessageRole } from '../types';

export const useAppState = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Use theme context instead of local state
  const { currentThemeMode, toggleTheme } = useThemeContext();
  
  const [currentView, setCurrentView] = useState<'chat' | 'finetuning'>('chat');
  const [selectedChatIndex, setSelectedChatIndex] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { isGeminiReady, setIsGeminiReady, appError, setAppError } = useApiInitialization();
  
  // Usar el nuevo hook de configuración
  const { config: chatConfig, setConfig: setChatConfig, saveConfig } = useAssistantConfig();

  const { userLocation, geolocationError, geolocationStatus } = useGeolocation(chatConfig.allowGeolocation);

  const { googleMapsScriptLoaded, fetchPlaceDetailsAndUpdateMessage, loadGoogleMapsScript } = useGoogleMaps(
    userLocation,
    chatConfig.currentLanguageCode || 'es',
    setAppError
  );

  // Load Google Maps script on app initialization
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey && !googleMapsScriptLoaded) {
      console.log('🔍 Loading Google Maps script with API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NO API KEY');
      loadGoogleMapsScript(apiKey);
    } else if (!apiKey) {
      console.warn('❌ VITE_GOOGLE_MAPS_API_KEY not found in environment variables');
    }
  }, [loadGoogleMapsScript, googleMapsScriptLoaded]);

  // Use conversations hook directly here
  const { 
    conversations, 
    currentConversationId, 
    setCurrentConversationId,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    loadConversations
  } = useConversations();

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

  // Handle menu overflow effect
  useEffect(() => {
    if (isMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen, isMobile]);

  // Handle place cards loading
  useEffect(() => {
    console.log('🔍 Place cards useEffect triggered:', {
      googleMapsScriptLoaded,
      messagesCount: messages.length
    });
    
    if (!googleMapsScriptLoaded) {
      console.log('❌ Google Maps script not loaded yet');
      return;
    }
    
    messages.forEach((msg, msgIndex) => {
      if (msg.role === 'model' && msg.placeCards) {
        console.log(`🔍 Message ${msgIndex} has ${msg.placeCards.length} place cards`);
        msg.placeCards.forEach((card, cardIndex) => {
          console.log(`🔍 Place card ${cardIndex}:`, {
            name: card.name,
            placeId: card.placeId,
            searchQuery: card.searchQuery,
            isLoadingDetails: card.isLoadingDetails,
            errorDetails: card.errorDetails,
            photoUrl: card.photoUrl
          });
          
          if (card.isLoadingDetails && (card.placeId || card.searchQuery)) {
            if (!card.errorDetails && !card.photoUrl) {
              console.log(`✅ Calling fetchPlaceDetailsAndUpdateMessage for card: ${card.name}`);
              fetchPlaceDetailsAndUpdateMessage(msg.id, card.id, card.placeId, card.searchQuery, setMessages);
            } else {
              console.log(`⚠️ Skipping card ${card.name} - already has errorDetails or photoUrl`);
            }
          } else {
            console.log(`⚠️ Skipping card ${card.name} - not loading or missing placeId/searchQuery`);
          }
        });
      }
    });
  }, [messages, googleMapsScriptLoaded, fetchPlaceDetailsAndUpdateMessage, setMessages]);

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
    shouldShowChatContainer
  };
};


import { useEffect, useState } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { useThemeContext } from '../theme/ThemeProvider';
import { useGeolocation } from './useGeolocation';
import { useApiInitialization } from './useApiInitialization';
import { useGoogleMaps } from './useGoogleMaps';
import { useChatManager } from './useChatManager';
import { useAssistantConfig } from './useAssistantConfig';
import { useConversations } from './useConversations';

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

  const { googleMapsScriptLoaded, fetchPlaceDetailsAndUpdateMessage } = useGoogleMaps(
    userLocation,
    chatConfig.currentLanguageCode || 'es',
    setAppError
  );

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
    if (!googleMapsScriptLoaded) return;
    messages.forEach(msg => {
      if (msg.role === 'model' && msg.placeCards) {
        msg.placeCards.forEach(card => {
          if (card.isLoadingDetails && (card.placeId || card.searchQuery)) {
            if (!card.errorDetails && !card.photoUrl) {
              fetchPlaceDetailsAndUpdateMessage(msg.id, card.id, card.placeId, card.searchQuery, setMessages);
            }
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
    handleSendMessage,
    handleSeeMoreEvents,
    clearMessages,
    setMessages,
    handleNewChat,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    deleteConversation
  };
};


import { useEffect, useState } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { useGeolocation } from './useGeolocation';
import { useApiInitialization } from './useApiInitialization';
import { useGoogleMaps } from './useGoogleMaps';
import { useChatManager } from './useChatManager';
import { useAssistantConfig } from './useAssistantConfig';

export const useAppState = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Theme state management
  const [currentThemeMode, setCurrentThemeMode] = useState<'light' | 'dark'>('light');
  const [currentView, setCurrentView] = useState<'chat' | 'finetuning'>('chat');
  const [selectedChatIndex, setSelectedChatIndex] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleTheme = () => {
    setCurrentThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const { isGeminiReady, setIsGeminiReady, appError, setAppError } = useApiInitialization();
  
  // Usar el nuevo hook de configuración
  const { config: chatConfig, setConfig: setChatConfig, saveConfig } = useAssistantConfig();

  const { userLocation, geolocationError, geolocationStatus } = useGeolocation(chatConfig.allowGeolocation);

  const { googleMapsScriptLoaded, fetchPlaceDetailsAndUpdateMessage } = useGoogleMaps(
    userLocation,
    chatConfig.currentLanguageCode || 'es',
    setAppError
  );

  const { 
    messages, 
    isLoading, 
    handleSendMessage, 
    handleSeeMoreEvents, 
    clearMessages, 
    setMessages,
    handleNewChat,
    conversations,
    currentConversationId,
    setCurrentConversationId
  } = useChatManager(
    chatConfig,
    userLocation,
    isGeminiReady,
    setAppError,
    setIsGeminiReady
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
    setCurrentConversationId
  };
};

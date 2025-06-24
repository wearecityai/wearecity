
import { useEffect, useState } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { useChatState } from './useChatState';
import { useGeolocation } from './useGeolocation';
import { useApiInitialization } from './useApiInitialization';
import { useGoogleMaps } from './useGoogleMaps';
import { useChatManager } from './useChatManager';

export const useAppState = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Theme state management
  const [currentThemeMode, setCurrentThemeMode] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    setCurrentThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const { isGeminiReady, setIsGeminiReady, appError, setAppError } = useApiInitialization();
  
  const {
    currentView,
    setCurrentView,
    chatTitles,
    selectedChatIndex,
    setSelectedChatIndex,
    isMenuOpen,
    setIsMenuOpen,
    chatConfig,
    setChatConfig
  } = useChatState();

  const { userLocation, geolocationError, geolocationStatus } = useGeolocation(chatConfig.allowGeolocation);

  const { googleMapsScriptLoaded, fetchPlaceDetailsAndUpdateMessage } = useGoogleMaps(
    userLocation,
    chatConfig.currentLanguageCode || 'es',
    setAppError
  );

  const { messages, isLoading, handleSendMessage, handleSeeMoreEvents, clearMessages, setMessages } = useChatManager(
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
    chatTitles,
    selectedChatIndex,
    setSelectedChatIndex,
    isMenuOpen,
    setIsMenuOpen,
    chatConfig,
    setChatConfig,
    userLocation,
    geolocationError,
    geolocationStatus: geolocationStatus as 'idle' | 'pending' | 'success' | 'error',
    googleMapsScriptLoaded,
    messages,
    isLoading,
    handleSendMessage,
    handleSeeMoreEvents,
    clearMessages,
    setMessages
  };
};

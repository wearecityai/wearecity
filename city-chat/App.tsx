
import React, { useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';

import FinetuningPage from './components/FinetuningPage';
import AppHeader from './components/AppHeader';
import AppDrawer from './components/AppDrawer';
import ChatContainer from './components/ChatContainer';
import ErrorBoundary from './components/ErrorBoundary';

import { useChatManager } from './hooks/useChatManager';
import { useGeolocation } from './hooks/useGeolocation';
import { useApiInitialization } from './hooks/useApiInitialization';
import { useGoogleMaps } from './hooks/useGoogleMaps';
import { useChatState } from './hooks/useChatState';
import { useAppHandlers } from './hooks/useAppHandlers';

interface UserLocation {
  latitude: number;
  longitude: number;
}

(window as any).initMap = () => {
  // console.log("Google Maps API script (potentially) loaded via callback.");
};

interface AppProps {
  toggleTheme: () => void;
  currentThemeMode: 'light' | 'dark';
}

const App: React.FC<AppProps> = ({ toggleTheme, currentThemeMode }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  const {
    handleNewChat,
    handleSetCurrentLanguageCode,
    handleSaveCustomization,
    handleDownloadPdf,
    handleSelectChat,
    handleMenuToggle,
    handleOpenFinetuning,
    handleOpenSettings
  } = useAppHandlers({
    chatConfig,
    setChatConfig,
    setCurrentView,
    setIsMenuOpen,
    setSelectedChatIndex,
    selectedChatIndex,
    isMobile,
    appError,
    setAppError,
    clearMessages
  });

  useEffect(() => {
    if (isMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen, isMobile]);

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

  // Show error boundary if needed
  const errorBoundary = <ErrorBoundary isGeminiReady={isGeminiReady} appError={appError} />;
  if (errorBoundary.props.isGeminiReady === false && errorBoundary.props.appError) {
    return errorBoundary;
  }

  if (currentView === 'finetuning') {
    return (
      <FinetuningPage
        currentConfig={chatConfig}
        onSave={handleSaveCustomization}
        onCancel={() => {setCurrentView('chat'); setIsMenuOpen(false);}}
        googleMapsScriptLoaded={googleMapsScriptLoaded}
        apiKeyForMaps=""
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', maxHeight: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <AppDrawer
        isMenuOpen={isMenuOpen}
        onMenuToggle={handleMenuToggle}
        onNewChat={handleNewChat}
        onOpenFinetuning={handleOpenFinetuning}
        chatTitles={chatTitles}
        selectedChatIndex={selectedChatIndex}
        onSelectChat={handleSelectChat}
        chatConfig={chatConfig}
        userLocation={userLocation}
        geolocationStatus={geolocationStatus}
      />

      <Box component="main" sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        ...(isMenuOpen && !isMobile && {
            transition: theme.transitions.create(['margin', 'width'], {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
        }),
      }}>
        <AppHeader
          isMobile={isMobile}
          onMenuToggle={handleMenuToggle}
          currentThemeMode={currentThemeMode}
          onToggleTheme={toggleTheme}
          onOpenSettings={handleOpenSettings}
        />

        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          appError={appError}
          chatConfig={chatConfig}
          onSendMessage={handleSendMessage}
          onDownloadPdf={handleDownloadPdf}
          onSeeMoreEvents={handleSeeMoreEvents}
          onSetLanguageCode={handleSetCurrentLanguageCode}
        />
      </Box>
    </Box>
  );
};

export default App;

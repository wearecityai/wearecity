
import React from 'react';
import { Box } from '@mui/material';
import FinetuningPage from './FinetuningPage';
import AppHeader from './AppHeader';
import AppDrawer from './AppDrawer';
import ChatContainer from './ChatContainer';
import ErrorBoundary from './ErrorBoundary';
import { useAppHandlers } from '../hooks/useAppHandlers';
import { useAppAuth } from '../hooks/useAppAuth';

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

interface AppContainerProps {
  toggleTheme: () => void;
  currentThemeMode: 'light' | 'dark';
  user?: User | null;
  profile?: Profile | null;
  onLogin?: () => void;
  theme: any;
  isMobile: boolean;
  isGeminiReady: boolean;
  appError: string | null;
  currentView: 'chat' | 'finetuning';
  setCurrentView: React.Dispatch<React.SetStateAction<'chat' | 'finetuning'>>;
  chatTitles: string[];
  selectedChatIndex: number;
  setSelectedChatIndex: React.Dispatch<React.SetStateAction<number>>;
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  chatConfig: any;
  setChatConfig: React.Dispatch<React.SetStateAction<any>>;
  userLocation: any;
  geolocationStatus: string;
  googleMapsScriptLoaded: boolean;
  messages: any[];
  isLoading: boolean;
  handleSendMessage: (message: string) => void;
  handleSeeMoreEvents: (originalUserQuery: string) => void;
  clearMessages: () => void;
  setAppError: (error: string | null) => void;
  setIsGeminiReady: (ready: boolean) => void;
}

const AppContainer: React.FC<AppContainerProps> = ({ 
  toggleTheme, 
  currentThemeMode, 
  user = null, 
  profile = null, 
  onLogin,
  theme,
  isMobile,
  isGeminiReady,
  appError,
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
  geolocationStatus,
  googleMapsScriptLoaded,
  messages,
  isLoading,
  handleSendMessage,
  handleSeeMoreEvents,
  clearMessages,
  setAppError,
  setIsGeminiReady
}) => {
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

  const { handleOpenFinetuningWithAuth } = useAppAuth({
    user,
    profile,
    onLogin,
    handleOpenFinetuning
  });

  console.log('App.tsx - Props recibidas:', { 
    user: !!user, 
    profile: !!profile, 
    onLogin: !!onLogin,
    isAuthenticated: !!user 
  });

  // Show error boundary if needed
  const errorBoundary = <ErrorBoundary isGeminiReady={isGeminiReady} appError={appError} />;
  if (errorBoundary.props.isGeminiReady === false && errorBoundary.props.appError) {
    return errorBoundary;
  }

  if (currentView === 'finetuning') {
    // Solo mostrar el panel de configuración si el usuario es administrador
    if (!user || !profile || profile.role !== 'administrativo') {
      setCurrentView('chat');
      setIsMenuOpen(false);
      return null;
    }
    
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
        onOpenFinetuning={handleOpenFinetuningWithAuth}
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
          isAuthenticated={!!user}
          onLogin={onLogin}
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

export default AppContainer;

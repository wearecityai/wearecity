
import React from 'react';
import { Box } from '@mui/material';
import ErrorBoundary from './ErrorBoundary';
import AppDrawer from './AppDrawer';
import MainContent from './MainContent';
import AdminRoute from './AdminRoute';

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

interface AppLayoutProps {
  isGeminiReady: boolean;
  appError: string | null;
  currentView: 'chat' | 'finetuning';
  setCurrentView: React.Dispatch<React.SetStateAction<'chat' | 'finetuning'>>;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  user?: User | null;
  profile?: Profile | null;
  theme: any;
  isMobile: boolean;
  isMenuOpen: boolean;
  handleMenuToggle: () => void;
  handleNewChat: () => void;
  handleOpenFinetuningWithAuth: () => void;
  chatTitles: string[];
  selectedChatIndex: number;
  handleSelectChat: (index: number) => void;
  chatConfig: any;
  userLocation: any;
  geolocationStatus: string;
  currentThemeMode: 'light' | 'dark';
  toggleTheme: () => void;
  handleOpenSettings: () => void;
  onLogin?: () => void;
  messages: any[];
  isLoading: boolean;
  handleSendMessage: (message: string) => void;
  handleDownloadPdf: (pdfInfo: any) => void;
  handleSeeMoreEvents: (originalUserQuery: string) => void;
  handleSetCurrentLanguageCode: (langCode: string) => void;
  handleSaveCustomization: (newConfig: any) => void;
  googleMapsScriptLoaded: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  isGeminiReady,
  appError,
  currentView,
  setCurrentView,
  setIsMenuOpen,
  user,
  profile,
  theme,
  isMobile,
  isMenuOpen,
  handleMenuToggle,
  handleNewChat,
  handleOpenFinetuningWithAuth,
  chatTitles,
  selectedChatIndex,
  handleSelectChat,
  chatConfig,
  userLocation,
  geolocationStatus,
  currentThemeMode,
  toggleTheme,
  handleOpenSettings,
  onLogin,
  messages,
  isLoading,
  handleSendMessage,
  handleDownloadPdf,
  handleSeeMoreEvents,
  handleSetCurrentLanguageCode,
  handleSaveCustomization,
  googleMapsScriptLoaded
}) => {
  // Show error boundary if needed
  if (!isGeminiReady && appError) {
    return <ErrorBoundary isGeminiReady={isGeminiReady} appError={appError} />;
  }

  if (currentView === 'finetuning') {
    return (
      <AdminRoute
        user={user}
        profile={profile}
        chatConfig={chatConfig}
        handleSaveCustomization={handleSaveCustomization}
        onCancel={() => {setCurrentView('chat'); setIsMenuOpen(false);}}
        googleMapsScriptLoaded={googleMapsScriptLoaded}
        setCurrentView={setCurrentView}
        setIsMenuOpen={setIsMenuOpen}
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

      <MainContent
        theme={theme}
        isMobile={isMobile}
        isMenuOpen={isMenuOpen}
        handleMenuToggle={handleMenuToggle}
        currentThemeMode={currentThemeMode}
        toggleTheme={toggleTheme}
        handleOpenSettings={handleOpenSettings}
        user={user}
        onLogin={onLogin}
        messages={messages}
        isLoading={isLoading}
        appError={appError}
        chatConfig={chatConfig}
        handleSendMessage={handleSendMessage}
        handleDownloadPdf={handleDownloadPdf}
        handleSeeMoreEvents={handleSeeMoreEvents}
        handleSetCurrentLanguageCode={handleSetCurrentLanguageCode}
      />
    </Box>
  );
};

export default AppLayout;

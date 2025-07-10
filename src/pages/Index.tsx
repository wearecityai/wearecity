import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApiInitialization } from '../hooks/useApiInitialization';
import { useAppState } from '../hooks/useAppState';
import AppContainer from '../components/AppContainer';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { isGeminiReady, appError, setAppError, setIsGeminiReady } = useApiInitialization();
  
  // App state hooks
  const {
    theme,
    isMobile,
    currentView,
    setCurrentView,
    chatTitles,
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
    handleSendMessage,
    handleSeeMoreEvents,
    clearMessages,
    currentThemeMode,
    toggleTheme,
    handleNewChat,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    deleteConversation,
    shouldShowChatContainer
  } = useAppState();

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleAdminPanel = () => {
    navigate('/admin');
  };

  // Show loading state only while auth is initializing AND we don't have a definitive auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Always show the main app - authentication is optional
  return (
    <AppContainer
      toggleTheme={toggleTheme}
      currentThemeMode={currentThemeMode}
      user={user}
      profile={profile}
      onLogin={handleLogin}
      onAdminPanel={handleAdminPanel}
      theme={theme}
      isMobile={isMobile}
      isGeminiReady={isGeminiReady}
      appError={appError}
      currentView={currentView}
      setCurrentView={setCurrentView}
      chatTitles={chatTitles}
      selectedChatIndex={selectedChatIndex}
      setSelectedChatIndex={setSelectedChatIndex}
      isMenuOpen={isMenuOpen}
      setIsMenuOpen={setIsMenuOpen}
      chatConfig={chatConfig}
      setChatConfig={setChatConfig}
      saveConfig={saveConfig}
      userLocation={userLocation}
      geolocationStatus={geolocationStatus}
      googleMapsScriptLoaded={googleMapsScriptLoaded}
      messages={messages}
      isLoading={isLoading}
      handleSendMessage={handleSendMessage}
      handleSeeMoreEvents={handleSeeMoreEvents}
      clearMessages={clearMessages}
      setAppError={setAppError}
      setIsGeminiReady={setIsGeminiReady}
      handleNewChat={handleNewChat}
      conversations={conversations}
      currentConversationId={currentConversationId}
      setCurrentConversationId={setCurrentConversationId}
      deleteConversation={deleteConversation}
      shouldShowChatContainer={shouldShowChatContainer}
    />
  );
};

export default Index;

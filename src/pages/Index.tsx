import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApiInitialization } from '../hooks/useApiInitialization';
import { useAppState } from '../hooks/useAppState';
import AppContainer from '../components/AppContainer';
import SplashScreen from '../components/SplashScreen';

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

  // Show loading state only while auth is initializing AND we don't have a definitive auth state
  if (authLoading) {
    return <SplashScreen />;
  }

  // Always show the main app - authentication is optional
  return (
    <AppContainer
      toggleTheme={toggleTheme}
      currentThemeMode={currentThemeMode}
      user={user}
      profile={profile}
      onLogin={handleLogin}
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

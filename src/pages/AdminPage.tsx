import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuthFirebase';
import { useApiInitialization } from '@/hooks/useApiInitialization';
import { useAppState } from '@/hooks/useAppState';
import AppContainer from '@/components/AppContainer';
import SplashScreen from '@/components/SplashScreen';

const AdminPage = () => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { isGeminiReady, appError, setAppError, setIsGeminiReady } = useApiInitialization();
  
  // App state hooks - usar conversaciones generales para admin
  const {
    isMobile,
    currentView,
    setCurrentView: setCurrentViewTyped,
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
    shouldShowChatContainer,
    handleToggleLocation
  } = useAppState(); // Sin citySlug para conversaciones generales de admin

  const handleLogin = () => {
    // No necesitamos navegar a /auth desde aquí ya que el usuario ya está autenticado
    console.log('Usuario ya autenticado');
  };

  // Show loading state only while auth is initializing AND we don't have a definitive auth state
  if (authLoading) {
    return <SplashScreen />;
  }

  // Redirect to landing page if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Redirect to landing page if not an admin
  if (profile && profile.role !== 'administrativo') {
    return <Navigate to="/" replace />;
  }

  // Show the admin interface (old home functionality)
  return (
    <AppContainer
      toggleTheme={toggleTheme}
      currentThemeMode={currentThemeMode}
      user={user}
      profile={profile}
      onLogin={handleLogin}
      theme={null}
      isMobile={isMobile}
      isGeminiReady={isGeminiReady}
      appError={appError}
      currentView={currentView as 'chat' | 'finetuning'}
      setCurrentView={setCurrentViewTyped as React.Dispatch<React.SetStateAction<'chat' | 'finetuning'>>}
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
        handleToggleLocation={handleToggleLocation}
        setMessages={() => {}}
    />
  );
};

export default AdminPage; 
import React from 'react';
import { useAppHandlers } from '../hooks/useAppHandlers';
import { useAppAuth } from '../hooks/useAppAuth';
import AppLayoutModern from './AppLayoutModern';

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
  saveConfig: (config: any) => Promise<boolean>;
  userLocation: any;
  geolocationStatus: 'idle' | 'pending' | 'success' | 'error';
  googleMapsScriptLoaded: boolean;
  messages: any[];
  isLoading: boolean;
  handleSendMessage: (message: string) => void;
  handleSeeMoreEvents: (originalUserQuery: string) => void;
  clearMessages: () => void;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setAppError: (error: string | null) => void;
  setIsGeminiReady: (ready: boolean) => void;
  handleNewChat: () => Promise<void>;
  conversations: Array<{ id: string; title: string }>;
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  shouldShowChatContainer: boolean;
  isPublicChat?: boolean;
  handleToggleLocation: (enabled: boolean) => Promise<void>;
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
  saveConfig,
  userLocation,
  geolocationStatus,
  googleMapsScriptLoaded,
  messages,
  isLoading,
  handleSendMessage,
  handleSeeMoreEvents,
  clearMessages,
  setMessages,
  setAppError,
  setIsGeminiReady,
  handleNewChat,
  conversations,
  currentConversationId,
  setCurrentConversationId,
  deleteConversation,
  shouldShowChatContainer,
  isPublicChat = false,
  handleToggleLocation
}) => {
  const {
    handleNewChat: handleNewChatClick,
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
    saveConfig,
    setCurrentView,
    setIsMenuOpen,
    setSelectedChatIndex,
    selectedChatIndex,
    isMobile,
    appError,
    setAppError,
    clearMessages,
    handleNewChat,
    setCurrentConversationId,
    conversations
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

  return (
    <AppLayoutModern
      isGeminiReady={isGeminiReady}
      appError={appError}
      currentView={currentView}
      setCurrentView={setCurrentView}
      setIsMenuOpen={setIsMenuOpen}
      user={user}
      profile={profile}
      theme={theme}
      isMobile={isMobile}
      isMenuOpen={isMenuOpen}
      handleMenuToggle={handleMenuToggle}
      handleNewChat={handleNewChatClick}
      handleOpenFinetuningWithAuth={handleOpenFinetuningWithAuth}
      chatTitles={chatTitles}
      selectedChatIndex={selectedChatIndex}
      handleSelectChat={handleSelectChat}
      chatConfig={chatConfig}
      userLocation={userLocation}
      geolocationStatus={geolocationStatus}
      currentThemeMode={currentThemeMode}
      toggleTheme={toggleTheme}
      handleOpenSettings={handleOpenSettings}
      onLogin={onLogin}
      messages={messages}
      isLoading={isLoading}
      handleSendMessage={handleSendMessage}
      handleDownloadPdf={handleDownloadPdf}
      handleSeeMoreEvents={handleSeeMoreEvents}
      handleSetCurrentLanguageCode={handleSetCurrentLanguageCode}
      handleSaveCustomization={handleSaveCustomization}
      googleMapsScriptLoaded={googleMapsScriptLoaded}
      conversations={conversations}
      deleteConversation={deleteConversation}
      shouldShowChatContainer={shouldShowChatContainer}
      isPublicChat={isPublicChat}
      handleToggleLocation={handleToggleLocation}
    />
  );
};

export default AppContainer;

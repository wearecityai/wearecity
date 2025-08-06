import React from 'react';
import { Sparkles, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { DashboardLayout, DashboardHeader, DashboardContent } from './ui/dashboard-layout';
import { ChatLayout, ChatSidebar, ChatMain } from './ui/chat-layout';
import { SidebarProvider, SidebarTrigger, SidebarInset } from './ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { NavActions } from './nav-actions';
import MainContent from './MainContent';
import FinetuningPage from './FinetuningPage';
import UserButton from './auth/UserButton';
import ErrorBoundary from './ErrorBoundary';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from './ui/breadcrumb';
import { Separator } from './ui/separator';

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

interface AppLayoutModernProps {
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
  geolocationStatus: 'idle' | 'pending' | 'success' | 'error';
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
  conversations: Array<{ id: string; title: string }>;
  deleteConversation: (conversationId: string) => Promise<void>;
  shouldShowChatContainer: boolean;
  isPublicChat?: boolean;
  handleToggleLocation: (enabled: boolean) => Promise<void>;
}

const AppLayoutModern: React.FC<AppLayoutModernProps> = (props) => {
  const {
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
    googleMapsScriptLoaded,
    conversations,
    deleteConversation,
    shouldShowChatContainer,
    isPublicChat = false,
    handleToggleLocation,
    chatTitles
  } = props;

  if (currentView === 'finetuning') {
    return (
      <DashboardLayout>
        <DashboardHeader>
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentView('chat')}
              >
                <span className="sr-only">Volver al chat</span>
                ←
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h1 className="text-xl font-bold">Configuración</h1>
              </div>
            </div>
            <UserButton />
          </div>
        </DashboardHeader>
        
        <DashboardContent>
          <FinetuningPage
            currentConfig={chatConfig}
            onSave={handleSaveCustomization}
            onCancel={() => setCurrentView('chat')}
            googleMapsScriptLoaded={googleMapsScriptLoaded}
            apiKeyForMaps=""
          />
        </DashboardContent>
      </DashboardLayout>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar 
        onNewChat={handleNewChat}
        onOpenFinetuning={handleOpenFinetuningWithAuth}
        chatTitles={chatTitles}
        chatIds={conversations.map(c => c.id)}
        selectedChatIndex={selectedChatIndex}
        onSelectChat={handleSelectChat}
        onDeleteChat={deleteConversation}
        chatConfig={chatConfig}
        userLocation={userLocation}
        geolocationStatus={geolocationStatus}
        isPublicChat={isPublicChat}
      />
      <SidebarInset>
        {!isPublicChat && (
          <header className="flex h-14 shrink-0 items-center gap-2">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1">
                      {chatConfig?.restrictedCity?.name || 'CityCore AI Chat'}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto px-3">
              <NavActions />
            </div>
          </header>
        )}
        
        <div className="flex flex-1 flex-col overflow-hidden">
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
            shouldShowChatContainer={shouldShowChatContainer}
            handleToggleLocation={handleToggleLocation}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayoutModern;
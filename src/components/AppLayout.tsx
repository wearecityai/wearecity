import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import AppDrawer from './AppDrawer';
import MainContent from './MainContent';
import FinetuningPage from './FinetuningPage';
import UserMenu from './UserMenu';
import UserButton from './auth/UserButton';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card, CardContent } from './ui/card';
import { ResizablePanelGroup, ResizablePanel } from './ui/resizable';
import { Menu, X, Globe, User } from 'lucide-react';

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

const AppLayout: React.FC<AppLayoutProps> = (props) => {
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
    handleToggleLocation
  } = props;

  // Use conversation data from props instead of duplicating the hook
  const chatIds = conversations.map(c => c.id);
  const chatTitles = conversations.map(c => c.title);

  const [userMenuAnchorEl, setUserMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };
  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleShareClick = () => {
    setFinetuningActiveTab(1); // Cambiar a la pestaña "Compartir"
    setCurrentView('finetuning');
    setIsMenuOpen(false);
    setShowShareToast(false);
  };

  // Estado para controlar la pestaña activa en FinetuningPage
  const [finetuningActiveTab, setFinetuningActiveTab] = React.useState(0);

  const handleCloseToast = () => {
    setShowShareToast(false);
  };

  const showShareToastAfterSave = () => {
    setShowShareToast(true);
    setTimeout(() => {
      setShowShareToast(false);
    }, 5000);
  };

  const handleSaveCustomizationWithToast = (newConfig: any) => {
    handleSaveCustomization(newConfig);
    // Mostrar el toast después de guardar
    setTimeout(() => {
      showShareToastAfterSave();
    }, 300);
  };

  const drawerWidth = 260;
  const collapsedDrawerWidth = 72;

  // Estado para la imagen de perfil en edición (preview)
  const [profileImagePreview, setProfileImagePreview] = React.useState<string | undefined>(undefined);
  
  // Estado para el toast de compartir
  const [showShareToast, setShowShareToast] = React.useState(false);

  // Header para vista normal (sin panel de configuración)
  const normalHeader = (
    <div 
      className={`fixed top-0 z-50 flex items-center justify-between p-4 min-h-16 bg-background border-b ${
        isMobile 
          ? 'left-0 w-full' 
          : `left-${isMenuOpen ? '[260px]' : '[72px]'} w-[calc(100%-${isMenuOpen ? '260px' : '72px'})]`
      }`}
      style={{
        left: isMobile ? 0 : (isMenuOpen ? drawerWidth : collapsedDrawerWidth),
        width: isMobile ? '100%' : `calc(100% - ${isMenuOpen ? drawerWidth : collapsedDrawerWidth}px)`,
      }}
    >
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMenuToggle}
          className="mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      
      {/* Título CityCore centrado absolutamente */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent font-bold text-xl tracking-wider pointer-events-auto transition-transform hover:scale-105 px-6 py-2 rounded-lg bg-muted/50">
          CityCore
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        {user ? (
          <UserButton />
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUserMenuOpen}
              className="p-0"
            >
              <Avatar className="w-10 h-10">
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            </Button>
            <UserMenu
              anchorEl={userMenuAnchorEl}
              open={Boolean(userMenuAnchorEl)}
              onClose={handleUserMenuClose}
              currentThemeMode={currentThemeMode}
              onToggleTheme={toggleTheme}
              onOpenSettings={handleOpenSettings}
              isAuthenticated={!!user}
              onLogin={onLogin}
            />
          </>
        )}
      </div>
    </div>
  );

  if (!isGeminiReady && appError) {
    return <ErrorBoundary isGeminiReady={isGeminiReady} appError={appError} />;
  }

  // MOBILE: panel admin ocupa toda la pantalla
  if (isMobile && currentView === 'finetuning') {
    return (
      <>
        {normalHeader}
        <FinetuningPage
          currentConfig={chatConfig}
          onSave={handleSaveCustomizationWithToast}
          onCancel={() => {setCurrentView('chat'); setIsMenuOpen(false);}}
          googleMapsScriptLoaded={googleMapsScriptLoaded}
          apiKeyForMaps=""
          profileImagePreview={profileImagePreview}
          setProfileImagePreview={setProfileImagePreview}
          activeTab={finetuningActiveTab}
          onTabChange={setFinetuningActiveTab}
        />
      </>
    );
  }

  // DESKTOP: panel admin y chat lado a lado
  if (currentView === 'finetuning') {
    return (
      <div className="h-screen overflow-hidden bg-background flex">
        {/* Side menu siempre visible */}
        <AppDrawer
          isMenuOpen={isMenuOpen}
          onMenuToggle={handleMenuToggle}
          onNewChat={handleNewChat}
          onOpenFinetuning={handleOpenFinetuningWithAuth}
          chatTitles={chatTitles}
          chatIds={chatIds}
          selectedChatIndex={selectedChatIndex}
          onSelectChat={handleSelectChat}
          onDeleteChat={deleteConversation}
          chatConfig={chatConfig}
          userLocation={userLocation}
          geolocationStatus={geolocationStatus}
          isPublicChat={isPublicChat}
        />
        
        {/* Paneles redimensionables: admin y chat */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Panel Izquierdo: Configuración */}
          <ResizablePanel minSize={30} defaultSize={50}>
            <div className="flex flex-col h-full">
              {/* Header del panel de configuración */}
              <div className="flex items-center justify-between p-4 h-16 bg-background border-b border-r">
                <h2 className="text-lg font-medium truncate">
                  Personalizar Asistente
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {setCurrentView('chat'); setIsMenuOpen(false);}}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {/* Contenido del panel de configuración */}
              <div className="flex-1 overflow-hidden border-r">
                <FinetuningPage
                  currentConfig={chatConfig}
                  onSave={handleSaveCustomizationWithToast}
                  onCancel={() => {setCurrentView('chat'); setIsMenuOpen(false);}}
                  googleMapsScriptLoaded={googleMapsScriptLoaded}
                  apiKeyForMaps=""
                  profileImagePreview={profileImagePreview}
                  setProfileImagePreview={setProfileImagePreview}
                  activeTab={finetuningActiveTab}
                  onTabChange={setFinetuningActiveTab}
                />
              </div>
            </div>
          </ResizablePanel>
          
          {/* Panel Derecho: Chat */}
          <ResizablePanel minSize={30} defaultSize={50}>
            <div className="flex flex-col h-full">
              {/* Header del chat */}
              <div className="flex items-center justify-between p-4 h-16 bg-background border-b">
                <h2 className="text-lg font-bold text-white tracking-wider">
                  CityCore
                </h2>
                <div className="flex items-center gap-2">
                  {user ? (
                    <UserButton />
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleUserMenuOpen}
                        className="p-0"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                      <UserMenu
                        anchorEl={userMenuAnchorEl}
                        open={Boolean(userMenuAnchorEl)}
                        onClose={handleUserMenuClose}
                        currentThemeMode={currentThemeMode}
                        onToggleTheme={toggleTheme}
                        onOpenSettings={handleOpenSettings}
                        isAuthenticated={!!user}
                        onLogin={onLogin}
                      />
                    </>
                  )}
                </div>
              </div>
              {/* Contenido del chat */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <MainContent
                  theme={theme}
                  isMobile={false}
                  isMenuOpen={false}
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
                  isInFinetuningMode={true}
                  shouldShowChatContainer={shouldShowChatContainer}
                  handleToggleLocation={handleToggleLocation}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  // Vista normal: header, side menu y chat
  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      {normalHeader}
      <div className="flex flex-1 pt-16 sm:pt-16">
        <AppDrawer
          isMenuOpen={isMenuOpen}
          onMenuToggle={handleMenuToggle}
          onNewChat={handleNewChat}
          onOpenFinetuning={handleOpenFinetuningWithAuth}
          chatTitles={chatTitles}
          chatIds={chatIds}
          selectedChatIndex={selectedChatIndex}
          onSelectChat={handleSelectChat}
          onDeleteChat={deleteConversation}
          chatConfig={chatConfig}
          userLocation={userLocation}
          geolocationStatus={geolocationStatus}
          isPublicChat={isPublicChat}
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
          shouldShowChatContainer={shouldShowChatContainer}
          handleToggleLocation={handleToggleLocation}
        />
      </div>
      
      {/* Toast de compartir */}
      {showShareToast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[9999] max-w-md w-11/12 mx-2">
          <Card className="relative shadow-lg">
            <CardContent className="p-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseToast}
                className="absolute top-2 right-2 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
              
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="text-primary">
                  <Globe className="h-8 w-8" />
                </div>
                
                <h3 className="text-lg font-semibold">
                  ¡Configuración Guardada!
                </h3>
                
                <p className="text-sm text-muted-foreground">
                  Tu asistente está listo. ¿Quieres compartirlo?
                </p>
                
                <Button
                  onClick={handleShareClick}
                  size="sm"
                  className="w-full"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Compartir Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
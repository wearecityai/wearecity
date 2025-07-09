import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import ErrorBoundary from './ErrorBoundary';
import AppDrawer from './AppDrawer';
import MainContent from './MainContent';
import FinetuningPage from './FinetuningPage';

import UserMenu from './UserMenu';
import UserButton from './auth/UserButton';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';
import { ResizablePanelGroup, ResizablePanel } from './ui/resizable';

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
    shouldShowChatContainer
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

  const drawerWidth = 260;
  const collapsedDrawerWidth = 72;

  // Estado para la imagen de perfil en edición (preview)
  const [profileImagePreview, setProfileImagePreview] = React.useState<string | undefined>(undefined);

  // Header para vista normal (sin panel de configuración)
  const normalHeader = (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: isMobile ? 0 : (isMenuOpen ? drawerWidth : collapsedDrawerWidth),
        width: isMobile ? '100%' : `calc(100% - ${isMenuOpen ? drawerWidth : collapsedDrawerWidth}px)`,
        zIndex: (theme) => theme.zIndex.appBar || 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        minHeight: '64px',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      {isMobile && (
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleMenuToggle}
          sx={{ mr: 2, color: 'text.primary' }}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: 'white', letterSpacing: 1.5, fontSize: '1rem', flexGrow: 1 }}>
        CityCore
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {user ? (
          <UserButton />
        ) : (
          <>
            <IconButton
              color="inherit"
              aria-label="user account"
              onClick={handleUserMenuOpen}
              id="user-avatar-button"
              sx={{ p: 0 }}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: theme => theme.palette.background.paper,
                  color: theme => theme.palette.text.primary,
                  fontSize: 28,
                  border: `1px solid ${theme => theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AccountCircleIcon sx={{ fontSize: 32 }} />
              </Avatar>
            </IconButton>
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
      </Box>
    </Box>
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
          onSave={handleSaveCustomization}
          onCancel={() => {setCurrentView('chat'); setIsMenuOpen(false);}}
          googleMapsScriptLoaded={googleMapsScriptLoaded}
          apiKeyForMaps=""
          profileImagePreview={profileImagePreview}
          setProfileImagePreview={setProfileImagePreview}
        />
      </>
    );
  }

  // DESKTOP: panel admin y chat lado a lado
  if (currentView === 'finetuning') {
    return (
      <Box sx={{ 
        height: { xs: '100dvh', sm: '100vh' }, 
        maxHeight: { xs: '100dvh', sm: '100vh' }, 
        overflow: 'hidden', 
        bgcolor: 'background.default', 
        display: 'flex', 
        flexDirection: 'row' 
      }}>
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
        />
        
        {/* Paneles redimensionables: admin y chat */}
        <ResizablePanelGroup direction="horizontal" style={{ flex: 1 }}>
          {/* Panel Izquierdo: Configuración */}
          <ResizablePanel minSize={30} defaultSize={50}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header del panel de configuración */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                height: '64px',
                minHeight: '64px',
                maxHeight: '64px',
                bgcolor: 'background.default',
                color: 'text.primary',
                borderBottom: `1px solid ${theme.palette.divider}`,
                borderRight: `1px solid ${theme.palette.divider}`,
              }}>
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 500, flexGrow: 1, minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', color: 'text.primary' }}>
                  Personalizar Asistente
                </Typography>
                <IconButton
                  color="inherit"
                  aria-label="cerrar configuración"
                  onClick={() => {setCurrentView('chat'); setIsMenuOpen(false);}}
                  sx={{ color: 'text.primary' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              {/* Contenido del panel de configuración */}
              <Box sx={{ flex: 1, overflow: 'hidden', borderRight: `1px solid ${theme.palette.divider}` }}>
                <FinetuningPage
                  currentConfig={chatConfig}
                  onSave={handleSaveCustomization}
                  onCancel={() => {setCurrentView('chat'); setIsMenuOpen(false);}}
                  googleMapsScriptLoaded={googleMapsScriptLoaded}
                  apiKeyForMaps=""
                  profileImagePreview={profileImagePreview}
                  setProfileImagePreview={setProfileImagePreview}
                />
              </Box>
            </Box>
          </ResizablePanel>
          
          {/* Panel Derecho: Chat */}
          <ResizablePanel minSize={30} defaultSize={50}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header del chat */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                height: '64px',
                minHeight: '64px',
                maxHeight: '64px',
                bgcolor: 'background.default',
                color: 'text.primary',
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}>
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: 'white', letterSpacing: 1.5, fontSize: '1rem', flexGrow: 1 }}>
                  CityCore
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {user ? (
                    <UserButton />
                  ) : (
                    <>
                      <IconButton
                        color="inherit"
                        aria-label="user account"
                        onClick={handleUserMenuOpen}
                        id="user-avatar-button"
                        sx={{ p: 0 }}
                      >
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: theme => theme.palette.background.paper,
                            color: theme => theme.palette.text.primary,
                            fontSize: 28,
                            border: `1px solid ${theme => theme.palette.divider}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <AccountCircleIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                      </IconButton>
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
                </Box>
              </Box>
              {/* Contenido del chat */}
              <Box sx={{ 
                flex: 1, 
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
              }}>
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
                  chatConfig={{
                    ...chatConfig,
                    profileImageUrl: profileImagePreview !== undefined ? profileImagePreview : chatConfig.profileImageUrl
                  }}
                  handleSendMessage={handleSendMessage}
                  handleDownloadPdf={handleDownloadPdf}
                  handleSeeMoreEvents={handleSeeMoreEvents}
                  handleSetCurrentLanguageCode={handleSetCurrentLanguageCode}
                  isInFinetuningMode={true}
                  shouldShowChatContainer={shouldShowChatContainer}
                />
              </Box>
            </Box>
          </ResizablePanel>
        </ResizablePanelGroup>
      </Box>
    );
  }

  // Vista normal: header, side menu y chat
  return (
    <Box sx={{ 
      height: { xs: '100dvh', sm: '100vh' }, 
      maxHeight: { xs: '100dvh', sm: '100vh' }, 
      overflow: 'hidden', 
      bgcolor: 'background.default', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      {normalHeader}
      <Box sx={{ display: 'flex', flex: 1, height: '100%', paddingTop: '64px' }}>
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
          chatConfig={{
            ...chatConfig,
            profileImageUrl: profileImagePreview !== undefined ? profileImagePreview : chatConfig.profileImageUrl
          }}
          handleSendMessage={handleSendMessage}
          handleDownloadPdf={handleDownloadPdf}
          handleSeeMoreEvents={handleSeeMoreEvents}
          handleSetCurrentLanguageCode={handleSetCurrentLanguageCode}
          shouldShowChatContainer={shouldShowChatContainer}
        />
      </Box>
    </Box>
  );
};

export default AppLayout;

import React from 'react';
import { Box, Typography, Avatar, Paper, Stack, Button } from '@mui/material';
import ErrorBoundary from './ErrorBoundary';
import AppDrawer from './AppDrawer';
import MainContent from './MainContent';
import FinetuningPage from './FinetuningPage';

import UserMenu from './UserMenu';
import UserButton from './auth/UserButton';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloseIcon from '@mui/icons-material/Close';
import LanguageIcon from '@mui/icons-material/Language';
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
  isPublicChat?: boolean;
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
    isPublicChat = false
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
        py: { xs: 1, sm: 2 }, // padding vertical 8px en mobile, 16px en desktop
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
          isPublicChat={isPublicChat}
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
                  onSave={handleSaveCustomizationWithToast}
                  onCancel={() => {setCurrentView('chat'); setIsMenuOpen(false);}}
                  googleMapsScriptLoaded={googleMapsScriptLoaded}
                  apiKeyForMaps=""
                  profileImagePreview={profileImagePreview}
                  setProfileImagePreview={setProfileImagePreview}
                  activeTab={finetuningActiveTab}
                  onTabChange={setFinetuningActiveTab}
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
                  chatConfig={chatConfig}
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
      <Box sx={{ display: 'flex', flex: 1, height: '100%', paddingTop: { xs: 0, sm: '64px' } }}>
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
        />
      </Box>
      
      {/* Toast de compartir */}
      {showShareToast && (
        <Box
          sx={{
            position: 'fixed',
            bottom: '80px', // Posición arriba del input del chat
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            maxWidth: 400,
            width: '90%',
            mx: 2
          }}
        >
          <Paper
            elevation={4}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              position: 'relative',
              boxShadow: theme.shadows[8]
            }}
          >
            <IconButton
              onClick={handleCloseToast}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                color: 'text.secondary',
                size: 'small'
              }}
              size="small"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            
            <Stack spacing={1.5} alignItems="center" textAlign="center">
              <Box sx={{ color: 'primary.main' }}>
                <LanguageIcon sx={{ fontSize: 32 }} />
              </Box>
              
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                ¡Configuración Guardada!
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Tu asistente está listo. ¿Quieres compartirlo?
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleShareClick}
                startIcon={<LanguageIcon />}
                size="small"
              >
                Compartir Chat
              </Button>
            </Stack>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default AppLayout;

import React from 'react';
import { Box, Typography } from '@mui/material';
import ErrorBoundary from './ErrorBoundary';
import AppDrawer from './AppDrawer';
import MainContent from './MainContent';
import AdminRoute from './AdminRoute';
import UserMenu from './UserMenu';
import UserButton from './auth/UserButton';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
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
    deleteConversation
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

  // Header siempre visible y fijo
  const header = (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: isMenuOpen ? drawerWidth : collapsedDrawerWidth,
        width: `calc(100% - ${isMenuOpen ? drawerWidth : collapsedDrawerWidth}px)` ,
        zIndex: (theme) => theme.zIndex.appBar || 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        minHeight: '64px',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 500, flexGrow: 1, minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden' }}>
        {selectedChatIndex !== null && selectedChatIndex !== undefined && selectedChatIndex >= 0 && selectedChatIndex < chatTitles.length ? chatTitles[selectedChatIndex] : ''}
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
            >
              <AccountCircleIcon />
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
        {header}
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
      </>
    );
  }

  // DESKTOP: panel admin y chat lado a lado
  if (currentView === 'finetuning') {
    return (
      <Box sx={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
        {header}
        <Box sx={{ display: 'flex', flex: 1, height: '100%', paddingTop: '64px' }}>
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
            <ResizablePanel minSize={50} defaultSize={70} style={{ borderRight: '1px solid', borderColor: theme.palette.divider }}>
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
            </ResizablePanel>
            <ResizablePanel minSize={50} defaultSize={30}>
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
            </ResizablePanel>
          </ResizablePanelGroup>
        </Box>
      </Box>
    );
  }

  // Vista normal: header, side menu y chat
  return (
    <Box sx={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      {header}
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
          chatConfig={chatConfig}
          handleSendMessage={handleSendMessage}
          handleDownloadPdf={handleDownloadPdf}
          handleSeeMoreEvents={handleSeeMoreEvents}
          handleSetCurrentLanguageCode={handleSetCurrentLanguageCode}
        />
      </Box>
    </Box>
  );
};

export default AppLayout;


import React from 'react';
import { Box, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ChatContainer from './ChatContainer';
import UserMenu from './UserMenu';
import UserButton from './auth/UserButton';

interface User {
  id: string;
  email?: string;
}

interface MainContentProps {
  theme: any;
  isMobile: boolean;
  isMenuOpen: boolean;
  handleMenuToggle: () => void;
  currentThemeMode: 'light' | 'dark';
  toggleTheme: () => void;
  handleOpenSettings: () => void;
  user?: User | null;
  onLogin?: () => void;
  messages: any[];
  isLoading: boolean;
  appError: string | null;
  chatConfig: any;
  handleSendMessage: (message: string) => void;
  handleDownloadPdf: (pdfInfo: any) => void;
  handleSeeMoreEvents: (originalUserQuery: string) => void;
  handleSetCurrentLanguageCode: (langCode: string) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  theme,
  isMobile,
  isMenuOpen,
  handleMenuToggle,
  currentThemeMode,
  toggleTheme,
  handleOpenSettings,
  user,
  onLogin,
  messages,
  isLoading,
  appError,
  chatConfig,
  handleSendMessage,
  handleDownloadPdf,
  handleSeeMoreEvents,
  handleSetCurrentLanguageCode
}) => {
  const [userMenuAnchorEl, setUserMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
        transition: theme.transitions.create(['margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        ...(isMobile && isMenuOpen && {
          marginLeft: 0,
        }),
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: '64px',
          bgcolor: 'background.paper',
        }}
      >
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleMenuToggle}
          edge="start"
          sx={{ 
            mr: 2,
            ...(isMobile && isMenuOpen && { display: 'none' }),
          }}
        >
          <MenuIcon />
        </IconButton>

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

      {/* Chat Content */}
      <ChatContainer
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        appError={appError}
        chatConfig={chatConfig}
        onDownloadPdf={handleDownloadPdf}
        onSeeMoreEvents={handleSeeMoreEvents}
        onSetLanguageCode={handleSetCurrentLanguageCode}
      />
    </Box>
  );
};

export default MainContent;

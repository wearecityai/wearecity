import React from 'react';
import { Box, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ChatContainer from './ChatContainer';
import ChatInput from './ChatInput';
import UserMenu from './UserMenu';
import UserButton from './auth/UserButton';
import { DEFAULT_LANGUAGE_CODE } from '../constants';

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
        ...(isMobile && isMenuOpen && {
          marginLeft: 0,
        }),
        paddingTop: '64px',
      }}
    >
      {/* Contenedor con scroll que llega hasta el borde derecho */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          height: '100%',
          paddingBottom: '120px', // Space for the fixed chat input
        }}
      >
        {/* Contenedor interno con padding para el contenido */}
        <Box
          sx={{
            width: '100%',
            maxWidth: { sm: '800px' },
            margin: '0 auto',
            padding: { xs: '0 16px', sm: '0 32px' },
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Chat Content - This will start right after the header */}
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
      </Box>
      
      {/* Fixed Chat Input at the bottom */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: isMobile ? 0 : (isMenuOpen ? 260 : 72), // Same logic as header
          right: 0,
          bgcolor: 'background.default',
          zIndex: 1000,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: { sm: '800px' },
            margin: '0 auto',
          }}
        >
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            recommendedPrompts={chatConfig.recommendedPrompts}
            currentLanguageCode={chatConfig.currentLanguageCode || DEFAULT_LANGUAGE_CODE}
            onSetLanguageCode={handleSetCurrentLanguageCode}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default MainContent;

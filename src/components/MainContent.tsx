
import React from 'react';
import { Box } from '@mui/material';
import AppHeader from './AppHeader';
import ChatContainer from './ChatContainer';

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
  return (
    <Box component="main" sx={{
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      transition: theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
      }),
      ...(isMenuOpen && !isMobile && {
          transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
          }),
      }),
    }}>
      <AppHeader
        isMobile={isMobile}
        onMenuToggle={handleMenuToggle}
        currentThemeMode={currentThemeMode}
        onToggleTheme={toggleTheme}
        onOpenSettings={handleOpenSettings}
        isAuthenticated={!!user}
        onLogin={onLogin}
      />

      <ChatContainer
        messages={messages}
        isLoading={isLoading}
        appError={appError}
        chatConfig={chatConfig}
        onSendMessage={handleSendMessage}
        onDownloadPdf={handleDownloadPdf}
        onSeeMoreEvents={handleSeeMoreEvents}
        onSetLanguageCode={handleSetCurrentLanguageCode}
      />
    </Box>
  );
};

export default MainContent;

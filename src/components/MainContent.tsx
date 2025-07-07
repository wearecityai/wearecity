import React from 'react';
import { Box, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ChatContainer, { RecommendedPromptsBar } from './ChatContainer';
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
  isInFinetuningMode?: boolean; // Nueva prop para detectar si está en modo finetuning
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
  handleSetCurrentLanguageCode,
  isInFinetuningMode = false
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
        height: { xs: '100dvh', sm: '100vh' },
        maxHeight: { xs: '100dvh', sm: '100vh' },
        overflow: 'hidden',
        bgcolor: 'background.default',
        ...(isMobile && isMenuOpen && {
          marginLeft: 0,
        }),
        paddingTop: isInFinetuningMode ? 0 : '64px',
      }}
    >
      {/* Contenedor con scroll que llega hasta el borde derecho */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          height: '100%',
          paddingBottom: { 
            xs: 'calc(120px + env(safe-area-inset-bottom, 0px))', 
            sm: '120px' 
          }, // Space for the fixed chat input + safe area
        }}
      >
        {/* Saludo/avatar y prompts recomendados a ancho completo */}
        {messages.length === 0 && (
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4 }}>
            <Box sx={{ width: { xs: '100%', sm: 600, md: 800 }, maxWidth: '100%' }}>
              <ChatContainer
                messages={[]}
                isLoading={false}
                onSendMessage={() => {}}
                appError={null}
                chatConfig={chatConfig}
                onDownloadPdf={() => {}}
                onSeeMoreEvents={() => {}}
                onSetLanguageCode={() => {}}
                onlyGreeting
              />
            </Box>
            <RecommendedPromptsBar prompts={chatConfig.recommendedPrompts} />
          </Box>
        )}
        {/* Contenedor interno con padding para el contenido */}
        {messages.length > 0 && (
          <Box
            sx={{
              width: '100%',
              maxWidth: { sm: '800px' },
              margin: '0 auto',
              padding: { xs: '0 16px', sm: '0 32px' },
              minHeight: '100%',
              display: 'flex',
              flexDirection: 'column',
              mx: '16px',
            }}
          >
            {/* Chat Content - Solo mensajes reales */}
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
        )}
      </Box>
      
      {/* Fixed Chat Input at the bottom */}
      <Box
        sx={{
          position: isInFinetuningMode ? 'relative' : 'fixed',
          bottom: isInFinetuningMode ? 0 : { xs: 'env(safe-area-inset-bottom, 0px)', sm: 0 },
          left: isInFinetuningMode ? 0 : (isMobile ? 0 : (isMenuOpen ? 260 : 72)),
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

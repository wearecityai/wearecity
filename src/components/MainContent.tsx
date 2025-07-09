import React, { useRef, useEffect } from 'react';
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
  shouldShowChatContainer?: boolean; // Nueva prop para controlar la visibilidad del ChatContainer
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
  isInFinetuningMode = false,
  shouldShowChatContainer = true
}) => {
  const [userMenuAnchorEl, setUserMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollableBoxRef = useRef<HTMLDivElement>(null);
  
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  // Forzar scroll al fondo en modo finetuning
  useEffect(() => {
    if (isInFinetuningMode && scrollableBoxRef.current) {
      scrollableBoxRef.current.scrollTop = scrollableBoxRef.current.scrollHeight;
    }
  }, [isInFinetuningMode, messages]);

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: isInFinetuningMode ? '100%' : { xs: '100dvh', sm: '100vh' },
        minHeight: 0,
        maxHeight: isInFinetuningMode ? '100%' : { xs: '100dvh', sm: '100vh' },
        overflow: 'hidden',
        bgcolor: 'background.default',
        ...(isMobile && isMenuOpen && {
          marginLeft: 0,
        }),
        paddingTop: isInFinetuningMode ? 0 : '64px',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {isInFinetuningMode ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, width: '100%', maxWidth: 800, margin: '0 auto' }}>
          <Box
            ref={scrollableBoxRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              height: '100%',
              paddingBottom: 0,
            }}
          >
            {messages.length === 0 && !shouldShowChatContainer && (
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, px: 1 }}>
                <Box sx={{ width: '100%', maxWidth: '100%' }}>
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
                    user={user}
                    onLogin={onLogin}
                  />
                </Box>
                <RecommendedPromptsBar prompts={chatConfig?.recommendedPrompts || []} />
              </Box>
            )}
            {/* Mostrar ChatContainer cuando hay mensajes o cuando shouldShowChatContainer es true */}
            {(messages.length > 0 || shouldShowChatContainer) && (
              <Box
                sx={{
                  width: '100%',
                  maxWidth: '100%',
                  margin: '0 auto',
                  padding: { xs: '0 8px', sm: '0 16px' },
                  minHeight: 0,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <ChatContainer
                  messages={messages}
                  isLoading={isLoading}
                  onSendMessage={handleSendMessage}
                  appError={appError}
                  chatConfig={chatConfig}
                  onDownloadPdf={handleDownloadPdf}
                  onSeeMoreEvents={handleSeeMoreEvents}
                  onSetLanguageCode={handleSetCurrentLanguageCode}
                  user={user}
                  onLogin={onLogin}
                />
                <div ref={messagesEndRef} />
              </Box>
            )}
          </Box>
          {/* Input del chat pegado abajo en modo admin */}
          <Box sx={{ 
            width: '100%', 
            maxWidth: '100%', 
            margin: '0 auto', 
            flexShrink: 0, 
            p: 0,
            position: 'sticky',
            bottom: 0,
            zIndex: 1
          }}>
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              recommendedPrompts={chatConfig.recommendedPrompts}
              currentLanguageCode={chatConfig.currentLanguageCode || DEFAULT_LANGUAGE_CODE}
              onSetLanguageCode={handleSetCurrentLanguageCode}
              isInFinetuningMode={true}
            />
          </Box>
        </Box>
      ) : (
        <>
          <Box
            ref={scrollableBoxRef}
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              height: '100%',
              paddingBottom: { xs: 'calc(120px + env(safe-area-inset-bottom, 0px))', sm: '120px' },
              width: '100%',
              maxWidth: 800,
              margin: '0 auto',
            }}
          >
            {messages.length === 0 && !shouldShowChatContainer && (
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, px: 1 }}>
                <Box sx={{ width: '100%', maxWidth: '100%' }}>
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
                    user={user}
                    onLogin={onLogin}
                  />
                </Box>
                <RecommendedPromptsBar prompts={chatConfig?.recommendedPrompts || []} />
              </Box>
            )}
            {/* Mostrar ChatContainer cuando hay mensajes o cuando shouldShowChatContainer es true */}
            {(messages.length > 0 || shouldShowChatContainer) && (
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
                <ChatContainer
                  messages={messages}
                  isLoading={isLoading}
                  onSendMessage={handleSendMessage}
                  appError={appError}
                  chatConfig={chatConfig}
                  onDownloadPdf={handleDownloadPdf}
                  onSeeMoreEvents={handleSeeMoreEvents}
                  onSetLanguageCode={handleSetCurrentLanguageCode}
                  user={user}
                  onLogin={onLogin}
                />
                <div ref={messagesEndRef} />
              </Box>
            )}
          </Box>
          {/* Fixed Chat Input at the bottom */}
          <Box
            sx={{
              position: 'fixed',
              bottom: { xs: 'env(safe-area-inset-bottom, 0px)', sm: 0 },
              left: isMobile ? 0 : (isMenuOpen ? 260 : 72),
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
        </>
      )}
    </Box>
  );
};

export default MainContent;

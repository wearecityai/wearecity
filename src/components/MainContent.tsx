import React, { useEffect, useRef, useState } from 'react';
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
  handleToggleLocation: (enabled: boolean) => Promise<void>;
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
  shouldShowChatContainer = true,
  handleToggleLocation
}) => {
  const [userMenuAnchorEl, setUserMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [hasUserSentFirstMessage, setHasUserSentFirstMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollableBoxRef = useRef<HTMLDivElement>(null);
  
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  // Track if user has sent their first message
  useEffect(() => {
    if (messages.length > 0 && messages.some(msg => msg.role === 'user')) {
      setHasUserSentFirstMessage(true);
    }
  }, [messages]);

  // Forzar scroll al fondo en modo finetuning
  useEffect(() => {
    if (isInFinetuningMode && scrollableBoxRef.current) {
      scrollableBoxRef.current.scrollTop = scrollableBoxRef.current.scrollHeight;
    }
  }, [isInFinetuningMode, messages]);

  const drawerWidth = 260;
  const collapsedDrawerWidth = 72;

  return (
    <main
      className={`
        flex-1 flex flex-col bg-background overflow-hidden justify-center items-center
        ${isInFinetuningMode 
          ? 'h-full' 
          : 'h-screen max-h-screen'
        }
        ${isInFinetuningMode ? '' : 'pt-16'}
      `}
      style={{
        marginLeft: isMobile && isMenuOpen ? 0 : undefined,
      }}
    >
      {isInFinetuningMode ? (
        <div className="flex-1 flex flex-col h-full w-full max-w-[800px] mx-auto">
          <div
            ref={scrollableBoxRef}
            className="flex-1 overflow-y-auto h-full pb-0"
          >
            {messages.length === 0 && !shouldShowChatContainer && (
              <div className="w-full flex flex-col items-center pt-8 px-1 sm:px-1 overflow-hidden">
                <div className="w-full max-w-full overflow-hidden">
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
                </div>
                {!isMobile && !hasUserSentFirstMessage && (
                  <RecommendedPromptsBar prompts={chatConfig?.recommendedPrompts || []} onSendMessage={handleSendMessage} />
                )}
              </div>
            )}
            {/* Mostrar ChatContainer cuando hay mensajes o cuando shouldShowChatContainer es true */}
            {(messages.length > 0 || shouldShowChatContainer) && (
              <div className="w-full max-w-full mx-auto px-2 sm:px-4 h-full flex flex-col">
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
              </div>
            )}
          </div>
          {/* Input del chat pegado abajo en modo admin */}
          <div className="w-full max-w-full mx-auto flex-shrink-0 p-0 sticky bottom-0 z-[1]">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              recommendedPrompts={chatConfig.recommendedPrompts}
              currentLanguageCode={chatConfig.currentLanguageCode || DEFAULT_LANGUAGE_CODE}
              onSetLanguageCode={handleSetCurrentLanguageCode}
              isInFinetuningMode={true}
              onToggleLocation={handleToggleLocation}
              chatConfig={chatConfig}
            />
          </div>
        </div>
      ) : (
        <>
          <div
            ref={scrollableBoxRef}
            className="flex-1 overflow-y-auto overflow-x-hidden h-full w-full max-w-[800px] mx-auto pb-[120px] sm:pb-[120px] min-w-0"
            style={{
              paddingBottom: isMobile ? 'calc(120px + env(safe-area-inset-bottom, 0px))' : '120px'
            }}
          >
            {messages.length === 0 && !shouldShowChatContainer && (
              <div className="w-full flex flex-col items-center pt-8 px-1 sm:px-1 overflow-hidden">
                <div className="w-full max-w-full overflow-hidden">
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
                </div>
                {!isMobile && !hasUserSentFirstMessage && (
                  <RecommendedPromptsBar prompts={chatConfig?.recommendedPrompts || []} onSendMessage={handleSendMessage} />
                )}
              </div>
            )}
            {/* Mostrar ChatContainer cuando hay mensajes o cuando shouldShowChatContainer es true */}
            {(messages.length > 0 || shouldShowChatContainer) && (
              <div className="w-full max-w-full sm:max-w-[800px] mx-auto px-1 sm:px-2 md:px-4 min-h-full flex flex-col overflow-hidden">
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
              </div>
            )}
          </div>
          {/* Fixed Chat Input at the bottom */}
          <div
            className="fixed bg-background z-[1000]"
            style={{
              bottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : 0,
              left: isMobile ? 0 : (isMenuOpen ? drawerWidth : collapsedDrawerWidth),
              right: 0,
            }}
          >
            {/* Contenedor específico para sugerencias en mobile */}
            {isMobile && !hasUserSentFirstMessage && (
              <div className="absolute top-0 left-0 right-0 w-screen overflow-visible z-[1001]">
                <RecommendedPromptsBar prompts={chatConfig?.recommendedPrompts || []} onSendMessage={handleSendMessage} />
              </div>
            )}
            <div 
              className={`w-full max-w-full sm:max-w-[800px] mx-auto ${
                isMobile && !hasUserSentFirstMessage ? 'pt-8' : 'pt-0'
              }`}
            >
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                recommendedPrompts={chatConfig.recommendedPrompts}
                currentLanguageCode={chatConfig.currentLanguageCode || DEFAULT_LANGUAGE_CODE}
                onSetLanguageCode={handleSetCurrentLanguageCode}
                onToggleLocation={handleToggleLocation}
                chatConfig={chatConfig}
              />
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default MainContent;
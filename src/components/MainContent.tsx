import React, { useEffect, useRef, useState } from 'react';
import ChatContainer, { RecommendedPromptsBar } from './ChatContainer';
import ChatInput from './ChatInput';
import { ChatMain, ChatMessages } from './ui/chat-layout';
import { EmptyState } from './ui/empty-state';
import { DEFAULT_LANGUAGE_CODE } from '../constants';
import { MessageCircle } from 'lucide-react';

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
  isInFinetuningMode?: boolean;
  shouldShowChatContainer?: boolean;
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (isInFinetuningMode) {
    return (
      <ChatMain className="h-full max-w-4xl mx-auto">
        <ChatMessages className="flex-1 overflow-y-auto">
          {messages.length === 0 && !shouldShowChatContainer ? (
            <EmptyState
              icon={<MessageCircle className="h-8 w-8 text-muted-foreground" />}
              title="Bienvenido al configurador"
              description="Configura tu asistente de ciudad y comienza a chatear"
            />
          ) : (
            <div className="space-y-4">
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
        </ChatMessages>
        
        <div className="border-t bg-background p-4">
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
      </ChatMain>
    );
  }

  return (
    <ChatMain className="h-screen">
      <ChatMessages className="flex-1 overflow-y-auto pb-32">
        {messages.length === 0 && !shouldShowChatContainer ? (
          <div className="flex flex-col items-center justify-center h-full">
            <EmptyState
              icon={<MessageCircle className="h-8 w-8 text-muted-foreground" />}
              title={`¡Hola! Soy el asistente de ${chatConfig?.restrictedCity?.name || 'tu ciudad'}`}
              description="¿En qué puedo ayudarte hoy? Puedes preguntarme sobre servicios, eventos, trámites y mucho más."
            />
            {!isMobile && !hasUserSentFirstMessage && (
              <div className="mt-8">
                <RecommendedPromptsBar 
                  prompts={chatConfig?.recommendedPrompts || []} 
                  onSendMessage={handleSendMessage} 
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 p-4">
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
      </ChatMessages>
      
      {/* Fixed Chat Input */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
        {isMobile && !hasUserSentFirstMessage && (
          <div className="p-4 border-b">
            <RecommendedPromptsBar 
              prompts={chatConfig?.recommendedPrompts || []} 
              onSendMessage={handleSendMessage} 
            />
          </div>
        )}
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
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
      </div>
    </ChatMain>
  );
};

export default MainContent;
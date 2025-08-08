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

  // Función para obtener el avatar de la ciudad
  const getCityAvatar = () => {
    if (chatConfig?.restrictedCity?.name) {
      // Extraer solo el nombre de la ciudad (antes de la coma)
      const getCityName = () => {
        const fullName = chatConfig.restrictedCity.name;
        if (fullName.includes(',')) {
          return fullName.split(',')[0].trim();
        }
        return fullName;
      };

      // Obtener iniciales de la ciudad
      const getInitials = (name: string) => {
        return name
          .split(' ')
          .map(word => word.charAt(0))
          .join('')
          .toUpperCase()
          .slice(0, 2);
      };

      const cityName = getCityName();
      const cityImage = chatConfig.profileImageUrl || null;
      const cityInitials = getInitials(cityName);

      if (cityImage) {
        return (
          <div className="flex aspect-square size-20 items-center justify-center rounded-full overflow-hidden mb-4">
            <img 
              src={cityImage} 
              alt={cityName}
              className="w-full h-full object-cover"
            />
          </div>
        );
      } else {
        return (
          <div className="flex aspect-square size-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold mb-4">
            {cityInitials}
          </div>
        );
      }
    }
    
    // Fallback si no hay ciudad configurada
    return (
      <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <MessageCircle className="h-6 w-6" />
      </div>
    );
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
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {messages.length === 0 && !shouldShowChatContainer ? (
              <EmptyState
                icon={getCityAvatar()}
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
          </div>
        </div>
        
        <div className="bg-background p-4 chat-container">
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
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden" style={{ height: '100%' }}>
      {/* Área de mensajes - flexible */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {messages.length === 0 && !shouldShowChatContainer ? (
          <div className="flex flex-col items-center justify-center h-full p-4 pb-0">
            <EmptyState
              icon={getCityAvatar()}
              title={`¡Hola! Soy el asistente de ${chatConfig?.restrictedCity?.name || 'tu ciudad'}`}
              description="¿En qué puedo ayudarte hoy? Puedes preguntarme sobre servicios, eventos, trámites y mucho más."
            />
            {!isMobile && !hasUserSentFirstMessage && (
              <div className="mt-8 mb-0">
                <RecommendedPromptsBar 
                  prompts={chatConfig?.recommendedPrompts || []} 
                  onSendMessage={handleSendMessage} 
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center h-full">
            <div className="w-full max-w-4xl space-y-4 pb-0 px-3 sm:px-6 md:px-8">
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
          </div>
        )}
      </div>
      
      {/* Chat Input - siempre visible en la parte inferior */}
      <div className="bg-background flex-shrink-0 chat-input-container">
        <div className="px-3 py-2 sm:p-4 sm:pt-0">
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
    </div>
  );
};

export default MainContent;
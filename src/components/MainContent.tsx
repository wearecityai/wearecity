import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChatContainer, { RecommendedPromptsBar } from './ChatContainer';
import ChatInput from './ChatInput';
import { ChatMain, ChatMessages } from './ui/chat-layout';
import { EmptyState } from './ui/empty-state';
import { DEFAULT_LANGUAGE_CODE } from '../constants';
import { MessageCircle } from 'lucide-react';
import { WeatherWidget } from './WeatherWidget';

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
    geolocationStatus?: 'idle' | 'pending' | 'success' | 'error';
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
    handleToggleLocation,
    geolocationStatus = 'idle'
}) => {
  const { t } = useTranslation();
  const [userMenuAnchorEl, setUserMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [hasUserSentFirstMessage, setHasUserSentFirstMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollableBoxRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLDivElement>(null);
  
  // Dynamic bottom/left offset for the scroll button (above input and centered)
  const [scrollButtonBottom, setScrollButtonBottom] = useState<number>(96);
  const [scrollButtonLeft, setScrollButtonLeft] = useState<number>(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  
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
          <div className="flex aspect-square size-20 items-center justify-center rounded-full overflow-hidden mb-4 border-2 border-gray-400 dark:border-gray-500">
            <img 
              src={cityImage} 
              alt={cityName}
              className="w-full h-full object-cover"
            />
          </div>
        );
      } else {
        return (
          <div className="flex aspect-square size-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold mb-4 border-2 border-gray-400 dark:border-gray-500">
            {cityInitials}
          </div>
        );
      }
    }
    
    // Fallback si no hay ciudad configurada
    return (
      <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground border-2 border-gray-400 dark:border-gray-500">
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

    // Auto-scroll like ChatGPT - position last USER message at top
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      setTimeout(() => {
        if (scrollableBoxRef.current) {
          const scrollContainer = scrollableBoxRef.current;
          
          // Find the last USER message element
          const userMessageElements = scrollContainer.querySelectorAll('[data-message-role="user"]');
          
          if (userMessageElements.length > 0) {
            const lastUserMessage = userMessageElements[userMessageElements.length - 1];
            
            // Calculate position to make the last user message visible at top
            const messageTop = (lastUserMessage as HTMLElement).offsetTop;
            const headerHeight = 20; // Use same position as first message in new chat
            const targetScrollTop = messageTop - headerHeight;
            
            scrollContainer.scrollTop = Math.max(0, targetScrollTop);
            
            console.log('ChatGPT-style scroll - last user message:', {
              messageTop,
              headerHeight,
              targetScrollTop,
              finalScrollTop: scrollContainer.scrollTop,
              totalUserMessages: userMessageElements.length
            });
          } else {
            // Fallback: scroll to bottom
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            console.log('Fallback: no user messages found');
          }
        }
      }, 100);
    }
  }, [messages]);

  // Check if assistant response exceeds visible area and show scroll button
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const checkScrollPosition = () => {
      const container = scrollableBoxRef.current;
      const inputEl = chatInputRef.current;
      const endEl = messagesEndRef.current;
      if (!container || !inputEl || !endEl) {
        setShowScrollButton(false);
        return;
      }

      // Rects relative to viewport
      const inputRect = inputEl.getBoundingClientRect();
      const endRect = endEl.getBoundingClientRect();

      // True when the end of real content (anchor before spacer) is hidden behind the input
      const contentHiddenBehindInput = endRect.top > inputRect.top + 4;

      // Also ensure the user is not already pinned to bottom (no need to show)
      const { scrollTop, scrollHeight, clientHeight } = container;
      const atBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 2;

      setShowScrollButton(contentHiddenBehindInput && !atBottom);
    };

    // Check initially and on scroll
    checkScrollPosition();
    const el = scrollableBoxRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollPosition);
      // Also recalc on resize (input height/position may change)
      window.addEventListener('resize', checkScrollPosition);
      return () => {
        el.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, [messages]);

  // Measure chat input height to position the scroll button above it
  useEffect(() => {
    const updateOffset = () => {
      const inputEl = chatInputRef.current;
      const inputHeight = inputEl?.offsetHeight ?? 0;

      // Treat as mobile if prop says so OR viewport <= 640px
      const isMobileViewport = isMobile || (typeof window !== 'undefined' && window.innerWidth <= 640);
      const baseGap = isMobileViewport ? 144 : 20; // mobile: a bit higher (~144px above input)

      setScrollButtonBottom(Math.max(baseGap, inputHeight + baseGap));

      // Center horizontally with the input container
      const rect = inputEl?.getBoundingClientRect();
      if (rect) {
        setScrollButtonLeft(rect.left + rect.width / 2);
      } else if (typeof window !== 'undefined') {
        setScrollButtonLeft(window.innerWidth / 2);
      }
    };

    updateOffset();
    window.addEventListener('resize', updateOffset);

    let ro: ResizeObserver | undefined;
    if (chatInputRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateOffset);
      ro.observe(chatInputRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateOffset);
      ro?.disconnect();
    };
  }, [isMobile, messages]);

  if (isInFinetuningMode) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollableBoxRef} className="flex-1 overflow-y-auto">
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
                  setMessages={() => {}}
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
            geolocationStatus={geolocationStatus}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden h-full">
      {/* Área de mensajes - flexible */}
      <div ref={scrollableBoxRef} className="flex-1 overflow-y-auto min-h-0 chat-container">
        {messages.length === 0 && !shouldShowChatContainer ? (
          <div className={`flex flex-col items-center ${isMobile ? 'justify-start pt-20' : 'justify-center'} h-full px-4 pb-0`}>
            <div className={`${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
              <div className="flex flex-col items-center space-y-2">
                {/* Avatar de la ciudad */}
                <div className="text-muted-foreground">
                  {getCityAvatar()}
                </div>
                
                {/* Título del saludo */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-1">
                    {chatConfig?.restrictedCity?.name?.split(',')[0] || t('chat.defaultAssistant')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {(() => {
                      const cityParts = chatConfig?.restrictedCity?.name?.split(',') || [];
                      console.log('🔍 [MainContent] Datos de ciudad:', chatConfig?.restrictedCity?.name);
                      console.log('🔍 [MainContent] Partes de ciudad:', cityParts);
                      
                      if (cityParts.length >= 3) {
                        // Formato: Ciudad, Provincia, País
                        return `${cityParts[1].trim()}, ${cityParts[2].trim()}`;
                      } else if (cityParts.length === 2) {
                        // Formato: Ciudad, País
                        const cityName = cityParts[0].trim();
                        const country = cityParts[1].trim();
                        
                        // Mapeo especial para ciudades que sabemos su provincia
                        const cityProvinceMap: { [key: string]: string } = {
                          'La Vila Joiosa': 'Alicante',
                          'Benidorm': 'Alicante',
                          'Alicante': 'Alicante',
                          'Elche': 'Alicante',
                          'Torrevieja': 'Alicante',
                          'Orihuela': 'Alicante',
                          'Elda': 'Alicante',
                          'Alcoy': 'Alicante',
                          'San Vicente del Raspeig': 'Alicante',
                          'Petrel': 'Alicante',
                          'Villena': 'Alicante',
                          'Denia': 'Alicante',
                          'Calpe': 'Alicante',
                          'Xàbia': 'Alicante',
                          'Pilar de la Horadada': 'Alicante',
                          'Santa Pola': 'Alicante',
                          'Crevillente': 'Alicante',
                          'Ibi': 'Alicante',
                          'Altea': 'Alicante',
                          'Finestrat': 'Alicante',
                          'Callosa de Segura': 'Alicante',
                          'Rojales': 'Alicante',
                          'Guardamar del Segura': 'Alicante',
                          'Pego': 'Alicante',
                          'Teulada': 'Alicante',
                          'Benissa': 'Alicante',
                          'L\'Alfàs del Pi': 'Alicante',
                          'Polop': 'Alicante',
                          'La Nucía': 'Alicante',
                          'Orba': 'Alicante',
                          'Tàrbena': 'Alicante',
                          'Bolulla': 'Alicante',
                          'Callosa d\'En Sarrià': 'Alicante',
                          'Tormos': 'Alicante',
                          'Famorca': 'Alicante',
                          'Castell de Castells': 'Alicante',
                          'Benigembla': 'Alicante',
                          'Murla': 'Alicante',
                          'Parcent': 'Alicante',
                          'Alcalalí': 'Alicante',
                          'Xaló': 'Alicante',
                          'Lliber': 'Alicante',
                          'Senija': 'Alicante',
                          'Calp': 'Alicante'
                        };
                        
                        const province = cityProvinceMap[cityName] || 'Alicante';
                        return `${province}, ${country}`;
                      } else {
                        return 'Alicante, España';
                      }
                    })()}
                  </p>
                  
                  {/* Widget del tiempo */}
                  <WeatherWidget 
                    key={`weather-${chatConfig?.restrictedCity?.name?.split(',')[0] || 'Benidorm'}`}
                    city={chatConfig?.restrictedCity?.name?.split(',')[0] || 'Benidorm'} 
                    className="mb-4"
                    compact={true}
                  />
                </div>
              </div>
            </div>
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
                      <div className="w-full max-w-4xl space-y-4 pb-0 px-4 sm:px-6 md:px-8">
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
            {/* Espaciador dinámico para posicionar el último mensaje arriba */}
            <div 
              style={{ 
                paddingBottom: `${Math.max(200, (scrollableBoxRef.current?.clientHeight || 200) - 100)}px`, 
                width: '100%' 
              }}
            ></div>
          </div>
          </div>
        )}
      </div>
      
      {/* Chat Input - siempre visible en la parte inferior */}
      <div ref={chatInputRef} className="bg-background flex-shrink-0 chat-input-container">
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
              geolocationStatus={geolocationStatus}
            />
          </div>
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ bottom: scrollButtonBottom, left: scrollButtonLeft, transform: 'translateX(-50%)' }}
        >
          <button
            onClick={() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
              } else if (scrollableBoxRef.current) {
                scrollableBoxRef.current.scrollTop = scrollableBoxRef.current.scrollHeight;
              }
            }}
            className={`bg-background border border-border text-white hover:bg-accent rounded-full shadow-lg transition-all duration-200 hover:scale-110 pointer-events-auto flex items-center justify-center ${isMobile ? 'h-12 w-12' : 'p-3'}`}
            aria-label="Scroll to bottom"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-white"
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default MainContent;
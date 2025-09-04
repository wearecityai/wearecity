import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Sparkles, AlertTriangle, Wifi, HelpCircle } from 'lucide-react';
import MessageList from './MessageList';
import { ChatMessage, CustomChatConfig, RecommendedPrompt } from '../types';
import { API_KEY_ERROR_MESSAGE, MAPS_API_KEY_INVALID_ERROR_MESSAGE, DEFAULT_LANGUAGE_CODE } from '../constants';
import { WeatherWidget } from './WeatherWidget';

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  appError: string | null;
  chatConfig: CustomChatConfig;
  onSendMessage: (message: string) => void;
  onDownloadPdf: (pdfInfo: NonNullable<ChatMessage['downloadablePdfInfo']>) => void;
  onSeeMoreEvents: (originalUserQuery: string) => void;
  onSetLanguageCode: (langCode: string) => void;
  onlyGreeting?: boolean;
  user?: { id: string; email?: string } | null;
  onLogin?: () => void;
  setMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  appError,
  chatConfig,
  onSendMessage,
  onDownloadPdf,
  onSeeMoreEvents,
  onSetLanguageCode,
  onlyGreeting = false,
  user,
  onLogin,
  setMessages
}) => {
  const { t } = useTranslation();
  
  if (!onlyGreeting && messages.length === 0 && !isLoading && !messages.some(m => m.isTyping)) return null;

  const isOfflineError = appError?.toLowerCase().includes("offline") || appError?.toLowerCase().includes("network");
  const isApiError = appError === API_KEY_ERROR_MESSAGE || 
    appError?.toLowerCase().includes("google maps") || 
    appError?.toLowerCase().includes("api_key") || 
    appError?.toLowerCase().includes("invalidkeymaperror") || 
    appError === MAPS_API_KEY_INVALID_ERROR_MESSAGE;

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative w-full max-w-full min-w-0">
      {appError && !messages.some(msg => msg.error && msg.error.includes(appError)) && (
        <Alert className="mx-4 mt-2 rounded-lg" variant={isOfflineError ? "default" : "destructive"}>
          {isOfflineError ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>
            {isOfflineError ? t('errors.offlineNotice', { defaultValue: 'Connection notice' })
            : isApiError ? t('errors.apiConfigError', { defaultValue: 'API configuration error' })
            : t('common.error')}
          </AlertTitle>
          <AlertDescription>{appError}</AlertDescription>
        </Alert>
      )}

      {onlyGreeting && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Avatar className="w-20 h-20 mb-4 shadow-lg border-2 border-primary">
            <AvatarImage 
              src={chatConfig.profileImageUrl || '/placeholder.svg'} 
              alt="Assistant"
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              <Sparkles className="w-8 h-8" />
            </AvatarFallback>
          </Avatar>

          <div className="space-y-4 max-w-md">
            <h2 className="text-3xl font-bold text-gradient">
              {chatConfig.assistantName || t('chat.defaultAssistant')}
            </h2>

            <WeatherWidget 
              city={chatConfig.restrictedCity?.name || 'Benidorm'} 
              className="max-w-md mx-auto"
            />

            {chatConfig.systemInstruction && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    {chatConfig.systemInstruction.length > 200 
                      ? `${chatConfig.systemInstruction.substring(0, 200)}...` 
                      : chatConfig.systemInstruction}
                  </p>
                </CardContent>
              </Card>
            )}

            {!user && onLogin && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">
                  {t('chat.loginPrompt', { defaultValue: 'For a personalized experience, please log in' })}
                </p>
                <Button onClick={onLogin} variant="outline">
                  {t('auth.login')}
                </Button>
              </div>
            )}

            {chatConfig.restrictedCity && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm font-medium">
                      {t('chat.specializedIn', { city: chatConfig.restrictedCity.name, defaultValue: 'Specialized in {{city}}' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('chat.specializedDescription', { city: chatConfig.restrictedCity.name, defaultValue: 'This assistant is tailored to help with information and services in {{city}}.' })}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {!onlyGreeting && (
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onDownloadPdf={onDownloadPdf}
          configuredSedeElectronicaUrl={chatConfig.sedeElectronicaUrl}
          onSeeMoreEvents={onSeeMoreEvents}
          setMessages={setMessages}
        />
      )}
    </div>
  );
};

// Recommended Prompts Bar Component
export const RecommendedPromptsBar: React.FC<{
  prompts: RecommendedPrompt[];
  onSendMessage: (message: string) => void;
}> = ({ prompts, onSendMessage }) => {
  if (!prompts?.length) return null;

  return (
    <div className="w-full overflow-x-auto pb-1 sm:pb-2">
      <div className="flex gap-1 sm:gap-2 px-2 sm:px-4 min-w-max">
        {prompts.slice(0, 6).map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSendMessage(prompt.text)}
                            className="whitespace-nowrap rounded-full bg-background md:hover:bg-muted/80 border-muted-foreground/20 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
          >
            <span className="text-xs sm:text-sm">{prompt.text}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ChatContainer;
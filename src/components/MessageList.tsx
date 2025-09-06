import React, { useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';
import { LoadingSpinner } from './ui/loading-spinner';
import { Loader2 } from 'lucide-react';
import { useLoadingPattern } from '../hooks/useLoadingPattern';

interface MessageListProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onDownloadPdf: (pdfInfo: NonNullable<ChatMessageType['downloadablePdfInfo']>) => void;
  configuredSedeElectronicaUrl?: string;
  onSeeMoreEvents: (originalUserQuery: string) => void;
  setMessages?: React.Dispatch<React.SetStateAction<ChatMessageType[]>>;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading, 
  onDownloadPdf, 
  configuredSedeElectronicaUrl, 
  onSeeMoreEvents,
  setMessages 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { detectLoadingPattern } = useLoadingPattern();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Obtener la última consulta del usuario para detectar patrones de carga
  const getLastUserQuery = (): string => {
    const userMessages = messages.filter(msg => msg.role === 'user');
    return userMessages.length > 0 ? userMessages[userMessages.length - 1].content || '' : '';
  };

  // Loading state for the initial assistant load is handled by App.tsx now for Gemini UI
  // if (isLoading && messages.length === 0) {
  //   return (
  //     <div className="flex flex-col items-center justify-center flex-1 p-4">
  //       <Loader2 className="animate-spin" />
  //       <span className="text-sm text-muted-foreground mt-2">
  //         Cargando asistente...
  //       </span>
  //     </div>
  //   );
  // }
  
  if (!messages.length && !isLoading) return null;

  return (
    <div className="flex-1 py-4 bg-transparent w-full max-w-full min-w-0">
      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          onDownloadPdf={onDownloadPdf}
          configuredSedeElectronicaUrl={configuredSedeElectronicaUrl}
          onSeeMoreEvents={onSeeMoreEvents}
          setMessages={setMessages}
          userQuery={getLastUserQuery()}
        />
      ))}
      
      {/* Global loading spinner when isLoading is true but no typing message exists */}
      {isLoading && !messages.some(msg => msg.isTyping) && (
        <div className="flex items-center space-x-3 h-10 mb-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
          <div className="text-muted-foreground text-sm animate-pulse">
            {detectLoadingPattern(getLastUserQuery())}
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
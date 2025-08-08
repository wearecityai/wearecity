import React, { useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType, MessageRole } from '../types';
import ChatMessage from './ChatMessage';
import { LoadingSpinner } from './ui/loading-spinner';

interface MessageListProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onDownloadPdf: (pdfInfo: NonNullable<ChatMessageType['downloadablePdfInfo']>) => void;
  configuredSedeElectronicaUrl?: string;
  onSeeMoreEvents: (originalUserQuery: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading, 
  onDownloadPdf, 
  configuredSedeElectronicaUrl, 
  onSeeMoreEvents 
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top when new messages arrive (ChatGPT style)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, [messages.length]);

  // Reverse messages to show newest first (ChatGPT style)
  const reversedMessages = [...messages].reverse();

  if (!messages.length && !isLoading) return null;

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 bg-transparent w-full max-w-full overflow-y-auto min-w-0"
      style={{ 
        display: 'flex',
        flexDirection: 'column-reverse'
      }}
    >
      {/* Loading indicator at top when typing */}
      {isLoading && (
        <div className="py-4 px-3 sm:px-6 md:px-8">
          <ChatMessage 
            message={{
              id: 'typing',
              content: '',
              role: MessageRole.Model,
              timestamp: new Date(),
              isTyping: true
            }}
            onDownloadPdf={onDownloadPdf}
            configuredSedeElectronicaUrl={configuredSedeElectronicaUrl}
            onSeeMoreEvents={onSeeMoreEvents}
          />
        </div>
      )}

      {/* Messages in reverse order (newest first) */}
      {reversedMessages.map((message) => (
        <div key={message.id} className="py-2 px-3 sm:px-6 md:px-8">
          <ChatMessage
            message={message}
            onDownloadPdf={onDownloadPdf}
            configuredSedeElectronicaUrl={configuredSedeElectronicaUrl}
            onSeeMoreEvents={onSeeMoreEvents}
          />
        </div>
      ))}
    </div>
  );
};

export default MessageList;
import React, { useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';
import { LoadingSpinner } from './ui/loading-spinner';

interface MessageListProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onDownloadPdf: (pdfInfo: NonNullable<ChatMessageType['downloadablePdfInfo']>) => void;
  configuredSedeElectronicaUrl?: string;
  onSeeMoreEvents: (originalUserQuery: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, onDownloadPdf, configuredSedeElectronicaUrl, onSeeMoreEvents }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    <div className="flex-1 py-4 bg-transparent w-full max-w-full overflow-hidden min-w-0">
      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          onDownloadPdf={onDownloadPdf}
          configuredSedeElectronicaUrl={configuredSedeElectronicaUrl}
          onSeeMoreEvents={onSeeMoreEvents}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
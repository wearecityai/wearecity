
import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 2, bgcolor: 'transparent' }}>
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
    </Box>
  );
};

export default MessageList;

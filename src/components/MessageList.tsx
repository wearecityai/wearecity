import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage'; // Ensured relative path

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
  //     <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, p: 2 }}>
  //       <CircularProgress />
  //       <Typography variant="caption" sx={{ mt: 2, color: 'text.secondary' }}>
  //         Cargando asistente...
  //       </Typography>
  //     </Box>
  //   );
  // }
  
  return (
    <Box sx={{ flexGrow: 1, py: 2, bgcolor: 'transparent' }}> {/* overflow removido - ahora está en MainContent */}
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
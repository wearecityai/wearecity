
import React from 'react';
import { Box, Alert, AlertTitle, Typography, Stack, useTheme } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { ChatMessage, CustomChatConfig } from '../types';
import { API_KEY_ERROR_MESSAGE, MAPS_API_KEY_INVALID_ERROR_MESSAGE, DEFAULT_LANGUAGE_CODE } from '../constants';

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  appError: string | null;
  chatConfig: CustomChatConfig;
  onSendMessage: (message: string) => void;
  onDownloadPdf: (pdfInfo: NonNullable<ChatMessage['downloadablePdfInfo']>) => void;
  onSeeMoreEvents: (originalUserQuery: string) => void;
  onSetLanguageCode: (langCode: string) => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  appError,
  chatConfig,
  onSendMessage,
  onDownloadPdf,
  onSeeMoreEvents,
  onSetLanguageCode
}) => {
  const theme = useTheme();

  return (
    <Stack
      direction="column"
      sx={{
        flexGrow: 1,
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        maxWidth: { sm: '800px' },
        margin: '0 auto',
        padding: { xs: '0', sm: '0 32px' }, // 32px padding on desktop
      }}
    >
      {appError && !messages.some(msg => msg.error && msg.error.includes(appError)) && (
        <Alert
          severity={appError.toLowerCase().includes("offline") || appError.toLowerCase().includes("network") ? "warning" : "error"}
          sx={{ mx: 2, mt:1, borderRadius: 2 }} // 16px margin (2 in MUI spacing)
          iconMapping={{
            warning: <SyncProblemIcon fontSize="inherit" />,
            error: <ErrorOutlineIcon fontSize="inherit" />
          }}
        >
          <AlertTitle>
          {appError.toLowerCase().includes("offline") || appError.toLowerCase().includes("network") ? 'Aviso de Conexión'
          : appError === API_KEY_ERROR_MESSAGE || appError.toLowerCase().includes("google maps") || appError.toLowerCase().includes("api_key") || appError.toLowerCase().includes("invalidkeymaperror") || appError === MAPS_API_KEY_INVALID_ERROR_MESSAGE ? 'Error de Configuración de API'
          : 'Error'}
          </AlertTitle>
          {appError}
        </Alert>
      )}

      {messages.length === 0 && !isLoading && (
        <Box sx={{flexGrow: 1, display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', p:3, textAlign: 'center'}}>
          <AutoAwesomeIcon sx={{fontSize: 48, color: 'primary.main', mb:2}}/>
          <Typography variant="h5" sx={{mb:1}}>
            ¡Hola! ¿Cómo puedo ayudarte hoy
            {chatConfig.restrictedCity ? ` desde ${chatConfig.restrictedCity.name}` : ''}?
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            Puedes comenzar a chatear inmediatamente. Inicia sesión para guardar tus conversaciones.
          </Typography>
        </Box>
      )}
      <MessageList
        messages={messages}
        isLoading={isLoading && messages.length === 0}
        onDownloadPdf={onDownloadPdf}
        configuredSedeElectronicaUrl={chatConfig.sedeElectronicaUrl}
        onSeeMoreEvents={onSeeMoreEvents}
      />
      <ChatInput
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        recommendedPrompts={chatConfig.recommendedPrompts}
        currentLanguageCode={chatConfig.currentLanguageCode || DEFAULT_LANGUAGE_CODE}
        onSetLanguageCode={onSetLanguageCode}
      />
      <Typography variant="caption" sx={{ textAlign: 'center', p: 1, color: 'text.secondary', fontSize: '0.7rem' }}>
        Gemini puede cometer errores, incluso sobre personas, así que comprueba sus respuestas. <a href="#" style={{color: theme.palette.text.secondary}}>Tu privacidad y Gemini</a>
      </Typography>
    </Stack>
  );
};

export default ChatContainer;

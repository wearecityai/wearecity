import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  Chip,
  Stack,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LinkIcon from '@mui/icons-material/Link';
import { usePublicChats } from '@/hooks/usePublicChats';
import { useAuth } from '@/hooks/useAuth';

interface ChatLinkDisplayProps {
  assistantName?: string;
}

export const ChatLinkDisplay: React.FC<ChatLinkDisplayProps> = ({ assistantName }) => {
  const { user } = useAuth();
  const { userChats, isLoading } = usePublicChats();
  const [mainChat, setMainChat] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (userChats.length > 0) {
      // Buscar el chat que coincida con el nombre del asistente o tomar el primero
      const matchingChat = assistantName 
        ? userChats.find(chat => chat.assistant_name === assistantName)
        : userChats[0];
      setMainChat(matchingChat || userChats[0]);
    }
  }, [userChats, assistantName]);

  const getChatUrl = (slug: string) => {
    return `${window.location.origin}/chat/${slug}`;
  };

  const handleCopyLink = async () => {
    if (mainChat) {
      try {
        await navigator.clipboard.writeText(getChatUrl(mainChat.chat_slug));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
  };

  const handleOpenChat = () => {
    if (mainChat) {
      window.open(getChatUrl(mainChat.chat_slug), '_blank');
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Cargando información del chat...
        </Typography>
      </Box>
    );
  }

  if (!mainChat) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          <Typography variant="body2">
            No tienes chats públicos configurados.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <LinkIcon color="primary" />
        <Typography variant="h6">
          Link del Chat Público
        </Typography>
        <Chip 
          label={mainChat.is_public ? 'Público' : 'Test'} 
          size="small"
          color={mainChat.is_public ? 'success' : 'warning'}
          variant="outlined"
        />
      </Stack>

      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Asistente: {mainChat.assistant_name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {mainChat.is_public 
              ? 'Cualquier usuario puede acceder a este chat usando el siguiente enlace:'
              : 'Este chat está en modo test. Solo tú puedes acceder:'
            }
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            value={getChatUrl(mainChat.chat_slug)}
            variant="outlined"
            size="small"
            InputProps={{
              readOnly: true,
              sx: { 
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }
            }}
          />
          <Tooltip title="Copiar enlace">
            <IconButton 
              onClick={handleCopyLink}
              color={copied ? 'success' : 'primary'}
              sx={{ 
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  borderColor: theme.palette.primary.main
                }
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Abrir chat">
            <IconButton 
              onClick={handleOpenChat}
              sx={{ 
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  borderColor: theme.palette.primary.main
                }
              }}
            >
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {copied && (
          <Alert severity="success" sx={{ py: 0.5 }}>
            ¡Enlace copiado al portapapeles!
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}></Box>

        <Typography variant="caption" color="text.secondary">
          Creado: {new Date(mainChat.created_at).toLocaleDateString()}
          {mainChat.updated_at && mainChat.updated_at !== mainChat.created_at && (
            <span> • Actualizado: {new Date(mainChat.updated_at).toLocaleDateString()}</span>
          )}
        </Typography>
      </Stack>
    </Box>
  );
}; 
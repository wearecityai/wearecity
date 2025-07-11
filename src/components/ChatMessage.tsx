import React from 'react';
import { Box, Paper, Typography, Avatar, Button, IconButton, Chip, Stack, CircularProgress, useTheme } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy'; 
import LocationCityIcon from '@mui/icons-material/LocationCity'; // City icon for assistant
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import { ChatMessage as ChatMessageType, MessageRole } from '../types';
import EventCard from './EventCard';
import PlaceCard from './PlaceCard';
import { omitLovProps } from '../lib/omitLovProps';

interface ChatMessageProps {
  message: ChatMessageType;
  onDownloadPdf?: (pdfInfo: NonNullable<ChatMessageType['downloadablePdfInfo']>) => void;
  configuredSedeElectronicaUrl?: string;
  onSeeMoreEvents?: (originalUserQuery: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onDownloadPdf, configuredSedeElectronicaUrl, onSeeMoreEvents }) => {
  const isUser = message.role === MessageRole.User;
  const timestamp = new Date(message.timestamp);
  const theme = useTheme();

  const linkifyAndMarkdown = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\[.*?\]\(.*?\)|`.*?`|\*\*.*?\*\*|\*.*?\*|```[\s\S]*?```|~.*?~|https?:\/\/\S+)/g);
    return parts.map((part, index) => {
      if (part.match(/^\[(.*?)\]\((.*?)\)$/)) { // Markdown link
        const [, linkText, linkUrl] = part.match(/^\[(.*?)\]\((.*?)\)$/)!;
        return (
          <Button
            key={index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            variant="text"
            endIcon={<OpenInNewIcon fontSize="inherit" />}
            sx={{ textTransform: 'none', p: 0, minWidth: 'auto', verticalAlign: 'baseline', fontWeight: 'inherit', fontSize: 'inherit', color: isUser ? 'inherit' : theme.palette.primary.main }}
          >
            {linkText}
          </Button>
        );
      }
      if (part.match(/^https?:\/\/\S+$/)) { // Plain URL
        const isPartOfSpecialLink = (message.telematicProcedureLink && part.includes(message.telematicProcedureLink)) ||
                                   (configuredSedeElectronicaUrl && part.includes(configuredSedeElectronicaUrl));
        if (isPartOfSpecialLink) return part; 
        return (
             <Button
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                variant="text"
                endIcon={<OpenInNewIcon fontSize="inherit" />}
                sx={{ textTransform: 'none', p: 0, minWidth: 'auto', verticalAlign: 'baseline', fontWeight: 'inherit', fontSize: 'inherit',  color: isUser ? 'inherit' : theme.palette.primary.main, wordBreak: 'break-all' }}
            >
                {part}
            </Button>
        );
      }
      if (part.match(/^\*\*(.*?)\*\*$/)) return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
      if (part.match(/^\*(.*?)\*$/)) return <em key={index}>{part.substring(1, part.length - 1)}</em>;
      if (part.match(/^`(.*?)`$/)) return <Chip key={index} label={part.substring(1, part.length - 1)} size="small" sx={{ bgcolor: isUser ? 'rgba(255,255,255,0.2)' : theme.palette.action.hover, height: 'auto', '& .MuiChip-label': {p: '2px 6px', fontSize: '0.8rem', whiteSpace: 'normal'}}}/>;
      if (part.match(/^```([\s\S]*?)```$/)) {
        return (
          <Paper key={index} variant="outlined" sx={{ my: 1, p: 1.5, bgcolor: isUser ? 'rgba(0,0,0,0.1)' : theme.palette.background.default, overflowX: 'auto', fontSize: '0.875rem', borderRadius: 1 }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              <code>{part.substring(3, part.length - 3)}</code>
            </pre>
          </Paper>
        );
      }
      if (part.match(/^~.*?~$/)) return <s key={index}>{part.substring(1, part.length - 1)}</s>;
      return part.split('\n').map((line, i, arr) => (
        <Box key={`${index}-${i}`} component="span">
          {line}
          {i < arr.length - 1 && <br />}
        </Box>
      ));
    });
  };

  const avatar = (
    <Avatar sx={{
      width: 32, height: 32,
      bgcolor: isUser ? theme.palette.primary.main : theme.palette.secondary.main,
      color: theme.palette.common.white,
      alignSelf: 'flex-start', 
    }}>
      {isUser ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
    </Avatar>
  );

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      mb: 2,
      px: { xs: 1, sm: 0 },
      width: '100%',
      minWidth: 0,
      maxWidth: '100%',
      overflow: 'hidden',
    }}>
      {isUser ? (
        // Mensaje del usuario - alineado a la derecha
        <Box sx={{ 
          maxWidth: { xs: 'calc(100vw - 32px)', sm: '700px' },
          minWidth: 0,
          overflow: 'hidden',
        }}>
          <Paper
            elevation={0}
            sx={{
              px: { xs: 1, sm: 1.5 },
              pb: { xs: 1, sm: 1.5 },
              pt: { xs: 1, sm: 1.5 },
              bgcolor: theme.palette.mode === 'dark' ? '#36383a' : '#f1f3f4',
              color: theme.palette.mode === 'dark' ? '#fff' : '#222',
              borderRadius: '20px 4px 20px 20px',
              minWidth: '60px',
              width: 'fit-content',
              overflowWrap: 'break-word',
              wordWrap: 'break-word',
              wordBreak: 'break-word',
              hyphens: 'auto',
              overflow: 'hidden',
            }}
          >
            {(message.content && message.content.trim() !== "") && (
              <Typography 
                variant="body1" 
                component="div" 
                sx={{ 
                  whiteSpace: 'pre-line',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              > 
                {linkifyAndMarkdown(message.content)}
              </Typography>
            )}
          </Paper>
        </Box>
      ) : (
        // Mensaje del asistente - alineado a la izquierda
        <Stack direction="row" spacing={1} sx={{ 
          width: '100%', 
          minWidth: 0,
          maxWidth: '100%',
        }} alignItems="flex-start">
          {!message.isTyping && (
            <Avatar sx={{
              width: 32, height: 32,
              bgcolor: 'transparent',
              color: theme.palette.primary.main,
              alignSelf: 'flex-start',
              flexShrink: 0,
            }}>
              <LocationCityIcon fontSize="medium" />
            </Avatar>
          )}
          
          <Box sx={{ 
            maxWidth: '100%', 
            minWidth: 0, 
            flex: 1,
            overflow: 'hidden',
          }}>
            <Paper
              elevation={0}
              sx={{
                px: { xs: 1, sm: 1.5 },
                pb: { xs: 1, sm: 1.5 },
                pt: { xs: 0.5, sm: 0.75 },
                bgcolor: 'transparent',
                color: theme.palette.text.primary,
                borderRadius: '4px 20px 20px 20px',
                minWidth: '60px',
                maxWidth: { xs: 'calc(100vw - 32px)', sm: '700px' },
                width: 'fit-content',
                overflowWrap: 'break-word',
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                hyphens: 'auto',
                overflow: 'hidden',
              }}
            >
              {message.isTyping ? (
                <Stack direction="row" spacing={1} alignItems="center" className="typing-indicator" sx={{ 
                  minWidth: 0,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  height: 40,
                  flexWrap: 'nowrap',
                  alignItems: 'center',
                }}>
                  <Box sx={{ 
                    position: 'relative', 
                    width: 32, 
                    height: 32, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexShrink: 0,
                    overflow: 'visible'
                  }}>
                    <CircularProgress 
                      size={32} 
                      thickness={4}
                      sx={{ 
                        color: theme.palette.primary.main, 
                        position: 'absolute', 
                        left: 0, 
                        top: 0,
                        overflow: 'visible'
                      }}
                    />
                    <LocationCityIcon sx={{ 
                      fontSize: 20, 
                      color: theme.palette.primary.main, 
                      position: 'absolute', 
                      left: '50%', 
                      top: '50%', 
                      transform: 'translate(-50%, -50%)',
                      overflow: 'visible'
                    }} />
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      animation: 'fadeInOut 6s infinite',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.2,
                      '@keyframes fadeInOut': {
                        '0%, 100%': { opacity: 0.7 },
                        '16%, 84%': { opacity: 1 },
                      }
                    }}
                  >
                    {(() => {
                      const loadingStates = [
                        "Un momento...",
                        "Analizando la consulta...",
                        "Buscando información relevante...",
                        "Preparando la respuesta...",
                        "Verificando datos locales..."
                      ];
                      return loadingStates[Math.floor((Date.now() / 2000) % loadingStates.length)];
                    })()}
                  </Typography>
                </Stack>
              ) : message.error ? (
                <Box sx={{ bgcolor: theme.palette.error.light, p: 1, borderRadius: 1, color: theme.palette.error.dark }}>
                  <Typography variant="body2" component="p" fontWeight="bold">Error:</Typography>
                  <Typography variant="body2" component="p">{message.error}</Typography>
                </Box>
              ) : (
                <>
                  {(message.content && message.content.trim() !== "") && (
                    <Typography 
                      variant="body1" 
                      component="div" 
                      sx={{ 
                        whiteSpace: 'pre-line',
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        lineHeight: 1.4,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    > 
                      {linkifyAndMarkdown(message.content)}
                    </Typography>
                  )}
                  {message.events && message.events.length > 0 && (
                    <Stack spacing={1} sx={{ 
                      mt: 1.5, 
                      width: '100%',
                      maxWidth: '100%',
                      overflow: 'hidden',
                    }}>
                      {message.events.map((event, index) => (
                        <EventCard key={`${message.id}-event-${index}`} event={event} />
                      ))}
                    </Stack>
                  )}
                  {message.placeCards && message.placeCards.length > 0 && (
                    <Stack spacing={1} sx={{ 
                      mt: 1.5, 
                      width: '100%',
                      maxWidth: '100%',
                      overflow: 'hidden',
                    }}>
                      {message.placeCards.map((place) => (
                        <PlaceCard key={`${message.id}-place-${place.id}`} place={place} />
                      ))}
                    </Stack>
                  )}
                  {(!message.content || message.content.trim() === "") && (!message.events || message.events.length === 0) && (!message.placeCards || message.placeCards.length === 0) && (
                    <Typography variant="body2" color="text.secondary">Sin respuesta</Typography>
                  )}
                </>
              )}
            </Paper>
            {!message.isTyping && !message.error && (
              <Stack direction="row" spacing={0.5} sx={{
                mt: 0.5, 
                pl: 0.5,
                maxWidth: '100%',
                overflow: 'hidden',
              }}>
                <IconButton size="small" title="Me gusta" sx={{color: 'text.secondary'}}><ThumbUpOutlinedIcon sx={{fontSize: '1.1rem'}}/></IconButton>
                <IconButton size="small" title="No me gusta" sx={{color: 'text.secondary'}}><ThumbDownOutlinedIcon sx={{fontSize: '1.1rem'}}/></IconButton>
                <IconButton size="small" title="Copiar" sx={{color: 'text.secondary'}}><ContentCopyIcon sx={{fontSize: '1.1rem'}}/></IconButton>
                <IconButton size="small" title="Más opciones" sx={{color: 'text.secondary'}}><MoreVertIcon sx={{fontSize: '1.1rem'}}/></IconButton>
              </Stack>
            )}
          </Box>
        </Stack>
      )}
    </Box>
  );
};

export default ChatMessage;

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
        const isPartOfSpecialLink = (message.telematicProcedureLink && part.includes(message.telematicProcedureLink.url)) ||
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
        <React.Fragment key={`${index}-${i}`} {...omitLovProps({})}>
          {line}
          {i < arr.length - 1 && <br />}
        </React.Fragment>
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
      mb: 2, // Increased margin bottom
      px: { xs: 2, sm: 0 } // Remove horizontal padding on desktop as parent already has it
    }}>
      <Stack direction={isUser ? "row-reverse" : "row"} spacing={1} sx={{ width: '100%' }} alignItems="flex-start">
        {!isUser && (
            <Avatar sx={{
                width: 32, height: 32,
                bgcolor: 'transparent', // Sparkle icon needs transparent bg to sit nicely
                color: theme.palette.primary.main, // Sparkle color
                alignSelf: 'flex-start',
            }}>
                <LocationCityIcon fontSize="medium" />
            </Avatar>
        )}
        {isUser && avatar} {/* Show standard avatar for user */}
        
        <Box> {/* Wrapper for paper and action icons */}
            <Paper
            elevation={0} // Flat messages
            sx={{
                p: 1.5,
                bgcolor: isUser ? theme.palette.primary.dark : 'transparent',
                color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
                borderRadius: isUser ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                minWidth: '60px',
                maxWidth: '700px',
                width: '100%',
                margin: '0 auto',
                overflowWrap: 'break-word',
                wordWrap: 'break-word',
                hyphens: 'auto',
            }}
            >
            {message.isTyping ? (
                <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 250 }}>
                    <CircularProgress 
                        size={20} 
                        thickness={6}
                        sx={{ 
                            color: theme.palette.primary.main,
                            animationDuration: '1s'
                        }} 
                    />
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: 'text.secondary',
                            animation: 'fadeInOut 6s infinite',
                            '@keyframes fadeInOut': {
                                '0%, 100%': { opacity: 0.7 },
                                '16%, 84%': { opacity: 1 },
                            }
                        }}
                    >
                        {(() => {
                            const loadingStates = [
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
                <Box sx={{ bgcolor: isUser ? 'rgba(0,0,0,0.2)' : theme.palette.error.light, p: 1, borderRadius: 1, color: isUser ? 'inherit' : theme.palette.error.dark }}>
                <Typography variant="body2" component="p" fontWeight="bold">Error:</Typography>
                <Typography variant="body2" component="p">{message.error}</Typography>
                </Box>
            ) : (
                <>
                <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}> 
                    {linkifyAndMarkdown(message.content)}
                </Typography>

                {message.events && message.events.length > 0 && (
                    <Stack spacing={1} sx={{ mt: 1.5 }}>
                    {message.events.map((event, index) => (
                        <EventCard key={`${message.id}-event-${index}`} event={event} />
                    ))}
                    </Stack>
                )}
                {message.placeCards && message.placeCards.length > 0 && (
                    <Stack spacing={1} sx={{ mt: 1.5 }}>
                    {message.placeCards.map((place) => (
                        <PlaceCard key={`${message.id}-place-${place.id}`} place={place} />
                    ))}
                    </Stack>
                )}

                {/* Legacy Buttons (hidden for Gemini clone visual, can be re-enabled if needed) */}
                {false && (
                    <Stack spacing={1} direction="column" alignItems="flex-start" sx={{ mt: message.content ? 1.5 : 0 }}>
                        {message.downloadablePdfInfo && configuredSedeElectronicaUrl && (
                            <Button size="small" variant="contained" color={isUser ? "inherit" : "secondary"} startIcon={<OpenInNewIcon />} href={configuredSedeElectronicaUrl} target="_blank" rel="noopener noreferrer" title="Ir a la Sede Electrónica del Ayuntamiento" sx={{ textTransform: 'none', borderRadius: '16px' }}>
                                Ir a Sede Electrónica
                            </Button>
                        )}
                        {message.downloadablePdfInfo && onDownloadPdf && (
                        <Button size="small" variant={isUser ? "outlined" : "contained"} color={isUser ? "inherit" : "secondary"} startIcon={<DownloadIcon />} onClick={() => onDownloadPdf(message.downloadablePdfInfo!)} title={`Descargar ${message.downloadablePdfInfo.fileName}`} sx={{ textTransform: 'none', borderRadius: '16px' }}>
                            Descargar: {message.downloadablePdfInfo.fileName}
                        </Button>
                        )}
                        {!message.downloadablePdfInfo && message.telematicProcedureLink && (
                        <Button size="small" variant="contained" color={isUser ? "inherit" : "primary"} startIcon={<OpenInNewIcon />} href={message.telematicProcedureLink.url} target="_blank" rel="noopener noreferrer" title={`Acceder a: ${message.telematicProcedureLink.text}`} sx={{ textTransform: 'none', borderRadius: '16px' }}>
                            {message.telematicProcedureLink.text}
                        </Button>
                        )}
                        {message.showSeeMoreButton && onSeeMoreEvents && message.originalUserQueryForEvents && (
                        <Button size="small" variant="outlined" color={isUser ? "inherit" : "primary"} startIcon={<AddCircleOutlineIcon />} onClick={() => onSeeMoreEvents(message.originalUserQueryForEvents!)} title="Ver más eventos" sx={{ textTransform: 'none', borderRadius: '16px' }}>
                            Ver más eventos
                        </Button>
                        )}
                    </Stack>
                )}

                {message.mapQuery && (
                    <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic', opacity: 0.7 }}>
                    (Mapa: "{message.mapQuery}")
                    </Typography>
                )}
                </>
            )}
            {/* Timestamp removed for Gemini clone visual, can be added back if needed */}
            {/* {!message.isTyping && (
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.7 }}>
                {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
            )} */}
            </Paper>
            {!isUser && !message.isTyping && !message.error && (
                <Stack direction="row" spacing={0.5} sx={{mt:0.5, pl:0.5}}>
                    <IconButton size="small" title="Me gusta" sx={{color: 'text.secondary'}}><ThumbUpOutlinedIcon sx={{fontSize: '1.1rem'}}/></IconButton>
                    <IconButton size="small" title="No me gusta" sx={{color: 'text.secondary'}}><ThumbDownOutlinedIcon sx={{fontSize: '1.1rem'}}/></IconButton>
                    <IconButton size="small" title="Copiar" sx={{color: 'text.secondary'}}><ContentCopyIcon sx={{fontSize: '1.1rem'}}/></IconButton>
                    <IconButton size="small" title="Más opciones" sx={{color: 'text.secondary'}}><MoreVertIcon sx={{fontSize: '1.1rem'}}/></IconButton>
                </Stack>
            )}
        </Box>
      </Stack>
    </Box>
  );
};

export default ChatMessage;
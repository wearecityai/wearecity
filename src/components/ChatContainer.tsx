import React, { useEffect, useState, useRef } from 'react';
import { Box, Alert, AlertTitle, Typography, Stack, useTheme, Avatar, Button } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import MessageList from './MessageList';
import { ChatMessage, CustomChatConfig, RecommendedPrompt } from '../types';
import { API_KEY_ERROR_MESSAGE, MAPS_API_KEY_INVALID_ERROR_MESSAGE, DEFAULT_LANGUAGE_CODE } from '../constants';
import * as Icons from '@mui/icons-material';
import HelpIcon from '@mui/icons-material/Help';

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
  onLogin
}) => {
  const theme = useTheme();

  if (!onlyGreeting && messages.length === 0 && !isLoading && !messages.some(m => m.isTyping)) return null;

  return (
    <Stack
      direction="column"
      sx={{
        flexGrow: 1,
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        // maxWidth y padding removidos - ahora están en MainContent
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

      {onlyGreeting && (
        <Box sx={{flexGrow: 1, display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', p:3, textAlign: 'center'}}>
          {chatConfig.profileImageUrl ? (
            <Avatar 
              src={chatConfig.profileImageUrl} 
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'background.paper',
                color: 'primary.main',
                boxShadow: 2,
                mb: 2,
              }}
            />
          ) : (
            <Avatar
              src={process.env.BASE_URL ? process.env.BASE_URL + '/placeholder.svg' : '/placeholder.svg'}
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'background.paper',
                color: 'primary.main',
                boxShadow: 2,
                mb: 2,
              }}
            />
          )}
          <Typography variant="h5" sx={{mb:1}}>
            {(() => {
              if (chatConfig.assistantName && chatConfig.assistantName.trim() !== "") {
                return `¡Hola! Soy tu asistente de ${chatConfig.assistantName}`;
              } else if (chatConfig.restrictedCity && chatConfig.restrictedCity.name) {
                return `¡Hola! Soy tu asistente de ${chatConfig.restrictedCity.name}`;
              } else {
                return "¡Hola! Soy tu asistente";
              }
            })()}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            Realiza cualquier consulta que tengas sobre la ciudad.
          </Typography>
          {!user && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5, gap: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Para guardar tus conversaciones y mejorar las recomendaciones
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={onLogin}
                sx={{
                  color: 'primary.main',
                  textTransform: 'none',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: 'transparent'
                  }
                }}
              >
                Inicia sesión
              </Button>
            </Box>
          )}
        </Box>
      )}
      {!onlyGreeting && (
        <MessageList
          messages={messages}
          isLoading={isLoading && messages.length === 0}
          onDownloadPdf={onDownloadPdf}
          configuredSedeElectronicaUrl={chatConfig.sedeElectronicaUrl}
          onSeeMoreEvents={onSeeMoreEvents}
        />
      )}

    </Stack>
  );
};

// Helper function to get Material UI icon component by name
const getIconComponent = (iconName: string) => {
  // Convert snake_case or camelCase to PascalCase for Material UI icons
  const pascalCase = iconName
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  
  // Common icon mappings
  const iconMap: { [key: string]: any } = {
    'event': Icons.Event,
    'events': Icons.Event,
    'calendar': Icons.Event,
    'restaurant': Icons.Restaurant,
    'food': Icons.Restaurant,
    'dining': Icons.Restaurant,
    'directions_bus': Icons.DirectionsBus,
    'bus': Icons.DirectionsBus,
    'transport': Icons.DirectionsBus,
    'schedule': Icons.Schedule,
    'time': Icons.Schedule,
    'hours': Icons.Schedule,
    'library': Icons.LocalLibrary,
    'book': Icons.LocalLibrary,
    'museum': Icons.Museum,
    'culture': Icons.Museum,
    'art': Icons.Palette,
    'music': Icons.MusicNote,
    'sports': Icons.SportsScore,
    'shopping': Icons.ShoppingCart,
    'hotel': Icons.Hotel,
    'accommodation': Icons.Hotel,
    'hospital': Icons.LocalHospital,
    'health': Icons.LocalHospital,
    'pharmacy': Icons.LocalPharmacy,
    'police': Icons.LocalPolice,
    'emergency': Icons.Warning,
    'weather': Icons.WbSunny,
    'tourism': Icons.Place,
    'help': Icons.Help,
    'info': Icons.Info,
    'location': Icons.LocationOn,
    'map': Icons.Map,
    'parking': Icons.LocalParking,
    'gas': Icons.LocalGasStation,
    'taxi': Icons.LocalTaxi,
    'train': Icons.Train,
    'airport': Icons.Flight,
    'beach': Icons.Place,
    'park': Icons.Nature,
    'wifi': Icons.Wifi,
    'atm': Icons.AttachMoney,
    'church': Icons.Place,
    'government': Icons.AccountBalance,
    'school': Icons.School,
    'university': Icons.School,
  };
  
  // Try direct mapping first
  if (iconMap[iconName.toLowerCase()]) {
    return iconMap[iconName.toLowerCase()];
  }
  
  // Try PascalCase lookup in Icons
  const IconComponent = (Icons as any)[pascalCase];
  if (IconComponent) {
    return IconComponent;
  }
  
  // Fallback to help icon
  return Icons.Help;
};

export const RecommendedPromptsBar: React.FC<{ 
  prompts: RecommendedPrompt[], 
  onSendMessage: (message: string) => void 
}> = ({ prompts, onSendMessage }) => {
  if (!prompts || !Array.isArray(prompts) || prompts.length === 0) return null;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldCenter, setShouldCenter] = useState(false);
  
  // Detectar si hay overflow para centrar o no
  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        const { scrollWidth, clientWidth } = containerRef.current;
        setShouldCenter(scrollWidth <= clientWidth);
      }
    };
    
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    
    return () => window.removeEventListener('resize', checkOverflow);
  }, [prompts]);

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        overflowY: 'hidden',
        gap: 2,
        justifyContent: shouldCenter ? 'center' : 'flex-start',
        width: '100%',
        pb: 1,
        pl: 2,
        pr: 2,
        '::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {prompts.map((prompt, idx) => {
        const IconComponent = getIconComponent(prompt.img || 'help');
        // Limitar el texto del prompt a 60 caracteres
        const MAX_PROMPT_LENGTH = 60;
        const promptText = (prompt.text || '').length > MAX_PROMPT_LENGTH
          ? (prompt.text || '').slice(0, MAX_PROMPT_LENGTH - 1) + '…'
          : (prompt.text || '');
        return (
          <Box
            key={idx}
            sx={{
              background: theme => theme.palette.mode === 'dark' ? '#232428' : '#f5f5f5',
              color: theme => theme.palette.mode === 'dark' ? '#fff' : '#222',
              borderRadius: 4,
              minWidth: { xs: 110, sm: 140 },
              maxWidth: { xs: 110, sm: 140 },
              minHeight: { xs: 150, sm: 180 },
              maxHeight: { xs: 150, sm: 180 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
              fontWeight: 400,
              px: { xs: 1, sm: 1.5 },
              py: { xs: 1.5, sm: 2 },
              textAlign: 'center',
              flex: '0 0 auto',
              boxShadow: 'none',
              cursor: 'pointer',
              transition: 'background 0.18s',
              '&:hover': {
                background: theme => theme.palette.mode === 'dark' ? '#292a2e' : '#e0e0e0',
              },
              mb: 0,
              userSelect: 'none',
              gap: 1,
            }}
            onClick={() => onSendMessage(prompt.text)}
          >
            <Avatar sx={{ 
              width: { xs: 38, sm: 52 }, 
              height: { xs: 38, sm: 52 }, 
              bgcolor: 'primary.main', 
              color: 'white',
              mb: 1.2
            }}>
              <IconComponent sx={{ fontSize: { xs: 22, sm: 32 } }} />
            </Avatar>
            <span style={{ flex: 1, width: '100%', wordBreak: 'break-word', lineHeight: 1.25 }}>{promptText}</span>
          </Box>
        );
      })}
    </Box>
  );
};

export default ChatContainer;

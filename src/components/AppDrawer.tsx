import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, IconButton, Typography, Button, List, ListItem, ListItemButton, 
  ListItemIcon, ListItemText, CircularProgress, useTheme, useMediaQuery, Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import HistoryIcon from '@mui/icons-material/History';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeleteIcon from '@mui/icons-material/Delete';
import { CustomChatConfig } from '../types';

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface AppDrawerProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onNewChat: (title?: string) => void;
  onOpenFinetuning: () => void;
  chatTitles: string[];
  chatIds: string[];
  selectedChatIndex: number;
  onSelectChat: (index: number) => void;
  onDeleteChat: (conversationId: string) => void;
  chatConfig: CustomChatConfig;
  userLocation: UserLocation | null;
  geolocationStatus: 'idle' | 'pending' | 'success' | 'error';
  isPublicChat?: boolean;
}

const AppDrawer: React.FC<AppDrawerProps> = ({
  isMenuOpen,
  onMenuToggle,
  onNewChat,
  onOpenFinetuning,
  chatTitles,
  chatIds,
  selectedChatIndex,
  onSelectChat,
  onDeleteChat,
  chatConfig,
  userLocation,
  geolocationStatus,
  isPublicChat = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [locationInfo, setLocationInfo] = useState<{
    city: string;
    address: string;
    loading: boolean;
  }>({
    city: '',
    address: '',
    loading: false
  });

  // Función para obtener información de ubicación desde coordenadas
  const getLocationInfo = async (lat: number, lng: number) => {
    setLocationInfo(prev => ({ ...prev, loading: true }));
    
    try {
      // Usar la edge function para geocodificación inversa
      const response = await fetch("https://irghpvvoparqettcnpnh.functions.supabase.co/chat-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: "geocode", // Mensaje dummy requerido
          userId: null,
          userLocation: { lat, lng },
          geocodeOnly: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      
      const data = await response.json();
      
      // Usar la información devuelta por la edge function
      setLocationInfo({
        city: data.city || `Ubicación ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        address: data.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        loading: false
      });
      
    } catch (error) {
      console.error('Error obteniendo información de ubicación:', error);
      setLocationInfo({
        city: 'Ubicación actual',
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        loading: false
      });
    }
  };

  // Actualizar información de ubicación cuando cambien las coordenadas
  useEffect(() => {
    if (userLocation && geolocationStatus === 'success') {
      getLocationInfo(userLocation.latitude, userLocation.longitude);
    } else if (!userLocation) {
      setLocationInfo({
        city: '',
        address: '',
        loading: false
      });
    }
  }, [userLocation, geolocationStatus]);

  const drawerWidth = 260;
  const collapsedDrawerWidth = 72;
  
  // Constantes para consistencia
  const ICON_SIZE = 24;
  const PADDING_COLLAPSED = 0; // Sin padding en contraído para centrado perfecto
  const PADDING_EXPANDED = 2; // 16px
  const MARGIN_BETWEEN_ICON_TEXT = 1.5; // 12px
  const BUTTON_HEIGHT = 48; // Altura más generosa para mejor apariencia

  const refreshLocation = () => {
    if (chatConfig.allowGeolocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          getLocationInfo(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          setLocationInfo({
            city: 'Error de ubicación',
            address: 'No se pudo obtener la ubicación',
            loading: false
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  };

  const getDisplayCity = () => {
    if (chatConfig.restrictedCity?.name) {
      return chatConfig.restrictedCity.name;
    }
    if (locationInfo.city) {
      return locationInfo.city;
    }
    if (userLocation) {
      return "Ubicación actual";
    }
    return "Ubicación desconocida";
  };

  const getDisplayAddress = () => {
    if (chatConfig.restrictedCity?.formattedAddress) {
      return chatConfig.restrictedCity.formattedAddress;
    }
    if (locationInfo.address) {
      return locationInfo.address;
    }
    if (geolocationStatus === 'success' && userLocation) {
      return `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`;
    }
    return "Dirección no disponible";
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header con botón de menú */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        px: isMenuOpen ? PADDING_EXPANDED : 0, 
        py: 1.5,
        minHeight: 64,
        justifyContent: isMenuOpen ? 'flex-start' : 'center',
      }}>
        <IconButton
          onClick={onMenuToggle}
          sx={{
            width: BUTTON_HEIGHT,
            height: BUTTON_HEIGHT,
            mr: isMenuOpen ? MARGIN_BETWEEN_ICON_TEXT : 0,
          }}
        >
          <MenuIcon sx={{ fontSize: ICON_SIZE }} />
        </IconButton>
        {isMenuOpen && (
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Menu
          </Typography>
        )}
      </Box>
      {/* Botón Nuevo Chat */}
      <Box sx={{ 
        px: isMenuOpen ? PADDING_EXPANDED : 1, 
        pb: 1.5,
        display: 'flex',
        justifyContent: 'center'
      }}>
        <Button
          variant="outlined"
          startIcon={!isMenuOpen ? null : <EditOutlinedIcon sx={{ fontSize: ICON_SIZE }} />}
          onClick={() => onNewChat("Nuevo chat")}
          title={!isMenuOpen ? "Nuevo chat" : undefined}
          sx={{
            width: isMenuOpen ? '100%' : BUTTON_HEIGHT,
            height: BUTTON_HEIGHT,
            bgcolor: theme.palette.mode === 'dark' ? '#2e2f32' :'#e0e0e0',
            color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.primary,
            '&:hover': {
               bgcolor: theme.palette.mode === 'dark' ? '#3c3d40' :'#d5d5d5',
            },
            borderRadius: '20px',
            border: 'none',
            boxShadow: 'none',
            justifyContent: 'center',
            px: isMenuOpen ? 2 : 0,
            minWidth: isMenuOpen ? 'auto' : BUTTON_HEIGHT,
            overflow: 'hidden',
            textTransform: 'none',
            fontSize: '0.875rem',
            '& .MuiButton-startIcon': {
              mr: isMenuOpen ? MARGIN_BETWEEN_ICON_TEXT : 0,
              ml: 0,
            }
          }}
        >
          {isMenuOpen ? "Nuevo chat" : <EditOutlinedIcon sx={{ fontSize: ICON_SIZE }} />}
        </Button>
      </Box>
      <List sx={{ flexGrow: 1, px: 0, py: 0 }}>
        <ListItemButton 
          onClick={() => console.log("Descubrir ciudades clicked")}
          title={!isMenuOpen ? "Descubrir ciudades" : undefined}
          sx={{
            minHeight: BUTTON_HEIGHT,
            justifyContent: 'center',
            px: isMenuOpen ? PADDING_EXPANDED : 0,
            mx: isMenuOpen ? 1 : 1.5,
            my: 0.5,
            borderRadius: '20px',
          }}
        >
           <ListItemIcon sx={{
             minWidth: isMenuOpen ? ICON_SIZE + 8 : BUTTON_HEIGHT, 
             mr: isMenuOpen ? MARGIN_BETWEEN_ICON_TEXT : 0,
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
           }}>
             <LocationCityIcon sx={{ fontSize: ICON_SIZE }} />
           </ListItemIcon>
          {isMenuOpen && <ListItemText primary="Descubrir ciudades" primaryTypographyProps={{fontSize: '0.875rem'}} />}
        </ListItemButton>

        <Typography variant="caption" sx={{ 
          px: PADDING_EXPANDED + 1, 
          py: 1, 
          color: 'text.secondary', 
          fontWeight: 500, 
          display: isMenuOpen ? 'block' : 'none',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          RECIENTE
        </Typography>
        {isMenuOpen && chatTitles.map((title, index) => (
          <Box key={index} sx={{ position: 'relative', mx: 1, '&:hover .delete-chat-btn': { opacity: 1 } }}>
            <ListItemButton
              selected={index === selectedChatIndex}
              title={!isMenuOpen ? title : undefined}
              onClick={() => {
                  onSelectChat(index);
                  if (isMobile) onMenuToggle();
              }}
              sx={{
                minHeight: BUTTON_HEIGHT,
                justifyContent: isMenuOpen ? 'flex-start' : 'center',
                px: isMenuOpen ? PADDING_EXPANDED : PADDING_COLLAPSED,
                pr: isMenuOpen ? 6 : PADDING_COLLAPSED, // espacio para el icono de eliminar
                borderRadius: '20px',
              }}
            >
              <ListItemText 
                primary={title} 
                primaryTypographyProps={{
                  fontSize: '0.875rem', 
                  noWrap: true, 
                  textOverflow: 'ellipsis'
                }} 
              />
            </ListItemButton>
            <IconButton
              className="delete-chat-btn"
              size="small"
              aria-label="Eliminar chat"
              onClick={(event) => {
                event.stopPropagation();
                onDeleteChat(chatIds[index]);
              }}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0,
                transition: 'opacity 0.2s',
                color: 'error.main',
                zIndex: 2,
                width: 28,
                height: 28,
              }}
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        ))}
         {isMenuOpen && <ListItemButton 
           onClick={() => console.log("Mostrar más clicked")}
           title={!isMenuOpen ? "Mostrar más" : undefined}
           sx={{
             minHeight: BUTTON_HEIGHT,
             justifyContent: isMenuOpen ? 'flex-start' : 'center',
             px: isMenuOpen ? PADDING_EXPANDED : PADDING_COLLAPSED,
             mx: 1,
             borderRadius: '20px',
           }}
         >
            <ListItemIcon sx={{
              minWidth: isMenuOpen ? ICON_SIZE + 8 : BUTTON_HEIGHT, 
              mr: isMenuOpen ? MARGIN_BETWEEN_ICON_TEXT : 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ExpandMoreIcon sx={{ fontSize: ICON_SIZE }} />
            </ListItemIcon>
            <ListItemText primary="Mostrar más" primaryTypographyProps={{fontSize: '0.875rem'}}/>
        </ListItemButton>}
      </List>

      {/* Bottom Drawer Section */}
      <List sx={{ pb: 1, px: 0, py: 0 }}>
        <Divider sx={{ my: 1, mx: 1, display: isMenuOpen ? 'block' : 'none' }}/>
        <ListItemButton 
          onClick={() => console.log("Actividad clicked")}
          title={!isMenuOpen ? "Actividad" : undefined}
          sx={{
            minHeight: BUTTON_HEIGHT,
            justifyContent: 'center',
            px: isMenuOpen ? PADDING_EXPANDED : 0,
            mx: isMenuOpen ? 1 : 1.5,
            my: 0.5,
            borderRadius: '20px',
          }}
        >
            <ListItemIcon sx={{
              minWidth: isMenuOpen ? ICON_SIZE + 8 : BUTTON_HEIGHT, 
              mr: isMenuOpen ? MARGIN_BETWEEN_ICON_TEXT : 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <HistoryIcon sx={{ fontSize: ICON_SIZE }} />
            </ListItemIcon>
            {isMenuOpen && <ListItemText primary="Actividad" primaryTypographyProps={{fontSize: '0.875rem'}}/>}
        </ListItemButton>
        {!isPublicChat && (
          <ListItemButton 
            onClick={() => { onOpenFinetuning(); if (isMobile) onMenuToggle(); }}
            title={!isMenuOpen ? "Configurar chat" : undefined}
            sx={{
              minHeight: BUTTON_HEIGHT,
              justifyContent: 'center',
              px: isMenuOpen ? PADDING_EXPANDED : 0,
              mx: isMenuOpen ? 1 : 1.5,
              my: 0.5,
              borderRadius: '20px',
            }}
          >
              <ListItemIcon sx={{
                minWidth: isMenuOpen ? ICON_SIZE + 8 : BUTTON_HEIGHT, 
                mr: isMenuOpen ? MARGIN_BETWEEN_ICON_TEXT : 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <TuneIcon sx={{ fontSize: ICON_SIZE }} />
              </ListItemIcon>
              {isMenuOpen && <ListItemText primary="Configurar chat" primaryTypographyProps={{fontSize: '0.875rem'}}/>}
          </ListItemButton>
        )}
        <Divider sx={{ my: 1, mx: 1, display: isMenuOpen ? 'block' : 'none' }}/>
        
        {/* Location Section - Mejorada */}
        <ListItem
            sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: isMenuOpen ? 'flex-start' : 'center',
                minHeight: BUTTON_HEIGHT,
                px: isMenuOpen ? PADDING_EXPANDED : 0,
                mx: isMenuOpen ? 1 : 1.5,
                my: 0.5,
                py: isMenuOpen ? 1 : 0,
                cursor: 'default',
                borderRadius: '20px',
            }}
            title={!isMenuOpen ? getDisplayCity() : undefined}
        >
            <ListItemIcon 
                sx={{ 
                    minWidth: isMenuOpen ? ICON_SIZE + 8 : BUTTON_HEIGHT,
                    mr: isMenuOpen ? MARGIN_BETWEEN_ICON_TEXT : 0,
                    mt: isMenuOpen ? 0.5 : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <LocationOnIcon sx={{ fontSize: ICON_SIZE }} />
            </ListItemIcon>
            {isMenuOpen && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexGrow: 1 }}>
                     {/* Nombre del municipio/ciudad */}
                     <Typography variant="body2" sx={{ fontWeight: '500', lineHeight: 1.2, fontSize: '0.875rem' }}>
                        {getDisplayCity()}
                     </Typography>
                     
                     {/* Dirección postal detectada por coordenadas */}
                     <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                          mt: 0.25, 
                          lineHeight: 1.2,
                          fontSize: '0.75rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                     >
                        {locationInfo.loading ? 'Obteniendo dirección...' : getDisplayAddress()}
                     </Typography>
                     
                     <Button
                        variant="text"
                        size="small"
                        onClick={refreshLocation}
                        disabled={!chatConfig.allowGeolocation || locationInfo.loading}
                        sx={{
                          p: 0, 
                          justifyContent: 'flex-start', 
                          textTransform: 'none', 
                          color: 'primary.main', 
                          mt: 0.5, 
                          fontSize: '0.75rem',
                          minHeight: 'auto',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            textDecoration: 'underline'
                          }
                        }}
                     >
                        {locationInfo.loading ? 'Actualizando...' : 'Actualizar ubicación'}
                     </Button>
                </Box>
            )}
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? isMenuOpen : true}
      onClose={onMenuToggle}
      sx={{
        width: isMenuOpen ? drawerWidth : collapsedDrawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isMenuOpen ? drawerWidth : collapsedDrawerWidth,
          boxSizing: 'border-box',
          borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
          boxShadow: isMobile ? theme.shadows[3] : 'none',
          overflowX: 'hidden',
        },
        '& .MuiListItemIcon-root': {
        },
        '& .MuiListItemText-root': {
          opacity: isMenuOpen ? 1 : 0,
        }
      }}
      ModalProps={{ keepMounted: true }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default AppDrawer;

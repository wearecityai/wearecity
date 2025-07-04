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
  geolocationStatus
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
  const collapsedDrawerWidth = 56;

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
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, mb: 1 }}>
        <IconButton
          onClick={onMenuToggle}
          sx={{
            minWidth: 0,
            mr: isMenuOpen ? 1 : 0,
          }}
        >
          <MenuIcon />
        </IconButton>
        {isMenuOpen && (
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Menu
          </Typography>
        )}
      </Box>
      <Button
        variant="outlined"
        startIcon={<EditOutlinedIcon />}
        onClick={() => onNewChat("Nuevo chat")}
        title={!isMenuOpen ? "Nuevo chat" : undefined}
        sx={{
          m: '12px 16px',
          bgcolor: theme.palette.mode === 'dark' ? '#2e2f32' :'#e0e0e0',
          color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.primary,
          '&:hover': {
             bgcolor: theme.palette.mode === 'dark' ? '#3c3d40' :'#d5d5d5',
          },
          borderRadius: '24px',
          py: 1.25,
          boxShadow: 'none',
          width: isMenuOpen ? 'auto' : collapsedDrawerWidth - 24,
          minWidth: isMenuOpen ? 'auto' : 0,
          justifyContent: isMenuOpen ? 'flex-start' : 'center',
          px: isMenuOpen ? '16px' : '0px',
          overflow: 'hidden',
          '& .MuiButton-startIcon': {
            mr: isMenuOpen ? 1 : 0,
            ml: isMenuOpen ? 0 : 0,
          }
        }}
      >
        {isMenuOpen && "Nuevo chat"}
      </Button>
      <List sx={{ flexGrow: 1, px:1 }}>
        <ListItemButton 
          onClick={() => console.log("Descubrir ciudades clicked")}
          title={!isMenuOpen ? "Descubrir ciudades" : undefined}
          sx={{
            justifyContent: !isMenuOpen ? 'center' : 'flex-start',
            px: !isMenuOpen ? 2 : 3,
          }}
        >
           <ListItemIcon sx={{minWidth: isMenuOpen ? 32 : 0, mr: isMenuOpen ? 2 : 0}}><LocationCityIcon /></ListItemIcon>
          {isMenuOpen && <ListItemText primary="Descubrir ciudades" primaryTypographyProps={{fontSize: '0.875rem'}} />}
        </ListItemButton>

        <Typography variant="caption" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 500, display: isMenuOpen ? 'block' : 'none' }}>
          RECIENTE
        </Typography>
        {isMenuOpen && chatTitles.map((title, index) => (
          <Box key={index} sx={{ position: 'relative', display: 'flex', alignItems: 'center', '&:hover .delete-chat-btn': { opacity: 1 } }}>
            <ListItemButton
              selected={index === selectedChatIndex}
              title={!isMenuOpen ? title : undefined}
              onClick={() => {
                  onSelectChat(index);
                  if (isMobile) onMenuToggle();
              }}
              sx={{
                justifyContent: !isMenuOpen ? 'center' : 'flex-start',
                px: !isMenuOpen ? 2 : 3,
                pr: 5 // espacio para el icono
              }}
            >
              <ListItemText primary={title} primaryTypographyProps={{fontSize: '0.875rem', noWrap: true, textOverflow: 'ellipsis'}} />
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
                zIndex: 2
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
         {isMenuOpen && <ListItemButton 
           onClick={() => console.log("Mostrar más clicked")}
           title={!isMenuOpen ? "Mostrar más" : undefined}
           sx={{
             justifyContent: !isMenuOpen ? 'center' : 'flex-start',
             px: !isMenuOpen ? 2 : 3,
           }}
         >
            <ListItemIcon sx={{minWidth: isMenuOpen ? 32 : 0, mr: isMenuOpen ? 2 : 0}}><ExpandMoreIcon /></ListItemIcon>
            <ListItemText primary="Mostrar más" primaryTypographyProps={{fontSize: '0.875rem'}}/>
        </ListItemButton>}
      </List>

      {/* Bottom Drawer Section */}
      <List sx={{pb:1, px:1}}>
        <Divider sx={{my:1, display: isMenuOpen ? 'block' : 'none'}}/>
        <ListItemButton 
          onClick={() => console.log("Actividad clicked")}
          title={!isMenuOpen ? "Actividad" : undefined}
          sx={{
            justifyContent: !isMenuOpen ? 'center' : 'flex-start',
            px: !isMenuOpen ? 2 : 3,
          }}
        >
            <ListItemIcon sx={{minWidth: isMenuOpen ? 32 : 0, mr: isMenuOpen ? 2 : 0}}><HistoryIcon /></ListItemIcon>
            {isMenuOpen && <ListItemText primary="Actividad" primaryTypographyProps={{fontSize: '0.875rem'}}/>}
        </ListItemButton>
        <ListItemButton 
          onClick={() => { onOpenFinetuning(); if (isMobile) onMenuToggle(); }}
          title={!isMenuOpen ? "Configurar chat" : undefined}
          sx={{
            justifyContent: !isMenuOpen ? 'center' : 'flex-start',
            px: !isMenuOpen ? 2 : 3,
          }}
        >
            <ListItemIcon sx={{minWidth: isMenuOpen ? 32 : 0, mr: isMenuOpen ? 2 : 0}}><TuneIcon /></ListItemIcon>
            {isMenuOpen && <ListItemText primary="Configurar chat" primaryTypographyProps={{fontSize: '0.875rem'}}/>}
        </ListItemButton>
        <Divider sx={{my:1, display: isMenuOpen ? 'block' : 'none'}}/>
        
        {/* Location Section - Mejorada */}
        <ListItem
            sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                pt: 0.5,
                pb: 0.5,
                px: !isMenuOpen ? 2 : 3,
                cursor: 'default',
            }}
            title={!isMenuOpen ? getDisplayCity() : undefined}
        >
            <ListItemIcon 
                sx={{ 
                    minWidth: isMenuOpen ? 32 : 0,
                    mr: isMenuOpen ? 2 : 0,
                    mt: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: !isMenuOpen ? 'center' : 'flex-start'
                }}
            >
                <LocationOnIcon />
            </ListItemIcon>
            {isMenuOpen && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexGrow: 1 }}>
                     {/* Nombre del municipio/ciudad */}
                     <Typography variant="body2" sx={{fontWeight:'500', lineHeight: 1.2}}>
                        {getDisplayCity()}
                     </Typography>
                     
                     {/* Dirección postal detectada por coordenadas */}
                     <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                          mt: 0.25, 
                          lineHeight: 1.2,
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
                          fontSize: '0.75rem'
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

import React from 'react';
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
import { CustomChatConfig } from '../types';

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface AppDrawerProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onNewChat: (title?: string) => void;
  onOpenFinetuning: () => void;
  chatTitles: string[];
  selectedChatIndex: number;
  onSelectChat: (index: number) => void;
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
  selectedChatIndex,
  onSelectChat,
  chatConfig,
  userLocation,
  geolocationStatus
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const drawerWidth = 260;
  const collapsedDrawerWidth = 72;

  const drawerContent = (
    <Box sx={{ width: isMenuOpen ? drawerWidth : collapsedDrawerWidth, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', pt: 1 }} role="presentation">
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
        variant="contained"
        startIcon={<EditOutlinedIcon />}
        onClick={() => onNewChat("Nuevo chat")}
        title={!isMenuOpen ? "Nueva conversación" : undefined}
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
        {isMenuOpen && "Nueva conversación"}
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
          <ListItemButton
            key={index}
            selected={index === selectedChatIndex}
            title={!isMenuOpen ? title : undefined}
            onClick={() => {
                onSelectChat(index);
                if (isMobile) onMenuToggle();
            }}
            sx={{
              justifyContent: !isMenuOpen ? 'center' : 'flex-start',
              px: !isMenuOpen ? 2 : 3,
            }}
          >
            <ListItemText primary={title} primaryTypographyProps={{fontSize: '0.875rem', noWrap: true, textOverflow: 'ellipsis'}} />
          </ListItemButton>
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
        {/* Location Section - Always visible, text hidden when collapsed */}
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
            title={!isMenuOpen ? (chatConfig.restrictedCity?.name || (userLocation ? "Ubicación actual" : "Ubicación desconocida")) : undefined}
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
                     <Typography variant="body2" sx={{fontWeight:'500'}}>
                        {chatConfig.restrictedCity?.name || (userLocation ? "Ubicación actual" : "Ubicación desconocida")}
                        {chatConfig.restrictedCity?.name && chatConfig.restrictedCity.formattedAddress ? `, ${chatConfig.restrictedCity.formattedAddress.split(',').slice(-2).join(', ').trim()}` : ''}
                     </Typography>
                     <Typography variant="caption" color="text.secondary">
                        {geolocationStatus === 'success' && userLocation && !chatConfig.restrictedCity ? `Lat: ${userLocation.latitude.toFixed(2)}, Lon: ${userLocation.longitude.toFixed(2)}` : "De tu dirección IP"}
                     </Typography>
                    <Button
                        variant="text"
                        size="small"
                        onClick={() => chatConfig.allowGeolocation && navigator.geolocation.getCurrentPosition(() => {}, () => {}, {})} 
                        sx={{p:0, justifyContent:'flex-start', textTransform:'none', color: 'primary.main', mt:0.25, fontSize:'0.75rem'}}
                    >
                        Actualizar ubicación
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

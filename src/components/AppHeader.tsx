import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Button, Chip, Avatar, Box, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import { useTheme } from '@mui/material/styles';
import UserMenu from './UserMenu';
import { useGeolocation } from "../hooks/useGeolocation";
import { useAppState } from "../hooks/useAppState";

interface AppHeaderProps {
  isMobile: boolean;
  onMenuToggle: () => void;
  currentThemeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  isAuthenticated?: boolean;
  onLogin?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  isMobile,
  onMenuToggle,
  currentThemeMode,
  onToggleTheme,
  onOpenSettings,
  isAuthenticated = false,
  onLogin
}) => {
  const theme = useTheme();
  const [userMenuAnchorEl, setUserMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const openUserMenu = Boolean(userMenuAnchorEl);
  const { chatConfig } = useAppState();
  const { userLocation, geolocationStatus, refreshLocation, isWatching } = useGeolocation(chatConfig.allowGeolocation);

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const getLocationText = () => {
    if (!chatConfig.allowGeolocation) return "Geolocalización desactivada";
    if (geolocationStatus === 'pending') return "Obteniendo ubicación...";
    if (geolocationStatus === 'error') return "Error de ubicación";
    if (userLocation) {
      const accuracy = userLocation.accuracy ? ` (±${Math.round(userLocation.accuracy)}m)` : '';
      return `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}${accuracy}`;
    }
    return "Ubicación no disponible";
  };

  const getLocationIcon = () => {
    if (!chatConfig.allowGeolocation) return <LocationOffIcon fontSize="small" />;
    if (geolocationStatus === 'pending') return <RefreshIcon fontSize="small" className="animate-spin" />;
    if (geolocationStatus === 'error') return <ErrorIcon fontSize="small" color="error" />;
    return <LocationOnIcon fontSize="small" color={isWatching ? "success" : "primary"} />;
  };

  const getLocationColor = () => {
    if (!chatConfig.allowGeolocation) return 'text.disabled';
    if (geolocationStatus === 'pending') return 'primary.main';
    if (geolocationStatus === 'error') return 'error.main';
    return isWatching ? 'success.main' : 'primary.main';
  };

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: 'background.default', color: 'text.primary' }}>
        <Toolbar sx={{ minHeight: '56px!important', px: 2, position: 'relative' }}>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={onMenuToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          {/* Espacio para alinear el centro */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'absolute', left: 0, right: 0, pointerEvents: 'none' }}>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, letterSpacing: 1, color: 'primary.main', textAlign: 'center', pointerEvents: 'auto' }}>
              CityCore
            </Typography>
          </Box>
          {/* Resto de elementos alineados a la derecha */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              color="inherit"
              endIcon={<ArrowDropDownIcon />}
              sx={{ ml: 1, mr: 'auto', textTransform: 'none', color: 'text.secondary', borderRadius: '16px', '&:hover': {bgcolor: 'action.hover'} }}
            >
              2.5 Flash
            </Button>
            {/* Indicador de Geolocalización */}
            <Tooltip title={getLocationText()} arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                {getLocationIcon()}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    ml: 0.5, 
                    color: getLocationColor(),
                    display: { xs: 'none', md: 'block' },
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {userLocation ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : 'Sin ubicación'}
                </Typography>
                {chatConfig.allowGeolocation && geolocationStatus !== 'pending' && (
                  <IconButton
                    size="small"
                    onClick={refreshLocation}
                    sx={{ ml: 0.5, p: 0.5 }}
                    title="Actualizar ubicación"
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Tooltip>
            <Chip
              label="Probar"
              icon={<ScienceOutlinedIcon sx={{fontSize: '1.1rem !important'}}/>}
              onClick={() => console.log("Probar clicked")}
              size="small"
              sx={{
                mr: 1.5, borderRadius: '8px',
                bgcolor: theme.palette.mode === 'dark' ? '#303134' : '#e8f0fe',
                color: theme.palette.mode === 'dark' ? '#e8eaed' : '#1967d2',
                '&:hover': { bgcolor: theme.palette.mode === 'dark' ? '#3c4043' : '#d2e3fc'},
                display: {xs: 'none', sm: 'flex'}
              }}
            />
            <IconButton onClick={handleUserMenuClick} size="small">
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <PersonIcon fontSize="small"/>
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <UserMenu
        anchorEl={userMenuAnchorEl}
        open={openUserMenu}
        onClose={handleUserMenuClose}
        currentThemeMode={currentThemeMode}
        onToggleTheme={onToggleTheme}
        onOpenSettings={onOpenSettings}
        isAuthenticated={isAuthenticated}
        onLogin={onLogin}
      />
    </>
  );
};

export default AppHeader;

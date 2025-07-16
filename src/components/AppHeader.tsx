import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Avatar, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import { useTheme } from '@mui/material/styles';
import UserMenu from './UserMenu';

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

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
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
              CityChat
            </Typography>
          </Box>
          {/* Resto de elementos alineados a la derecha */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
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

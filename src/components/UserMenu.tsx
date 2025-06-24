
import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsIcon from '@mui/icons-material/Settings';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface UserMenuProps {
  anchorEl: null | HTMLElement;
  open: boolean;
  onClose: () => void;
  currentThemeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  isAuthenticated?: boolean;
  onLogin?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  anchorEl,
  open,
  onClose,
  currentThemeMode,
  onToggleTheme,
  onOpenSettings,
  isAuthenticated = false,
  onLogin
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Use actual authentication state from useAuth hook
  const actuallyAuthenticated = !!user;
  
  console.log('UserMenu props:', { 
    isAuthenticated, 
    actuallyAuthenticated, 
    hasOnLogin: !!onLogin,
    hasUser: !!user 
  });

  const handleToggleTheme = () => {
    onToggleTheme();
    onClose();
  };

  const handleOpenSettings = () => {
    onOpenSettings();
    onClose();
  };

  const handleLogin = () => {
    console.log('Login button clicked');
    if (onLogin) {
      onLogin();
    } else {
      navigate('/auth');
    }
    onClose();
  };

  const handleLogout = async () => {
    console.log('Logout button clicked');
    await signOut();
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      MenuListProps={{ 'aria-labelledby': 'user-avatar-button' }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem onClick={handleToggleTheme}>
        <ListItemIcon>
          {currentThemeMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </ListItemIcon>
        <ListItemText>Cambiar a modo {currentThemeMode === 'dark' ? 'Claro' : 'Oscuro'}</ListItemText>
      </MenuItem>
      
      {!actuallyAuthenticated ? (
        <MenuItem onClick={handleLogin}>
          <ListItemIcon><LoginIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Iniciar Sesión</ListItemText>
        </MenuItem>
      ) : (
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Cerrar Sesión</ListItemText>
        </MenuItem>
      )}
      
      <MenuItem onClick={handleOpenSettings}>
        <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Ajustes</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default UserMenu;

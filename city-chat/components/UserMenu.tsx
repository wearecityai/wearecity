
import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsIcon from '@mui/icons-material/Settings';

interface UserMenuProps {
  anchorEl: null | HTMLElement;
  open: boolean;
  onClose: () => void;
  currentThemeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  anchorEl,
  open,
  onClose,
  currentThemeMode,
  onToggleTheme,
  onOpenSettings
}) => {
  const handleToggleTheme = () => {
    onToggleTheme();
    onClose();
  };

  const handleOpenSettings = () => {
    onOpenSettings();
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
      <MenuItem onClick={handleOpenSettings}>
        <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Ajustes</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default UserMenu;

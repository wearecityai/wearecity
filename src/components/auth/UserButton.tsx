import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Typography, Box, Button as MuiButton } from '@mui/material';
import { User, Settings, LogOut, Shield, LogIn } from 'lucide-react';

const UserButton = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    await signOut();
    handleMenuClose();
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email || 'Usuario';
  };

  const getRoleDisplay = () => {
    return profile?.role === 'administrativo' ? 'Administrador' : 'Ciudadano';
  };

  // If user is not authenticated, show login button
  if (!user) {
    return (
      <MuiButton variant="outlined" color="inherit" onClick={handleLogin} size="small" startIcon={<LogIn style={{width: 18, height: 18}} />}>Iniciar Sesión</MuiButton>
    );
  }

  return (
    <>
      <IconButton onClick={handleMenuOpen} size="small" sx={{ ml: 1 }} aria-controls={open ? 'user-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined}>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="user-menu"
        open={open}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 4,
          sx: { minWidth: 220, borderRadius: 2, mt: 1 }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={500} noWrap>{getDisplayName()}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography>
          {profile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              {profile?.role === 'administrativo' && <Shield style={{width: 14, height: 14}} />}
              <Typography variant="caption" color="text.secondary">{getRoleDisplay()}</Typography>
            </Box>
          )}
        </Box>
        <Divider />
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon><User style={{width: 20, height: 20}} /></ListItemIcon>
          <ListItemText>Perfil</ListItemText>
        </MenuItem>
        {profile?.role === 'administrativo' && (
          <MenuItem onClick={() => navigate('/profile')}>
            <ListItemIcon><Settings style={{width: 20, height: 20}} /></ListItemIcon>
            <ListItemText>Configuración</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon><LogOut style={{width: 20, height: 20}} /></ListItemIcon>
          <ListItemText>Cerrar Sesión</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserButton;

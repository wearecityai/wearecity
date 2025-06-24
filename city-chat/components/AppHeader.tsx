
import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Button, Chip, Avatar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
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
        <Toolbar sx={{ minHeight: '56px!important', px: 2 }}>
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
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 500 }}>
            Gemini
          </Typography>
          <Button
            size="small"
            color="inherit"
            endIcon={<ArrowDropDownIcon />}
            sx={{ ml: 1, mr: 'auto', textTransform: 'none', color: 'text.secondary', borderRadius: '16px', '&:hover': {bgcolor: 'action.hover'} }}
          >
            2.5 Flash
          </Button>

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

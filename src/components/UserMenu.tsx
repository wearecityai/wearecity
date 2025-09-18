import React from 'react';
import { useAuth } from '@/hooks/useAuthFirebase';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Sun, Moon, Settings, LogIn, LogOut, User } from 'lucide-react';

interface UserMenuProps {
  currentThemeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  isAuthenticated?: boolean;
  onLogin?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
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

  const handleToggleTheme = () => {
    onToggleTheme();
  };

  const handleOpenSettings = () => {
    onOpenSettings();
  };

  const handleLogin = () => {
    console.log('Login button clicked');
    if (onLogin) {
      onLogin();
    } else {
      navigate('/auth');
    }
  };

  const handleLogout = async () => {
    console.log('Logout button clicked');
    await signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        side="bottom"
        className="w-56"
      >
        <DropdownMenuItem onClick={handleToggleTheme}>
          {currentThemeMode === 'dark' ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          Cambiar a modo {currentThemeMode === 'dark' ? 'Claro' : 'Oscuro'}
        </DropdownMenuItem>
        
        {!actuallyAuthenticated ? (
          <DropdownMenuItem onClick={handleLogin}>
            <LogIn className="mr-2 h-4 w-4" />
            Iniciar Sesión
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={handleOpenSettings}>
          <Settings className="mr-2 h-4 w-4" />
          Ajustes
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
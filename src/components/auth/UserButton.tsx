
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, LogOut, Shield, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const UserButton = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    console.log('User signing out');
    await signOut();
    navigate('/');
  };

  const handleLogin = () => {
    console.log('Redirecting to login page');
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
      <Button variant="ghost" onClick={handleLogin} className="h-8">
        <LogIn className="w-4 h-4 mr-2" />
        Iniciar Sesión
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
            {profile && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {profile?.role === 'administrativo' && <Shield className="w-3 h-3" />}
                {getRoleDisplay()}
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        {profile?.role === 'administrativo' && (
          <DropdownMenuItem onClick={() => navigate('/admin')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Panel Administrativo</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;

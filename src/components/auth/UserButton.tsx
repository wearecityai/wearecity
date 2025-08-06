import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { User, Settings, LogOut, Shield, LogIn } from 'lucide-react';

const UserButton = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
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
      <Button variant="outline" size="sm" onClick={handleLogin}>
        <LogIn className="w-4 h-4 mr-2" />
        Iniciar Sesión
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="px-3 py-2">
          <p className="text-sm font-medium">{getDisplayName()}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          {profile && (
            <div className="flex items-center gap-1 mt-1">
              {profile?.role === 'administrativo' && <Shield className="w-3 h-3" />}
              <span className="text-xs text-muted-foreground">{getRoleDisplay()}</span>
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
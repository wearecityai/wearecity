import React from 'react';
import { Menu, User } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center relative px-4">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={onMenuToggle}
              aria-label="menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          {/* Centered title */}
          <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
            <h1 className="text-lg font-bold tracking-wide text-primary pointer-events-auto">
              CityChat
            </h1>
          </div>
          
          {/* Right-aligned user menu */}
          <div className="flex items-center justify-end flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUserMenuClick}
              className="relative h-8 w-8 rounded-full"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </header>
      
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
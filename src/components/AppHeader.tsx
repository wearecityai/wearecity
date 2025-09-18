import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center relative px-4">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 rounded-full"
              onClick={onMenuToggle}
              aria-label="menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          {/* Centered title */}
          <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
            <h1 className="text-lg font-bold tracking-wide text-primary pointer-events-auto">
              {t('chat.title')}
            </h1>
          </div>
          
          {/* Right-aligned user menu */}
          <div className="flex items-center justify-end flex-1">
            {isAuthenticated ? (
              <UserMenu
                currentThemeMode={currentThemeMode}
                onToggleTheme={onToggleTheme}
                onOpenSettings={onOpenSettings}
                isAuthenticated={isAuthenticated}
                onLogin={onLogin}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onLogin}
                className="bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-full"
              >
                Iniciar sesión
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default AppHeader;
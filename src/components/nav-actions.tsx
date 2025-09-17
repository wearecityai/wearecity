import * as React from "react"
import { useTranslation } from 'react-i18next'
import {
  MoreHorizontal,
  LogOut,
  User,
  ArrowLeft,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate, useLocation } from "react-router-dom"

export function NavActions() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const getUserInitials = (user: any) => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {user ? (
        /* User Avatar Dropdown */
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuItem className="flex flex-col items-start p-3">
              <div className="font-medium">{user.email}</div>
              <div className="text-xs text-muted-foreground">{t('auth.user', { defaultValue: 'User' })}</div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('auth.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        /* Show login button when not authenticated */
        <Button
          onClick={handleSignIn}
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
        >
          <User className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
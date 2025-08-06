import React, { useState, useEffect } from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  useSidebar 
} from './ui/sidebar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Sparkles, 
  Plus, 
  Home, 
  Settings, 
  Trash2, 
  Globe, 
  MapPin,
  RefreshCw,
  Moon,
  Sun
} from 'lucide-react';
import { StatusBadge } from './ui/status-badge';

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface Conversation {
  id: string;
  title: string;
}

interface AppSidebarProps {
  onNewChat: () => void;
  conversations: Conversation[];
  selectedChatIndex: number;
  onSelectChat: (index: number) => void;
  onDeleteConversation: (id: string) => Promise<void>;
  chatConfig: any;
  userLocation: UserLocation | null;
  geolocationStatus: 'idle' | 'pending' | 'success' | 'error';
  currentThemeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenFinetuning: () => void;
}

export function AppSidebar({
  onNewChat,
  conversations,
  selectedChatIndex,
  onSelectChat,
  onDeleteConversation,
  chatConfig,
  userLocation,
  geolocationStatus,
  currentThemeMode,
  onToggleTheme,
  onOpenSettings,
  onOpenFinetuning
}: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const [locationInfo, setLocationInfo] = useState<{
    city: string;
    address: string;
  } | null>(null);

  const getLocationInfo = async (location: UserLocation) => {
    if (!location) return;
    
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${location.latitude}+${location.longitude}&key=c7935e98c4bf4ee1b8a0f6ac5e67efb5&language=es&pretty=1`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const components = result.components;
        
        const city = components.city || components.town || components.village || components.county || 'Ciudad desconocida';
        const address = result.formatted || 'Dirección no disponible';
        
        setLocationInfo({ city, address });
      }
    } catch (error) {
      console.error('Error obteniendo información de ubicación:', error);
    }
  };

  useEffect(() => {
    if (userLocation && geolocationStatus === 'success') {
      getLocationInfo(userLocation);
    }
  }, [userLocation, geolocationStatus]);

  const getDisplayCity = () => {
    if (chatConfig?.restrictedCity?.name) {
      return chatConfig.restrictedCity.name;
    }
    return locationInfo?.city || 'Tu ciudad';
  };

  const getDisplayAddress = () => {
    if (chatConfig?.restrictedCity?.name) {
      return `Modo restringido a ${chatConfig.restrictedCity.name}`;
    }
    return locationInfo?.address || 'Ubicación no disponible';
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && (
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {chatConfig?.restrictedCity?.name || 'CityCore'}
            </h1>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNewChat} className="w-full">
                  <Plus className="h-4 w-4" />
                  {!collapsed && <span>Nuevo Chat</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Home className="h-4 w-4" />
                  {!collapsed && <span>Inicio</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Globe className="h-4 w-4" />
                  {!collapsed && <span>Descubrir Ciudades</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {conversations.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Conversaciones Recientes</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {conversations.slice(0, 5).map((conversation, index) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      onClick={() => onSelectChat(index)}
                      isActive={index === selectedChatIndex}
                      className="group"
                    >
                      <span className="truncate">
                        {!collapsed && conversation.title}
                      </span>
                      {!collapsed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 opacity-0 group-hover:opacity-100 ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conversation.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {chatConfig?.allowGeolocation && (
          <SidebarGroup>
            <SidebarGroupLabel>Ubicación</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2 py-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {getDisplayCity()}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {getDisplayAddress()}
                      </div>
                      <StatusBadge 
                        status={geolocationStatus === 'pending' ? 'loading' : geolocationStatus === 'success' ? 'online' : 'error'} 
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
                {!collapsed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Actualizar
                  </Button>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onToggleTheme}>
              {currentThemeMode === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {!collapsed && <span>Cambiar Tema</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onOpenSettings}>
              <Settings className="h-4 w-4" />
              {!collapsed && <span>Configuración</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
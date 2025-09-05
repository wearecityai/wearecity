import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from './ui/sidebar';
import { 
  Edit3, 
  MapPin, 
  Settings, 
  Sliders, 
  ChevronDown, 
  Navigation, 
  Trash2, 
  Star,
  MoreHorizontal,
  Plus,
  MessageCircle,
  Home
} from 'lucide-react';
import { CustomChatConfig } from '../types';
import { useDefaultChat } from '../hooks/useDefaultChat';
import { StatusBadge } from './ui/status-badge';
import { GeolocationIndicator } from './GeolocationIndicator';

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface AppDrawerProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onNewChat: (title?: string) => void;
  onOpenFinetuning: () => void;
  chatTitles: string[];
  chatIds: string[];
  selectedChatIndex: number;
  onSelectChat: (index: number) => void;
  onDeleteChat: (conversationId: string) => void;
  chatConfig: CustomChatConfig;
  userLocation: UserLocation | null;
  geolocationStatus: 'idle' | 'pending' | 'success' | 'error';
  isPublicChat?: boolean;
}

const AppDrawer: React.FC<AppDrawerProps> = ({
  isMenuOpen,
  onMenuToggle,
  onNewChat,
  onOpenFinetuning,
  chatTitles,
  chatIds,
  selectedChatIndex,
  onSelectChat,
  onDeleteChat,
  chatConfig,
  userLocation,
  geolocationStatus,
  isPublicChat = false
}) => {
  const navigate = useNavigate();
  const sidebarContext = useSidebar();
  const collapsed = sidebarContext?.state === 'collapsed';
  const { defaultChat, setDefaultChat, removeDefaultChat, isDefaultChat } = useDefaultChat();
  const [locationInfo, setLocationInfo] = useState<{
    city: string;
    address: string;
    loading: boolean;
  }>({
    city: '',
    address: '',
    loading: false
  });

  // Evitar geocodificación automática: sólo mostrar coordenadas hasta que el usuario lo solicite
  const updateLocationFromCoords = (lat: number, lng: number) => {
    setLocationInfo({
      city: 'Ubicación actual',
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      loading: false
    });
  };

  // Actualizar sólo coordenadas cuando cambien (sin reverse geocoding automático)
  useEffect(() => {
    if (userLocation && geolocationStatus === 'success') {
      updateLocationFromCoords(userLocation.latitude, userLocation.longitude);
    } else if (!userLocation) {
      setLocationInfo({
        city: '',
        address: '',
        loading: false
      });
    }
  }, [userLocation, geolocationStatus]);

  const drawerWidth = 260;
  const collapsedDrawerWidth = 72;

  const refreshLocation = () => {
    if (chatConfig.allowGeolocation && navigator.geolocation) {
      setLocationInfo(prev => ({ ...prev, loading: true }));
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateLocationFromCoords(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          setLocationInfo({
            city: 'Error de ubicación',
            address: 'No se pudo obtener la ubicación',
            loading: false
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  };

  const getDisplayCity = () => {
    if (chatConfig.restrictedCity?.name) {
      return chatConfig.restrictedCity.name;
    }
    if (locationInfo.city) {
      return locationInfo.city;
    }
    if (userLocation) {
      return "Ubicación actual";
    }
    return "Ubicación desconocida";
  };

  const getDisplayAddress = () => {
    if (chatConfig.restrictedCity?.formattedAddress) {
      return chatConfig.restrictedCity.formattedAddress;
    }
    if (locationInfo.address) {
      return locationInfo.address;
    }
    if (geolocationStatus === 'success' && userLocation) {
      return `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`;
    }
    return "Dirección no disponible";
  };

  // Función para manejar el toggle del chat predeterminado
  const handleToggleDefaultChat = () => {
    const currentChatId = chatIds[selectedChatIndex];
    const currentChatTitle = chatTitles[selectedChatIndex];
    
    if (currentChatId && currentChatTitle) {
      if (isDefaultChat(currentChatId)) {
        removeDefaultChat();
      } else {
        setDefaultChat(currentChatId, currentChatTitle);
      }
    }
  };

  return (
    <Sidebar collapsible="icon" className="sidebar-transition">
      <SidebarHeader className="border-b border-sidebar-border p-4 sidebar-content-transition">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessageCircle className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="sidebar-content-transition">
              <h2 className="text-lg font-semibold text-sidebar-foreground">WeAreCity</h2>
              <p className="text-xs text-sidebar-foreground/60">Chat inteligente</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="sidebar-content-transition">
        {/* New Chat */}
        <SidebarGroup className="sidebar-content-transition">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onNewChat("Nuevo chat")}
                className="w-full sidebar-button-transition"
                size="lg"
              >
                <Plus className="h-4 w-4" />
                {!collapsed && <span className="sidebar-content-transition">Nuevo chat</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup className="sidebar-content-transition">
          <SidebarGroupLabel className="sidebar-content-transition">Navegación</SidebarGroupLabel>
          <SidebarGroupContent className="sidebar-content-transition">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/')}
                  tooltip="Inicio"
                  className="sidebar-button-transition"
                >
                  <Home className="h-4 w-4" />
                  <span className="sidebar-content-transition">Inicio</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/?focus=search')}
                  tooltip="Descubrir ciudades"
                  className="sidebar-button-transition"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="sidebar-content-transition">Descubrir ciudades</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Chats */}
        {chatTitles.length > 0 && (
          <SidebarGroup className="sidebar-content-transition">
            <SidebarGroupLabel className="sidebar-content-transition">Conversaciones recientes</SidebarGroupLabel>
            <SidebarGroupContent className="sidebar-content-transition">
              <SidebarMenu>
                {chatTitles.slice(0, 5).map((title, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton
                      onClick={() => onSelectChat(index)}
                      isActive={index === selectedChatIndex}
                      className="group w-full justify-between sidebar-button-transition"
                      tooltip={title}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MessageCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate sidebar-content-transition">{title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isDefaultChat(chatIds[index]) && (
                          <Star className="h-3 w-3 text-primary sidebar-content-transition" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chatIds[index]);
                          }}
                          className="h-6 w-6 p-0 opacity-0 md:group-hover:opacity-100 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {chatTitles.length > 5 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton className="sidebar-button-transition">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sidebar-content-transition">Ver más ({chatTitles.length - 5})</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 sidebar-content-transition">
        <SidebarMenu>
          {/* Default chat toggle */}
          {chatIds.length > 0 && selectedChatIndex >= 0 && chatIds[selectedChatIndex] && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  const currentChatId = chatIds[selectedChatIndex];
                  const currentChatTitle = chatTitles[selectedChatIndex];
                  if (currentChatId && currentChatTitle) {
                    if (isDefaultChat(currentChatId)) {
                      removeDefaultChat();
                    } else {
                      setDefaultChat(currentChatId, currentChatTitle);
                    }
                  }
                }}
                tooltip={isDefaultChat(chatIds[selectedChatIndex]) ? "Quitar chat predeterminado" : "Marcar como predeterminado"}
                className="sidebar-button-transition"
              >
                <Star className={cn("h-4 w-4", isDefaultChat(chatIds[selectedChatIndex]) && "text-primary")} />
                <span className="sidebar-content-transition">{isDefaultChat(chatIds[selectedChatIndex]) ? "Chat predeterminado" : "Marcar predeterminado"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* Settings */}
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Ajustes" className="sidebar-button-transition">
              <Settings className="h-4 w-4" />
              <span className="sidebar-content-transition">Ajustes</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Configure chat */}
          {!isPublicChat && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={onOpenFinetuning}
                tooltip="Configurar chat"
                className="sidebar-button-transition"
              >
                <Sliders className="h-4 w-4" />
                <span className="sidebar-content-transition">Configurar chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* Location section */}
          {chatConfig.allowGeolocation && (
            <>
              <Separator className="my-2" />
              <div className="px-2 py-1">
                {!collapsed ? (
                  <div className="space-y-2">
                    <GeolocationIndicator
                      status={geolocationStatus}
                      userLocation={userLocation}
                      onRetry={refreshLocation}
                    />
                    {userLocation && chatConfig.restrictedCity?.name && (
                      <div className="text-xs text-sidebar-foreground/60">
                        📍 {chatConfig.restrictedCity.name}
                      </div>
                    )}
                  </div>
                ) : (
                  <GeolocationIndicator
                    status={geolocationStatus}
                    userLocation={userLocation}
                    compact
                  />
                )}
              </div>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppDrawer;
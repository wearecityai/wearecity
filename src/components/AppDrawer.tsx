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

  // Función para obtener información de ubicación desde coordenadas
  const getLocationInfo = async (lat: number, lng: number) => {
    setLocationInfo(prev => ({ ...prev, loading: true }));
    
    try {
      // Usar la edge function para geocodificación inversa
      const response = await fetch("https://irghpvvoparqettcnpnh.functions.supabase.co/chat-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: "geocode", // Mensaje dummy requerido
          userId: null,
          userLocation: { lat, lng },
          geocodeOnly: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      
      const data = await response.json();
      
      // Usar la información devuelta por la edge function
      setLocationInfo({
        city: data.city || `Ubicación ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        address: data.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        loading: false
      });
      
    } catch (error) {
      console.error('Error obteniendo información de ubicación:', error);
      setLocationInfo({
        city: 'Ubicación actual',
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        loading: false
      });
    }
  };

  // Actualizar información de ubicación cuando cambien las coordenadas
  useEffect(() => {
    if (userLocation && geolocationStatus === 'success') {
      getLocationInfo(userLocation.latitude, userLocation.longitude);
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
          getLocationInfo(position.coords.latitude, position.coords.longitude);
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
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessageCircle className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">WeAreCity</h2>
              <p className="text-xs text-sidebar-foreground/60">Chat inteligente</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* New Chat */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onNewChat("Nuevo chat")}
                className="w-full"
                size="lg"
              >
                <Plus className="h-4 w-4" />
                {!collapsed && <span>Nuevo chat</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/')}
                  tooltip="Inicio"
                >
                  <Home className="h-4 w-4" />
                  <span>Inicio</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/?focus=search')}
                  tooltip="Descubrir ciudades"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Descubrir ciudades</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Chats */}
        {chatTitles.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Conversaciones recientes</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {chatTitles.slice(0, 5).map((title, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton
                      onClick={() => onSelectChat(index)}
                      isActive={index === selectedChatIndex}
                      className="group w-full justify-between"
                      tooltip={title}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MessageCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isDefaultChat(chatIds[index]) && (
                          <Star className="h-3 w-3 text-primary" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chatIds[index]);
                          }}
                          className="h-6 w-6 p-0 opacity-0 md:group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {chatTitles.length > 5 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <MoreHorizontal className="h-4 w-4" />
                      <span>Ver más ({chatTitles.length - 5})</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
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
              >
                <Star className={cn("h-4 w-4", isDefaultChat(chatIds[selectedChatIndex]) && "text-primary")} />
                <span>{isDefaultChat(chatIds[selectedChatIndex]) ? "Chat predeterminado" : "Marcar predeterminado"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* Settings */}
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Ajustes">
              <Settings className="h-4 w-4" />
              <span>Ajustes</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Configure chat */}
          {!isPublicChat && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={onOpenFinetuning}
                tooltip="Configurar chat"
              >
                <Sliders className="h-4 w-4" />
                <span>Configurar chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* Location section */}
          {chatConfig.allowGeolocation && (
            <>
              <Separator className="my-2" />
              <div className="px-2 py-1">
                <div className="flex items-center gap-3">
                  <Navigation className="h-4 w-4 text-sidebar-foreground/60" />
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <StatusBadge 
                        status={geolocationStatus === 'success' ? 'success' : geolocationStatus === 'error' ? 'error' : 'loading'}
                        className="text-xs"
                      >
                        {userLocation ? getDisplayCity() : 'Ubicación'}
                      </StatusBadge>
                      {userLocation && (
                        <p className="text-xs text-sidebar-foreground/60 mt-1 line-clamp-2">
                          {locationInfo.loading ? 'Obteniendo dirección...' : getDisplayAddress()}
                        </p>
                      )}
                      <Button
                        variant="link"
                        size="sm"
                        onClick={refreshLocation}
                        disabled={locationInfo.loading}
                        className="h-auto p-0 text-xs mt-1 text-sidebar-foreground/60"
                      >
                        {locationInfo.loading ? 'Actualizando...' : 'Actualizar ubicación'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppDrawer;
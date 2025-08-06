import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Menu,
  Edit3, 
  MapPin, 
  History, 
  Settings, 
  Sliders, 
  ChevronDown, 
  Navigation, 
  Trash2, 
  Star,
  MoreHorizontal
} from 'lucide-react';
import { CustomChatConfig } from '../types';
import { useDefaultChat } from '../hooks/useDefaultChat';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const navigate = useNavigate();
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
    <>
      {/* Mobile overlay */}
      {isMobile && isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={onMenuToggle}
        />
      )}
      
      {/* Drawer */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-background border-r transition-all duration-300 z-50 flex flex-col",
          isMobile ? (isMenuOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
          isMenuOpen ? "w-[260px]" : "w-[72px]"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center min-h-16",
          isMenuOpen ? "px-4 justify-start" : "justify-center"
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className={cn("h-12 w-12", isMenuOpen && "mr-3")}
          >
            <Menu className="h-6 w-6" />
          </Button>
          {isMenuOpen && (
            <span className="font-medium">Menu</span>
          )}
        </div>

        {/* New Chat Button */}
        <div className={cn(
          "flex justify-center mb-4",
          isMenuOpen ? "px-4" : "px-2"
        )}>
          <Button
            variant="outline"
            onClick={() => onNewChat("Nuevo chat")}
            className={cn(
              "rounded-2xl border-none shadow-none",
              isMenuOpen 
                ? "w-full h-12 justify-center bg-muted hover:bg-muted/80" 
                : "h-12 w-12 p-0 bg-muted hover:bg-muted/80"
            )}
            title={!isMenuOpen ? "Nuevo chat" : undefined}
          >
            {isMenuOpen ? (
              <>
                <Edit3 className="h-6 w-6 mr-3" />
                Nuevo chat
              </>
            ) : (
              <Edit3 className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2">
          {/* Discover Cities */}
          <Button
            variant="ghost"
            onClick={() => {
              navigate('/?focus=search');
              if (isMobile) onMenuToggle();
            }}
            className={cn(
              "rounded-2xl mb-2",
              isMenuOpen 
                ? "w-full h-12 justify-start px-4" 
                : "h-12 w-12 p-0 mx-auto"
            )}
            title={!isMenuOpen ? "Descubrir ciudades" : undefined}
          >
            <MapPin className={cn("h-6 w-6", isMenuOpen && "mr-3")} />
            {isMenuOpen && "Descubrir ciudades"}
          </Button>

          {/* Recent chats section */}
          {isMenuOpen && (
            <>
              <div className="px-3 py-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  RECIENTE
                </span>
              </div>
              
              {chatTitles.map((title, index) => (
                <div key={index} className="relative group mb-1">
                  <Button
                    variant={index === selectedChatIndex ? "secondary" : "ghost"}
                    onClick={() => {
                      onSelectChat(index);
                      if (isMobile) onMenuToggle();
                    }}
                    className="w-full h-12 justify-start px-4 pr-12 rounded-2xl text-left overflow-hidden"
                    title={title}
                  >
                    <span className="truncate">{title}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chatIds[index]);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 sm:opacity-0 xs:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="ghost"
                onClick={() => console.log("Mostrar más clicked")}
                className="w-full h-12 justify-start px-4 rounded-2xl"
              >
                <ChevronDown className="h-6 w-6 mr-3" />
                Mostrar más
              </Button>
            </>
          )}
        </ScrollArea>

        {/* Bottom section */}
        <div className="p-2 space-y-2">
          <Separator className={cn("mx-2", !isMenuOpen && "hidden")} />
          
          {/* Default chat toggle */}
          {chatIds.length > 0 && selectedChatIndex >= 0 && chatIds[selectedChatIndex] && (
            <Button
              variant="ghost"
              onClick={handleToggleDefaultChat}
              className={cn(
                "rounded-2xl",
                isMenuOpen 
                  ? "w-full h-12 justify-start px-4" 
                  : "h-12 w-12 p-0 mx-auto"
              )}
              title={!isMenuOpen ? (isDefaultChat(chatIds[selectedChatIndex]) ? "Quitar chat predeterminado" : "Marcar como predeterminado") : undefined}
            >
              {isDefaultChat(chatIds[selectedChatIndex]) ? (
                <Star className={cn("h-6 w-6 text-primary", isMenuOpen && "mr-3")} />
              ) : (
                <Star className={cn("h-6 w-6", isMenuOpen && "mr-3")} />
              )}
              {isMenuOpen && (isDefaultChat(chatIds[selectedChatIndex]) ? "Chat predeterminado" : "Marcar predeterminado")}
            </Button>
          )}

          {/* Settings */}
          <Button
            variant="ghost"
            onClick={() => console.log("Ajustes clicked")}
            className={cn(
              "rounded-2xl",
              isMenuOpen 
                ? "w-full h-12 justify-start px-4" 
                : "h-12 w-12 p-0 mx-auto"
            )}
            title={!isMenuOpen ? "Ajustes" : undefined}
          >
            <Settings className={cn("h-6 w-6", isMenuOpen && "mr-3")} />
            {isMenuOpen && "Ajustes"}
          </Button>

          {/* Configure chat */}
          {!isPublicChat && (
            <Button
              variant="ghost"
              onClick={() => { 
                onOpenFinetuning(); 
                if (isMobile) onMenuToggle(); 
              }}
              className={cn(
                "rounded-2xl",
                isMenuOpen 
                  ? "w-full h-12 justify-start px-4" 
                  : "h-12 w-12 p-0 mx-auto"
              )}
              title={!isMenuOpen ? "Configurar chat" : undefined}
            >
              <Sliders className={cn("h-6 w-6", isMenuOpen && "mr-3")} />
              {isMenuOpen && "Configurar chat"}
            </Button>
          )}

          <Separator className={cn("mx-2", !isMenuOpen && "hidden")} />

          {/* Location section */}
          {chatConfig.allowGeolocation && (
            <div
              className={cn(
                "rounded-2xl p-3",
                isMenuOpen ? "w-full" : "w-12 h-12 flex items-center justify-center mx-auto"
              )}
              title={!isMenuOpen ? getDisplayCity() : undefined}
            >
              <div className={cn("flex", isMenuOpen ? "items-start space-x-3" : "justify-center")}>
                <Navigation className={cn("h-6 w-6 mt-0.5", !isMenuOpen && "mt-0")} />
                {isMenuOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {userLocation ? getDisplayCity() : 'Geolocalización activa'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {userLocation 
                        ? (locationInfo.loading ? 'Obteniendo dirección...' : getDisplayAddress())
                        : 'Esperando ubicación...'
                      }
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={refreshLocation}
                      disabled={locationInfo.loading}
                      className="h-auto p-0 text-xs mt-1"
                    >
                      {locationInfo.loading ? 'Actualizando...' : 'Actualizar ubicación'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AppDrawer;
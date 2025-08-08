import * as React from "react"
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  MessageCircle,
  Plus,
  MapPin,
  Settings2,
  Sliders,

  Trash2,
  MoreHorizontal,
  LifeBuoy,
  Send,
  Edit,
  Building2,
  Compass,
  Globe,
  Map,
  MessageSquare,
  Star,
  Locate,
} from "lucide-react"

import { NavSecondary } from "@/components/nav-secondary"
import { TeamSwitcher } from "@/components/team-switcher"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"



import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useDefaultChat } from "@/hooks/useDefaultChat"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onNewChat?: (title?: string) => void
  onOpenFinetuning?: () => void
  chatTitles?: string[]
  chatIds?: string[]
  selectedChatIndex?: number
  onSelectChat?: (index: number) => void
  onDeleteChat?: (conversationId: string) => void
  chatConfig?: any
  userLocation?: any
  geolocationStatus?: 'idle' | 'pending' | 'success' | 'error'
  isPublicChat?: boolean
  handleToggleLocation?: (enabled: boolean) => Promise<void>
  onCitySelect?: (city: any) => void
  onShowCitySearch?: () => void
  isInSearchMode?: boolean
}

// Navigation data
const navSecondaryData = []

export function AppSidebar({ 
  onNewChat = () => {},
  onOpenFinetuning = () => {},
  chatTitles = [],
  chatIds = [],
  selectedChatIndex = -1,
  onSelectChat = () => {},
  onDeleteChat = () => {},
  chatConfig = {},
  userLocation = null,
  geolocationStatus = 'idle',
  isPublicChat = false,
  handleToggleLocation = async () => {},
  onCitySelect = () => {},
  onShowCitySearch = () => {},
  isInSearchMode = false,
  ...props 
}: AppSidebarProps) {
  const [starUpdateTrigger, setStarUpdateTrigger] = React.useState(0);
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const { defaultChat, setDefaultChat, removeDefaultChat, isDefaultChat, loading } = useDefaultChat()

  // Detectar si estamos en la página de descubrir ciudades (ya no se usa, pero mantenemos para compatibilidad)
  const isDiscoverPage = location.search.includes('focus=search')
  const [locationInfo, setLocationInfo] = React.useState<{
    city: string;
    address: string;
    loading: boolean;
  }>({
    city: '',
    address: '',
    loading: false
  })

  // Función para obtener el avatar de la ciudad
  const getCityAvatar = () => {
    if (chatConfig?.restrictedCity?.name) {
      // Extraer solo el nombre de la ciudad (antes de la coma)
      const getCityName = () => {
        const fullName = chatConfig.restrictedCity.name;
        if (fullName.includes(',')) {
          return fullName.split(',')[0].trim();
        }
        return fullName;
      };

      // Obtener iniciales de la ciudad
      const getInitials = (name: string) => {
        return name
          .split(' ')
          .map(word => word.charAt(0))
          .join('')
          .toUpperCase()
          .slice(0, 2);
      };

      const cityName = getCityName();
      const cityImage = chatConfig.profileImageUrl || null;
      const cityInitials = getInitials(cityName);

      if (cityImage) {
        return (
          <div className="flex aspect-square size-16 items-center justify-center rounded-full overflow-hidden border border-border/40 mb-3">
            <img 
              src={cityImage} 
              alt={cityName}
              className="w-full h-full object-cover"
            />
          </div>
        );
      } else {
        return (
          <div className="flex aspect-square size-16 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-lg font-semibold border border-border/40 mb-3">
            {cityInitials}
          </div>
        );
      }
    }
    
    // Fallback si no hay ciudad configurada
    return (
      <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-sidebar-muted text-sidebar-muted-foreground border border-border/40">
        <MessageCircle className="h-4 w-4" />
      </div>
    );
  };

  // Función para obtener información de ubicación desde coordenadas
  const getLocationInfo = async (lat: number, lng: number) => {
    setLocationInfo(prev => ({ ...prev, loading: true }))
    
    try {
      const response = await fetch("https://irghpvvoparqettcnpnh.functions.supabase.co/chat-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: "geocode",
          userId: null,
          userLocation: { lat, lng },
          geocodeOnly: true
        })
      })
      
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor')
      }
      
      const data = await response.json()
      
      setLocationInfo({
        city: data.city || `Ubicación ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        address: data.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        loading: false
      })
      
    } catch (error) {
      console.error('Error obteniendo información de ubicación:', error)
      setLocationInfo({
        city: 'Ubicación actual',
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        loading: false
      })
    }
  }

  // Actualizar información de ubicación cuando cambien las coordenadas
  React.useEffect(() => {
    if (userLocation && geolocationStatus === 'success') {
      getLocationInfo(userLocation.latitude, userLocation.longitude)
    } else if (!userLocation) {
      setLocationInfo({
        city: '',
        address: '',
        loading: false
      })
    }
  }, [userLocation, geolocationStatus])

  const refreshLocation = () => {
    if (chatConfig.allowGeolocation && navigator.geolocation) {
      setLocationInfo(prev => ({ ...prev, loading: true }))
      navigator.geolocation.getCurrentPosition(
        (position) => {
          getLocationInfo(position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error)
          setLocationInfo({
            city: 'Error de ubicación',
            address: 'No se pudo obtener la ubicación',
            loading: false
          })
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    }
  }

  const getDisplayCity = () => {
    if (chatConfig.restrictedCity?.name) {
      return chatConfig.restrictedCity.name
    }
    if (locationInfo.city) {
      return locationInfo.city
    }
    if (userLocation) {
      return "Ubicación actual"
    }
    return "Ubicación desconocida"
  }

  const getDisplayAddress = () => {
    if (chatConfig.restrictedCity?.formattedAddress) {
      return chatConfig.restrictedCity.formattedAddress
    }
    if (locationInfo.address) {
      return locationInfo.address
    }
    if (geolocationStatus === 'success' && userLocation) {
      return `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`
    }
    return "Dirección no disponible"
  }

  // Obtener la ciudad actual de la URL
  const getCurrentCitySlug = () => {
    const path = location.pathname;
    // Intentar obtener el slug de los parámetros primero
    const slugFromParams = params.chatSlug || params.citySlug;
    if (slugFromParams) {
      return slugFromParams;
    }
    // Si no hay parámetros, intentar extraer de la URL
    if (path.startsWith('/chat/') || path.startsWith('/city/')) {
      const pathParts = path.split('/');
      const slug = pathParts[pathParts.length - 1];
      return slug && slug !== 'chat' && slug !== 'city' ? slug : null;
    }
    return null;
  }

  // Función para manejar el cambio de chat predeterminado

  const handleCitySelect = (city: any) => {
    if (onCitySelect) {
      onCitySelect(city)
    } else {
      // Navegar a la nueva ciudad
      navigate(`/chat/${city.slug}`)
    }
  }


  return (
    <>
      <Sidebar variant="inset" collapsible="icon" {...props}>
        <SidebarHeader>
          <TeamSwitcher chatConfig={chatConfig} onCitySelect={onCitySelect} onShowCitySearch={onShowCitySearch} />
        </SidebarHeader>
        
        <SidebarContent className="flex flex-col gap-0 h-full">
          {/* Discover Cities and Default City */}
          <SidebarGroup className="p-1 flex-shrink-0 pl-2">
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={isInSearchMode ? () => {} : onShowCitySearch}
                  isActive={isInSearchMode}
                  disabled={isInSearchMode}
                  className="w-full group-data-[collapsible=icon]:justify-center h-10"
                  size="sm"
                  tooltip={isInSearchMode ? "Ya estás en modo búsqueda" : "Descubrir ciudades"}
                >
                  <Compass className="h-4 w-4 group-data-[collapsible=icon]:mx-auto" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {isInSearchMode ? "Buscando ciudades..." : "Descubrir ciudades"}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    
                    const currentCitySlug = getCurrentCitySlug()
                    console.log('Star clicked - Current city slug:', currentCitySlug)
                    
                    if (currentCitySlug) {
                      try {
                        if (isDefaultChat(currentCitySlug)) {
                          console.log('Removing default chat for:', currentCitySlug)
                          await removeDefaultChat()
                        } else {
                          console.log('Setting default chat for:', currentCitySlug)
                          await setDefaultChat('', `Chat de ${currentCitySlug}`, currentCitySlug)
                        }
                        // Forzar re-renderización
                        setStarUpdateTrigger(prev => prev + 1)
                      } catch (error) {
                        console.error('Error toggling default chat:', error)
                      }
                    } else {
                      console.log('No current city slug found')
                    }
                  }}
                  disabled={loading}
                  className="w-full group-data-[collapsible=icon]:justify-center h-10 cursor-pointer touch-manipulation"
                  size="sm"
                  tooltip="Ciudad predeterminada"
                >
                  <Star className={cn(
                    "h-4 w-4 group-data-[collapsible=icon]:mx-auto pointer-events-none",
                    (() => {
                      const currentSlug = getCurrentCitySlug()
                      const isDefault = currentSlug && isDefaultChat(currentSlug)
                      console.log('Star state - Current slug:', currentSlug, 'Is default:', isDefault)
                      return isDefault ? "text-sidebar-accent-foreground fill-current" : "text-sidebar-foreground"
                    })()
                  )} />
                  <span className="group-data-[collapsible=icon]:hidden">Ciudad predeterminada</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* Recent Chats */}
          <SidebarGroup className="flex-1 flex flex-col min-h-0 max-h-[calc(100vh-300px)]">
            <SidebarSeparator className="mb-1 flex-shrink-0" />
            <SidebarMenuItem className="flex-shrink-0">
                          <SidebarMenuButton
              onClick={() => {
                const currentCity = chatConfig?.restrictedCity?.name || 'tu ciudad';
                const citySlug = chatConfig?.restrictedCity?.slug || '';
                onNewChat();
              }}
              className="w-full group-data-[collapsible=icon]:justify-center h-10"
              size="sm"
              tooltip="Nuevo chat"
            >
              <Edit className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Nuevo chat</span>
            </SidebarMenuButton>
            </SidebarMenuItem>
            <div className="group-data-[collapsible=icon]:hidden flex-1 flex flex-col min-h-0">
              {chatTitles.length > 0 && (
                <SidebarGroupLabel className="flex-shrink-0">Conversaciones</SidebarGroupLabel>
              )}
              <SidebarGroupContent className="flex-1 overflow-y-auto min-h-0 scrollbar-hide hover:scrollbar-default">
                {chatTitles.length > 0 ? (
                  <SidebarMenu>
                    {chatTitles.map((title, index) => (
                      <SidebarMenuItem key={index}>
                        <SidebarMenuButton
                          onClick={() => onSelectChat(index)}
                          isActive={index === selectedChatIndex}
                          className="group/menu-item w-full justify-between group-data-[collapsible=icon]:justify-center min-h-[2rem] py-1"
                          tooltip={title}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <MessageCircle className="h-4 w-4 flex-shrink-0 text-sidebar-foreground/50" />
                            <span className="truncate group-data-[collapsible=icon]:hidden">{title}</span>
                          </div>
                          <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteChat(chatIds[index])
                              }}
                              className="h-6 w-6 p-0 opacity-0 group-hover/menu-item:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                ) : (
                  <div className="flex items-end justify-center min-h-[200px] pt-16 group-data-[collapsible=icon]:hidden">
                    <div className="flex flex-col items-center text-center text-sidebar-foreground/60">
                      {getCityAvatar()}
                      <div className="text-sm mt-2">
                        <div>Todavía no tienes</div>
                        <div>conversaciones</div>
                      </div>
                    </div>
                  </div>
                )}
              </SidebarGroupContent>
            </div>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>


    </>
  )
}
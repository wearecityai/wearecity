import * as React from "react"
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
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
  BarChart3,
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
import { useCityNavigation } from "@/hooks/useCityNavigation"
import { useState, useEffect } from "react"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onNewChat?: (title?: string) => void
  onOpenFinetuning?: () => void
  onOpenMetrics?: () => void
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
  onOpenMetrics = () => {},
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
  const { t } = useTranslation();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'administrativo';
  const [starUpdateTrigger, setStarUpdateTrigger] = useState(0);
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const isAdminContext = isAdmin && location.pathname.startsWith('/admin/');
  const { 
    defaultChat, 
    setDefaultCity, 
    removeDefaultCity, 
    isDefaultCity, 
    loading 
  } = useCityNavigation()

  // Forzar re-renderización cuando cambie el defaultChat
  useEffect(() => {
    setStarUpdateTrigger(prev => prev + 1);
  }, [defaultChat]);

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

  // Evitar geocodificación automática: solo guardar coordenadas y marcar loading como false
  const updateLocationFromCoords = (lat: number, lng: number) => {
    setLocationInfo({
      city: t('geolocation.currentLocation', { defaultValue: 'Current location' }),
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      loading: false
    })
  }

  // Actualizar sólo coordenadas cuando cambien (sin reverse geocoding automático)
  React.useEffect(() => {
    if (userLocation && geolocationStatus === 'success') {
      updateLocationFromCoords(userLocation.latitude, userLocation.longitude)
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
          updateLocationFromCoords(position.coords.latitude, position.coords.longitude)
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

  // Función para forzar la activación de geolocalización
  const forceEnableLocation = () => {
    if (navigator.geolocation) {
      setLocationInfo(prev => ({ ...prev, loading: true }))
      console.log('🔧 Forzando activación de geolocalización...')
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateLocationFromCoords(position.coords.latitude, position.coords.longitude)
          console.log('✅ Geolocalización forzada exitosa')
        },
        (error) => {
          console.error('Error obteniendo ubicación forzada:', error)
          setLocationInfo({
            city: 'Error de ubicación',
            address: 'No se pudo obtener la ubicación',
            loading: false
          })
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      )
    }
  }

  const getDisplayCity = () => {
    if (chatConfig.restrictedCity?.name) {
      return chatConfig.restrictedCity.name
    }
    // Mostrar únicamente ubicación genérica o coordenadas, sin traducir
    if (userLocation) {
      return t('geolocation.currentLocation', { defaultValue: 'Current location' })
    }
    return t('geolocation.unknownLocation', { defaultValue: 'Unknown location' })
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
    return t('geolocation.addressNotAvailable', { defaultValue: 'Address not available' })
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
          {/* Admin vs Citizen primary actions */}
          <SidebarGroup className="p-1 flex-shrink-0 pl-2">
            <SidebarMenu className="gap-0.5">
              {isAdminContext ? (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={onOpenMetrics}
                      className="w-full group-data-[collapsible=icon]:justify-center h-10 md:hover:bg-sidebar-accent md:hover:text-sidebar-accent-foreground"
                      size="sm"
                      tooltip={t('navigation.metrics', { defaultValue: 'Metrics' })}
                    >
                      <BarChart3 className="h-4 w-4 group-data-[collapsible=icon]:mx-auto" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {t('navigation.metrics', { defaultValue: 'Metrics' })}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={onOpenFinetuning}
                      className="w-full group-data-[collapsible=icon]:justify-center h-10 md:hover:bg-sidebar-accent md:hover:text-sidebar-accent-foreground"
                      size="sm"
                      tooltip={t('navigation.configureChat', { defaultValue: 'Configure Chat' })}
                    >
                      <Sliders className="h-4 w-4 group-data-[collapsible=icon]:mx-auto" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {t('navigation.configureChat', { defaultValue: 'Configure Chat' })}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              ) : (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={isInSearchMode ? () => {} : onShowCitySearch}
                      isActive={isInSearchMode}
                      disabled={isInSearchMode}
                      className="w-full group-data-[collapsible=icon]:justify-center h-10 md:hover:bg-sidebar-accent md:hover:text-sidebar-accent-foreground"
                      size="sm"
                      tooltip={isInSearchMode ? t('sidebar.alreadyInSearchMode', { defaultValue: 'You are already in search mode' }) : t('sidebar.discoverCities', { defaultValue: 'Discover cities' })}
                    >
                      <Compass className="h-4 w-4 group-data-[collapsible=icon]:mx-auto" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {isInSearchMode ? t('sidebar.searchingCities', { defaultValue: 'Searching cities...' }) : t('sidebar.discoverCities', { defaultValue: 'Discover cities' })}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const currentCitySlug = getCurrentCitySlug()
                        if (currentCitySlug) {
                          try {
                            if (isDefaultCity(currentCitySlug)) {
                              await removeDefaultCity()
                            } else {
                              await setDefaultCity(currentCitySlug)
                            }
                            setStarUpdateTrigger(prev => prev + 1)
                          } catch (error) {
                            console.error('Error toggling default city:', error)
                          }
                        }
                      }}
                      disabled={loading}
                      className="w-full group-data-[collapsible=icon]:justify-center h-10 touch-manipulation md:hover:bg-sidebar-accent md:hover:text-sidebar-accent-foreground"
                      size="sm"
                    >
                      <Star className={cn(
                        "h-4 w-4 group-data-[collapsible=icon]:mx-auto",
                        (() => {
                          const currentSlug = getCurrentCitySlug()
                          const isDefault = currentSlug && isDefaultCity(currentSlug)
                          return isDefault ? "text-sidebar-accent-foreground fill-current" : "text-sidebar-foreground"
                        })()
                      )} />
                      <span className="group-data-[collapsible=icon]:hidden">{t('sidebar.defaultCity', { defaultValue: 'Default city' })}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroup>

          {/* Recent Chats */}
          <SidebarGroup className="flex-1 flex flex-col min-h-0 max-h-[calc(100vh-300px)]">
            <SidebarSeparator className="mb-1 flex-shrink-0" />
            <SidebarMenuItem className="flex-shrink-0">
              <SidebarMenuButton
                onClick={() => {
                  onNewChat();
                  if (isAdminContext) {
                    const slug = (chatConfig?.restrictedCity?.slug as string | undefined) || getCurrentCitySlug() || '';
                    if (slug) navigate(`/admin/${slug}`);
                  }
                }}
              className="w-full group-data-[collapsible=icon]:justify-center h-10 md:hover:bg-sidebar-accent md:hover:text-sidebar-accent-foreground"
              size="sm"
              tooltip={t('chat.newChat', { defaultValue: 'New Chat' })}
            >
              <Edit className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">{t('chat.newChat', { defaultValue: 'New Chat' })}</span>
            </SidebarMenuButton>
            </SidebarMenuItem>
            <div className="group-data-[collapsible=icon]:hidden flex-1 flex flex-col min-h-0">
              {chatTitles.length > 0 && (
                <SidebarGroupLabel className="flex-shrink-0">{t('sidebar.conversations', { defaultValue: 'Conversations' })}</SidebarGroupLabel>
              )}
              <SidebarGroupContent className="flex-1 overflow-y-auto min-h-0 scrollbar-hide hover:scrollbar-default">
                {chatTitles.length > 0 ? (
                  <SidebarMenu>
                    {chatTitles.map((title, index) => (
                      <SidebarMenuItem key={index}>
                        <SidebarMenuButton
                          onClick={() => {
                            onSelectChat(index);
                            if (isAdminContext) {
                              const slug = (chatConfig?.restrictedCity?.slug as string | undefined) || getCurrentCitySlug() || '';
                              if (slug) navigate(`/admin/${slug}`);
                            }
                          }}
                          isActive={index === selectedChatIndex}
                          className="group/menu-item w-full justify-between group-data-[collapsible=icon]:justify-center min-h-[2rem] py-1"
                          tooltip={title}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <MessageCircle className="h-4 w-4 flex-shrink-0 text-sidebar-foreground/50" />
                            <span className="truncate group-data-[collapsible=icon]:hidden">{title}</span>
                          </div>
                          <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
                            <div
                              role="button"
                              aria-label={t('chat.delete', { defaultValue: 'Delete chat' })}
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteChat(chatIds[index])
                              }}
                              className="h-6 w-6 p-0 opacity-0 group-hover/menu-item:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            >
                              <Trash2 className="h-3 w-3" />
                            </div>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                ) : (
                  <div className="flex items-end justify-center min-h-[200px] pt-16 group-data-[collapsible=icon]:hidden">
                    <div className="flex flex-col items-center text-center text-sidebar-foreground/60">
                      <div className="flex aspect-square size-16 items-center justify-center rounded-full bg-sidebar-primary/10 text-sidebar-primary border border-border/40 mb-3">
                        <MessageCircle className="h-8 w-8" />
                      </div>
                      <div className="text-sm mt-2">
                        <div>{t('sidebar.noConversationsYet', { defaultValue: 'You don\'t have conversations yet' })}</div>
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
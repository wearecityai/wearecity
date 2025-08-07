import * as React from "react"
import { ChevronsUpDown, MapPin } from "lucide-react"
import { useNavigate } from "react-router-dom"


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface TeamSwitcherProps {
  chatConfig?: any;
  onCitySelect?: (city: any) => void;
  onShowCitySearch?: () => void;
}

export function TeamSwitcher({ chatConfig, onCitySelect, onShowCitySearch }: TeamSwitcherProps) {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  // Obtener información de la ciudad actual
  const getCurrentCityInfo = () => {
    if (chatConfig?.restrictedCity?.name) {
      // Extraer solo el nombre de la ciudad (antes de la coma)
      const getCityName = () => {
        const fullName = chatConfig.restrictedCity.name;
        if (fullName.includes(',')) {
          return fullName.split(',')[0].trim();
        }
        return fullName;
      };

      // Extraer país de la dirección formateada
      const getCountry = () => {
        if (chatConfig.restrictedCity.formattedAddress) {
          const parts = chatConfig.restrictedCity.formattedAddress.split(',');
          // El país generalmente está al final
          const lastPart = parts[parts.length - 1]?.trim();
          if (lastPart && lastPart !== '') {
            return lastPart;
          }
        }
        return 'España';
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

      return {
        name: getCityName(),
        country: getCountry(),
        image: chatConfig.profileImageUrl || null,
        logo: chatConfig.profileImageUrl ? null : getInitials(getCityName())
      }
    }
    
    // Fallback si no hay ciudad configurada
    return {
      name: "CityCore AI",
      country: "Selecciona una ciudad",
      image: null,
      logo: '🏙️'
    }
  }

  const currentCity = getCurrentCityInfo()

  const handleCitySelect = (city: any) => {
    if (onCitySelect) {
      onCitySelect(city)
    } else {
      // Navegar a la nueva ciudad
      navigate(`/chat/${city.slug}`)
    }
  }

  const handleChangeCity = () => {
    if (onShowCitySearch) {
      onShowCitySearch()
    }
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                tooltip={currentCity.name}
              >
                {currentCity.image ? (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full overflow-hidden group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!rounded-full">
                    <img 
                      src={currentCity.image} 
                      alt={currentCity.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!rounded-full">
                    {currentCity.logo}
                  </div>
                )}
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">{currentCity.name}</span>
                  <span className="truncate text-xs">{currentCity.country}</span>
                </div>
                <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Ciudad Actual
              </DropdownMenuLabel>
              <DropdownMenuItem className="gap-2 p-2">
                {currentCity.image ? (
                  <div className="flex size-6 items-center justify-center rounded-sm overflow-hidden">
                    <img 
                      src={currentCity.image} 
                      alt={currentCity.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex size-6 items-center justify-center rounded-sm border bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                    {currentCity.logo}
                  </div>
                )}
                <div>
                  <div className="font-medium">{currentCity.name}</div>
                  <div className="text-xs text-muted-foreground">{currentCity.country}</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="gap-2 p-2"
                onClick={handleChangeCity}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <MapPin className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">Cambiar ciudad</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>


    </>
  )
}
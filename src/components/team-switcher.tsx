import * as React from "react"
import { ChevronsUpDown, MapPin } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from '@/hooks/useAuthFirebase'


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
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'administrativo';

  // Obtener información de la ciudad actual
  const getCurrentCityInfo = () => {
    if (chatConfig?.restrictedCity?.name) {
      // Extraer información completa de la ciudad
      const getCityInfo = () => {
        const fullName = chatConfig.restrictedCity.name;
        const parts = fullName.split(',').map(part => part.trim());
        
        // Mapeo especial para ciudades que sabemos su provincia
        const cityProvinceMap: { [key: string]: string } = {
          'La Vila Joiosa': 'Alicante',
          'Benidorm': 'Alicante',
          'Alicante': 'Alicante',
          'Elche': 'Alicante',
          'Torrevieja': 'Alicante',
          'Orihuela': 'Alicante',
          'Elda': 'Alicante',
          'Alcoy': 'Alicante',
          'San Vicente del Raspeig': 'Alicante',
          'Petrel': 'Alicante',
          'Villena': 'Alicante',
          'Denia': 'Alicante',
          'Calpe': 'Alicante',
          'Xàbia': 'Alicante',
          'Pilar de la Horadada': 'Alicante',
          'Santa Pola': 'Alicante',
          'Crevillente': 'Alicante',
          'Ibi': 'Alicante',
          'Altea': 'Alicante',
          'Finestrat': 'Alicante',
          'Callosa de Segura': 'Alicante',
          'Rojales': 'Alicante',
          'Guardamar del Segura': 'Alicante',
          'Pego': 'Alicante',
          'Teulada': 'Alicante',
          'Benissa': 'Alicante',
          'L\'Alfàs del Pi': 'Alicante',
          'Polop': 'Alicante',
          'La Nucía': 'Alicante',
          'Orba': 'Alicante',
          'Tàrbena': 'Alicante',
          'Bolulla': 'Alicante',
          'Callosa d\'En Sarrià': 'Alicante',
          'Tormos': 'Alicante',
          'Famorca': 'Alicante',
          'Castell de Castells': 'Alicante',
          'Benigembla': 'Alicante',
          'Murla': 'Alicante',
          'Parcent': 'Alicante',
          'Alcalalí': 'Alicante',
          'Xaló': 'Alicante',
          'Lliber': 'Alicante',
          'Senija': 'Alicante',
          'Calp': 'Alicante'
        };
        
        // Si hay al menos 3 partes: ciudad, provincia, país
        if (parts.length >= 3) {
          return {
            city: parts[0],
            province: parts[1],
            country: parts[2]
          };
        }
        // Si hay 2 partes: ciudad, país (usar mapeo para provincia)
        else if (parts.length === 2) {
          const cityName = parts[0];
          const country = parts[1];
          const province = cityProvinceMap[cityName] || 'Alicante';
          
          return {
            city: cityName,
            province: province,
            country: country
          };
        }
        // Si solo hay 1 parte: solo ciudad (usar mapeo para provincia)
        else {
          const cityName = parts[0] || fullName;
          const province = cityProvinceMap[cityName] || 'Alicante';
          
          return {
            city: cityName,
            province: province,
            country: 'España'
          };
        }
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

      const cityInfo = getCityInfo();

      return {
        name: cityInfo.city,
        province: cityInfo.province,
        country: cityInfo.country,
        fullName: chatConfig.restrictedCity.name,
        image: chatConfig.profileImageUrl || null,
        logo: chatConfig.profileImageUrl ? null : getInitials(cityInfo.city)
      }
    }
    
    // Fallback si no hay ciudad configurada
    return {
      name: "WeAreCity AI",
      province: "",
      country: "",
      fullName: "WeAreCity AI",
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
    if (isAdmin) return; // Admins cannot change city
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
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full overflow-hidden border border-border/40 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!rounded-full">
                    <img 
                      src={currentCity.image} 
                      alt={currentCity.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold border border-border/40 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!rounded-full">
                    {currentCity.logo}
                  </div>
                )}
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">{currentCity.name}</span>
                  {(currentCity.province || currentCity.country) && (
                    <span className="truncate text-xs text-muted-foreground">
                      {[currentCity.province, currentCity.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
                <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-64"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={12}
              avoidCollisions={true}
              collisionPadding={16}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Ciudad Actual
              </DropdownMenuLabel>
              <DropdownMenuItem className="gap-3">
                {currentCity.image ? (
                  <div className="flex size-6 items-center justify-center rounded-sm overflow-hidden border border-border/40">
                    <img 
                      src={currentCity.image} 
                      alt={currentCity.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex size-6 items-center justify-center rounded-sm border border-border/40 bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                    {currentCity.logo}
                  </div>
                )}
                <div>
                  <div className="font-medium">{currentCity.name}</div>
                  {(currentCity.province || currentCity.country) && (
                    <div className="text-xs text-muted-foreground">
                      {[currentCity.province, currentCity.country].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
              {!isAdmin && (
                <>
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>


    </>
  )
}
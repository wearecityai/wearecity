import * as React from "react"
import { ChevronsUpDown, MapPin } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from '@/hooks/useAuthFirebase'
import { useCityNavigation } from '@/hooks/useCityNavigation'
import { useCitiesFirebase } from '@/hooks/useCitiesFirebase'


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
  const { recentCities } = useCityNavigation();
  const { cities } = useCitiesFirebase();

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

  // Obtener ciudades recientes con información completa (excluyendo la ciudad actual)
  const getRecentCitiesInfo = () => {
    const currentCitySlug = chatConfig?.restrictedCity?.slug;
    return recentCities
      .filter(slug => slug !== currentCitySlug) // Excluir la ciudad actual
      .map(slug => cities.find(city => city.slug === slug))
      .filter(Boolean)
      .slice(0, 3); // Máximo 3 ciudades
  }

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
          {isAdmin ? (
            // For admin users, show a simple non-interactive display without dropdown
            <SidebarMenuButton
              size="lg"
              className="cursor-default hover:bg-transparent hover:text-inherit focus:bg-transparent focus:text-inherit active:bg-transparent active:text-inherit md:hover:bg-transparent md:hover:text-inherit"
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
            </SidebarMenuButton>
          ) : (
            // For non-admin users, show the dropdown menu
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
                  Ciudades Recientes
                </DropdownMenuLabel>
                {getRecentCitiesInfo().map((city, index) => {
                  if (!city) return null;
                  
                  const getCityInitials = (name: string) => {
                    return name
                      .split(' ')
                      .map(word => word.charAt(0))
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                  };

                  const cityImage = city.profileImageUrl || city.profile_image_url;
                  const cityInitials = getCityInitials(city.name);

                  return (
                    <DropdownMenuItem 
                      key={city.slug}
                      className="gap-3"
                      onClick={() => handleCitySelect(city)}
                    >
                      {cityImage ? (
                        <div className="flex size-6 items-center justify-center rounded-sm overflow-hidden border border-border/40">
                          <img 
                            src={cityImage} 
                            alt={city.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex size-6 items-center justify-center rounded-sm border border-border/40 bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                          {cityInitials}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{city.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {city.name.includes(',') ? city.name.split(',')[1]?.trim() : 'España'}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
                {getRecentCitiesInfo().length === 0 && (
                  <DropdownMenuItem className="gap-3 text-muted-foreground">
                    <div className="flex size-6 items-center justify-center rounded-sm border border-border/40 bg-muted">
                      <MapPin className="size-3" />
                    </div>
                    <div className="text-sm">No hay ciudades recientes</div>
                  </DropdownMenuItem>
                )}
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
          )}
        </SidebarMenuItem>
      </SidebarMenu>


    </>
  )
}
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useCityNavigation } from './useCityNavigation';

export const useInitialNavigation = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    getInitialCityDestination,
    updateLastVisitedCity,
    loading: cityNavigationLoading
  } = useCityNavigation();

  // Estado para controlar si estamos en proceso de navegación inicial
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const handleInitialNavigation = async () => {
      console.log('🚀 useInitialNavigation - handleInitialNavigation called:', {
        user: !!user,
        profileRole: profile?.role,
        pathname: location.pathname,
        cityNavigationLoading,
        isNavigating
      });

      // Solo aplicar para ciudadanos y cuando estemos en la página principal
      if (!user || profile?.role !== 'ciudadano' || location.pathname !== '/') {
        console.log('❌ useInitialNavigation - Conditions not met:', {
          hasUser: !!user,
          isCitizen: profile?.role === 'ciudadano',
          isRootPath: location.pathname === '/'
        });
        setIsNavigating(false);
        return;
      }

      // Esperar a que se carguen los datos de navegación
      if (cityNavigationLoading) {
        console.log('⏳ useInitialNavigation - Still loading city navigation data');
        return;
      }

      const destinationCity = getInitialCityDestination();
      console.log('🎯 useInitialNavigation - Destination city:', destinationCity);
      
      if (destinationCity) {
        console.log('🚀 Navegando a ciudad inicial:', destinationCity);
        setIsNavigating(true);
        
        try {
          // Actualizar última ciudad visitada antes de navegar
          await updateLastVisitedCity(destinationCity);
          // Navegar a la ciudad
          navigate(`/chat/${destinationCity}`, { replace: true });
        } catch (error) {
          console.error('Error during initial navigation:', error);
          setIsNavigating(false);
        }
      } else {
        console.log('❌ useInitialNavigation - No destination city found');
        setIsNavigating(false);
      }
    };

    handleInitialNavigation();
  }, [user, profile?.role, location.pathname, cityNavigationLoading, getInitialCityDestination, updateLastVisitedCity, navigate]);

  return { isNavigating };
};

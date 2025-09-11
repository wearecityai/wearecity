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
      // Solo aplicar para ciudadanos y cuando estemos en la página principal
      if (!user || profile?.role !== 'ciudadano' || location.pathname !== '/') {
        setIsNavigating(false);
        return;
      }

      // Esperar a que se carguen los datos de navegación
      if (cityNavigationLoading) {
        return;
      }

      const destinationCity = getInitialCityDestination();
      
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
        setIsNavigating(false);
      }
    };

    handleInitialNavigation();
  }, [user, profile?.role, location.pathname, cityNavigationLoading, getInitialCityDestination, updateLastVisitedCity, navigate]);

  return { isNavigating };
};

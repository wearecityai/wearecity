import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useCityNavigation } from './useCityNavigation';
import { useAppState } from './useAppState';

export const useSidebarVisibility = () => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { loading: cityNavigationLoading } = useCityNavigation();
  const { isFullyLoaded, chatConfig } = useAppState();

  const [shouldShowSidebar, setShouldShowSidebar] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  useEffect(() => {
    // Solo mostrar el sidebar cuando TODO esté completamente listo
    // Para usuarios anónimos, no requerir user ni profile
    const isReady = !authLoading && 
      !cityNavigationLoading && 
      isFullyLoaded && 
      chatConfig;

    if (isReady) {
      // Agregar un pequeño delay adicional para asegurar estabilidad
      const timer = setTimeout(() => {
        setShouldShowSidebar(true);
        setHasShownOnce(true);
      }, 300);
      return () => clearTimeout(timer);
    }
    // Evitar ocultar el sidebar si ya se mostró una vez (previene parpadeos al reanudar pestaña)
    if (!hasShownOnce) {
      setShouldShowSidebar(false);
    }
  }, [user, profile, authLoading, cityNavigationLoading, isFullyLoaded, chatConfig, hasShownOnce]);

  return { shouldShowSidebar };
};

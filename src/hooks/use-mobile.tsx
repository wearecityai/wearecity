import { useEffect, useState } from 'react';
import { useKeyboardDetection } from './useKeyboardDetection';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  return isMobile;
};

// Hook para manejar la altura dinámica del viewport en móviles
export const useDynamicViewport = () => {
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const [isPWA, setIsPWA] = useState(false);
  const { isKeyboardOpen, isSafari } = useKeyboardDetection();

  useEffect(() => {
    const updateViewportHeight = () => {
      // Detectar si estamos en PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      setIsPWA(isStandalone);

      // Calcular altura dinámica
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // Usar altura dinámica para móviles
      if (window.innerWidth < 768) {
        setViewportHeight('calc(var(--vh, 1vh) * 100)');
      } else {
        setViewportHeight('100vh');
      }
    };

    // Actualizar inmediatamente
    updateViewportHeight();

    // Actualizar en cambios de orientación y resize
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    // Para PWA y teclado, actualizar cuando cambie la altura del viewport
    if ('visualViewport' in window) {
      (window as any).visualViewport?.addEventListener('resize', updateViewportHeight);
    }

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      if ('visualViewport' in window) {
        (window as any).visualViewport?.removeEventListener('resize', updateViewportHeight);
      }
    };
  }, []);

  return { viewportHeight, isPWA, isKeyboardOpen, isSafari };
};

// Hook para manejar el estado de la barra de navegación en móviles
export const useMobileNavigation = () => {
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Ocultar/mostrar barra de navegación basado en scroll
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsNavigationVisible(false); // Ocultar al hacer scroll hacia abajo
      } else {
        setIsNavigationVisible(true); // Mostrar al hacer scroll hacia arriba
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return { isNavigationVisible };
};

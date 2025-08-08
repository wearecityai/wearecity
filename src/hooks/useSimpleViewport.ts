import { useState, useEffect } from 'react';

export const useSimpleViewport = () => {
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    // Detectar Safari
    const detectSafari = () => {
      const userAgent = navigator.userAgent;
      const isSafariBrowser = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      setIsSafari(isSafariBrowser);
      return isSafariBrowser;
    };

    const isSafariBrowser = detectSafari();

    const updateViewportHeight = () => {
      const currentHeight = window.innerHeight;
      const vh = currentHeight * 0.01;
      
      // Actualizar CSS custom property
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setViewportHeight('calc(var(--vh, 1vh) * 100)');
    };

    // Actualizar inmediatamente
    updateViewportHeight();

    // Eventos para detectar cambios
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    // Visual Viewport API para cambios del teclado
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

  return { viewportHeight, isSafari, isKeyboardOpen: false };
};

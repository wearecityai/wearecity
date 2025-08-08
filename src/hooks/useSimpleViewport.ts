import { useState, useEffect } from 'react';

export const useSimpleViewport = () => {
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const [isSafari, setIsSafari] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

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
      
      console.log('🔧 Viewport height updated:', {
        currentHeight,
        vh,
        isSafari: isSafariBrowser
      });
    };

    // Funciones específicas para Safari
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (isSafariBrowser && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
        setIsKeyboardOpen(true);
        
        // Agregar clase para Safari que mantiene el input visible
        document.body.classList.add('safari-keyboard-open');
        
        // Forzar scroll al input después de un delay
        setTimeout(() => {
          target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest' 
          });
        }, 100);
      }
    };

    const handleBlur = () => {
      if (isSafariBrowser) {
        setIsKeyboardOpen(false);
        document.body.classList.remove('safari-keyboard-open');
      }
    };

    // Actualizar inmediatamente
    updateViewportHeight();

    // Eventos para detectar cambios
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    // Eventos específicos para Safari
    if (isSafariBrowser) {
      document.addEventListener('focusin', handleFocus);
      document.addEventListener('focusout', handleBlur);
    }
    
    // Visual Viewport API para cambios del teclado
    if ('visualViewport' in window) {
      (window as any).visualViewport?.addEventListener('resize', updateViewportHeight);
    }

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      
      if (isSafariBrowser) {
        document.removeEventListener('focusin', handleFocus);
        document.removeEventListener('focusout', handleBlur);
        document.body.classList.remove('safari-keyboard-open');
      }
      
      if ('visualViewport' in window) {
        (window as any).visualViewport?.removeEventListener('resize', updateViewportHeight);
      }
    };
  }, []);

  return { viewportHeight, isSafari, isKeyboardOpen };
};

import { useState, useEffect, useRef } from 'react';

export const useSafariPersistentKeyboard = () => {
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const [isSafari, setIsSafari] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeightRef = useRef<number>(0);

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
      
      // Para Safari, usar altura dinámica
      if (isSafariBrowser) {
        setViewportHeight('calc(var(--vh, 1vh) * 100)');
      } else {
        setViewportHeight('100vh');
      }
      
      console.log('🔧 Viewport height updated:', {
        currentHeight,
        vh,
        isSafari: isSafariBrowser,
        inputFocused,
        keyboardOpen
      });
    };

    // Función para forzar que el input esté visible
    const forceInputVisible = () => {
      if (!isSafariBrowser || !inputFocused) return;

      const inputs = document.querySelectorAll('textarea, input');
      inputs.forEach(input => {
        if (input === document.activeElement) {
          // Forzar que el input esté visible
          input.scrollIntoView({ 
            behavior: 'instant', 
            block: 'center',
            inline: 'center'
          });
        }
      });

      // También forzar el scroll del contenedor del input
      const chatInputContainer = document.querySelector('.chat-input-container');
      if (chatInputContainer) {
        chatInputContainer.scrollIntoView({ 
          behavior: 'instant', 
          block: 'end'
        });
      }
    };

    // Detectar cuando el input recibe focus
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        setInputFocused(true);
        setKeyboardOpen(true);
        
        // En Safari, necesitamos ser persistentes
        if (isSafariBrowser) {
          // Limpiar intervalo anterior
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          // Crear un intervalo que mantenga el input visible
          intervalRef.current = setInterval(() => {
            forceInputVisible();
            updateViewportHeight();
          }, 100); // Cada 100ms
        }
      }
    };

    // Detectar cuando el input pierde focus
    const handleBlur = () => {
      setInputFocused(false);
      setKeyboardOpen(false);
      
      // Limpiar intervalo
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Detectar cambios en el viewport
    const handleViewportChange = () => {
      if ('visualViewport' in window) {
        const visualViewport = (window as any).visualViewport;
        const currentHeight = window.innerHeight;
        const keyboardHeight = currentHeight - visualViewport.height;
        
        // Si la altura cambió significativamente, actualizar
        if (Math.abs(currentHeight - lastHeightRef.current) > 10) {
          lastHeightRef.current = currentHeight;
          updateViewportHeight();
          
          // Si el input está enfocado, forzar que esté visible
          if (inputFocused && isSafariBrowser) {
            setTimeout(forceInputVisible, 50);
          }
        }
        
        console.log('🔍 Viewport change detected:', {
          currentHeight,
          visualViewportHeight: visualViewport.height,
          keyboardHeight,
          inputFocused,
          isSafari: isSafariBrowser
        });
      }
    };

    // Eventos
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    if ('visualViewport' in window) {
      (window as any).visualViewport?.addEventListener('resize', handleViewportChange);
    }

    // Actualizar inmediatamente
    updateViewportHeight();

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      
      if ('visualViewport' in window) {
        (window as any).visualViewport?.removeEventListener('resize', handleViewportChange);
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [inputFocused, keyboardOpen]);

  return { viewportHeight, isSafari, inputFocused, keyboardOpen };
};

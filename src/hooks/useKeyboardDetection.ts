import { useState, useEffect } from 'react';

export const useKeyboardDetection = () => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    // Detectar Safari
    const detectSafari = () => {
      const userAgent = navigator.userAgent;
      const isSafariBrowser = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      setIsSafari(isSafariBrowser);
      return isSafariBrowser;
    };

    const updateKeyboardState = () => {
      const isMobile = window.innerWidth < 768;
      const isSafariBrowser = detectSafari();
      
      if (isMobile && 'visualViewport' in window) {
        const visualViewport = (window as any).visualViewport;
        const currentKeyboardHeight = window.innerHeight - visualViewport.height;
        
        // Umbral diferente para Safari
        const threshold = isSafariBrowser ? 100 : 150;
        const keyboardVisible = currentKeyboardHeight > threshold;
        
        setIsKeyboardOpen(keyboardVisible);
        setKeyboardHeight(currentKeyboardHeight);
        
        console.log('🔍 Keyboard detection:', {
          windowHeight: window.innerHeight,
          visualViewportHeight: visualViewport.height,
          keyboardHeight: currentKeyboardHeight,
          isKeyboardVisible: keyboardVisible,
          isMobile,
          isSafari: isSafariBrowser,
          threshold
        });
      } else {
        setIsKeyboardOpen(false);
        setKeyboardHeight(0);
      }
    };

    // Actualizar inmediatamente
    updateKeyboardState();

    // Eventos para detectar cambios en el viewport
    window.addEventListener('resize', updateKeyboardState);
    window.addEventListener('orientationchange', updateKeyboardState);
    
    // Visual Viewport API para detectar cambios del teclado
    if ('visualViewport' in window) {
      (window as any).visualViewport?.addEventListener('resize', updateKeyboardState);
    }

    // Eventos específicos para iOS
    if ('ontouchstart' in window) {
      // Detectar cuando el input recibe focus (teclado se abre)
      const handleFocus = () => {
        setTimeout(updateKeyboardState, 100);
      };
      
      // Detectar cuando el input pierde focus (teclado se cierra)
      const handleBlur = () => {
        setTimeout(updateKeyboardState, 100);
      };
      
      document.addEventListener('focusin', handleFocus);
      document.addEventListener('focusout', handleBlur);
      
      return () => {
        window.removeEventListener('resize', updateKeyboardState);
        window.removeEventListener('orientationchange', updateKeyboardState);
        if ('visualViewport' in window) {
          (window as any).visualViewport?.removeEventListener('resize', updateKeyboardState);
        }
        document.removeEventListener('focusin', handleFocus);
        document.removeEventListener('focusout', handleBlur);
      };
    }

    return () => {
      window.removeEventListener('resize', updateKeyboardState);
      window.removeEventListener('orientationchange', updateKeyboardState);
      if ('visualViewport' in window) {
        (window as any).visualViewport?.removeEventListener('resize', updateKeyboardState);
      }
    };
  }, []);

  return { isKeyboardOpen, keyboardHeight, isSafari };
};

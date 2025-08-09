import { useState, useEffect, useRef } from 'react';

export const useSafariKeyboard = () => {
  const [isSafari, setIsSafari] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [originalViewportHeight, setOriginalViewportHeight] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Detectar Safari
    const detectSafari = () => {
      const userAgent = navigator.userAgent;
      const isSafariBrowser = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      setIsSafari(isSafariBrowser);
      return isSafariBrowser;
    };

    const isSafariBrowser = detectSafari();

    if (!isSafariBrowser) return;

    // Guardar la altura original del viewport
    setOriginalViewportHeight(window.innerHeight);

    // Enfoque agresivo para Safari: forzar el viewport
    const forceViewportHeight = () => {
      const currentHeight = window.innerHeight;
      const vh = currentHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // Forzar que el body use la altura completa
      document.body.style.height = `${currentHeight}px`;
      document.body.style.overflow = 'hidden';
      
      console.log('🔧 Safari viewport forced:', {
        currentHeight,
        vh,
        originalHeight: originalViewportHeight
      });
    };

    // Detectar cuando el input recibe focus
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        setInputFocused(true);
        
        // En Safari, esperar un poco y luego forzar el viewport
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          setIsKeyboardOpen(true);
          forceViewportHeight();
          
          // Forzar que el input esté visible
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    // Detectar cuando el input pierde focus
    const handleBlur = () => {
      setInputFocused(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setIsKeyboardOpen(false);
        // Restaurar el viewport
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        document.body.style.height = `${window.innerHeight}px`;
      }, 300);
    };

    // Detectar cambios en el viewport
    const handleViewportChange = () => {
      if ('visualViewport' in window) {
        const visualViewport = (window as any).visualViewport;
        const keyboardHeight = window.innerHeight - visualViewport.height;
        const keyboardVisible = keyboardHeight > 50; // Umbral muy bajo para Safari
        
        if (keyboardVisible && inputFocused) {
          setIsKeyboardOpen(true);
          forceViewportHeight();
        }
        
        console.log('🔍 Safari viewport change:', {
          windowHeight: window.innerHeight,
          visualViewportHeight: visualViewport.height,
          keyboardHeight,
          keyboardVisible,
          inputFocused
        });
      }
    };

    // Prevenir scroll en Safari
    const handleScroll = (e: Event) => {
      if (inputFocused) {
        e.preventDefault();
        e.stopPropagation();
        window.scrollTo(0, 0);
        return false;
      }
    };

    // Prevenir zoom en Safari
    const handleTouchStart = (e: TouchEvent) => {
      if (inputFocused) {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      }
    };

    // Eventos
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    window.addEventListener('scroll', handleScroll, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    if ('visualViewport' in window) {
      (window as any).visualViewport?.addEventListener('resize', handleViewportChange);
    }

    // Forzar viewport inicial
    forceViewportHeight();

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      
      if ('visualViewport' in window) {
        (window as any).visualViewport?.removeEventListener('resize', handleViewportChange);
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputFocused, originalViewportHeight]);

  return { isSafari, isKeyboardOpen, inputFocused };
};
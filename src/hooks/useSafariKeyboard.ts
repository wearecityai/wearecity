<div class="w-full flex flex-col items-center chat-input-container pb-2 sm:pb-6 md:pb-8"><div class="border bg-card text-card-foreground shadow-sm w-full max-w-4xl rounded-xl"><div class="p-0"><div class="flex items-center min-h-20 sm:min-h-20 px-2 sm:px-3 md:px-4 pb-2 sm:pb-4"><div class="flex-1 space-y-2 sm:space-y-3"><textarea class="flex w-full rounded-md bg-background py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 chat-textarea min-h-[48px] sm:min-h-[40px] max-h-[200px] resize-none pt-4 pb-0 px-2 sm:px-0 text-sm sm:text-base md:text-lg overflow-hidden" placeholder="Escribe tu consulta sobre La Vila Joiosa" rows="1" style="height: 48px; overflow-y: hidden;"></textarea><div class="flex items-center justify-between mt-3 sm:mt-2"><div class="flex items-center gap-2 sm:gap-3"><button class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent rounded-md h-8 sm:h-7 px-2 sm:px-2 text-muted-foreground hover:text-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe h-4 w-4 sm:h-4 sm:w-4 mr-1"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg><span class="text-sm sm:text-sm">Español</span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down h-3 w-3 sm:h-3 sm:w-3 ml-1"><path d="m6 9 6 6 6-6"></path></svg></button><button type="button" aria-pressed="true" data-state="on" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground bg-transparent h-8 sm:h-7 px-2 sm:px-2" aria-label="Activar ubicación"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation h-4 w-4 sm:h-4 sm:w-4 mr-1"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg><span class="text-sm sm:text-sm font-medium">Ubicación</span></button></div><div class="flex items-center"><button class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent h-10 w-10 sm:h-12 sm:w-12 rounded-full text-primary hover:text-primary" data-state="closed"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic h-5 w-5 sm:h-6 sm:w-6"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg></button></div></div></div></div></div></div></div>import { useState, useEffect, useRef } from 'react';

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

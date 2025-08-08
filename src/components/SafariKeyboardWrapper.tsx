import React, { useEffect, useRef, useState } from 'react';

interface SafariKeyboardWrapperProps {
  children: React.ReactNode;
  isSafari: boolean;
}

export const SafariKeyboardWrapper: React.FC<SafariKeyboardWrapperProps> = ({ 
  children, 
  isSafari 
}) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isSafari) return;

    // Enfoque radical para Safari: crear un viewport fijo
    const createFixedViewport = () => {
      if (!wrapperRef.current) return;

      const wrapper = wrapperRef.current;
      const currentHeight = window.innerHeight;
      
      // Forzar que el wrapper use toda la altura disponible
      wrapper.style.height = `${currentHeight}px`;
      wrapper.style.position = 'fixed';
      wrapper.style.top = '0';
      wrapper.style.left = '0';
      wrapper.style.right = '0';
      wrapper.style.bottom = '0';
      wrapper.style.overflow = 'hidden';
      wrapper.style.transform = 'translateZ(0)';
      wrapper.style.willChange = 'transform';
      
      console.log('🔧 Safari fixed viewport created:', { currentHeight });
    };

    // Detectar focus en inputs
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        setInputFocused(true);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          setIsKeyboardOpen(true);
          createFixedViewport();
          
          // Forzar que el input esté visible
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    };

    // Detectar blur en inputs
    const handleBlur = () => {
      setInputFocused(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setIsKeyboardOpen(false);
        // Restaurar viewport
        if (wrapperRef.current) {
          const wrapper = wrapperRef.current;
          wrapper.style.height = `${window.innerHeight}px`;
        }
      }, 100);
    };

    // Prevenir scroll
    const handleScroll = (e: Event) => {
      if (inputFocused) {
        e.preventDefault();
        e.stopPropagation();
        window.scrollTo(0, 0);
        return false;
      }
    };

    // Prevenir zoom
    const handleTouchStart = (e: TouchEvent) => {
      if (inputFocused && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Eventos
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    window.addEventListener('scroll', handleScroll, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });

    // Crear viewport fijo inicial
    createFixedViewport();

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isSafari, inputFocused]);

  if (!isSafari) {
    return <>{children}</>;
  }

  return (
    <div 
      ref={wrapperRef}
      className="safari-keyboard-wrapper"
      style={{
        height: '100dvh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        transform: 'translateZ(0)',
        willChange: 'transform',
        zIndex: 9999
      }}
    >
      {children}
    </div>
  );
};

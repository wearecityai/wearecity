import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook para gestionar automáticamente el idioma basándose en:
 * 1. Idioma guardado en localStorage
 * 2. Idioma del navegador
 * 3. Idioma por defecto (español)
 */
export const useAutoLanguage = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const initializeLanguage = () => {
      // Obtener idioma guardado
      const savedLanguage = localStorage.getItem('i18nextLng');
      
      // Obtener idioma del navegador
      const browserLanguage = navigator.language || navigator.languages?.[0] || 'es';
      const browserLangCode = browserLanguage.split('-')[0]; // 'es-ES' -> 'es'
      
      // Lista de idiomas soportados
      const supportedLanguages = ['es', 'en', 'ca', 'fr', 'de', 'it', 'pt', 'nl'];
      
      let targetLanguage = 'es'; // idioma por defecto
      
      if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
        // Usar idioma guardado si existe y es soportado
        targetLanguage = savedLanguage;
      } else if (supportedLanguages.includes(browserLangCode)) {
        // Usar idioma del navegador si es soportado
        targetLanguage = browserLangCode;
      }
      
      // Cambiar idioma si es diferente al actual
      if (i18n.language !== targetLanguage) {
        i18n.changeLanguage(targetLanguage);
      }
    };

    // Inicializar cuando el i18n esté listo
    if (i18n.isInitialized) {
      initializeLanguage();
    } else {
      i18n.on('initialized', initializeLanguage);
      return () => i18n.off('initialized', initializeLanguage);
    }
  }, [i18n]);

  return {
    currentLanguage: i18n.language,
    changeLanguage: (lang: string) => {
      i18n.changeLanguage(lang);
      localStorage.setItem('i18nextLng', lang);
    },
    isReady: i18n.isInitialized
  };
};
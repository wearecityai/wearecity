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
      
      // Obtener idioma del navegador con mejor detección
      const browserLanguage = navigator.language || navigator.languages?.[0] || 'es';
      console.log('🌍 Browser language detected:', browserLanguage);
      
      // Mapeo de códigos de idioma más específico
      const languageMap: { [key: string]: string } = {
        'ca': 'ca',
        'ca-ES': 'ca',
        'ca-AD': 'ca',
        'ca-FR': 'ca',
        'ca-IT': 'ca',
        'es': 'es',
        'es-ES': 'es',
        'es-MX': 'es',
        'es-AR': 'es',
        'en': 'en',
        'en-US': 'en',
        'en-GB': 'en',
        'fr': 'fr',
        'fr-FR': 'fr',
        'de': 'de',
        'de-DE': 'de',
        'it': 'it',
        'it-IT': 'it',
        'pt': 'pt',
        'pt-PT': 'pt',
        'pt-BR': 'pt',
        'nl': 'nl',
        'nl-NL': 'nl'
      };
      
      // Lista de idiomas soportados
      const supportedLanguages = ['es', 'en', 'ca', 'fr', 'de', 'it', 'pt', 'nl'];
      
      let targetLanguage = 'es'; // idioma por defecto
      
      if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
        // Usar idioma guardado si existe y es soportado
        targetLanguage = savedLanguage;
        console.log('💾 Using saved language:', targetLanguage);
      } else {
        // Intentar mapear el idioma del navegador
        const mappedLanguage = languageMap[browserLanguage];
        if (mappedLanguage && supportedLanguages.includes(mappedLanguage)) {
          targetLanguage = mappedLanguage;
          console.log('🗺️ Mapped browser language:', browserLanguage, '->', targetLanguage);
        } else {
          // Fallback a código corto
          const browserLangCode = browserLanguage.split('-')[0];
          if (supportedLanguages.includes(browserLangCode)) {
            targetLanguage = browserLangCode;
            console.log('📏 Using short language code:', browserLangCode);
          }
        }
      }
      
      console.log('🎯 Target language:', targetLanguage);
      
      // Cambiar idioma si es diferente al actual
      if (i18n.language !== targetLanguage) {
        console.log('🔄 Changing language from', i18n.language, 'to', targetLanguage);
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
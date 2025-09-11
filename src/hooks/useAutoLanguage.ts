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
      // Evitar múltiples inicializaciones
      if (i18n.isInitialized) {
        return;
      }
      
      console.log('🔧 Initializing language detection...');
      
      // Solo limpiar localStorage si no hay idioma guardado
      if (!localStorage.getItem('i18nextLng')) {
        localStorage.removeItem('i18nextLng');
      }
      
      // Obtener idioma del navegador con mejor detección
      const browserLanguage = navigator.language || navigator.languages?.[0] || 'es';
      const allLanguages = navigator.languages || [navigator.language];
      
      console.log('🌍 All browser languages:', allLanguages);
      console.log('🌍 Primary browser language:', browserLanguage);
      
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
      
      // Buscar en todas las preferencias de idioma del navegador
      for (const lang of allLanguages) {
        console.log('🔍 Checking language preference:', lang);
        
        // Intentar mapeo directo
        if (languageMap[lang] && supportedLanguages.includes(languageMap[lang])) {
          targetLanguage = languageMap[lang];
          console.log('✅ Found exact match:', lang, '->', targetLanguage);
          break;
        }
        
        // Intentar código corto
        const shortCode = lang.split('-')[0];
        if (supportedLanguages.includes(shortCode)) {
          targetLanguage = shortCode;
          console.log('✅ Found short code match:', lang, '->', targetLanguage);
          break;
        }
      }
      
      console.log('🎯 Final target language:', targetLanguage);
      
      // Forzar cambio de idioma
      console.log('🔄 Forcing language change to:', targetLanguage);
      i18n.changeLanguage(targetLanguage).then(() => {
        console.log('✅ Language changed successfully to:', i18n.language);
        localStorage.setItem('i18nextLng', targetLanguage);
      }).catch((error) => {
        console.error('❌ Error changing language:', error);
      });
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
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { Suspense } from 'react';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';
import ca from './locales/ca.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import nl from './locales/nl.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  ca: { translation: ca },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  pt: { translation: pt },
  nl: { translation: nl },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: true, // Activar debug temporalmente
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
  });

// Forzar limpieza y detección automática
if (typeof window !== 'undefined') {
  // Limpiar cualquier configuración previa
  localStorage.removeItem('i18nextLng');
  
  // Debug información
  console.log('🌍 Browser language:', navigator.language);
  console.log('🌍 Browser languages:', navigator.languages);
  
  // Forzar detección del idioma del navegador
  const browserLang = navigator.language.split('-')[0];
  const supportedLanguages = ['es', 'en', 'ca', 'fr', 'de', 'it', 'pt', 'nl'];
  
  if (supportedLanguages.includes(browserLang)) {
    console.log('🌍 Setting language to:', browserLang);
    // Forzar el cambio inmediatamente
    setTimeout(() => {
      i18n.changeLanguage(browserLang);
    }, 100);
  }
}

export default i18n;
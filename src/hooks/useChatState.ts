import { useState } from 'react';
import { CustomChatConfig } from '../types';
import { 
  DEFAULT_CHAT_CONFIG, 
  SUPPORTED_LANGUAGES, 
  DEFAULT_LANGUAGE_CODE, 
  DEFAULT_CHAT_TITLE,
  API_KEY_ERROR_MESSAGE
} from '../constants';

export const useChatState = () => {
  const [currentView, setCurrentView] = useState<'chat' | 'finetuning'>('chat');
  const [chatTitles, setChatTitles] = useState<string[]>([DEFAULT_CHAT_TITLE]);
  const [selectedChatIndex, setSelectedChatIndex] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [chatConfig, setChatConfig] = useState<CustomChatConfig>(() => {
    let loadedConfig: CustomChatConfig = { ...DEFAULT_CHAT_CONFIG };
    try {
      const savedConfigString = localStorage.getItem('chatConfig');
      if (savedConfigString) {
        const savedConfig = JSON.parse(savedConfigString) as Partial<CustomChatConfig>;
        loadedConfig = {
          ...loadedConfig,
          ...savedConfig,
          recommendedPrompts: savedConfig.recommendedPrompts || DEFAULT_CHAT_CONFIG.recommendedPrompts,
          serviceTags: savedConfig.serviceTags || DEFAULT_CHAT_CONFIG.serviceTags,
          procedureSourceUrls: savedConfig.procedureSourceUrls || DEFAULT_CHAT_CONFIG.procedureSourceUrls,
          uploadedProcedureDocuments: savedConfig.uploadedProcedureDocuments || DEFAULT_CHAT_CONFIG.uploadedProcedureDocuments,
          restrictedCity: savedConfig.restrictedCity !== undefined ? savedConfig.restrictedCity : DEFAULT_CHAT_CONFIG.restrictedCity,
          sedeElectronicaUrl: savedConfig.sedeElectronicaUrl || DEFAULT_CHAT_CONFIG.sedeElectronicaUrl,
        };
      }
    } catch (error) {
      console.error("Error parsing saved chatConfig from localStorage:", error);
    }

    const isValidSavedLanguage = loadedConfig.currentLanguageCode && SUPPORTED_LANGUAGES.some(l => l.code === loadedConfig.currentLanguageCode);
    if (!isValidSavedLanguage) {
      let detectedLangCode = DEFAULT_LANGUAGE_CODE;
      if (typeof navigator !== 'undefined' && navigator.language) {
        const browserLang = navigator.language;
        const baseBrowserLang = browserLang.split('-')[0];
        const exactMatch = SUPPORTED_LANGUAGES.find(l => l.code.toLowerCase() === browserLang.toLowerCase());
        if (exactMatch) detectedLangCode = exactMatch.code;
        else {
          const baseMatch = SUPPORTED_LANGUAGES.find(l => l.code.split('-')[0].toLowerCase() === baseBrowserLang.toLowerCase());
          if (baseMatch) detectedLangCode = baseMatch.code;
        }
      }
      loadedConfig.currentLanguageCode = detectedLangCode;
    }
    return loadedConfig;
  });

  return {
    currentView,
    setCurrentView,
    chatTitles,
    setChatTitles,
    selectedChatIndex,
    setSelectedChatIndex,
    isMenuOpen,
    setIsMenuOpen,
    chatConfig,
    setChatConfig
  };
};

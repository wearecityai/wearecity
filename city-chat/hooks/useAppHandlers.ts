
import { useCallback } from 'react';
import { ChatMessage, CustomChatConfig } from '../types';
import { 
  DEFAULT_CHAT_CONFIG, 
  SUPPORTED_LANGUAGES, 
  DEFAULT_CHAT_TITLE,
  MAPS_API_KEY_INVALID_ERROR_MESSAGE 
} from '../constants';

interface UseAppHandlersProps {
  chatConfig: CustomChatConfig;
  setChatConfig: React.Dispatch<React.SetStateAction<CustomChatConfig>>;
  setCurrentView: React.Dispatch<React.SetStateAction<'chat' | 'finetuning'>>;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedChatIndex: React.Dispatch<React.SetStateAction<number>>;
  selectedChatIndex: number;
  isMobile: boolean;
  appError: string | null;
  setAppError: (error: string | null) => void;
  clearMessages: () => void;
}

export const useAppHandlers = ({
  chatConfig,
  setChatConfig,
  setCurrentView,
  setIsMenuOpen,
  setSelectedChatIndex,
  selectedChatIndex,
  isMobile,
  appError,
  setAppError,
  clearMessages
}: UseAppHandlersProps) => {

  const handleNewChat = useCallback((newChatTitle: string = DEFAULT_CHAT_TITLE) => {
    clearMessages();
    if (appError && !appError.toLowerCase().includes("google maps") && !appError.includes("API_KEY") && appError !== MAPS_API_KEY_INVALID_ERROR_MESSAGE) {
      setAppError(null);
    }
    if (isMobile) setIsMenuOpen(false);
  }, [clearMessages, appError, setAppError, isMobile, setIsMenuOpen]);

  const handleSetCurrentLanguageCode = useCallback((newLangCode: string) => {
    setChatConfig(prevConfig => {
      if (prevConfig.currentLanguageCode === newLangCode) return prevConfig;
      const updatedConfig = { ...prevConfig, currentLanguageCode: newLangCode };
      localStorage.setItem('chatConfig', JSON.stringify(updatedConfig));
      clearMessages();
      return updatedConfig;
    });
  }, [setChatConfig, clearMessages]);

  const handleSaveCustomization = useCallback(async (newConfig: CustomChatConfig) => {
    const configToSave: CustomChatConfig = { ...DEFAULT_CHAT_CONFIG, ...newConfig };
    configToSave.assistantName = newConfig.assistantName.trim() || DEFAULT_CHAT_CONFIG.assistantName;
    configToSave.systemInstruction = typeof newConfig.systemInstruction === 'string' ? newConfig.systemInstruction.trim() : DEFAULT_CHAT_CONFIG.systemInstruction;
    configToSave.currentLanguageCode = newConfig.currentLanguageCode && SUPPORTED_LANGUAGES.some(l => l.code === newConfig.currentLanguageCode) ? newConfig.currentLanguageCode : DEFAULT_CHAT_CONFIG.currentLanguageCode;
    configToSave.restrictedCity = newConfig.restrictedCity !== undefined ? newConfig.restrictedCity : DEFAULT_CHAT_CONFIG.restrictedCity;
    configToSave.procedureSourceUrls = newConfig.procedureSourceUrls || DEFAULT_CHAT_CONFIG.procedureSourceUrls;
    configToSave.uploadedProcedureDocuments = newConfig.uploadedProcedureDocuments || DEFAULT_CHAT_CONFIG.uploadedProcedureDocuments;
    configToSave.sedeElectronicaUrl = newConfig.sedeElectronicaUrl || DEFAULT_CHAT_CONFIG.sedeElectronicaUrl;

    localStorage.setItem('chatConfig', JSON.stringify(configToSave));
    setChatConfig(configToSave);
    setCurrentView('chat');
    clearMessages();
    setIsMenuOpen(false);
    if (appError && !appError.includes("API_KEY") && !appError.toLowerCase().includes("google maps") && !appError.toLowerCase().includes("offline") && !appError.toLowerCase().includes("network") && appError !== MAPS_API_KEY_INVALID_ERROR_MESSAGE) {
      setAppError(null);
    }
  }, [setChatConfig, setCurrentView, clearMessages, setIsMenuOpen, appError, setAppError]);

  const handleDownloadPdf = useCallback((pdfInfo: NonNullable<ChatMessage['downloadablePdfInfo']>) => {
    try {
      const byteCharacters = atob(pdfInfo.base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: pdfInfo.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfInfo.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error downloading PDF:", e);
      setAppError(`Error al descargar PDF: ${pdfInfo.fileName}.`);
    }
  }, [setAppError]);

  const handleSelectChat = useCallback((index: number) => {
    setSelectedChatIndex(index);
    if (index !== selectedChatIndex) {
      clearMessages(); // Clear for demo
    }
    if (isMobile) setIsMenuOpen(false);
  }, [setSelectedChatIndex, selectedChatIndex, clearMessages, isMobile, setIsMenuOpen]);

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, [setIsMenuOpen]);

  const handleOpenFinetuning = useCallback(() => {
    setCurrentView('finetuning');
  }, [setCurrentView]);

  const handleOpenSettings = useCallback(() => {
    setCurrentView('finetuning');
  }, [setCurrentView]);

  return {
    handleNewChat,
    handleSetCurrentLanguageCode,
    handleSaveCustomization,
    handleDownloadPdf,
    handleSelectChat,
    handleMenuToggle,
    handleOpenFinetuning,
    handleOpenSettings
  };
};

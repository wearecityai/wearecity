
import { useCallback } from 'react';
import { CustomChatConfig } from '../types';
import { 
  DEFAULT_CHAT_CONFIG, 
  SUPPORTED_LANGUAGES, 
  DEFAULT_CHAT_TITLE,
  MAPS_API_KEY_INVALID_ERROR_MESSAGE,
  API_KEY_ERROR_MESSAGE
} from '../constants';

interface UseAppHandlersProps {
  chatConfig: CustomChatConfig;
  setChatConfig: React.Dispatch<React.SetStateAction<CustomChatConfig>>;
  saveConfig: (config: CustomChatConfig) => Promise<boolean>;
  setCurrentView: React.Dispatch<React.SetStateAction<'chat' | 'finetuning' | 'metrics'>>;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedChatIndex: React.Dispatch<React.SetStateAction<number>>;
  selectedChatIndex: number;
  isMobile: boolean;
  appError: string | null;
  setAppError: (error: string | null) => void;
  clearMessages: () => void;
  handleNewChat: () => Promise<void>;
  setCurrentConversationId: (id: string | null) => void;
  conversations: Array<{ id: string; title: string }>;
}

export const useAppHandlers = ({
  chatConfig,
  setChatConfig,
  saveConfig,
  setCurrentView,
  setIsMenuOpen,
  setSelectedChatIndex,
  selectedChatIndex,
  isMobile,
  appError,
  setAppError,
  clearMessages,
  handleNewChat,
  setCurrentConversationId,
  conversations
}: UseAppHandlersProps) => {

  const handleNewChatClick = useCallback(async (newChatTitle: string = DEFAULT_CHAT_TITLE) => {
    await handleNewChat();
    if (appError && !appError.toLowerCase().includes("google maps") && !appError.includes("API_KEY") && appError !== MAPS_API_KEY_INVALID_ERROR_MESSAGE) {
      setAppError(null);
    }
    // Ensure we leave finetuning/metrics and show chat
    setCurrentView('chat');
    if (isMobile) setIsMenuOpen(false);
  }, [handleNewChat, appError, setAppError, isMobile, setIsMenuOpen, setCurrentView]);

  const handleSetCurrentLanguageCode = useCallback(async (newLangCode: string) => {
    const updatedConfig = { ...chatConfig, currentLanguageCode: newLangCode };
    setChatConfig(updatedConfig);
    await saveConfig(updatedConfig);
    clearMessages();
  }, [chatConfig, setChatConfig, saveConfig, clearMessages]);

  const handleSaveCustomization = useCallback(async (newConfig: CustomChatConfig) => {
    console.log('🔧 handleSaveCustomization called with:', newConfig);
    
    const configToSave: CustomChatConfig = { ...DEFAULT_CHAT_CONFIG, ...newConfig };
    configToSave.assistantName = newConfig.assistantName.trim() || DEFAULT_CHAT_CONFIG.assistantName;
    configToSave.systemInstruction = typeof newConfig.systemInstruction === 'string' ? newConfig.systemInstruction.trim() : DEFAULT_CHAT_CONFIG.systemInstruction;
    configToSave.currentLanguageCode = newConfig.currentLanguageCode && SUPPORTED_LANGUAGES.some(l => l.code === newConfig.currentLanguageCode) ? newConfig.currentLanguageCode : DEFAULT_CHAT_CONFIG.currentLanguageCode;
    configToSave.restrictedCity = newConfig.restrictedCity !== undefined ? newConfig.restrictedCity : DEFAULT_CHAT_CONFIG.restrictedCity;
    configToSave.procedureSourceUrls = newConfig.procedureSourceUrls || DEFAULT_CHAT_CONFIG.procedureSourceUrls;
    configToSave.uploadedProcedureDocuments = newConfig.uploadedProcedureDocuments || DEFAULT_CHAT_CONFIG.uploadedProcedureDocuments;
    configToSave.sedeElectronicaUrl = newConfig.sedeElectronicaUrl || DEFAULT_CHAT_CONFIG.sedeElectronicaUrl;
    configToSave.profileImageUrl = newConfig.profileImageUrl || DEFAULT_CHAT_CONFIG.profileImageUrl;

    console.log('🔧 Final config to save:', configToSave);
    
    setChatConfig(configToSave);
    const success = await saveConfig(configToSave);
    
    if (success) {
      setCurrentView('chat');
      clearMessages();
      setIsMenuOpen(false);
      if (appError && !appError.includes("API_KEY") && !appError.toLowerCase().includes("google maps") && !appError.toLowerCase().includes("offline") && !appError.toLowerCase().includes("network") && appError !== MAPS_API_KEY_INVALID_ERROR_MESSAGE) {
        setAppError(null);
      }
    }
  }, [setChatConfig, saveConfig, setCurrentView, clearMessages, setIsMenuOpen, appError, setAppError]);

  const handleDownloadPdf = useCallback((pdfInfo: NonNullable<any>) => {
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
    if (index < conversations.length) {
      const conversation = conversations[index];
      setCurrentConversationId(conversation.id);
      setSelectedChatIndex(index);
    }
    // Ensure we leave finetuning/metrics and show chat
    setCurrentView('chat');
    if (isMobile) setIsMenuOpen(false);
  }, [setCurrentConversationId, setSelectedChatIndex, conversations, isMobile, setIsMenuOpen, setCurrentView]);

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, [setIsMenuOpen]);

  const handleOpenFinetuning = useCallback(() => {
    setCurrentView('finetuning');
  }, [setCurrentView]);

  const handleOpenSettings = useCallback(() => {
    setCurrentView('finetuning');
  }, [setCurrentView]);

  const handleOpenMetrics = useCallback(() => {
    setCurrentView('metrics');
  }, [setCurrentView]);

  return {
    handleNewChat: handleNewChatClick,
    handleSetCurrentLanguageCode,
    handleSaveCustomization,
    handleDownloadPdf,
    handleSelectChat,
    handleMenuToggle,
    handleOpenFinetuning,
    handleOpenSettings,
    handleOpenMetrics
  };
};

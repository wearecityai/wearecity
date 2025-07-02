
import { useRef, useCallback } from 'react';
import { CustomChatConfig } from '../../types';
import { initChatSession, ChatSession } from '../../services/geminiService';
import { API_KEY_ERROR_MESSAGE } from '../../constants';
import { useErrorHandler } from '../useErrorHandler';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useChatSession = (
  isGeminiReady: boolean,
  onError: (error: string) => void,
  onGeminiReadyChange: (ready: boolean) => void
) => {
  const geminiChatSessionRef = useRef<ChatSession | null>(null);
  const { getFriendlyError } = useErrorHandler();

  const initializeChatSession = useCallback(async (
    configToUse: CustomChatConfig,
    location: UserLocation | null
  ) => {
    if (!isGeminiReady) {
      onError(API_KEY_ERROR_MESSAGE);
      return;
    }
    try {
      console.log('Initializing chat session with config:', {
        enableGoogleSearch: configToUse.enableGoogleSearch,
        allowMapDisplay: configToUse.allowMapDisplay
      });
      
      // Initialize chat session - the edge function handles system instruction building
      geminiChatSessionRef.current = initChatSession(
        undefined, // No custom instruction needed - edge function handles everything
        configToUse.enableGoogleSearch,
        configToUse.allowMapDisplay
      );
      
      console.log('Chat session initialized successfully');
    } catch (e: any) {
      console.error("Gemini Initialization error:", e);
      const errorMessage = getFriendlyError(e, "Error al inicializar el chat con Gemini.");
      onError(errorMessage);
      if (errorMessage === API_KEY_ERROR_MESSAGE) onGeminiReadyChange(false);
    }
  }, [isGeminiReady, onError, onGeminiReadyChange, getFriendlyError]);

  return {
    geminiChatSessionRef,
    initializeChatSession
  };
};

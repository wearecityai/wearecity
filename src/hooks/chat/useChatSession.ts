
import { useRef, useCallback } from 'react';
import { Chat as GeminiChat } from '@google/genai';
import { CustomChatConfig } from '../../types';
import { initChatSession } from '../../services/geminiService';
import { API_KEY_ERROR_MESSAGE } from '../../constants';
import { useSystemInstructionBuilder } from '../useSystemInstructionBuilder';
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
  const geminiChatSessionRef = useRef<GeminiChat | null>(null);
  const { buildFullSystemInstruction } = useSystemInstructionBuilder();
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
      const fullSystemInstruction = buildFullSystemInstruction(configToUse, location);
      geminiChatSessionRef.current = initChatSession(fullSystemInstruction, configToUse.enableGoogleSearch);
    } catch (e: any) {
      console.error("Gemini Initialization error:", e);
      const errorMessage = getFriendlyError(e, "Error al inicializar el chat con Gemini.");
      onError(errorMessage);
      if (errorMessage === API_KEY_ERROR_MESSAGE) onGeminiReadyChange(false);
    }
  }, [isGeminiReady, buildFullSystemInstruction, onError, onGeminiReadyChange, getFriendlyError]);

  return {
    geminiChatSessionRef,
    initializeChatSession
  };
};

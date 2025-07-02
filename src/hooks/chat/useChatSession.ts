
import { useRef, useCallback } from 'react';
import { CustomChatConfig } from '../../types';
import { initChatSession, ChatSession } from '../../services/geminiService';
import { API_KEY_ERROR_MESSAGE } from '../../constants';
import { useErrorHandler } from '../useErrorHandler';
import { useSystemInstructionBuilder } from '../useSystemInstructionBuilder';

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
  const { buildFullSystemInstruction, isLoaded } = useSystemInstructionBuilder();
  const initializationAttempts = useRef(0);
  const maxInitAttempts = 3;

  const initializeChatSession = useCallback(async (
    configToUse: CustomChatConfig,
    location: UserLocation | null
  ) => {
    console.log('=== Enhanced Chat Session Initialization ===');
    console.log('Attempt:', initializationAttempts.current + 1);
    console.log('Gemini ready:', isGeminiReady);
    console.log('Config:', {
      enableGoogleSearch: configToUse.enableGoogleSearch,
      allowMapDisplay: configToUse.allowMapDisplay
    });

    if (!isGeminiReady) {
      console.log('Gemini not ready, cannot initialize');
      onError(API_KEY_ERROR_MESSAGE);
      return;
    }

    if (!isLoaded) {
      console.log('System instructions not loaded yet, waiting...');
      return;
    }

    try {
      initializationAttempts.current++;
      
      // Build system instruction from database
      const systemInstruction = buildFullSystemInstruction(configToUse, location);
      console.log('Built system instruction:', systemInstruction ? 'Present' : 'Empty');
      
      // Initialize chat session with system instruction from database
      const chatSession = initChatSession(
        systemInstruction,
        configToUse.enableGoogleSearch,
        configToUse.allowMapDisplay
      );

      // Validate session creation
      if (!chatSession || typeof chatSession.sendMessageStream !== 'function') {
        throw new Error('Invalid chat session created');
      }

      geminiChatSessionRef.current = chatSession;
      
      console.log('✅ Chat session initialized successfully');
      console.log('Session validation:', {
        hasSession: !!chatSession,
        hasStreamMethod: typeof chatSession.sendMessageStream,
        messagesArray: Array.isArray(chatSession.messages)
      });

      // Reset attempt counter on success
      initializationAttempts.current = 0;
      
    } catch (e: any) {
      console.error(`❌ Chat session initialization error (attempt ${initializationAttempts.current}):`, e);
      
      // Enhanced retry logic with exponential backoff
      if (initializationAttempts.current < maxInitAttempts) {
        const retryDelay = Math.pow(2, initializationAttempts.current - 1) * 1000;
        console.log(`Retrying initialization in ${retryDelay}ms...`);
        
        setTimeout(() => {
          initializeChatSession(configToUse, location);
        }, retryDelay);
        return;
      }

      // Max attempts reached
      console.error('Max initialization attempts reached');
      initializationAttempts.current = 0;
      
      const errorMessage = getFriendlyError(e, "Error al inicializar el chat con Gemini.");
      onError(errorMessage);
      if (errorMessage === API_KEY_ERROR_MESSAGE) onGeminiReadyChange(false);
    }
  }, [isGeminiReady, onError, onGeminiReadyChange, getFriendlyError, buildFullSystemInstruction, isLoaded]);

  const resetChatSession = useCallback(() => {
    console.log('Resetting chat session');
    geminiChatSessionRef.current = null;
    initializationAttempts.current = 0;
  }, []);

  const validateChatSession = useCallback((): boolean => {
    const session = geminiChatSessionRef.current;
    const isValid = !!(
      session &&
      typeof session.sendMessageStream === 'function' &&
      Array.isArray(session.messages)
    );
    
    console.log('Chat session validation result:', isValid);
    if (!isValid) {
      console.warn('Invalid chat session detected:', {
        hasSession: !!session,
        hasStreamMethod: session ? typeof session.sendMessageStream : 'no session',
        hasMessages: session ? Array.isArray(session.messages) : 'no session'
      });
    }
    
    return isValid;
  }, []);

  return {
    geminiChatSessionRef,
    initializeChatSession,
    resetChatSession,
    validateChatSession
  };
};

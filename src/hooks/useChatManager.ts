import { useState, useCallback, useRef, useEffect } from 'react';
import { Chat as GeminiChat } from '@google/genai';
import { ChatMessage, MessageRole, CustomChatConfig } from '../types';
import { initChatSession, sendMessageToGeminiStream } from '../services/geminiService';
import { API_KEY_ERROR_MESSAGE } from '../constants';
import { useSystemInstructionBuilder } from './useSystemInstructionBuilder';
import { useMessageParser } from './useMessageParser';
import { useErrorHandler } from './useErrorHandler';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useChatManager = (
  chatConfig: CustomChatConfig,
  userLocation: UserLocation | null,
  isGeminiReady: boolean,
  onError: (error: string) => void,
  onGeminiReadyChange: (ready: boolean) => void
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const geminiChatSessionRef = useRef<GeminiChat | null>(null);

  const { buildFullSystemInstruction } = useSystemInstructionBuilder();
  const { parseAIResponse, handleSeeMoreEvents: parseHandleSeeMoreEvents, clearEventTracking } = useMessageParser();
  const { getFriendlyError } = useErrorHandler();

  const initializeChatAndGreet = useCallback(async (
    configToUse: CustomChatConfig,
    location: UserLocation | null,
    currentMessages: ChatMessage[]
  ) => {
    if (!isGeminiReady) {
      onError(API_KEY_ERROR_MESSAGE);
      return;
    }
    try {
      const fullSystemInstruction = buildFullSystemInstruction(configToUse, location);
      geminiChatSessionRef.current = initChatSession(fullSystemInstruction, configToUse.enableGoogleSearch);

      if (currentMessages.length === 0) {
          // No automatic greeting for Gemini clone UI, empty state is handled by MessageList/App
      }
    } catch (e: any) {
      console.error("Gemini Initialization error:", e);
      const errorMessage = getFriendlyError(e, "Error al inicializar el chat con Gemini.");
      onError(errorMessage);
      if (errorMessage === API_KEY_ERROR_MESSAGE) onGeminiReadyChange(false);
    }
  }, [isGeminiReady, buildFullSystemInstruction, onError, onGeminiReadyChange, getFriendlyError]);

  const handleSendMessage = async (inputText: string) => {
    if (!geminiChatSessionRef.current || isLoading || !isGeminiReady) {
        if (!isGeminiReady) onError(API_KEY_ERROR_MESSAGE);
        return;
    }
    
    const userMessage: ChatMessage = { 
      id: crypto.randomUUID(), 
      role: MessageRole.User, 
      content: inputText, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    const aiClientTempId = crypto.randomUUID();
    setMessages(prev => [...prev, { 
      id: aiClientTempId, 
      role: MessageRole.Model, 
      content: '', 
      timestamp: new Date(), 
      isTyping: true 
    }]);
    
    let currentAiContent = '';

    try {
      await sendMessageToGeminiStream(
        geminiChatSessionRef.current, inputText,
        (chunkText) => {
          currentAiContent += chunkText;
          setMessages(prev => prev.map(msg => 
            msg.id === aiClientTempId ? { ...msg, content: currentAiContent, isTyping: true } : msg
          ));
        },
        async (finalResponse) => {
          const parsedResponse = parseAIResponse(currentAiContent, finalResponse, chatConfig, inputText);

          const finalAiMessage: ChatMessage = {
            id: crypto.randomUUID(), 
            role: MessageRole.Model, 
            content: parsedResponse.processedContent, 
            timestamp: new Date(),
            groundingMetadata: parsedResponse.finalGroundingMetadata, 
            mapQuery: parsedResponse.mapQueryFromAI,
            events: parsedResponse.eventsForThisMessage.length > 0 ? parsedResponse.eventsForThisMessage : undefined,
            placeCards: parsedResponse.placeCardsForMessage.length > 0 ? parsedResponse.placeCardsForMessage : undefined,
            downloadablePdfInfo: parsedResponse.downloadablePdfInfoForMessage, 
            telematicProcedureLink: parsedResponse.telematicLinkForMessage,
            showSeeMoreButton: parsedResponse.showSeeMoreButtonForThisMessage, 
            originalUserQueryForEvents: parsedResponse.storedUserQueryForEvents,
          };
          
          setMessages(prev => prev.filter(msg => msg.id !== aiClientTempId).concat(finalAiMessage));
          setIsLoading(false);
        },
        async (apiError) => {
          console.error("API Error:", apiError);
          const friendlyApiError = getFriendlyError(apiError, `Error: ${apiError.message}`);
          const errorAiMessage: ChatMessage = { 
            id: crypto.randomUUID(), 
            role: MessageRole.Model, 
            content: '', 
            timestamp: new Date(), 
            error: friendlyApiError 
          };
          setMessages(prev => prev.filter(msg => msg.id !== aiClientTempId).concat(errorAiMessage));
          
          if (friendlyApiError === API_KEY_ERROR_MESSAGE) { 
            onError(API_KEY_ERROR_MESSAGE); 
            onGeminiReadyChange(false); 
          } else {
            onError(friendlyApiError);
          }
          setIsLoading(false);
        }
      );
    } catch (e: any) {
        console.error("Error sending message:", e);
        const errorMsg = getFriendlyError(e, "Error al enviar mensaje.");
        const errorAiMessage: ChatMessage = { 
          id: crypto.randomUUID(), 
          role: MessageRole.Model, 
          content: '', 
          timestamp: new Date(), 
          error: errorMsg 
        };
        setMessages(prev => prev.filter(msg => msg.id !== aiClientTempId).concat(errorAiMessage));
        onError(errorMsg);
        if (errorMsg === API_KEY_ERROR_MESSAGE) onGeminiReadyChange(false);
        setIsLoading(false);
    }
  };

  const handleSeeMoreEvents = (originalUserQuery?: string) => {
    parseHandleSeeMoreEvents(originalUserQuery, handleSendMessage);
  };

  const clearMessages = () => {
    setMessages([]);
    clearEventTracking();
  };

  // Initialize chat when ready
  useEffect(() => {
    if (isGeminiReady) {
      initializeChatAndGreet(chatConfig, userLocation, messages);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGeminiReady, chatConfig, userLocation]);

  return {
    messages,
    isLoading,
    handleSendMessage,
    handleSeeMoreEvents,
    clearMessages,
    setMessages
  };
};

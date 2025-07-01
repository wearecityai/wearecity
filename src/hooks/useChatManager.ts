import { useState, useCallback, useRef, useEffect } from 'react';
import { Chat as GeminiChat } from '@google/genai';
import { ChatMessage, MessageRole, CustomChatConfig } from '../types';
import { initChatSession, sendMessageToGeminiStream } from '../services/geminiService';
import { API_KEY_ERROR_MESSAGE } from '../constants';
import { useSystemInstructionBuilder } from './useSystemInstructionBuilder';
import { useMessageParser } from './useMessageParser';
import { useErrorHandler } from './useErrorHandler';
import { useMessages } from './useMessages';
import { useConversations } from './useConversations';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const geminiChatSessionRef = useRef<GeminiChat | null>(null);

  const { buildFullSystemInstruction } = useSystemInstructionBuilder();
  const { parseAIResponse, handleSeeMoreEvents: parseHandleSeeMoreEvents, clearEventTracking } = useMessageParser();
  const { getFriendlyError } = useErrorHandler();
  
  // Usar hooks de conversaciones y mensajes
  const { 
    conversations, 
    currentConversationId, 
    setCurrentConversationId,
    createConversation 
  } = useConversations();
  
  const { 
    messages, 
    addMessage, 
    updateMessage, 
    clearMessages, 
    setMessages 
  } = useMessages(currentConversationId);

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

    // Crear conversación si no existe
    let conversationId = currentConversationId;
    if (!conversationId) {
      const newConversation = await createConversation('Nueva conversación');
      if (newConversation) {
        conversationId = newConversation.id;
      }
    }

    // Verifica que hay conversación y usuario antes de guardar
    if (!conversationId) {
      onError('No se pudo crear o recuperar la conversación.');
      return;
    }

    const userMessage: ChatMessage = { 
      id: crypto.randomUUID(), 
      role: MessageRole.User, 
      content: inputText, 
      timestamp: new Date() 
    };
    
    // Agregar mensaje del usuario y verificar error
    try {
      await addMessage(userMessage);
    } catch (e) {
      console.error('Error guardando mensaje del usuario:', e);
      onError('No se pudo guardar tu mensaje. Intenta de nuevo.');
      return;
    }
    setIsLoading(true);
    
    const aiClientTempId = crypto.randomUUID();
    const tempAiMessage: ChatMessage = { 
      id: aiClientTempId, 
      role: MessageRole.Model, 
      content: '', 
      timestamp: new Date(), 
      isTyping: true 
    };
    
    setMessages(prev => [...prev, tempAiMessage]);
    
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
          
          setMessages(prev => prev.filter(msg => msg.id !== aiClientTempId));
          try {
            await addMessage(finalAiMessage);
          } catch (e) {
            console.error('Error guardando mensaje de la IA:', e);
            onError('No se pudo guardar la respuesta de la IA.');
          }
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
          
          setMessages(prev => prev.filter(msg => msg.id !== aiClientTempId));
          try {
            await addMessage(errorAiMessage);
          } catch (e) {
            console.error('Error guardando mensaje de error de la IA:', e);
            onError('No se pudo guardar el mensaje de error de la IA.');
          }
          
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
        
        setMessages(prev => prev.filter(msg => msg.id !== aiClientTempId));
        try {
          await addMessage(errorAiMessage);
        } catch (err) {
          console.error('Error guardando mensaje de error de la IA:', err);
          onError('No se pudo guardar el mensaje de error de la IA.');
        }
        onError(errorMsg);
        if (errorMsg === API_KEY_ERROR_MESSAGE) onGeminiReadyChange(false);
        setIsLoading(false);
    }
  };

  const handleSeeMoreEvents = (originalUserQuery?: string) => {
    parseHandleSeeMoreEvents(originalUserQuery, handleSendMessage);
  };

  const handleClearMessages = () => {
    clearMessages();
    clearEventTracking();
  };

  const handleNewChat = async () => {
    const newConversation = await createConversation();
    if (newConversation) {
      clearMessages();
      clearEventTracking();
    }
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
    clearMessages: handleClearMessages,
    setMessages,
    handleNewChat,
    conversations,
    currentConversationId,
    setCurrentConversationId
  };
};

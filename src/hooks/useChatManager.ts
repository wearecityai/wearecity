
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
    
    const userMessage: ChatMessage = { 
      id: crypto.randomUUID(), 
      role: MessageRole.User, 
      content: inputText, 
      timestamp: new Date() 
    };
    
    // Agregar mensaje del usuario y guardarlo
    console.log('Adding user message:', userMessage.id);
    await addMessage(userMessage);
    setIsLoading(true);
    
    // Crear mensaje temporal para la respuesta de la IA
    const aiMessageId = crypto.randomUUID();
    const tempAiMessage: ChatMessage = { 
      id: aiMessageId, 
      role: MessageRole.Model, 
      content: '', 
      timestamp: new Date(), 
      isTyping: true 
    };
    
    // Mostrar mensaje temporal mientras se genera la respuesta
    setMessages(prev => [...prev, tempAiMessage]);
    
    let currentAiContent = '';

    try {
      await sendMessageToGeminiStream(
        geminiChatSessionRef.current, inputText,
        (chunkText) => {
          currentAiContent += chunkText;
          // Actualizar contenido del mensaje temporal
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, content: currentAiContent, isTyping: true } : msg
          ));
        },
        async (finalResponse) => {
          console.log('Processing final AI response');
          const parsedResponse = parseAIResponse(currentAiContent, finalResponse, chatConfig, inputText);

          // Crear mensaje final de la IA con toda la información procesada
          const finalAiMessage: ChatMessage = {
            id: aiMessageId, // Usar el mismo ID del mensaje temporal
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
            isTyping: false
          };
          
          console.log('Saving final AI message:', finalAiMessage.id);
          
          // Reemplazar mensaje temporal con el mensaje final en el estado local
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? finalAiMessage : msg
          ));
          
          // Guardar mensaje final en la base de datos
          await addMessage(finalAiMessage);
          setIsLoading(false);
        },
        async (apiError) => {
          console.error("API Error:", apiError);
          const friendlyApiError = getFriendlyError(apiError, `Error: ${apiError.message}`);
          
          // Crear mensaje de error
          const errorAiMessage: ChatMessage = { 
            id: aiMessageId, // Usar el mismo ID
            role: MessageRole.Model, 
            content: '', 
            timestamp: new Date(), 
            error: friendlyApiError,
            isTyping: false
          };
          
          // Reemplazar mensaje temporal con mensaje de error
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? errorAiMessage : msg
          ));
          
          // Guardar mensaje de error en la base de datos
          await addMessage(errorAiMessage);
          
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
        
        // Crear mensaje de error
        const errorAiMessage: ChatMessage = { 
          id: aiMessageId, // Usar el mismo ID
          role: MessageRole.Model, 
          content: '', 
          timestamp: new Date(), 
          error: errorMsg,
          isTyping: false
        };
        
        // Reemplazar mensaje temporal con mensaje de error
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId ? errorAiMessage : msg
        ));
        
        // Guardar mensaje de error en la base de datos
        await addMessage(errorAiMessage);
        
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

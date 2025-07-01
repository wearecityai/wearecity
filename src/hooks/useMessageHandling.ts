
import { useRef } from 'react';
import { Chat as GeminiChat } from '@google/genai';
import { ChatMessage, MessageRole, CustomChatConfig } from '../types';
import { sendMessageToGeminiStream } from '../services/geminiService';
import { API_KEY_ERROR_MESSAGE } from '../constants';
import { useMessageParser } from './useMessageParser';
import { useErrorHandler } from './useErrorHandler';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useMessageHandling = (
  chatConfig: CustomChatConfig,
  isGeminiReady: boolean,
  onError: (error: string) => void,
  onGeminiReadyChange: (ready: boolean) => void,
  geminiChatSessionRef: React.MutableRefObject<GeminiChat | null>,
  addMessage: (message: ChatMessage) => Promise<void>,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  createConversation: (title?: string) => Promise<any>,
  currentConversationId: string | null
) => {
  const { parseAIResponse, handleSeeMoreEvents: parseHandleSeeMoreEvents } = useMessageParser();
  const { getFriendlyError } = useErrorHandler();

  const handleSendMessage = async (inputText: string) => {
    if (!geminiChatSessionRef.current || !isGeminiReady) {
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
    
    // Crear mensaje temporal para la respuesta de la IA
    const aiMessageId = crypto.randomUUID();
    const tempAiMessage: ChatMessage = { 
      id: aiMessageId, 
      role: MessageRole.Model, 
      content: '', 
      timestamp: new Date(), 
      isTyping: true 
    };
    
    // Agregar mensaje temporal solo al estado local (no guardar en BD)
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
            id: aiMessageId,
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
          
          // Guardar mensaje final en la base de datos SOLO UNA VEZ
          await addMessage(finalAiMessage);
        },
        async (apiError) => {
          console.error("API Error:", apiError);
          const friendlyApiError = getFriendlyError(apiError, `Error: ${apiError.message}`);
          
          // Crear mensaje de error
          const errorAiMessage: ChatMessage = { 
            id: aiMessageId,
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
        }
      );
    } catch (e: any) {
        console.error("Error sending message:", e);
        const errorMsg = getFriendlyError(e, "Error al enviar mensaje.");
        
        // Crear mensaje de error
        const errorAiMessage: ChatMessage = { 
          id: aiMessageId,
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
    }
  };

  const handleSeeMoreEvents = (originalUserQuery?: string) => {
    parseHandleSeeMoreEvents(originalUserQuery, handleSendMessage);
  };

  return {
    handleSendMessage,
    handleSeeMoreEvents
  };
};


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

    // Verifica que hay conversación antes de continuar
    if (!conversationId) {
      onError('No se pudo crear o recuperar la conversación.');
      return;
    }

    // 1. GUARDAR MENSAJE DEL USUARIO INMEDIATAMENTE
    const userMessage: ChatMessage = { 
      id: crypto.randomUUID(), 
      role: MessageRole.User, 
      content: inputText, 
      timestamp: new Date() 
    };
    
    console.log('Guardando mensaje del usuario:', userMessage.id);
    try {
      await addMessage(userMessage);
      console.log('Mensaje del usuario guardado exitosamente');
    } catch (e) {
      console.error('Error guardando mensaje del usuario:', e);
      onError('No se pudo guardar tu mensaje. Intenta de nuevo.');
      return;
    }

    setIsLoading(true);
    
    // 2. CREAR MENSAJE TEMPORAL DE LA IA PARA MOSTRAR EN LA UI
    const aiTempId = crypto.randomUUID();
    const tempAiMessage: ChatMessage = { 
      id: aiTempId, 
      role: MessageRole.Model, 
      content: '', 
      timestamp: new Date(), 
      isTyping: true 
    };
    
    // Agregar mensaje temporal solo a la UI (no a la base de datos)
    setMessages(prev => [...prev, tempAiMessage]);
    
    let accumulatedContent = '';

    try {
      await sendMessageToGeminiStream(
        geminiChatSessionRef.current, 
        inputText,
        // Callback para chunks de texto (streaming)
        (chunkText) => {
          accumulatedContent += chunkText;
          // Actualizar mensaje temporal en la UI
          setMessages(prev => prev.map(msg => 
            msg.id === aiTempId 
              ? { ...msg, content: accumulatedContent, isTyping: true } 
              : msg
          ));
        },
        // Callback cuando termina la respuesta completa
        async (finalResponse) => {
          console.log('IA terminó de responder, procesando respuesta final');
          
          // Procesar la respuesta de la IA
          const parsedResponse = parseAIResponse(accumulatedContent, finalResponse, chatConfig, inputText);

          // 3. CREAR MENSAJE FINAL DE LA IA PARA GUARDAR EN LA BASE DE DATOS
          const finalAiMessage: ChatMessage = {
            id: crypto.randomUUID(), // Nuevo ID para el mensaje persistente
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
          
          console.log('Guardando respuesta final de la IA:', finalAiMessage.id);
          
          // 4. REEMPLAZAR MENSAJE TEMPORAL CON MENSAJE FINAL
          try {
            // Primero guardamos en la base de datos
            await addMessage(finalAiMessage);
            console.log('Respuesta de la IA guardada exitosamente en la base de datos');
            
            // Luego actualizamos la UI quitando el temporal y mostrando el final
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiTempId ? finalAiMessage : msg
              )
            );
            
          } catch (e) {
            console.error('Error guardando respuesta de la IA:', e);
            
            // Si hay error guardando, mostramos el mensaje en la UI pero marcamos el error
            setMessages(prev => prev.map(msg => 
              msg.id === aiTempId 
                ? { 
                    ...finalAiMessage, 
                    id: aiTempId, // Mantener el ID temporal
                    error: 'No se pudo guardar la respuesta' 
                  }
                : msg
            ));
            
            onError('No se pudo guardar la respuesta de la IA.');
          }
          
          setIsLoading(false);
        },
        // Callback para errores de la API
        async (apiError) => {
          console.error("Error de la API de Gemini:", apiError);
          const friendlyApiError = getFriendlyError(apiError, `Error: ${apiError.message}`);
          
          // 5. CREAR MENSAJE DE ERROR Y GUARDARLO
          const errorAiMessage: ChatMessage = { 
            id: crypto.randomUUID(), 
            role: MessageRole.Model, 
            content: '', 
            timestamp: new Date(), 
            error: friendlyApiError 
          };
          
          console.log('Guardando mensaje de error de la IA');
          try {
            await addMessage(errorAiMessage);
            
            // Reemplazar mensaje temporal con mensaje de error
            setMessages(prev => prev.map(msg => 
              msg.id === aiTempId ? errorAiMessage : msg
            ));
            
          } catch (e) {
            console.error('Error guardando mensaje de error:', e);
            
            // Si no se puede guardar, al menos mostrar en la UI
            setMessages(prev => prev.map(msg => 
              msg.id === aiTempId 
                ? { ...errorAiMessage, id: aiTempId }
                : msg
            ));
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
        console.error("Error general enviando mensaje:", e);
        const errorMsg = getFriendlyError(e, "Error al enviar mensaje.");
        
        const errorAiMessage: ChatMessage = { 
          id: crypto.randomUUID(), 
          role: MessageRole.Model, 
          content: '', 
          timestamp: new Date(), 
          error: errorMsg 
        };
        
        try {
          await addMessage(errorAiMessage);
          setMessages(prev => prev.map(msg => 
            msg.id === aiTempId ? errorAiMessage : msg
          ));
        } catch (err) {
          console.error('Error guardando mensaje de error:', err);
          setMessages(prev => prev.map(msg => 
            msg.id === aiTempId 
              ? { ...errorAiMessage, id: aiTempId }
              : msg
          ));
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

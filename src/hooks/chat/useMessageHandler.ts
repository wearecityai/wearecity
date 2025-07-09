import { ChatMessage, CustomChatConfig, MessageRole } from '../../types';
import { useCallback, useRef, useState, SetStateAction } from 'react';
import { useMessageParser } from '../useMessageParser';
import { fetchChatIA } from '../../services/chatIA';
import { useAuth } from '../useAuth';
import { useGeolocation } from '../useGeolocation';

export const useMessageHandler = (
  chatConfig: CustomChatConfig,
  onError: (error: string) => void,
  onGeminiReadyChange: (ready: boolean) => void
) => {
  const [isLoading, setIsLoading] = useState(false);
  const { parseAIResponse } = useMessageParser();
  const { user } = useAuth();
  const { userLocation } = useGeolocation(chatConfig.allowGeolocation);
  const lastProcessedMessageRef = useRef<string | null>(null);

  const processMessage = useCallback(async (
    _unusedChatSession: null, // ya no se usa
    inputText: string,
    userMessage: ChatMessage,
    addMessage: (message: ChatMessage, targetConversationId?: string) => Promise<void>,
    saveMessageOnly: (message: ChatMessage, targetConversationId?: string) => Promise<void>,
    setMessages: (messages: any) => void,
    _isGeminiReady: boolean,
    targetConversationId: string
  ) => {
    if (lastProcessedMessageRef.current === userMessage.id) {
      return;
    }
    lastProcessedMessageRef.current = userMessage.id;
    setIsLoading(true);
    
    // 1. Añadir el mensaje del usuario
    await addMessage(userMessage, targetConversationId);
    
    // 2. Añadir el spinner justo después del mensaje del usuario
    const typingMessageId = `typing-${userMessage.id}`;
    const typingMessage: ChatMessage = {
      id: typingMessageId,
      role: MessageRole.Model,
      content: '',
      timestamp: new Date(),
      isTyping: true
    };
    
    // Añadir el spinner después del mensaje del usuario
    setMessages((prev: ChatMessage[]) => {
      console.log('Adding spinner. Current messages:', prev.map(m => ({ id: m.id, role: m.role, isTyping: m.isTyping })));
      const userMessageIndex = prev.findIndex(msg => msg.id === userMessage.id);
      console.log('User message index:', userMessageIndex, 'for message ID:', userMessage.id);
      
      if (userMessageIndex === -1) {
        // Si no encontramos el mensaje del usuario, añadir al final
        console.log('User message not found, adding spinner at the end');
        return [...prev, typingMessage];
      }
      // Insertar el spinner justo después del mensaje del usuario
      const newMessages = [...prev];
      newMessages.splice(userMessageIndex + 1, 0, typingMessage);
      console.log('Inserted spinner after user message at index:', userMessageIndex + 1);
      return newMessages;
    });
    
    try {
      // Preparar ubicación del usuario si está disponible
      const userLocationData = userLocation ? {
        lat: userLocation.latitude,
        lng: userLocation.longitude
      } : undefined;
      
      const responseText = await fetchChatIA(inputText, { 
        allowMapDisplay: chatConfig.allowMapDisplay,
        userId: user?.id,
        userLocation: userLocationData
      });
      
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.Model,
        content: responseText,
        timestamp: new Date()
      };
      // Parsea la respuesta como antes
      const parsed = parseAIResponse(responseText, null, chatConfig, inputText);
      const parsedMessage: ChatMessage = {
          ...aiMessage,
          content: parsed.processedContent,
        events: parsed.eventsForThisMessage,
        placeCards: parsed.placeCardsForMessage,
        mapQuery: parsed.mapQueryFromAI,
          downloadablePdfInfo: parsed.downloadablePdfInfoForMessage,
        telematicProcedureLink: parsed.telematicLinkForMessage,
        showSeeMoreButton: parsed.showSeeMoreButtonForThisMessage,
        originalUserQueryForEvents: parsed.storedUserQueryForEvents,
        groundingMetadata: parsed.finalGroundingMetadata,
      };
      
      // 3. Reemplazar el spinner con la respuesta real
      setMessages((prev: ChatMessage[]) => {
        console.log('Replacing spinner with response. Current messages:', prev.map(m => ({ id: m.id, role: m.role, isTyping: m.isTyping })));
        const typingIndex = prev.findIndex(msg => msg.id === typingMessageId);
        console.log('Spinner index:', typingIndex, 'for spinner ID:', typingMessageId);
        
        if (typingIndex === -1) {
          // Si no encontramos el spinner, añadir la respuesta al final
          console.log('Spinner not found, adding response at the end');
          return [...prev, parsedMessage];
        }
        // Reemplazar el spinner con la respuesta real
        const newMessages = [...prev];
        newMessages.splice(typingIndex, 1, parsedMessage);
        console.log('Replaced spinner with response at index:', typingIndex);
        return newMessages;
      });
      
      // 4. Guardar la respuesta en la base de datos
      await saveMessageOnly(parsedMessage, targetConversationId);
      
    } catch (error) {
      console.error('Error en fetchChatIA:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.Model,
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      
      // Reemplazar el spinner con el mensaje de error
      setMessages((prev: ChatMessage[]) => {
        const typingIndex = prev.findIndex(msg => msg.id === typingMessageId);
        if (typingIndex === -1) {
          return [...prev, errorMessage];
        }
        const newMessages = [...prev];
        newMessages.splice(typingIndex, 1, errorMessage);
        return newMessages;
      });
      
      try {
        await saveMessageOnly(errorMessage, targetConversationId);
      } catch {}
        onError('Error al procesar el mensaje. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
      lastProcessedMessageRef.current = null;
    }
  }, [parseAIResponse, onError, chatConfig, user?.id, userLocation]);

  return {
    isLoading,
    processMessage
  };
};

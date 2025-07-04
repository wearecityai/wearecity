import { ChatMessage, CustomChatConfig, MessageRole } from '../../types';
import { useCallback, useRef, useState } from 'react';
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
    setMessages: (messages: ChatMessage[]) => void,
    _isGeminiReady: boolean,
    targetConversationId: string
  ) => {
    if (lastProcessedMessageRef.current === userMessage.id) {
      return;
    }
    lastProcessedMessageRef.current = userMessage.id;
    setIsLoading(true);
    try {
      await addMessage(userMessage, targetConversationId);
      
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
      await addMessage(parsedMessage, targetConversationId);
    } catch (error) {
      console.error('Error en fetchChatIA:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.Model,
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
      try {
        await addMessage(errorMessage, targetConversationId);
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

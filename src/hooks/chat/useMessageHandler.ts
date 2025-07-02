import { ChatMessage, CustomChatConfig, MessageRole } from '../../types';
import { useCallback, useRef, useState } from 'react';
import { useMessageParser } from '../useMessageParser';
import { fetchChatIA } from '../../services/chatIA';

export const useMessageHandler = (
  chatConfig: CustomChatConfig,
  onError: (error: string) => void,
  onGeminiReadyChange: (ready: boolean) => void
) => {
  const [isLoading, setIsLoading] = useState(false);
  const { parseAIResponse } = useMessageParser();
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
      const responseText = await fetchChatIA(inputText, { allowMapDisplay: chatConfig.allowMapDisplay });
      // Parsea la respuesta para extraer eventos, placeCards, etc.
      const parsed = parseAIResponse(responseText, null, chatConfig, inputText);
      console.log('[useMessageHandler] Eventos parseados:', parsed.eventsForThisMessage);
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.Model,
        content: parsed.processedContent,
        timestamp: new Date(),
        events: parsed.eventsForThisMessage,
        placeCards: parsed.placeCardsForMessage,
        mapQuery: parsed.mapQueryFromAI,
        downloadablePdfInfo: parsed.downloadablePdfInfoForMessage,
        telematicProcedureLink: parsed.telematicLinkForMessage,
        showSeeMoreButton: parsed.showSeeMoreButtonForThisMessage,
        originalUserQueryForEvents: parsed.storedUserQueryForEvents,
        groundingMetadata: parsed.finalGroundingMetadata,
      };
      await addMessage(aiMessage, targetConversationId);
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
  }, [parseAIResponse, onError, chatConfig]);

  return {
    isLoading,
    processMessage
  };
};


import { ChatMessage, CustomChatConfig, MessageRole } from '../../types';
import { useCallback, useRef, useState } from 'react';
import { ChatSession } from '../../services/geminiService';
import { useContentParser } from '../parsers/useContentParser';

export const useMessageHandler = (
  chatConfig: CustomChatConfig,
  onError: (error: string) => void,
  onGeminiReadyChange: (ready: boolean) => void
) => {
  const [isLoading, setIsLoading] = useState(false);
  const { parseContent } = useContentParser();
  const lastProcessedMessageRef = useRef<string | null>(null);

  const processMessage = useCallback(async (
    chatSession: ChatSession | null,
    inputText: string,
    userMessage: ChatMessage,
    addMessage: (message: ChatMessage, targetConversationId?: string) => Promise<void>,
    saveMessageOnly: (message: ChatMessage, targetConversationId?: string) => Promise<void>,
    setMessages: (messages: ChatMessage[]) => void,
    isGeminiReady: boolean,
    targetConversationId: string
  ) => {
    // Prevent duplicate processing
    if (lastProcessedMessageRef.current === userMessage.id) {
      console.log('Message already being processed, skipping:', userMessage.id);
      return;
    }
    
    lastProcessedMessageRef.current = userMessage.id;
    
    console.log('Processing message:', userMessage.id, 'for conversation:', targetConversationId);
    
    if (!isGeminiReady || !chatSession) {
      console.error('Gemini not ready or chat session not available');
      onError('El asistente no está listo. Por favor, espera un momento.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Add user message to the specific conversation
      console.log('Adding user message to conversation:', targetConversationId);
      await addMessage(userMessage, targetConversationId);

      // Generate AI response using the new streaming method
      console.log('Generating AI response...');
      let responseText = '';
      
      await chatSession.sendMessageStream(
        inputText,
        (chunk: string, isFirst: boolean) => {
          responseText += chunk;
          // Could add real-time updates here if needed
        },
        () => {
          console.log('AI response generated, length:', responseText.length);
        },
        (error: Error) => {
          throw error;
        }
      );

      // Create AI message
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.Model,
        content: responseText,
        timestamp: new Date()
      };

      // Parse content based on configuration
      let parsedMessage = aiMessage;
      if (chatConfig.allowMapDisplay) {
        // Parse the content and apply the results to the message
        const parsed = parseContent(responseText, chatConfig);
        parsedMessage = {
          ...aiMessage,
          content: parsed.processedContent,
          mapQuery: parsed.mapQueryFromAI,
          downloadablePdfInfo: parsed.downloadablePdfInfoForMessage,
          telematicProcedureLink: parsed.telematicLinkForMessage
        };
      } else {
        const parsed = parseContent(responseText, chatConfig);
        parsedMessage = {
          ...aiMessage,
          content: parsed.processedContent,
          downloadablePdfInfo: parsed.downloadablePdfInfoForMessage,
          telematicProcedureLink: parsed.telematicLinkForMessage
        };
      }

      // Add AI message to the specific conversation
      console.log('Adding AI message to conversation:', targetConversationId);
      await addMessage(parsedMessage, targetConversationId);
      
      console.log('Message processing completed successfully');

    } catch (error) {
      console.error('Error processing message:', error);
      
      // Create error message
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.Model,
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Error desconocido'
      };

      try {
        // Add error message to the specific conversation
        await addMessage(errorMessage, targetConversationId);
      } catch (saveError) {
        console.error('Error saving error message:', saveError);
        onError('Error al procesar el mensaje y guardar la respuesta de error.');
      }
      
      if (error instanceof Error && error.message.includes('API key')) {
        onGeminiReadyChange(false);
        onError('Error de configuración de API. Verifica tu clave de API de Google.');
      } else {
        onError('Error al procesar el mensaje. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
      lastProcessedMessageRef.current = null;
    }
  }, [parseContent, onError, onGeminiReadyChange]);

  return {
    isLoading,
    processMessage
  };
};

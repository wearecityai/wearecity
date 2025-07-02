
import { ChatMessage, CustomChatConfig, MessageRole } from '../../types';
import { useCallback, useRef, useState } from 'react';
import { ChatSession } from '../../services/geminiService';
import { useContentParser } from '../parsers/useContentParser';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useMessageHandler = (
  chatConfig: CustomChatConfig,
  userLocation: UserLocation | null,
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
    updateMessage: (messageId: string, updates: Partial<ChatMessage>) => Promise<void>,
    setMessages: (messages: ChatMessage[]) => void,
    isGeminiReady: boolean,
    targetConversationId: string,
    getCurrentMessages: () => ChatMessage[]
  ) => {
    // Prevent duplicate processing
    if (lastProcessedMessageRef.current === userMessage.id) {
      console.log('Message already being processed, skipping:', userMessage.id);
      return;
    }
    
    lastProcessedMessageRef.current = userMessage.id;
    
    console.log('=== Processing message ===');
    console.log('Message ID:', userMessage.id);
    console.log('Target conversation ID:', targetConversationId);
    console.log('Gemini ready:', isGeminiReady);
    
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

      // Note: System instruction enhancement is now handled by the edge function
      // The edge function will automatically search scraped content and build enhanced instructions

      // Create a loading message immediately to show the indicator
      const loadingMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.Model,
        content: '',
        timestamp: new Date(),
        isTyping: true
      };

      // Add the loading message and also add it to local state immediately
      console.log('Adding loading message:', loadingMessage.id);
      await addMessage(loadingMessage, targetConversationId);

      // Generate AI response using streaming
      console.log('Starting streaming response generation...');
      let responseText = '';
      let isFirstChunk = true;
      
      await chatSession.sendMessageStream(
        inputText,
        (chunk: string, isFirst: boolean) => {
          console.log('Received chunk, length:', chunk.length, 'isFirst:', isFirst);
          responseText += chunk;
          
          // Update the loading message with partial content using updateMessage
          if (isFirstChunk) {
            console.log('First chunk received, updating loading message');
            updateMessage(loadingMessage.id, {
              content: responseText,
              isTyping: false
            }).catch(error => {
              console.error('Error updating message during streaming:', error);
            });
            isFirstChunk = false;
          } else {
            // Continue updating with accumulated response
            updateMessage(loadingMessage.id, {
              content: responseText
            }).catch(error => {
              console.error('Error updating message during streaming:', error);
            });
          }
        },
        () => {
          console.log('Streaming completed. Final response length:', responseText.length);
        },
        (error: Error) => {
          console.error('Streaming error:', error);
          throw error;
        }
      );

      // Parse content based on configuration
      let finalUpdates: Partial<ChatMessage>;
      if (chatConfig.allowMapDisplay) {
        const parsed = parseContent(responseText, chatConfig);
        finalUpdates = {
          content: parsed.processedContent,
          mapQuery: parsed.mapQueryFromAI,
          downloadablePdfInfo: parsed.downloadablePdfInfoForMessage,
          telematicProcedureLink: parsed.telematicLinkForMessage,
          isTyping: false
        };
      } else {
        const parsed = parseContent(responseText, chatConfig);
        finalUpdates = {
          content: parsed.processedContent,
          downloadablePdfInfo: parsed.downloadablePdfInfoForMessage,
          telematicProcedureLink: parsed.telematicLinkForMessage,
          isTyping: false
        };
      }

      // Apply final updates to the message
      console.log('Applying final updates to message:', loadingMessage.id);
      await updateMessage(loadingMessage.id, finalUpdates);
      
      console.log('=== Message processing completed successfully ===');

    } catch (error) {
      console.error('=== Error processing message ===', error);
      
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

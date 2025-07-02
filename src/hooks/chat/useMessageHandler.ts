
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
    
    // Enhanced validation
    if (!isGeminiReady) {
      console.error('Gemini not ready');
      onError('El asistente no está listo. Por favor, espera un momento.');
      return;
    }

    if (!chatSession) {
      console.error('Chat session not available');
      onError('Sesión de chat no disponible. Por favor, recarga la página.');
      return;
    }

    if (typeof chatSession.sendMessageStream !== 'function') {
      console.error('Chat session missing sendMessageStream method');
      onError('Error en la sesión de chat. Por favor, recarga la página.');
      return;
    }

    setIsLoading(true);
    
    // Create a loading message immediately to show the indicator
    const loadingMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: MessageRole.Model,
      content: '',
      timestamp: new Date(),
      isTyping: true
    };
    
    try {
      // Add user message to the specific conversation
      console.log('Adding user message to conversation:', targetConversationId);
      await addMessage(userMessage, targetConversationId);

      // Add the loading message and also add it to local state immediately
      console.log('Adding loading message:', loadingMessage.id);
      await addMessage(loadingMessage, targetConversationId);

      // Generate AI response using streaming
      console.log('Starting streaming response generation...');
      let responseText = '';
      let isFirstChunk = true;
      let hasStreamingError = false;
      
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
          console.log('Streaming completed successfully. Final response length:', responseText.length);
          
          // Validate that we have meaningful content
          if (responseText.trim().length === 0) {
            console.error('Streaming completed but no content received');
            hasStreamingError = true;
            throw new Error('No content received from AI response');
          }
        },
        (error: Error) => {
          console.error('Streaming error occurred:', error);
          hasStreamingError = true;
          throw error;
        }
      );
      
      // Additional validation after streaming
      if (hasStreamingError || responseText.trim().length === 0) {
        throw new Error('Streaming failed or returned empty response');
      }

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
      
      // Enhanced error handling and cleanup
      try {
        console.log('Cleaning up loading message after error:', loadingMessage?.id);
        
        // Always try to update the loading message to show error state
        if (loadingMessage) {
          await updateMessage(loadingMessage.id, {
            content: 'Error al procesar la respuesta. Inténtalo de nuevo.',
            isTyping: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
          console.log('Successfully updated loading message with error state');
        }
      } catch (updateError) {
        console.error('Failed to update loading message with error state:', updateError);
        
        // If updating fails, try to remove loading message and create new error message
        try {
          const errorMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: MessageRole.Model,
            content: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo.',
            timestamp: new Date(),
            error: error instanceof Error ? error.message : 'Error desconocido'
          };

          await addMessage(errorMessage, targetConversationId);
          console.log('Created new error message as fallback');
        } catch (saveError) {
          console.error('Critical: Failed to save error message:', saveError);
          onError('Error crítico al procesar el mensaje. Por favor, recarga la página.');
        }
      }
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          onGeminiReadyChange(false);
          onError('Error de configuración de API. Verifica tu clave de API de Google.');
        } else if (error.message.includes('timeout')) {
          onError('La respuesta tardó demasiado. Por favor, intenta de nuevo.');
        } else if (error.message.includes('No content received') || error.message.includes('empty response')) {
          onError('No se recibió respuesta del asistente. Por favor, intenta de nuevo.');
        } else if (error.message.includes('HTTP error')) {
          onError('Error de conexión con el servidor. Verifica tu conexión e intenta de nuevo.');
        } else {
          onError('Error al procesar el mensaje. Intenta de nuevo.');
        }
      } else {
        onError('Error desconocido al procesar el mensaje. Intenta de nuevo.');
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

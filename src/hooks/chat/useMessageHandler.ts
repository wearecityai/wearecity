
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

      // Create a loading message immediately to show the indicator
      const loadingMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.Model,
        content: '',
        timestamp: new Date(),
        isTyping: true
      };

      // Add the loading message
      console.log('Adding loading message to conversation:', targetConversationId);
      await addMessage(loadingMessage, targetConversationId);

      // Generate AI response using the new streaming method
      console.log('Generating AI response...');
      let responseText = '';
      let isFirstChunk = true;
      
      await chatSession.sendMessageStream(
        inputText,
        (chunk: string, isFirst: boolean) => {
          responseText += chunk;
          
          // Update the loading message with partial content on first chunk
          if (isFirstChunk) {
            const updatedMessage: ChatMessage = {
              ...loadingMessage,
              content: responseText,
              isTyping: false // Stop showing the typing indicator once we get content
            };
            
            // Update the message in the conversation
            setMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === loadingMessage.id ? updatedMessage : msg
              )
            );
            isFirstChunk = false;
          }
        },
        () => {
          console.log('AI response generated, length:', responseText.length);
        },
        (error: Error) => {
          throw error;
        }
      );

      // Parse content based on configuration
      let parsedMessage: ChatMessage;
      if (chatConfig.allowMapDisplay) {
        // Parse the content and apply the results to the message
        const parsed = parseContent(responseText, chatConfig);
        parsedMessage = {
          ...loadingMessage,
          content: parsed.processedContent,
          mapQuery: parsed.mapQueryFromAI,
          downloadablePdfInfo: parsed.downloadablePdfInfoForMessage,
          telematicProcedureLink: parsed.telematicLinkForMessage,
          isTyping: false
        };
      } else {
        const parsed = parseContent(responseText, chatConfig);
        parsedMessage = {
          ...loadingMessage,
          content: parsed.processedContent,
          downloadablePdfInfo: parsed.downloadablePdfInfoForMessage,
          telematicProcedureLink: parsed.telematicLinkForMessage,
          isTyping: false
        };
      }

      // Update the final message in the conversation
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === loadingMessage.id ? parsedMessage : msg
        )
      );
      
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

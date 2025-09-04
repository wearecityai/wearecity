import { ChatMessage, CustomChatConfig, MessageRole } from '../../types';
import { useCallback, useRef, useState } from 'react';
import { useAuth } from '../useAuth';
import { useTranslation } from 'react-i18next';
import { processWithVertexAI } from '../../services/vertexAIService';

export const useMessageHandler = (
  chatConfig: CustomChatConfig,
  onError: (error: string) => void,
  onGeminiReadyChange?: (ready: boolean) => void,
  citySlug?: string
) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const lastProcessedMessageRef = useRef<string | null>(null);

  const processMessage = useCallback(async (
    geminiChatSession: any,
    inputText: string,
    userMessage: ChatMessage,
    addMessage: (message: ChatMessage) => void,
    saveMessageOnly: (message: ChatMessage, conversationId: string) => Promise<void>,
    setMessages: (updater: any) => void,
    isReady: boolean,
    conversationId: string,
    currentMessages: ChatMessage[]
  ) => {
    const query = inputText;
    const cityContext = citySlug || '';
    const conversationHistory = currentMessages;
    console.log('🚀 Processing message with useMessageHandler');
    
    if (lastProcessedMessageRef.current === inputText) {
      console.log('⚠️ Message already being processed, skipping:', inputText);
      return;
    }
    
    lastProcessedMessageRef.current = inputText;
    setIsLoading(true);

    // Create typing indicator outside try block so it's accessible in catch
    const typingMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: MessageRole.Model,
      content: '',
      timestamp: new Date(),
      isTyping: true
    };

    try {
      // First, add the user message to the UI
      console.log('📝 Adding user message to UI:', userMessage.id);
      addMessage(userMessage);
      
      // Save user message to database
      await saveMessageOnly(userMessage, conversationId);

      // Add typing indicator
      addMessage(typingMessage);

      // Process with Vertex AI
      console.log('🤖 Processing with Vertex AI...');
      
      // Convert conversation history to the format expected by Vertex AI
      const historyForAI = conversationHistory?.map(msg => ({
        role: msg.role === MessageRole.User ? 'user' as const : 'assistant' as const,
        content: msg.content,
        timestamp: msg.timestamp
      })) || [];

      const vertexResponse = await processWithVertexAI(
        query,
        cityContext,
        historyForAI
      );

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.Model,
        content: vertexResponse.response,
        timestamp: new Date(),
        shouldAnimate: true,
        events: vertexResponse.events || [],
        placeCards: vertexResponse.places?.map(place => ({
          id: place.place_id || crypto.randomUUID(),
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          rating: place.rating,
          distance: undefined, // Will be calculated if needed
          photoUrl: place.photoUrl,
          website: undefined, // Will be fetched if needed
          isLoadingDetails: false,
          errorDetails: undefined,
          searchQuery: query,
          photoAttributions: []
        })) || [],
        metadata: {
          modelUsed: vertexResponse.modelUsed,
          complexity: vertexResponse.complexity,
          searchPerformed: vertexResponse.searchPerformed,
          multimodal: vertexResponse.multimodal
        }
      };
      
      // Replace typing indicator with actual response
      setMessages((prev: ChatMessage[]) => {
        const typingIndex = prev.findIndex(msg => msg.id === typingMessage.id);
        
        if (typingIndex === -1) {
          return [...prev, aiMessage];
        }
        const newMessages = [...prev];
        newMessages.splice(typingIndex, 1, aiMessage);
        return newMessages;
      });
      
      // Save AI response
      await saveMessageOnly(aiMessage, conversationId);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error en processMessage:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.Model,
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Error de conexión'
      };
      
      setMessages((prev: ChatMessage[]) => {
        const typingIndex = prev.findIndex(msg => msg.id === typingMessage.id);
        if (typingIndex === -1) {
          return [...prev, errorMessage];
        }
        const newMessages = [...prev];
        newMessages.splice(typingIndex, 1, errorMessage);
        return newMessages;
      });
      
      try {
        await saveMessageOnly(errorMessage, conversationId);
      } catch (saveError) {
        console.error('Failed to save error message:', saveError);
      }
      
      setIsLoading(false);
    }
    
    setTimeout(() => {
      lastProcessedMessageRef.current = null;
    }, 1000);
  }, [onError, chatConfig, user?.id, i18n]);

  return {
    isLoading,
    processMessage
  };
};
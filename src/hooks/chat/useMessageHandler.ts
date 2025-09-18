import { ChatMessage, CustomChatConfig, MessageRole } from '../../types';
import { useCallback, useRef, useState } from 'react';
import { useAuth } from '../useAuth';
import { useTranslation } from 'react-i18next';
import { processWithVertexAI } from '../../services/vertexAIService';
import { useMetrics } from '../../services/metricsService';

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
  const { recordUserMessage, recordAssistantResponse } = useMetrics();

  const processMessage = useCallback(async (
    geminiChatSession: any,
    inputText: string,
    userMessage: ChatMessage,
    addMessage: (message: ChatMessage, targetConversationId?: string) => void,
    saveMessageOnly: (message: ChatMessage, conversationId: string) => Promise<void>,
    setMessages: (updater: any) => void,
    isReady: boolean,
    conversationId: string,
    currentMessages: ChatMessage[]
  ) => {
    const query = inputText;
    const cityContext = {
      name: citySlug === 'la-vila-joiosa' ? 'La Vila Joiosa' : citySlug,
      slug: citySlug
    };
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
      // First, add the user message to the UI and save it
      console.log('📝 Adding user message to UI:', userMessage.id);
      addMessage(userMessage, conversationId);
      
      // Record user message metrics
      if (citySlug) {
        recordUserMessage(citySlug, user?.id, inputText);
      }
      
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

      // 🔍 Logs de identificación del sistema de respuesta
      console.log('🔍 ===== SISTEMA DE RESPUESTA IDENTIFICADO =====');
      console.log('📊 RAG used:', vertexResponse.ragUsed);
      console.log('📈 RAG results count:', vertexResponse.ragResultsCount);
      console.log('🔍 RAG search type:', vertexResponse.ragSearchType);
      console.log('🔄 Dynamic RAG:', vertexResponse.isDynamicRAG);
      console.log('🔍 Search performed:', vertexResponse.searchPerformed);
      console.log('🤖 Model used:', vertexResponse.modelUsed);
      console.log('📋 Complexity:', vertexResponse.complexity);
      
      // Identificar el sistema específico
      if (vertexResponse.ragUsed) {
        if (vertexResponse.isDynamicRAG) {
          console.log('✅ RESPUESTA: RAG Dinámico (Respuestas previas)');
          console.log(`   - Resultados encontrados: ${vertexResponse.ragResultsCount || 'N/A'}`);
          console.log(`   - Tipo de búsqueda: ${vertexResponse.ragSearchType || 'N/A'}`);
        } else {
          console.log('✅ RESPUESTA: RAG Estático (Base de datos local)');
          console.log(`   - Resultados encontrados: ${vertexResponse.ragResultsCount || 'N/A'}`);
          console.log(`   - Tipo de búsqueda: ${vertexResponse.ragSearchType || 'N/A'}`);
        }
      } else if (vertexResponse.searchPerformed) {
        if (vertexResponse.modelUsed === 'gemini-2.5-pro') {
          console.log('✅ RESPUESTA: Gemini 2.5 Pro + Google Search Grounding');
        } else {
          console.log('✅ RESPUESTA: Gemini 2.5 Flash + Google Search Grounding');
        }
      } else {
        console.log('✅ RESPUESTA: Gemini 2.5 Flash (Sin búsqueda)');
      }
      console.log('🔍 ================================================');

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
          multimodal: vertexResponse.multimodal,
          ragUsed: vertexResponse.ragUsed,
          ragResultsCount: vertexResponse.ragResultsCount,
          ragSearchType: vertexResponse.ragSearchType
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
      
      // Record assistant response metrics
      if (citySlug) {
        recordAssistantResponse(
          citySlug, 
          user?.id, 
          vertexResponse.response
          // tokensUsed will be calculated by the metrics service if available
        );
      }
      
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
    } finally {
      // Always clear the typing indicator and reset the processed message ref
      setMessages((prev: ChatMessage[]) => prev.filter(msg => msg.id !== typingMessage.id));
      lastProcessedMessageRef.current = null;
    }
  }, [onError, chatConfig, user?.id, i18n]);

  return {
    isLoading,
    processMessage
  };
};
import { ChatMessage, CustomChatConfig, MessageRole } from '../../types';
import { useCallback, useRef, useState } from 'react';
import { useAuth } from '../useAuth';
import { useTranslation } from 'react-i18next';
import { processWithVertexAI } from '../../services/vertexAIService';
import { useMetrics } from '../../services/metricsService';
import { useMessageParser } from '../useMessageParser';

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
  const { parseAIResponse } = useMessageParser();

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
    console.log('🚀 Processing message with useMessageHandler:', {
      citySlug,
      citySlugType: typeof citySlug,
      citySlugValue: citySlug,
      citySlugStringified: JSON.stringify(citySlug),
      cityContext
    });
    
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

      // Crear cityContext como objeto (como estaba en el commit "seguridad")
      const cityContext = {
        name: citySlug === 'la-vila-joiosa' ? 'La Vila Joiosa' : citySlug,
        slug: citySlug
      };

      const vertexResponse = await processWithVertexAI(
        query,
        cityContext, // Pasar cityContext como objeto
        historyForAI,
        undefined, // mediaUrl
        undefined, // mediaType
        chatConfig // Nueva: pasar configuración completa de la ciudad
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
          console.log(`   - Resultados encontrados: ${vertexResponse.ragResultsCount}`);
          console.log(`   - Tipo de búsqueda: ${vertexResponse.ragSearchType}`);
        } else {
          console.log('✅ RESPUESTA: RAG Estático (Base de datos local)');
          console.log(`   - Resultados encontrados: ${vertexResponse.ragResultsCount}`);
          console.log(`   - Tipo de búsqueda: ${vertexResponse.ragSearchType}`);
        }
      } else if (vertexResponse.searchPerformed) {
        console.log('✅ RESPUESTA: Gemini 2.5 Flash + Google Search Grounding');
      } else {
        console.log('✅ RESPUESTA: Gemini 2.5 Flash (Sin búsqueda)');
      }
      console.log('🔍 ================================================');

                      // 🎯 USAR DIRECTAMENTE LOS EVENTOS DE LA RESPUESTA (como en commit "Seguridad")
                      console.log('🔍 DEBUG - Datos de la respuesta:', {
                        responseText: typeof vertexResponse.response === 'string' ? vertexResponse.response?.substring(0, 200) : 'No es string',
                        responseTextType: typeof vertexResponse.response,
                        eventsFromResponse: vertexResponse.events,
                        eventsType: typeof vertexResponse.events,
                        eventsIsArray: Array.isArray(vertexResponse.events),
                        eventsCount: vertexResponse.events?.length || 0,
                        placesFromResponse: vertexResponse.places,
                        placesType: typeof vertexResponse.places,
                        placesIsArray: Array.isArray(vertexResponse.places),
                        placesCount: vertexResponse.places?.length || 0,
                        fullVertexResponse: vertexResponse
                      });

                      // Procesar la respuesta para extraer formularios y otros elementos
                      const parsedResponse = parseAIResponse(
                        vertexResponse.response,
                        null, // finalResponse no se usa aquí
                        chatConfig,
                        inputText
                      );

                      const aiMessage: ChatMessage = {
                        id: crypto.randomUUID(),
                        role: MessageRole.Model,
                        content: parsedResponse.processedContent,
                        timestamp: new Date(),
                        shouldAnimate: true,
                        events: vertexResponse.events || [],
                        placeCards: vertexResponse.places?.map(place => ({
                          id: place.place_id || crypto.randomUUID(),
                          placeId: place.place_id,
                          name: place.name,
                          address: place.formatted_address,
                          rating: place.rating,
                          userRatingsTotal: place.user_ratings_total,
                          distance: undefined, // Will be calculated if needed
                          photoUrl: place.photoUrl,
                          photoAttributions: place.photoAttributions || [],
                          website: place.website,
                          description: place.description,
                          priceLevel: place.price_level,
                          types: place.types,
                          openingHours: place.opening_hours?.weekday_text || place.opening_hours,
                          phoneNumber: place.international_phone_number || place.phone_number,
                          businessStatus: place.business_status,
                          isLoadingDetails: false,
                          errorDetails: undefined,
                          searchQuery: query
                        })) || [],
                        formButtonsForMessage: parsedResponse.formButtonsForMessage || [],
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
      // Only clear the processed message ref, don't touch typing indicators here
      // as they are handled in the try/catch blocks
      lastProcessedMessageRef.current = null;
    }
  }, [onError, chatConfig, user?.id, i18n]);

  return {
    isLoading,
    processMessage
  };
};
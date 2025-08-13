import { ChatMessage, CustomChatConfig, MessageRole } from '../../types';
import { useCallback, useRef, useState, SetStateAction } from 'react';
import { useMessageParser } from '../useMessageParser';
import { fetchChatIA } from '../../services/chatIA';
import { useAuth } from '../useAuth';
import { useGeolocation } from '../useGeolocation';
import { shouldSwitchLanguage } from '../../utils/languageDetection';
import { useTranslation } from 'react-i18next';

// Utility function to generate city slug from assistant name
const generateCitySlug = (assistantName: string): string => {
  return assistantName
    .toLowerCase()
    .normalize('NFD') // Decompose unicode
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
};

const detectLoadingType = (userMessage: string): ChatMessage['loadingType'] => {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes('evento') || msg.includes('actividad') || msg.includes('festival') || msg.includes('concierto') || msg.includes('espectáculo')) {
    return 'events';
  }
  if (msg.includes('restaurante') || msg.includes('comer') || msg.includes('comida') || msg.includes('cenar') || msg.includes('almorzar')) {
    return 'restaurants';
  }
  if (msg.includes('lugar') || msg.includes('sitio') || msg.includes('donde') || msg.includes('museo') || msg.includes('parque') || msg.includes('visitar')) {
    return 'places';
  }
  if (msg.includes('trámite') || msg.includes('documento') || msg.includes('papele') || msg.includes('gestión') || msg.includes('solicitud')) {
    return 'procedures';
  }
  if (msg.includes('información') || msg.includes('saber') || msg.includes('conocer') || msg.includes('explica') || msg.includes('qué es')) {
    return 'information';
  }
  
  return 'general';
};

export const useMessageHandler = (
  chatConfig: CustomChatConfig,
  onError: (error: string) => void,
  onGeminiReadyChange: (ready: boolean) => void,
  citySlug?: string
) => {
  const [isLoading, setIsLoading] = useState(false);
  const { parseAIResponse } = useMessageParser();
  const { user } = useAuth();
  const { userLocation } = useGeolocation();
  const { i18n } = useTranslation();
  const lastProcessedMessageRef = useRef<string | null>(null);
  const firstMessageProcessed = useRef<boolean>(false);

  const processMessage = useCallback(async (
    _unusedChatSession: null, // ya no se usa
    inputText: string,
    userMessage: ChatMessage,
    addMessage: (message: ChatMessage, targetConversationId?: string) => Promise<void>,
    saveMessageOnly: (message: ChatMessage, targetConversationId?: string) => Promise<void>,
    setMessages: (messages: any) => void,
    _isGeminiReady: boolean,
    targetConversationId: string,
    currentMessages: ChatMessage[] // ✅ NUEVO: historial de mensajes actual
  ) => {
    if (lastProcessedMessageRef.current === userMessage.id) {
      return;
    }
    lastProcessedMessageRef.current = userMessage.id;
    setIsLoading(true);
    
    // 1. Detect language changes in user messages
    try {
      // Detect language on every message, but be more conservative after the first one
      const isFirstMessage = !firstMessageProcessed.current;
      const detectedLanguage = shouldSwitchLanguage(inputText, i18n.language, isFirstMessage);
      
      if (detectedLanguage && detectedLanguage !== i18n.language) {
        console.log('🔤 Language change detected:', detectedLanguage, 'Current:', i18n.language, 'Is first message:', isFirstMessage);
        // Switch i18n language
        i18n.changeLanguage(detectedLanguage);
        localStorage.setItem('i18nextLng', detectedLanguage);
      }
      
      if (!firstMessageProcessed.current) {
        firstMessageProcessed.current = true;
      }
    } catch (error) {
      console.error('Error detecting language:', error);
    }
    
    // 2. Añadir el mensaje del usuario
    await addMessage(userMessage, targetConversationId);
    
    // 3. Añadir el spinner justo después del mensaje del usuario
    const typingMessageId = `typing-${userMessage.id}`;
    const loadingType = detectLoadingType(inputText);
    const typingMessage: ChatMessage = {
      id: typingMessageId,
      role: MessageRole.Model,
      content: '',
      timestamp: new Date(),
      isTyping: true,
      loadingType
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
      
      // Usar city slug pasado como parámetro o generar desde assistant name como fallback
      const finalCitySlug = citySlug || generateCitySlug(chatConfig.assistantName);
      
      console.log('🔍 DEBUG - Enviando city slug a chat-ia:', {
        citySlug: finalCitySlug,
        citySlugFromParam: citySlug,
        assistantName: chatConfig.assistantName,
        restrictedCity: chatConfig.restrictedCity,
        restrictedCityName: chatConfig.restrictedCity?.name
      });
      
      // Preparar el historial de la conversación para la IA
      console.log('🔍 DEBUG - Mensajes disponibles para historial:', {
        totalMessages: currentMessages.length,
        messages: currentMessages.map(m => ({ id: m.id, role: m.role, content: m.content?.substring(0, 50) }))
      });

      const conversationHistory = currentMessages
        .filter(msg => 
          !msg.isTyping && 
          !msg.error && 
          msg.content && 
          msg.content.trim().length > 0
        )
        .map(msg => ({
          role: msg.role === MessageRole.User ? 'user' as const : 'assistant' as const,
          content: msg.content.trim()
        }))
        .slice(-10); // Enviar los últimos 10 mensajes para mantener contexto

      console.log('🔍 DEBUG - Enviando historial de conversación:', {
        historyLength: conversationHistory.length,
        history: conversationHistory,
        filteredMessages: conversationHistory.map(m => ({ role: m.role, content: m.content.substring(0, 100) }))
      });

      // Crear un mensaje contextualizado que incluya información relevante del historial
      let contextualizedMessage = inputText;
      
      // Si hay historial, agregar contexto relevante de manera más inteligente
      if (conversationHistory.length > 0) {
        // Obtener los últimos mensajes relevantes (excluyendo el actual)
        const relevantHistory = conversationHistory
          .filter(msg => msg.role === 'user' && msg.content !== inputText)
          .slice(-3); // Últimos 3 mensajes del usuario
        
        if (relevantHistory.length > 0) {
          // Crear un contexto más natural y legible
          const contextSummary = relevantHistory
            .map((msg, index) => {
              const prefix = index === relevantHistory.length - 1 ? 'y' : index === 0 ? 'Primero' : 'Después';
              return `${prefix} preguntaste sobre: ${msg.content}`;
            })
            .join('. ');
          
          contextualizedMessage = `Contexto de nuestra conversación: ${contextSummary}.\n\nAhora me preguntas: ${inputText}`;
        }
      }

      // Elegir modo de respuesta: rápido para preguntas simples, calidad para búsquedas complejas
      const mode: 'fast' | 'quality' = loadingType === 'general' ? 'fast' : 'quality';
      const historyWindow = mode === 'fast' ? 4 : 10;
      const responseText = await fetchChatIA(contextualizedMessage, { 
        allowMapDisplay: chatConfig.allowMapDisplay,
        userId: user?.id,
        userLocation: userLocationData,
        citySlug: finalCitySlug, // Enviar solo el slug en lugar de la configuración completa
        conversationHistory: conversationHistory.slice(-historyWindow),
        mode,
        timeoutMs: mode === 'fast' ? 12000 : 45000
      });
      
      console.log('🔍 DEBUG - Respuesta de fetchChatIA:', {
        responseText: responseText,
        responseTextType: typeof responseText,
        responseTextLength: responseText?.length,
        isEmpty: !responseText || responseText.trim() === '',
        containsPlaceCardMarkers: responseText?.includes('[PLACE_CARD_START]') || false,
        containsEventCardMarkers: responseText?.includes('[EVENT_CARD_START]') || false
      });
      
      // Log adicional para ver si hay marcadores de place cards
      if (responseText && responseText.includes('[PLACE_CARD_START]')) {
        console.log('🔍 DEBUG - Found PLACE_CARD_START markers in response');
        const placeCardMatches = responseText.match(/\[PLACE_CARD_START\]([\s\S]*?)\[PLACE_CARD_END\]/g);
        console.log('🔍 DEBUG - Place card matches found:', placeCardMatches);
      }
      
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.Model,
        content: responseText,
        timestamp: new Date(),
        shouldAnimate: true
      };
      // Parsea la respuesta como antes
      const parsed = parseAIResponse(responseText, null, chatConfig, inputText);
      
      console.log('🔍 DEBUG - Parsed response:', {
        processedContent: parsed.processedContent?.substring(0, 200),
        eventsCount: parsed.eventsForThisMessage?.length || 0,
        events: parsed.eventsForThisMessage,
        placeCardsCount: parsed.placeCardsForMessage?.length || 0,
        placeCards: parsed.placeCardsForMessage
      });
      
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
      
      // 5. QUITAR EL LOADING inmediatamente después de reemplazar el spinner
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error en fetchChatIA:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.Model,
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Error de conexión'
      };
      
      // Reemplazar el spinner con el mensaje de error
      setMessages((prev: ChatMessage[]) => {
        const typingIndex = prev.findIndex(msg => msg.id === typingMessageId);
        if (typingIndex === -1) {
          console.log('Spinner not found for error, adding error message at the end');
          return [...prev, errorMessage];
        }
        const newMessages = [...prev];
        newMessages.splice(typingIndex, 1, errorMessage);
        console.log('Replaced spinner with error message at index:', typingIndex);
        return newMessages;
      });
      
      // Intentar guardar el mensaje de error, pero no fallar si no se puede
      try {
        await saveMessageOnly(errorMessage, targetConversationId);
      } catch (saveError) {
        console.error('Failed to save error message:', saveError);
      }
      
      // No llamar onError aquí para evitar mensajes duplicados
      
      // QUITAR EL LOADING inmediatamente después de reemplazar el spinner con error
      setIsLoading(false);
    }
    
    // Mantener la referencia hasta el final para evitar reprocesamiento
    setTimeout(() => {
      lastProcessedMessageRef.current = null;
    }, 1000);
  }, [parseAIResponse, onError, chatConfig, user?.id, userLocation, i18n]);

  return {
    isLoading,
    processMessage
  };
};

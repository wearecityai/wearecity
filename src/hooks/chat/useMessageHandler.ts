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
    targetConversationId: string
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
      
      const responseText = await fetchChatIA(inputText, { 
        allowMapDisplay: chatConfig.allowMapDisplay,
        userId: user?.id,
        userLocation: userLocationData,
        citySlug: finalCitySlug // Enviar solo el slug en lugar de la configuración completa
      });
      
      console.log('🔍 DEBUG - Respuesta de fetchChatIA:', {
        responseText: responseText,
        responseTextType: typeof responseText,
        responseTextLength: responseText?.length,
        isEmpty: !responseText || responseText.trim() === ''
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
    } finally {
      setIsLoading(false);
      // Mantener la referencia hasta el final para evitar reprocesamiento
      setTimeout(() => {
        lastProcessedMessageRef.current = null;
      }, 1000);
    }
  }, [parseAIResponse, onError, chatConfig, user?.id, userLocation, i18n]);

  return {
    isLoading,
    processMessage
  };
};

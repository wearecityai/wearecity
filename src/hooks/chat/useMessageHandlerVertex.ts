import { ChatMessage, CustomChatConfig, MessageRole } from '../../types';
import { useCallback, useRef, useState, SetStateAction } from 'react';
import { useMessageParser } from '../useMessageParser';
import { fetchChatIAVertex } from '../../services/chatIAVertex';
import { useAuth } from '../useAuth';
import { useGeolocation } from '../useGeolocation';
import { shouldSwitchLanguage } from '../../utils/languageDetection';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../integrations/supabase/client';

// Función simple para generar city slug
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

/**
 * Hook para manejar mensajes usando Vertex AI con instrucciones dinámicas
 */
export const useMessageHandlerVertex = (
  chatConfig: CustomChatConfig,
  onError: (error: string) => void,
  onVertexAIReadyChange: (ready: boolean) => void,
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
    _unusedChatSession: null,
    inputText: string,
    userMessage: ChatMessage,
    addMessage: (message: ChatMessage, targetConversationId?: string) => Promise<void>,
    saveMessageOnly: (message: ChatMessage, targetConversationId?: string) => Promise<void>,
    setMessages: (messages: any) => void,
    _isVertexAIReady: boolean,
    targetConversationId: string,
    currentMessages: ChatMessage[]
  ) => {
    if (lastProcessedMessageRef.current === userMessage.id) {
      return;
    }
    lastProcessedMessageRef.current = userMessage.id;
    setIsLoading(true);
    
    // 1. Detect language changes in user messages
    try {
      const isFirstMessage = !firstMessageProcessed.current;
      const detectedLanguage = shouldSwitchLanguage(inputText, i18n.language, isFirstMessage);
      
      if (detectedLanguage && detectedLanguage !== i18n.language) {
        console.log('🔤 Language change detected:', detectedLanguage, 'Current:', i18n.language, 'Is first message:', isFirstMessage);
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
      
      // Obtener cityId a partir del citySlug
      let finalCityId: string | undefined;
      if (finalCitySlug) {
        try {
          const { data: cityData, error: cityError } = await supabase
            .from('cities')
            .select('id')
            .eq('slug', finalCitySlug)
            .eq('is_active', true)
            .single();
          
          if (cityError) {
            console.warn('⚠️ No se pudo obtener cityId para:', finalCitySlug, cityError.message);
          } else if (cityData) {
            finalCityId = cityData.id;
            console.log('✅ CityId obtenido:', finalCityId, 'para slug:', finalCitySlug);
          }
        } catch (error) {
          console.warn('⚠️ Error obteniendo cityId:', error);
        }
      }
      
      console.log('🔍 DEBUG - Enviando city slug y cityId a Vertex AI:', {
        citySlug: finalCitySlug,
        cityId: finalCityId,
        citySlugFromParam: citySlug,
        assistantName: chatConfig.assistantName,
        restrictedCity: chatConfig.restrictedCity,
        restrictedCityName: chatConfig.restrictedCity?.name
      });
      
      // Preparar el historial de la conversación para Vertex AI
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

      console.log('🔍 DEBUG - Enviando historial de conversación a Vertex AI:', {
        historyLength: conversationHistory.length,
        history: conversationHistory,
        filteredMessages: conversationHistory.map(m => ({ role: m.role, content: m.content.substring(0, 100) }))
      });

      // Crear contexto de usuario inteligente
      const userContext = {
        isTourist: detectUserType(inputText, conversationHistory),
        language: i18n.language,
        accessibility: false, // TODO: Implementar detección de accesibilidad
        urgency: detectUrgency(inputText)
      };

      // Elegir modo de respuesta: rápido para preguntas simples, calidad para búsquedas complejas
      const mode: 'fast' | 'quality' = loadingType === 'general' ? 'fast' : 'quality';
      
      const response = await fetchChatIAVertex(inputText, { 
        allowMapDisplay: chatConfig.allowMapDisplay,
        userId: user?.id,
        userLocation: userLocationData,
        citySlug: finalCitySlug,
        cityId: finalCityId,
        conversationHistory: conversationHistory.slice(-10),
        mode,
        userContext
      });
      
      console.log('🔍 DEBUG - Respuesta completa de Vertex AI:', response);
      
      // Usar parseAIResponse para extraer EVENT CARDS y PLACE CARDS del texto
      const responseText = response.response || response;
      
      // Parsear la respuesta usando el parser existente
      const parsedResponse = parseAIResponse(responseText, response, chatConfig, inputText);
      
      console.log('🔍 DEBUG - Datos extraídos de Vertex AI:', {
        responseText: typeof responseText === 'string' ? responseText?.substring(0, 200) : 'No es string',
        responseTextType: typeof responseText,
        eventsCount: parsedResponse.eventsForThisMessage?.length || 0,
        events: parsedResponse.eventsForThisMessage,
        placeCardsCount: parsedResponse.placeCardsForMessage?.length || 0,
        placeCards: parsedResponse.placeCardsForMessage
      });
      
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.Model,
        content: responseText,
        timestamp: new Date(),
        shouldAnimate: true
      };
      
      const parsedMessage: ChatMessage = {
        ...aiMessage,
        content: parsedResponse.processedContent || responseText,
        events: parsedResponse.eventsForThisMessage || [],
        placeCards: parsedResponse.placeCardsForMessage || [],
        mapQuery: parsedResponse.mapQueryFromAI,
        downloadablePdfInfo: parsedResponse.downloadablePdfInfoForMessage,
        telematicProcedureLink: parsedResponse.telematicLinkForMessage,
        showSeeMoreButton: parsedResponse.showSeeMoreButtonForThisMessage || false,
        originalUserQueryForEvents: parsedResponse.storedUserQueryForEvents,
        groundingMetadata: parsedResponse.finalGroundingMetadata,
      };
      
      // Debug adicional - Verificar estructura del mensaje
      console.log('🚨 DEBUG - parsedMessage completo de Vertex AI:', parsedMessage);
      console.log('🚨 DEBUG - parsedMessage.events:', parsedMessage.events);
      console.log('🚨 DEBUG - parsedMessage.placeCards:', parsedMessage.placeCards);
      
      // 3. Reemplazar el spinner con la respuesta real
      setMessages((prev: ChatMessage[]) => {
        console.log('Replacing spinner with Vertex AI response. Current messages:', prev.map(m => ({ id: m.id, role: m.role, isTyping: m.isTyping })));
        const typingIndex = prev.findIndex(msg => msg.id === typingMessageId);
        console.log('Spinner index:', typingIndex, 'for spinner ID:', typingMessageId);
        
        if (typingIndex === -1) {
          console.log('Spinner not found, adding Vertex AI response at the end');
          return [...prev, parsedMessage];
        }
        // Reemplazar el spinner con la respuesta real
        const newMessages = [...prev];
        newMessages.splice(typingIndex, 1, parsedMessage);
        console.log('Replaced spinner with Vertex AI response at index:', typingIndex);
        return newMessages;
      });
      
      // 4. Guardar la respuesta en la base de datos
      await saveMessageOnly(parsedMessage, targetConversationId);
      
      // 5. QUITAR EL LOADING inmediatamente después de reemplazar el spinner
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error en Vertex AI:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.Model,
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje con Vertex AI. Por favor, intenta de nuevo.',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Error de conexión con Vertex AI'
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

/**
 * Detectar el tipo de usuario
 */
function detectUserType(userMessage: string, conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>): boolean {
  const lowerMessage = userMessage.toLowerCase();
  const fullContext = conversationHistory?.map(msg => msg.content).join(' ').toLowerCase() || '';
  
  const touristKeywords = [
    'turista', 'visitar', 'viaje', 'hotel', 'alojamiento',
    'que ver', 'lugares turisticos', 'monumentos', 'museos',
    'primera vez', 'no conozco', 'recomendaciones turisticas'
  ];

  const allText = `${lowerMessage} ${fullContext}`;
  
  return touristKeywords.some(keyword => allText.includes(keyword));
}

/**
 * Detectar urgencia de la consulta
 */
function detectUrgency(userMessage: string): 'low' | 'medium' | 'high' | 'emergency' {
  const lowerMessage = userMessage.toLowerCase();
  
  const emergencyKeywords = [
    'urgencia', 'emergencia', 'urgente', 'inmediato',
    'accidente', 'incendio', 'robo', 'asalto',
    'ambulancia', 'policia', 'bomberos'
  ];

  const highUrgencyKeywords = [
    'rapido', 'pronto', 'hoy', 'mañana',
    'problema', 'incidencia', 'averia'
  ];

  if (emergencyKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'emergency';
  }
  
  if (highUrgencyKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'high';
  }

  return 'low';
}

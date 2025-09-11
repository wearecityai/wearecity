import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Bot, Download, ExternalLink, Plus, ThumbsUp, ThumbsDown, Copy, MoreHorizontal, Building2, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { ChatMessage as ChatMessageType, MessageRole, PlaceCardInfo } from '../types';
import EventCard from './EventCard';
import PlaceCard from './PlaceCard';
import { EnhancedAIResponseRenderer } from './EnhancedAIResponseRenderer';
import { useTypewriter } from '../hooks/useTypewriter';
import { useStrictSequentialReveal } from '../hooks/useStrictSequentialReveal';
import { usePlaceCardRetry } from '../hooks/usePlaceCardRetry';
import { usePlaceCardFilter } from '../hooks/usePlaceCardFilter';
import { useLoadingPattern } from '../hooks/useLoadingPattern';
import { toast } from '@/components/ui/sonner';
// AI Elements removed

interface ChatMessageProps {
  message: ChatMessageType;
  onDownloadPdf?: (pdfInfo: NonNullable<ChatMessageType['downloadablePdfInfo']>) => void;
  configuredSedeElectronicaUrl?: string;
  onSeeMoreEvents?: (originalUserQuery: string) => void;
  setMessages?: React.Dispatch<React.SetStateAction<ChatMessageType[]>>;
  userQuery?: string; // Consulta del usuario para detectar patrones de carga
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onDownloadPdf, configuredSedeElectronicaUrl, onSeeMoreEvents, setMessages, userQuery }) => {
  const { t } = useTranslation();
  const { retryPlaceCard } = usePlaceCardRetry();
  const { filterPlaceCards, isFiltering } = usePlaceCardFilter();
  const { detectLoadingPattern } = useLoadingPattern();
  const isUser = message.role === MessageRole.User;
  const timestamp = new Date(message.timestamp);
  
  // Función para copiar el contenido del mensaje
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content || '');
      toast.success("Mensaje copiado al portapapeles");
    } catch (err) {
      console.error('Error al copiar el mensaje:', err);
      toast.error("No se pudo copiar el mensaje");
    }
  };
  
  // Estado para PlaceCard filtradas
  const [filteredPlaceCards, setFilteredPlaceCards] = useState<PlaceCardInfo[]>([]);
  
  // Filtrar PlaceCard cuando cambien o cuando se monte el componente
  useEffect(() => {
    if (message.placeCards && message.placeCards.length > 0) {
      console.log('🔍 Filtering place cards before rendering...');
      
      // Por ahora, permitir todas las PlaceCard para evitar bloqueos
      // El filtrado real se hará en el backend y en la validación de Google Places
      console.log('⚠️ Temporarily allowing all place cards to avoid blocking');
      setFilteredPlaceCards(message.placeCards);
      
      // TODO: Implementar filtrado real cuando tengamos acceso al chatConfig
      // const restrictedCityName = getRestrictedCityFromContext();
      // filterPlaceCards(message.placeCards, restrictedCityName).then(filtered => {
      //   console.log(`✅ Place cards filtered: ${filtered.length}/${message.placeCards!.length} valid`);
      //   setFilteredPlaceCards(filtered);
      // });
    } else {
      setFilteredPlaceCards([]);
    }
  }, [message.placeCards]);

  // Use typewriter effect only when explicitly requested (e.g., first-time generation)
  const shouldUseTypewriter = !!(message.shouldAnimate && !isUser && !message.isTyping && !message.error && message.content);
  
  // IMPORTANTE: Limpiar el contenido ANTES del typewriter para evitar mostrar JSON
  const cleanContent = (content: string): string => {
    if (!content || typeof content !== 'string') return content;
    
    // Si hay eventos o place cards, eliminar todo el JSON y marcadores
    if (message.events && message.events.length > 0 || message.placeCards && message.placeCards.length > 0) {
      return content
        .replace(/\[EVENT_CARD_START\][\s\S]*?\[EVENT_CARD_END\]/g, '')
        .replace(/\[PLACE_CARD_START\][\s\S]*?\[PLACE_CARD_END\]/g, '')
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/```/g, '')
        .replace(/^`?json\s*$/i, '')
        .replace(/\{[^}]*"events"[^}]*\}/g, '') // Eliminar objetos JSON con eventos
        .replace(/\{[^}]*"places"[^}]*\}/g, '') // Eliminar objetos JSON con lugares
        .replace(/\{[^}]*"placeCards"[^}]*\}/g, '') // Eliminar objetos JSON con placeCards
        .replace(/\{[^}]*"eventCards"[^}]*\}/g, '') // Eliminar objetos JSON con eventCards
        .trim();
    } else {
      // Si no hay tarjetas, solo limpiar formato JSON básico
      return content
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/```/g, '')
        .replace(/^`?json\s*$/i, '');
    }
  };

  // Limpiar el contenido original antes de pasarlo al typewriter
  const cleanedContent = cleanContent(message.content || '');

  // Debug: Log typewriter decision
  console.log('🔍 Typewriter debug:', {
    messageId: message.id,
    shouldAnimate: message.shouldAnimate,
    isUser,
    isTyping: message.isTyping,
    error: message.error,
    hasContent: !!message.content,
    shouldUseTypewriter
  });
  
  // Only call useTypewriter if we should animate, otherwise use empty string to avoid any side effects
  const { displayText, isTyping: typewriterIsTyping, skipToEnd } = useTypewriter(
    shouldUseTypewriter ? cleanedContent : '',
    { 
      speed: 8, 
      startDelay: 0, 
      messageId: message.id, 
      replayOnMount: false 
    }
  );
  
  // Use typewriter text if active, otherwise use cleaned content
  let contentToDisplay = shouldUseTypewriter ? displayText : cleanedContent;

  // Fallback: while typewriter has not started and there is no text yet, show the loading row
  const showPendingTypewriter = shouldUseTypewriter && !typewriterIsTyping && (!contentToDisplay || contentToDisplay.trim() === '');

  // Strict sequential reveal for cards - only after text is complete
  const totalCards = (message.events?.length || 0) + (message.placeCards?.length || 0);
  
  console.log('🔍 DEBUG - ChatMessage render:', {
    messageId: message.id,
    hasEvents: !!message.events?.length,
    eventsCount: message.events?.length || 0,
    hasPlaceCards: !!message.placeCards?.length,
    placeCardsCount: message.placeCards?.length || 0,
    totalCards,
    contentToDisplay: contentToDisplay?.substring(0, 100),
    messageContent: message.content?.substring(0, 100)
  });
  
  // 🚨 DEBUG ADICIONAL - Verificar estructura completa del mensaje
  console.log('🚨 DEBUG - ChatMessage message completo:', message);
  console.log('🚨 DEBUG - ChatMessage message.events:', message.events);
  console.log('🚨 DEBUG - ChatMessage message.placeCards:', message.placeCards);
  
  // 🔍 Logs de identificación del sistema de respuesta
  if (message.metadata) {
    console.log('🔍 ===== SISTEMA DE RESPUESTA IDENTIFICADO (FRONTEND) =====');
    console.log('📊 RAG used:', message.metadata.ragUsed);
    console.log('📈 RAG results count:', message.metadata.ragResultsCount);
    console.log('🔍 RAG search type:', message.metadata.ragSearchType);
    console.log('🔍 Search performed:', message.metadata.searchPerformed);
    console.log('🤖 Model used:', message.metadata.modelUsed);
    console.log('📋 Complexity:', message.metadata.complexity);
    
    // Identificar el sistema específico
    if (message.metadata.ragUsed) {
      if (message.metadata.isDynamicRAG) {
        console.log('✅ RESPUESTA: RAG Dinámico (Respuestas previas)');
        console.log(`   - Resultados encontrados: ${message.metadata.ragResultsCount}`);
        console.log(`   - Tipo de búsqueda: ${message.metadata.ragSearchType}`);
      } else {
        console.log('✅ RESPUESTA: RAG Estático (Base de datos local)');
        console.log(`   - Resultados encontrados: ${message.metadata.ragResultsCount}`);
        console.log(`   - Tipo de búsqueda: ${message.metadata.ragSearchType}`);
      }
    } else if (message.metadata.searchPerformed) {
      if (message.metadata.modelUsed === 'gemini-2.5-pro') {
        console.log('✅ RESPUESTA: Gemini 2.5 Pro + Google Search Grounding');
      } else {
        console.log('✅ RESPUESTA: Gemini 2.5 Flash-Lite + Google Search Grounding');
      }
    } else {
      console.log('✅ RESPUESTA: Gemini 2.5 Flash-Lite (Sin búsqueda)');
    }
    console.log('🔍 ========================================================');
  }
  
  const { shouldShowCard } = useStrictSequentialReveal({
    textContent: contentToDisplay, // Use the content that's actually being displayed
    totalCards,
    typewriterIsComplete: shouldUseTypewriter ? (!typewriterIsTyping && contentToDisplay === message.content) : true,
    cardDelay: 400,
    messageId: message.id
  });

  const processTextForParagraphs = (text: string): React.ReactNode => {
    // Split by double line breaks (paragraph breaks) but preserve single line breaks
    const paragraphs = text.split(/\n\s*\n/);
    
    return paragraphs.map((paragraph, index) => {
      if (paragraph.trim() === '') return null;
      
      return (
        <div key={index} className={index > 0 ? 'mt-3' : ''}>
          {linkifyAndMarkdown(paragraph.trim())}
        </div>
      );
    }).filter(Boolean);
  };

  const linkifyAndMarkdown = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\[.*?\]\(.*?\)|`.*?`|\*\*.*?\*\*|\*.*?\*|```[\s\S]*?```|~.*?~|https?:\/\/\S+)/g);
    return parts.map((part, index) => {
      if (part.match(/^\[(.*?)\]\((.*?)\)$/)) { // Markdown link
        const [, linkText, linkUrl] = part.match(/^\[(.*?)\]\((.*?)\)$/)!;
        return (
          <Button
            key={index}
            asChild
            variant="link"
            size="sm"
            className="text-inherit p-0 h-auto font-normal inline"
          >
            <a href={linkUrl} target="_blank" rel="noopener noreferrer">
              {linkText}
              <ExternalLink className="ml-1 h-3 w-3 inline" />
            </a>
          </Button>
        );
      }
      if (part.match(/^https?:\/\/\S+$/)) { // Plain URL
        const isPartOfSpecialLink = (message.telematicProcedureLink && part.includes(message.telematicProcedureLink)) ||
                                   (configuredSedeElectronicaUrl && part.includes(configuredSedeElectronicaUrl));
        if (isPartOfSpecialLink) return part; 
        return (
          <Button
            key={index}
            asChild
            variant="link"
            size="sm"
            className="text-inherit p-0 h-auto font-normal inline break-all overflow-wrap-anywhere"
          >
            <a href={part} target="_blank" rel="noopener noreferrer">
              {part}
              <ExternalLink className="ml-1 h-3 w-3 inline" />
            </a>
          </Button>
        );
      }
      if (part.match(/^\*\*(.*?)\*\*$/)) return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
      if (part.match(/^\*(.*?)\*$/)) return <em key={index}>{part.substring(1, part.length - 1)}</em>;
      if (part.match(/^`(.*?)`$/)) return <Badge key={index} variant="secondary" className="text-xs mx-1">{part.substring(1, part.length - 1)}</Badge>;
      if (part.match(/^```([\s\S]*?)```$/)) {
        return (
          <Card key={index} className="my-2 overflow-hidden">
            <CardContent className="p-3">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-all">
                <code className="break-all">{part.substring(3, part.length - 3)}</code>
              </pre>
            </CardContent>
          </Card>
        );
      }
      if (part.match(/^~.*?~$/)) return <s key={index}>{part.substring(1, part.length - 1)}</s>;
      return part; // No need to split by \n since whitespace-pre-line handles it
    });
  };

  const getLoadingMessage = (loadingType?: string, userQuery?: string): string => {
    // Si hay un loadingType específico, usarlo
    if (loadingType) {
      switch (loadingType) {
        case 'events':
          return t('loading.events', { defaultValue: 'Buscando eventos...' });
        case 'places':
          return t('loading.places', { defaultValue: 'Buscando sitios...' });
        case 'restaurants':
          return t('loading.restaurants', { defaultValue: 'Buscando restaurantes...' });
        case 'information':
          return t('loading.information', { defaultValue: 'Buscando información...' });
        case 'procedures':
          return t('loading.procedures', { defaultValue: 'Buscando procedimientos...' });
        case 'itinerary':
          return t('loading.itinerary', { defaultValue: 'Preparando itinerario...' });
        case 'schedule':
          return t('loading.schedule', { defaultValue: 'Buscando horarios...' });
        case 'transport':
          return t('loading.transport', { defaultValue: 'Buscando opciones de transporte...' });
        case 'accommodation':
          return t('loading.accommodation', { defaultValue: 'Buscando alojamiento...' });
        case 'shopping':
          return t('loading.shopping', { defaultValue: 'Buscando opciones de compras...' });
        case 'emergency':
          return t('loading.emergency', { defaultValue: 'Buscando servicios de emergencia...' });
        case 'weather':
          return t('loading.weather', { defaultValue: 'Consultando el clima...' });
        case 'history':
          return t('loading.history', { defaultValue: 'Buscando información histórica...' });
        case 'outdoor':
          return t('loading.outdoor', { defaultValue: 'Buscando actividades al aire libre...' });
        default:
          return t('loading.wait', { defaultValue: 'Cargando respuesta...' });
      }
    }
    
    // Si no hay loadingType específico, detectar patrón en la consulta del usuario
    return detectLoadingPattern(userQuery || '');
  };

  return (
    <div 
      className={`w-full ${isUser ? 'mb-8' : ''}`}
      data-message-role={message.role}
    >
             <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`} data-user-message-row={isUser ? 'true' : undefined} data-message-id={message.id}>
                 {isUser ? (
           // User message - right aligned with strict width constraints
           <div 
             className="max-w-[80%] sm:max-w-[70%] min-w-0 pl-4 sm:pl-6"
             style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
           >
            <Card className="bg-muted border-0 overflow-hidden">
              <CardContent className="px-3 sm:px-4 py-3 rounded-2xl rounded-br-sm">
                {(message.content && message.content.trim() !== "") && (
                  <div 
                    className="text-base leading-normal select-text"
                    style={{ 
                      wordWrap: 'break-word', 
                      overflowWrap: 'anywhere',
                      hyphens: 'auto',
                      maxWidth: '100%'
                    }}
                  >
                    {processTextForParagraphs(message.content)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
                 ) : (
           // Assistant message - using AI SDK Message component
           <div className="w-full min-w-0">
            <div>
                {message.isTyping ? (
                  <div className="flex items-center space-x-3 h-10">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                    <div className="text-muted-foreground text-sm animate-pulse">
                      {getLoadingMessage(message.loadingType, userQuery)}
                    </div>
                  </div>
                ) : message.error ? (
                  <Card className="border-destructive bg-destructive/10">
                    <CardContent className="p-3">
                      <p className="font-semibold text-destructive">{t('common.error')}:</p>
                      <p className="text-sm text-destructive">{message.error}</p>
                    </CardContent>
                  </Card>
                ) : showPendingTypewriter ? (
                  <div className="flex items-center space-x-3 h-10">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                    <div className="text-muted-foreground text-sm animate-pulse">
                      {getLoadingMessage(message.loadingType, userQuery)}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Contenedor principal con AI SDK Response */}
                    <div className="w-full min-w-0">
                      {(contentToDisplay && contentToDisplay.trim() !== "") && (
                        <div 
                          className="cursor-pointer min-w-0"
                          onClick={typewriterIsTyping ? skipToEnd : undefined}
                          style={{ maxWidth: '100%' }}
                        >
                          <EnhancedAIResponseRenderer content={contentToDisplay} />
                        </div>
                      )}
                      
                      {/* Indicador del sistema de respuesta */}
                      {message.metadata && (
                        <div className="mt-2 flex items-center justify-end">
                          <div className="text-xs text-muted-foreground flex items-center space-x-2">
                            {message.metadata.ragUsed ? (
                              <>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                  🗄️ RAG
                                </span>
                                <span className="text-xs">
                                  {message.metadata.ragResultsCount} resultados • {message.metadata.ragSearchType}
                                </span>
                              </>
                            ) : message.metadata.searchPerformed ? (
                              <>
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                  🔍 {message.metadata.modelUsed === 'gemini-2.5-pro' ? '2.5 Pro' : '2.5 Flash'} + Google
                                </span>
                              </>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                🤖 {message.metadata.modelUsed === 'gemini-2.5-pro' ? '2.5 Pro' : '2.5 Flash'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Event Cards y Place Cards */}
                      {((message.events && message.events.length > 0) || filteredPlaceCards.length > 0) && (
                        <div className="space-y-0">
                          {isFiltering && (
                            <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Validando ubicaciones de lugares...
                            </div>
                          )}
                          
                          {message.events && message.events.map((event, index) => (
                            <div key={`${message.id}-event-${index}`} className="mb-0">
                              <EventCard event={event} />
                              {index < message.events.length - 1 && (
                                <div className="border-t border-border/30 my-3"></div>
                              )}
                            </div>
                          ))}
                          
                          {filteredPlaceCards.map((place, index) => (
                            <div key={`${message.id}-place-${place.id}`} className="mb-0">
                              <PlaceCard 
                                place={place} 
                                onRetry={(placeId) => {
                                  if (setMessages) {
                                    const placeCard = message.placeCards?.find(card => card.id === placeId);
                                    if (placeCard) {
                                      retryPlaceCard(message.id, placeCard, setMessages);
                                    }
                                  }
                                }}
                              />
                              {index < filteredPlaceCards.length - 1 && (
                                <div className="border-t border-border/30 my-3"></div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                       
                       {/* Mostrar mensaje si se filtraron PlaceCard */}
                       {message.placeCards && message.placeCards.length > 0 && filteredPlaceCards.length === 0 && !isFiltering && (
                         <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                           <p className="text-sm text-yellow-800">
                             ⚠️ Los lugares sugeridos no están en la ciudad configurada y han sido filtrados por seguridad.
                           </p>
                         </div>
                       )}
                      {(!message.content || message.content.trim() === "") && (!message.events || message.events.length === 0) && (!message.placeCards || message.placeCards.length === 0) && (
                        <p className="text-muted-foreground text-sm">{t('common.error')}</p>
                      )}
                    </div>
                  </>
                )}
            </div>
            
            {!message.isTyping && !message.error && (
              <div className="flex items-center justify-start mt-2">
                {/* Botones de acción */}
                <div className="flex items-center -space-x-2 sm:space-x-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={handleCopyMessage}
                    title="Copiar mensaje"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


export default ChatMessage;
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { toast } from '@/components/ui/sonner';

interface ChatMessageProps {
  message: ChatMessageType;
  onDownloadPdf?: (pdfInfo: NonNullable<ChatMessageType['downloadablePdfInfo']>) => void;
  configuredSedeElectronicaUrl?: string;
  onSeeMoreEvents?: (originalUserQuery: string) => void;
  setMessages?: React.Dispatch<React.SetStateAction<ChatMessageType[]>>;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onDownloadPdf, configuredSedeElectronicaUrl, onSeeMoreEvents, setMessages }) => {
  const { t } = useTranslation();
  const { retryPlaceCard } = usePlaceCardRetry();
  const { filterPlaceCards, isFiltering } = usePlaceCardFilter();
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
    shouldUseTypewriter ? (message.content || '') : '',
    { 
      speed: 8, 
      startDelay: 0, 
      messageId: message.id, 
      replayOnMount: false 
    }
  );

  // Use typewriter text if active, otherwise use original content
  let contentToDisplay = shouldUseTypewriter ? displayText : message.content;
  
  // IMPORTANTE: Si hay eventos o place cards, NO mostrar las tarjetas en el texto
  // porque se renderizan como componentes separados
  if (message.events && message.events.length > 0 || message.placeCards && message.placeCards.length > 0) {
    // Si hay tarjetas, solo mostrar el texto introductorio (sin las tarjetas)
    if (contentToDisplay && typeof contentToDisplay === 'string') {
      // Eliminar marcadores de eventos y place cards del texto
      contentToDisplay = contentToDisplay
        .replace(/\[EVENT_CARD_START\][\s\S]*?\[EVENT_CARD_END\]/g, '')
        .replace(/\[PLACE_CARD_START\][\s\S]*?\[PLACE_CARD_END\]/g, '')
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/```/g, '')
        .replace(/^`?json\s*$/i, '')
        .trim();
    }
  } else {
    // Si no hay tarjetas, solo limpiar formato JSON
    if (contentToDisplay && typeof contentToDisplay === 'string') {
      contentToDisplay = contentToDisplay
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/```/g, '')
        .replace(/^`?json\s*$/i, '');
    }
  }

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
            className="text-inherit p-0 h-auto font-normal inline break-all"
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
          <Card key={index} className="my-2">
            <CardContent className="p-3">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                <code>{part.substring(3, part.length - 3)}</code>
              </pre>
            </CardContent>
          </Card>
        );
      }
      if (part.match(/^~.*?~$/)) return <s key={index}>{part.substring(1, part.length - 1)}</s>;
      return part; // No need to split by \n since whitespace-pre-line handles it
    });
  };

  const getLoadingMessage = (loadingType?: string): string => {
    switch (loadingType) {
      case 'events':
        return t('loading.events', { defaultValue: 'Searching events...' });
      case 'places':
        return t('loading.places', { defaultValue: 'Searching places...' });
      case 'restaurants':
        return t('loading.restaurants', { defaultValue: 'Searching restaurants...' });
      case 'information':
        return t('loading.information', { defaultValue: 'Searching information...' });
      case 'procedures':
        return t('loading.procedures', { defaultValue: 'Searching procedures...' });
      default:
        return t('loading.wait', { defaultValue: 'One moment...' });
    }
  };

  return (
    <div 
      className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      data-message-role={message.role}
    >
      {isUser ? (
        // User message - right aligned
        <div className="overflow-hidden">
          <Card className="bg-muted border-0">
            <CardContent className="px-3 sm:px-4 py-3 rounded-2xl rounded-br-sm">
              {(message.content && message.content.trim() !== "") && (
                <div className="text-base sm:text-base leading-normal break-words select-text">
                  {processTextForParagraphs(message.content)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Assistant message - left aligned
        <div className="flex items-start w-full overflow-hidden">
          <div className="flex-1 overflow-hidden max-w-full">
            <Card className="bg-transparent border-0 shadow-none">
              <CardContent className="p-0">
                {message.isTyping ? (
                  <div className="flex items-center space-x-3 h-10">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                    <div className="text-muted-foreground text-sm animate-pulse">
                      {getLoadingMessage(message.loadingType)}
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
                      {getLoadingMessage(message.loadingType)}
                    </div>
                  </div>
                ) : (
                  <>
                    {(contentToDisplay && contentToDisplay.trim() !== "") && (
                      <div 
                        className="cursor-pointer"
                        onClick={typewriterIsTyping ? skipToEnd : undefined}
                      >
                        <EnhancedAIResponseRenderer 
                          content={contentToDisplay} 
                          className="text-base sm:text-base leading-normal break-words select-text"
                        />
                      </div>
                    )}
                                          {message.events && message.events.length > 0 && (
                       <div className="mt-3 space-y-2">
                         {message.events.map((event, index) => (
                           <div
                             key={`${message.id}-event-${index}`}
                             className="transition-all duration-500 opacity-100 translate-y-0"
                           >
                             <EventCard event={event} />
                           </div>
                         ))}
                       </div>
                     )}
                     {/* Place Cards - Solo mostrar las filtradas */}
                     {filteredPlaceCards.length > 0 && (
                       <div className="mt-3 space-y-2">
                         {isFiltering && (
                           <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                             <Loader2 className="h-4 w-4 animate-spin mr-2" />
                             Validando ubicaciones de lugares...
                           </div>
                         )}
                         {filteredPlaceCards.map((place, index) => (
                           <div
                             key={`${message.id}-place-${place.id}`}
                             className="transition-all duration-500 opacity-100 translate-y-0"
                           >
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
                  </>
                )}
              </CardContent>
            </Card>
            
            {!message.isTyping && !message.error && (
              <div className="flex items-center -space-x-2 sm:space-x-1 mt-1 pl-0 sm:pl-1">
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
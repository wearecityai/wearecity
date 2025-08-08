import React from 'react';
import { User, Bot, Download, ExternalLink, Plus, ThumbsUp, ThumbsDown, Copy, MoreHorizontal, Building2, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { ChatMessage as ChatMessageType, MessageRole } from '../types';
import EventCard from './EventCard';
import PlaceCard from './PlaceCard';
import { useTypewriter } from '../hooks/useTypewriter';
import { useStrictSequentialReveal } from '../hooks/useStrictSequentialReveal';

interface ChatMessageProps {
  message: ChatMessageType;
  onDownloadPdf?: (pdfInfo: NonNullable<ChatMessageType['downloadablePdfInfo']>) => void;
  configuredSedeElectronicaUrl?: string;
  onSeeMoreEvents?: (originalUserQuery: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onDownloadPdf, configuredSedeElectronicaUrl, onSeeMoreEvents }) => {
  const isUser = message.role === MessageRole.User;
  const timestamp = new Date(message.timestamp);

  // Use typewriter effect for assistant messages that are not typing indicators
  const shouldUseTypewriter = !isUser && !message.isTyping && !message.error && message.content;
  const { displayText, isTyping: typewriterIsTyping, skipToEnd } = useTypewriter(
    shouldUseTypewriter ? message.content || '' : '',
    { speed: 8, startDelay: 200, messageId: message.id }
  );

  // Use typewriter text if active, otherwise use original content
  const contentToDisplay = shouldUseTypewriter ? displayText : message.content;

  // Strict sequential reveal for cards - only after text is complete
  const totalCards = (message.events?.length || 0) + (message.placeCards?.length || 0);
  const { shouldShowCard } = useStrictSequentialReveal({
    textContent: message.content,
    totalCards,
    typewriterIsComplete: !typewriterIsTyping && !!message.content,
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
        return 'Buscando eventos...';
      case 'places':
        return 'Buscando lugares...';
      case 'restaurants':
        return 'Buscando restaurantes...';
      case 'information':
        return 'Buscando información...';
      case 'procedures':
        return 'Buscando trámites...';
      default:
        return 'Un momento...';
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
                <div className="text-base sm:text-lg leading-normal break-words">
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
                      <p className="font-semibold text-destructive">Error:</p>
                      <p className="text-sm text-destructive">{message.error}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {(contentToDisplay && contentToDisplay.trim() !== "") && (
                      <div 
                        className="text-base sm:text-lg leading-normal break-words cursor-pointer"
                        onClick={typewriterIsTyping ? skipToEnd : undefined}
                      >
                        {processTextForParagraphs(contentToDisplay)}
                      </div>
                    )}
                     {message.events && message.events.length > 0 && (
                       <div className="mt-3 space-y-2">
                         {message.events.map((event, index) => {
                           const shouldShow = shouldShowCard(index);
                           return (
                             <div
                               key={`${message.id}-event-${index}`}
                               className={`transition-all duration-500 ${
                                 shouldShow 
                                   ? 'opacity-100 translate-y-0' 
                                   : 'opacity-0 translate-y-4'
                               }`}
                               style={{ display: shouldShow ? 'block' : 'none' }}
                             >
                               <EventCard event={event} />
                             </div>
                           );
                         })}
                       </div>
                     )}
                     {message.placeCards && message.placeCards.length > 0 && (
                       <div className="mt-3 space-y-2">
                         {message.placeCards.map((place, index) => {
                           const cardIndex = (message.events?.length || 0) + index;
                           const shouldShow = shouldShowCard(cardIndex);
                           return (
                             <div
                               key={`${message.id}-place-${place.id}`}
                               className={`transition-all duration-500 ${
                                 shouldShow 
                                   ? 'opacity-100 translate-y-0' 
                                   : 'opacity-0 translate-y-4'
                               }`}
                               style={{ display: shouldShow ? 'block' : 'none' }}
                             >
                               <PlaceCard place={place} />
                             </div>
                           );
                         })}
                       </div>
                     )}
                    {(!message.content || message.content.trim() === "") && (!message.events || message.events.length === 0) && (!message.placeCards || message.placeCards.length === 0) && (
                      <p className="text-muted-foreground text-sm">Sin respuesta</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            
            {!message.isTyping && !message.error && (
              <div className="flex items-center space-x-1 mt-1 pl-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <ThumbsDown className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
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
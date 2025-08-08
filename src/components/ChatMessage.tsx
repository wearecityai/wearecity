import React from 'react';
import { User, Bot, Download, ExternalLink, Plus, ThumbsUp, ThumbsDown, Copy, MoreHorizontal, Building2 } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { ChatMessage as ChatMessageType, MessageRole } from '../types';
import EventCard from './EventCard';
import PlaceCard from './PlaceCard';

interface ChatMessageProps {
  message: ChatMessageType;
  onDownloadPdf?: (pdfInfo: NonNullable<ChatMessageType['downloadablePdfInfo']>) => void;
  configuredSedeElectronicaUrl?: string;
  onSeeMoreEvents?: (originalUserQuery: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onDownloadPdf, configuredSedeElectronicaUrl, onSeeMoreEvents }) => {
  const isUser = message.role === MessageRole.User;
  const timestamp = new Date(message.timestamp);

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
      return part.split('\n').map((line, i, arr) => (
        <span key={`${index}-${i}`}>
          {line}
          {i < arr.length - 1 && <br />}
        </span>
      ));
    });
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
                <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line break-words">
                  {linkifyAndMarkdown(message.content)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Assistant message - left aligned
        <div className="flex items-start space-x-2 w-full overflow-hidden">
          {!message.isTyping && (
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Building2 className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className="flex-1 overflow-hidden max-w-full">
            <Card className="bg-transparent border-0 shadow-none">
              <CardContent className="p-0">
                {message.isTyping ? (
                  <div className="flex items-center space-x-3 h-10">
                    <div className="relative flex items-center justify-center">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Building2 className="absolute h-4 w-4 text-primary" />
                    </div>
                    <div className="text-muted-foreground text-sm animate-pulse">
                      {(() => {
                        const loadingStates = [
                          "Un momento...",
                          "Analizando la consulta...",
                          "Buscando información relevante...",
                          "Preparando la respuesta...",
                          "Verificando datos locales..."
                        ];
                        return loadingStates[Math.floor((Date.now() / 2000) % loadingStates.length)];
                      })()}
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
                    {(message.content && message.content.trim() !== "") && (
                      <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line break-words">
                        {linkifyAndMarkdown(message.content)}
                      </div>
                    )}
                    {message.events && message.events.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.events.map((event, index) => (
                          <EventCard key={`${message.id}-event-${index}`} event={event} />
                        ))}
                      </div>
                    )}
                    {message.placeCards && message.placeCards.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.placeCards.map((place) => (
                          <PlaceCard key={`${message.id}-place-${place.id}`} place={place} />
                        ))}
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
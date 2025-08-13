import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, MessageSquare, User, Bot } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChatMessage, MessageRole } from '../types';

interface ConversationDebugProps {
  messages: ChatMessage[];
  className?: string;
}

export const ConversationDebug: React.FC<ConversationDebugProps> = ({ messages, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const filteredMessages = messages.filter(msg => 
    !msg.isTyping && 
    !msg.error && 
    msg.content && 
    msg.content.trim().length > 0 &&
    msg.role !== MessageRole.System
  );

  const conversationHistory = filteredMessages
    .slice(-10)
    .map(msg => ({
      role: msg.role === MessageRole.User ? 'user' as const : 'assistant' as const,
      content: msg.content.trim()
    }));

  return (
    <div className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <MessageSquare className="h-4 w-4 mr-2" />
            Debug: Historial de Conversación ({conversationHistory.length} mensajes)
            {isOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Historial Enviado a la IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Últimos {conversationHistory.length} mensajes filtrados
              </div>
              
              {conversationHistory.map((msg, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-muted rounded">
                  <div className="flex-shrink-0">
                    {msg.role === 'user' ? (
                      <User className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Bot className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {msg.role === 'user' ? 'Usuario' : 'Asistente'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="text-sm break-words">
                      {msg.content.length > 100 
                        ? `${msg.content.substring(0, 100)}...` 
                        : msg.content
                      }
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Longitud: {msg.content.length} caracteres
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Total de mensajes en la conversación: {messages.length}
                <br />
                Mensajes filtrados: {filteredMessages.length}
                <br />
                Mensajes enviados a la IA: {conversationHistory.length}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

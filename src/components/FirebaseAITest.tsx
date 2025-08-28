import React, { useState } from 'react';
import { firebaseAIService } from '../services/firebaseAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Loader2, Send, MessageSquare, Zap } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export const FirebaseAITest: React.FC = () => {
  const [userMessage, setUserMessage] = useState('');
  const [citySlug, setCitySlug] = useState('valencia');
  const [mode, setMode] = useState<'fast' | 'quality'>('quality');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      // Añadir mensaje del usuario al historial
      const newUserMessage = { role: 'user' as const, content: userMessage };
      const updatedHistory = [...conversationHistory, newUserMessage];
      setConversationHistory(updatedHistory);

      console.log('🚀 Firebase AI Test - Enviando mensaje:', {
        userMessage,
        citySlug,
        mode,
        historyLength: updatedHistory.length
      });

      const result = await firebaseAIService.sendMessage({
        userMessage,
        citySlug,
        mode,
        conversationHistory: updatedHistory,
        historyWindow: 10
      });

      console.log('🚀 Firebase AI Test - Respuesta recibida:', result);

      // Añadir respuesta del asistente al historial
      const newAssistantMessage = { role: 'assistant' as const, content: result.response };
      setConversationHistory([...updatedHistory, newAssistantMessage]);

      setResponse(result.response);
      setUserMessage(''); // Limpiar input

    } catch (err) {
      console.error('🚀 Firebase AI Test - Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setConversationHistory([]);
    setResponse('');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-blue-500" />
            <CardTitle>Prueba de Firebase AI</CardTitle>
          </div>
          <CardDescription>
            Prueba la funcionalidad del chat IA con Firebase AI Logic y Google AI
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Configuración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="citySlug">Ciudad</Label>
              <Input
                id="citySlug"
                value={citySlug}
                onChange={(e) => setCitySlug(e.target.value)}
                placeholder="Ej: valencia, madrid, barcelona"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mode">Modo de Respuesta</Label>
              <div className="flex space-x-2">
                <Button
                  variant={mode === 'fast' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('fast')}
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Rápido
                </Button>
                <Button
                  variant={mode === 'quality' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('quality')}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Calidad
                </Button>
              </div>
            </div>
          </div>

          {/* Input del mensaje */}
          <div className="space-y-2">
            <Label htmlFor="userMessage">Mensaje</Label>
            <div className="flex space-x-2">
              <Textarea
                id="userMessage"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje aquí..."
                className="flex-1 min-h-[80px]"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !userMessage.trim()}
                className="self-end"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Controles */}
          <div className="flex justify-between items-center">
            <Badge variant="outline">
              Historial: {conversationHistory.length} mensajes
            </Badge>
            
            <Button
              onClick={clearConversation}
              variant="outline"
              size="sm"
            >
              Limpiar Conversación
            </Button>
          </div>

          {/* Respuesta */}
          {response && (
            <div className="space-y-2">
              <Label>Respuesta del Asistente:</Label>
              <div className="p-4 bg-muted rounded-lg border">
                <div className="whitespace-pre-wrap text-sm">{response}</div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Historial de conversación */}
          {conversationHistory.length > 0 && (
            <div className="space-y-2">
              <Label>Historial de Conversación:</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {conversationHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      msg.role === 'user' 
                        ? 'bg-blue-50 border-blue-200 ml-8' 
                        : 'bg-green-50 border-green-200 mr-8'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={msg.role === 'user' ? 'default' : 'secondary'}>
                        {msg.role === 'user' ? 'Usuario' : 'Asistente'}
                      </Badge>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { ChatMessage } from '../types';

export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar mensajes de una conversación
  const loadMessages = async () => {
    if (!user || !conversationId) {
      setMessages([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Convertir mensajes de la base de datos al formato ChatMessage
      const chatMessages: ChatMessage[] = (data || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'model',
        content: msg.content,
        timestamp: new Date(msg.created_at || ''),
        // Agregar metadata si existe
        ...(msg.metadata && typeof msg.metadata === 'object' ? msg.metadata : {})
      }));
      
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar mensaje en la base de datos
  const saveMessage = async (message: ChatMessage) => {
    if (!user || !conversationId) return;

    try {
      // Preparar metadata excluyendo campos base
      const { id, role, content, timestamp, ...metadata } = message;
      
      const { error } = await supabase
        .from('messages')
        .insert([{
          id: message.id,
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          metadata: Object.keys(metadata).length > 0 ? metadata : null,
          created_at: message.timestamp.toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  // Agregar mensaje localmente y guardarlo
  const addMessage = async (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    await saveMessage(message);
  };

  // Actualizar mensaje existente
  const updateMessage = async (messageId: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, ...updates }
          : msg
      )
    );

    // También actualizar en la base de datos si es necesario
    if (user && conversationId) {
      try {
        const message = messages.find(m => m.id === messageId);
        if (message) {
          const updatedMessage = { ...message, ...updates };
          const { id, role, content, timestamp, ...metadata } = updatedMessage;
          
          await supabase
            .from('messages')
            .update({
              content: updatedMessage.content,
              metadata: Object.keys(metadata).length > 0 ? metadata : null
            })
            .eq('id', messageId);
        }
      } catch (error) {
        console.error('Error updating message:', error);
      }
    }
  };

  // Limpiar mensajes
  const clearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    loadMessages();
  }, [conversationId, user]);

  return {
    messages,
    isLoading,
    addMessage,
    updateMessage,
    clearMessages,
    setMessages,
    loadMessages
  };
};

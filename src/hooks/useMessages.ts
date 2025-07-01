
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { ChatMessage, MessageRole } from '../types';

export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to convert database role to MessageRole
  const convertToMessageRole = (role: string): MessageRole => {
    return role === 'user' ? MessageRole.User : MessageRole.Model;
  };

  // Helper function to safely serialize metadata for database storage
  const serializeMetadata = (message: ChatMessage) => {
    const { id, role, content, timestamp, ...metadata } = message;
    
    // Convert complex types to simple objects for JSON storage
    const serializedMetadata: any = {};
    
    Object.keys(metadata).forEach(key => {
      const value = (metadata as any)[key];
      if (value !== undefined) {
        // Convert complex objects to JSON-serializable format
        serializedMetadata[key] = value;
      }
    });
    
    return Object.keys(serializedMetadata).length > 0 ? serializedMetadata : null;
  };

  // Helper function to deserialize metadata from database
  const deserializeMetadata = (metadata: any) => {
    return metadata && typeof metadata === 'object' ? metadata : {};
  };

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
      const chatMessages: ChatMessage[] = (data || []).map(msg => {
        const deserializedMetadata = deserializeMetadata(msg.metadata);
        
        return {
          id: msg.id,
          role: convertToMessageRole(msg.role),
          content: msg.content,
          timestamp: new Date(msg.created_at || ''),
          ...deserializedMetadata
        };
      });
      
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
      const serializedMetadata = serializeMetadata(message);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          id: message.id,
          conversation_id: conversationId,
          role: message.role === MessageRole.User ? 'user' : 'model',
          content: message.content,
          metadata: serializedMetadata,
          created_at: message.timestamp.toISOString()
        });

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
          const serializedMetadata = serializeMetadata(updatedMessage);
          
          await supabase
            .from('messages')
            .update({
              content: updatedMessage.content,
              metadata: serializedMetadata
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

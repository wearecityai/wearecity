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

  // Helper function to convert MessageRole to database role
  const convertToDatabaseRole = (role: MessageRole): string => {
    return role === MessageRole.User ? 'user' : 'model';
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

  // Load messages from a conversation
  const loadMessages = async () => {
    if (!user || !conversationId) {
      console.log('No user or conversationId, clearing messages. User:', !!user, 'ConversationId:', conversationId);
      setMessages([]);
      return;
    }
    
    console.log('Loading messages for conversation:', conversationId);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
        return;
      }
      
      console.log('Loaded messages:', data?.length || 0, 'for conversation:', conversationId);
      
      // Convert database messages to ChatMessage format
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

  // Save message to database only (without adding to local state)
  const saveMessageOnly = async (message: ChatMessage, targetConversationId?: string) => {
    const conversationIdToUse = targetConversationId || conversationId;
    
    if (!user) {
      console.log('No user available, cannot save message. User:', !!user);
      throw new Error('No user available');
    }

    if (!conversationIdToUse) {
      console.log('No conversationId available, cannot save message. ConversationId:', conversationIdToUse);
      throw new Error('No conversation ID available');
    }

    console.log('Saving message to database only:', message.id, 'to conversation:', conversationIdToUse, 'with role:', message.role);
    try {
      const serializedMetadata = serializeMetadata(message);
      const databaseRole = convertToDatabaseRole(message.role);
      
      console.log('Database role for message:', databaseRole);
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          id: message.id,
          conversation_id: conversationIdToUse,
          role: databaseRole,
          content: message.content,
          metadata: serializedMetadata,
          created_at: message.timestamp.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        throw error;
      }
      
      console.log('Message saved successfully to database:', data);
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  // Save message to database (legacy function for compatibility)
  const saveMessage = async (message: ChatMessage) => {
    await saveMessageOnly(message);
  };

  // Add message locally and save it to a specific conversation
  const addMessage = async (message: ChatMessage, targetConversationId?: string) => {
    const conversationIdToUse = targetConversationId || conversationId;
    console.log('Adding message locally and saving to database:', message.id, 'with role:', message.role, 'to conversation:', conversationIdToUse);
    
    // Save to database first
    await saveMessageOnly(message, conversationIdToUse);
    
    // Only add to local state if it belongs to the current conversation
    if (conversationIdToUse === conversationId) {
      setMessages(prev => [...prev, message]);
    }
  };

  // Update existing message
  const updateMessage = async (messageId: string, updates: Partial<ChatMessage>) => {
    console.log('Updating message:', messageId);
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, ...updates }
          : msg
      )
    );

    // Also update in database if necessary
    if (user && conversationId) {
      try {
        const message = messages.find(m => m.id === messageId);
        if (message) {
          const updatedMessage = { ...message, ...updates };
          const serializedMetadata = serializeMetadata(updatedMessage);
          
          const { error } = await supabase
            .from('messages')
            .update({
              content: updatedMessage.content,
              metadata: serializedMetadata
            })
            .eq('id', messageId);
            
          if (error) {
            console.error('Error updating message in database:', error);
          }
        }
      } catch (error) {
        console.error('Error updating message:', error);
      }
    }
  };

  // Clear messages
  const clearMessages = () => {
    console.log('Clearing messages');
    setMessages([]);
  };

  // React to conversation ID changes
  useEffect(() => {
    console.log('useMessages: conversationId changed to:', conversationId);
    loadMessages();
  }, [conversationId, user]);

  return {
    messages,
    isLoading,
    addMessage,
    saveMessageOnly,
    updateMessage,
    clearMessages,
    setMessages,
    loadMessages
  };
};

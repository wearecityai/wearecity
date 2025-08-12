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
    return role === MessageRole.User ? 'user' : 'assistant';
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
    if (!conversationId) {
      setMessages([]);
      return;
    }
    if (!user) {
      // Cargar mensajes de localStorage
      const local = localStorage.getItem(`chat_messages_${conversationId}`);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setMessages(parsed.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) })));
        } catch {
          // Keep existing messages instead of clearing to avoid flicker
        }
      }
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
        // Do not clear local messages on error
        return;
      }
      
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
      
      // Merge with existing local messages to avoid dropping optimistic typing/unsaved
      setMessages(prev => {
        const byId = new Map<string, ChatMessage>();
        // Start with previous (preserve any typing/optimistic entries)
        for (const m of prev) byId.set(m.id, m);
        // Overlay server messages
        for (const m of chatMessages) byId.set(m.id, { ...m, shouldAnimate: false });
        // Sort by timestamp asc if available, else keep insertion order
        const merged = Array.from(byId.values()).sort((a, b) => (a.timestamp?.getTime?.() || 0) - (b.timestamp?.getTime?.() || 0));
        return merged;
      });
    } catch (error) {
      console.error('Error loading messages:', error);
      // Do not clear local messages on error
    } finally {
      setIsLoading(false);
    }
  };

  // Save message to database only (without adding to local state)
  const saveMessageOnly = async (message: ChatMessage, targetConversationId?: string) => {
    const conversationIdToUse = targetConversationId || conversationId;
    
    if (!user) {
      // For unauthenticated users, save to localStorage
      if (conversationIdToUse) {
        const existing = localStorage.getItem(`chat_messages_${conversationIdToUse}`);
        const messages = existing ? JSON.parse(existing) : [];
        messages.push(message);
        localStorage.setItem(`chat_messages_${conversationIdToUse}`, JSON.stringify(messages));
      }
      return;
    }

    if (!conversationIdToUse) {
      throw new Error('No conversation ID available');
    }

    try {
      const serializedMetadata = serializeMetadata(message);
      const databaseRole = convertToDatabaseRole(message.role);
      
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
    if (!conversationIdToUse) return;

    // 1) Always add to local state immediately (optimistic update)
    setMessages(prev => [...prev, message]);

    // 2) Persist depending on auth state (in background for speed)
    if (!user) {
      // Unauthenticated: mirror to localStorage
      const existing = localStorage.getItem(`chat_messages_${conversationIdToUse}`);
      const local = existing ? JSON.parse(existing) : [];
      local.push(message);
      localStorage.setItem(`chat_messages_${conversationIdToUse}`, JSON.stringify(local));
      return;
    }

    // Authenticated: save to database without blocking UI
    try {
      await saveMessageOnly(message, conversationIdToUse);
    } catch (error) {
      console.error('Error saving message (optimistic add already applied):', error);
      // Optionally mark message with an error state here if needed
    }
  };

  // Update existing message
  const updateMessage = async (messageId: string, updates: Partial<ChatMessage>) => {
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
    setMessages([]);
    if (!user && conversationId) {
      localStorage.removeItem(`chat_messages_${conversationId}`);
    }
  };

  // React to conversation ID changes
  useEffect(() => {
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

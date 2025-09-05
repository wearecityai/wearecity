import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, addDoc, updateDoc, doc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';
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
    
    const cleanMetadata = (obj: any, path: string = ''): any => {
      if (obj === null || obj === undefined) {
        return null;
      }
      
      if (typeof obj === 'object' && !Array.isArray(obj)) {
        const cleaned: any = {};
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          if (value !== undefined) {
            const cleanedValue = cleanMetadata(value, `${path}.${key}`);
            if (cleanedValue !== null) {
              cleaned[key] = cleanedValue;
            }
          }
        });
        return Object.keys(cleaned).length > 0 ? cleaned : null;
      }
      
      if (Array.isArray(obj)) {
        const cleanedArray = obj.map(item => cleanMetadata(item, path)).filter(item => item !== null);
        return cleanedArray.length > 0 ? cleanedArray : null;
      }
      
      return obj;
    };
    
    Object.keys(metadata).forEach(key => {
      const value = (metadata as any)[key];
      if (value !== undefined) {
        const cleanedValue = cleanMetadata(value, key);
        if (cleanedValue !== null) {
          serializedMetadata[key] = cleanedValue;
        }
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
    
    // Clear any typing messages when switching conversations
    setMessages(prev => prev.filter(msg => !msg.isTyping));
    
    if (!user) {
      // Cargar mensajes de localStorage
      const local = localStorage.getItem(`chat_messages_${conversationId}`);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          // Filter out any typing messages from localStorage
          const cleanMessages = parsed
            .filter((msg: any) => !msg.isTyping)
            .map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
          setMessages(cleanMessages);
        } catch {
          // Keep existing messages instead of clearing to avoid flicker
        }
      }
      return;
    }
    
    console.log('Loading messages for conversation:', conversationId);
    setIsLoading(true);
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef, 
        where('conversation_id', '==', conversationId),
        orderBy('created_at', 'asc')
      );

      const querySnapshot = await getDocs(q);
      
      // Convert database messages to ChatMessage format
      const chatMessages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const deserializedMetadata = deserializeMetadata(data.metadata);
        
        chatMessages.push({
          id: doc.id,
          role: convertToMessageRole(data.role),
          content: data.content,
          timestamp: data.created_at?.toDate?.() || new Date(),
          ...deserializedMetadata
        });
      });
      
      // Merge with existing local messages to avoid dropping optimistic typing/unsaved
      setMessages(prev => {
        const byId = new Map<string, ChatMessage>();
        
        // Start with server messages (authoritative)
        for (const m of chatMessages) {
          byId.set(m.id, { ...m, shouldAnimate: false });
        }
        
        // Only add local messages that don't exist on server and aren't typing
        for (const m of prev) {
          if (!byId.has(m.id) && !m.isTyping) {
            byId.set(m.id, m);
          }
        }
        
        // Sort by timestamp asc if available, else keep insertion order
        const merged = Array.from(byId.values()).sort((a, b) => (a.timestamp?.getTime?.() || 0) - (b.timestamp?.getTime?.() || 0));
        
        // Debug: Log if we detect potential duplicates
        const duplicateIds = new Set<string>();
        const seenIds = new Set<string>();
        for (const msg of merged) {
          if (seenIds.has(msg.id)) {
            duplicateIds.add(msg.id);
          }
          seenIds.add(msg.id);
        }
        
        if (duplicateIds.size > 0) {
          console.warn('🚨 Duplicate message IDs detected:', Array.from(duplicateIds));
        }
        
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
      
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        conversation_id: conversationIdToUse,
        role: databaseRole,
        content: message.content,
        metadata: serializedMetadata,
        created_at: Timestamp.fromDate(message.timestamp)
      });
      
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
    setMessages(prev => {
      // Check if message already exists to prevent duplicates
      const exists = prev.some(m => m.id === message.id);
      if (exists) {
        console.warn('🚨 Attempted to add duplicate message:', message.id);
        return prev;
      }
      
      // If adding a typing message, remove any existing typing messages first
      if (message.isTyping) {
        const filteredPrev = prev.filter(m => !m.isTyping);
        return [...filteredPrev, message];
      }
      
      return [...prev, message];
    });

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
          
          const messageRef = doc(db, 'messages', messageId);
          await updateDoc(messageRef, {
            content: updatedMessage.content,
            metadata: serializedMetadata
          });
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

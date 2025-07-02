
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { ChatMessage, MessageRole } from '../types';
import { loadMessagesFromDb, saveMessageToDb, updateMessageInDb } from './messages/messageDatabase';
import { convertDbMessageToChatMessage } from './messages/messageConverters';
import { useMessageRealtime } from './messages/useMessageRealtime';

export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load messages from a conversation
  const loadMessages = async () => {
    if (!user || !conversationId) {
      console.log('No user or conversationId, clearing messages. User:', !!user, 'ConversationId:', conversationId);
      setMessages([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await loadMessagesFromDb(conversationId);
      
      // Convert database messages to ChatMessage format
      const chatMessages: ChatMessage[] = data.map(msg => convertDbMessageToChatMessage(msg));
      
      // Clean up any orphaned messages that were converted (they have default recovery content)
      const orphanedMessages = chatMessages.filter(msg => 
        msg.content === 'Lo siento, hubo un problema generando esta respuesta. Por favor, intenta de nuevo.' &&
        msg.role === MessageRole.Model
      );
      
      if (orphanedMessages.length > 0) {
        console.log('Cleaning up orphaned messages in database:', orphanedMessages.map(m => m.id));
        // Update orphaned messages in database to fix their state
        for (const orphanedMsg of orphanedMessages) {
          try {
            await updateMessageInDb(orphanedMsg.id, {
              content: orphanedMsg.content,
              isTyping: false
            });
          } catch (updateError) {
            console.error('Failed to update orphaned message:', updateError);
          }
        }
      }
      
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
    
    if (!user || !conversationIdToUse) {
      const errorMsg = !user ? 'No user available' : 'No conversation ID available';
      console.log(errorMsg);
      throw new Error(errorMsg);
    }

    await saveMessageToDb(message, conversationIdToUse, user.id);
  };

  // Add message locally and save it to a specific conversation
  const addMessage = async (message: ChatMessage, targetConversationId?: string) => {
    const conversationIdToUse = targetConversationId || conversationId;
    console.log('Adding message locally and saving to database:', message.id, 'with role:', message.role, 'to conversation:', conversationIdToUse);
    
    // Add to local state immediately only if it belongs to the current conversation
    // This is needed for streaming updates before the message is saved to DB
    if (conversationIdToUse === conversationId) {
      console.log('Adding message to local state immediately for streaming:', message.id);
      setMessages(prev => {
        // Avoid duplicates
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    } else {
      console.log('Message belongs to different conversation, not adding to local state');
    }
    
    // Save to database - realtime will sync it back for other users/sessions
    await saveMessageOnly(message, conversationIdToUse);
  };

  // Update existing message both locally and in database
  const updateMessage = async (messageId: string, updates: Partial<ChatMessage>) => {
    console.log('Updating message:', messageId, 'with updates:', Object.keys(updates));
    
    // Update local state immediately for responsiveness
    setMessages(prev => {
      const messageExists = prev.some(msg => msg.id === messageId);
      if (!messageExists) {
        console.warn('Message not found in local state for update:', messageId);
        return prev;
      }
      
      return prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, ...updates }
          : msg
      );
    });

    // Also update in database if necessary
    if (user && conversationId) {
      try {
        const message = messages.find(m => m.id === messageId);
        if (message) {
          const updatedMessage = { ...message, ...updates };
          await updateMessageInDb(messageId, updatedMessage);
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

  // Set up realtime subscription
  useMessageRealtime(conversationId, user, setMessages);

  // React to conversation ID changes
  useEffect(() => {
    console.log('useMessages: conversationId changed to:', conversationId);
    
    if (!conversationId || !user) {
      console.log('ConversationId is null or no user, clearing messages');
      setMessages([]);
      return;
    }

    // Load initial messages
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

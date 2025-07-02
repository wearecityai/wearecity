import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '../../types';
import { convertToDatabaseRole } from './messageConverters';
import { serializeMetadata } from './messageSerializers';

// Load messages from a conversation
export const loadMessagesFromDb = async (conversationId: string) => {
  console.log('Loading messages for conversation:', conversationId);
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading messages:', error);
    throw error;
  }
  
  console.log('Loaded messages:', data?.length || 0, 'for conversation:', conversationId);
  return data || [];
};

// Save message to database only (without adding to local state)
export const saveMessageToDb = async (
  message: ChatMessage, 
  conversationId: string,
  userId: string
) => {
  if (!userId) {
    console.log('No user available, cannot save message. User:', !!userId);
    throw new Error('No user available');
  }

  if (!conversationId) {
    console.log('No conversationId available, cannot save message. ConversationId:', conversationId);
    throw new Error('No conversation ID available');
  }

  console.log('Saving message to database only:', message.id, 'to conversation:', conversationId, 'with role:', message.role);
  
  const serializedMetadata = serializeMetadata(message);
  const databaseRole = convertToDatabaseRole(message.role);
  
  console.log('Database role for message:', databaseRole);
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      id: message.id,
      conversation_id: conversationId,
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
  return data;
};

// Update existing message in database
export const updateMessageInDb = async (
  messageId: string,
  updates: Partial<ChatMessage>
) => {
  const serializedMetadata = updates.content ? serializeMetadata(updates as ChatMessage) : null;
  
  const updateData: any = {};
  if (updates.content) updateData.content = updates.content;
  if (serializedMetadata !== null) updateData.metadata = serializedMetadata;
  
  const { error } = await supabase
    .from('messages')
    .update(updateData)
    .eq('id', messageId);
    
  if (error) {
    console.error('Error updating message in database:', error);
    throw error;
  } else {
    console.log('Message updated successfully in database:', messageId);
  }
};
import { MessageRole, ChatMessage } from '../../types';

// Helper function to convert database role to MessageRole
export const convertToMessageRole = (role: string): MessageRole => {
  return role === 'user' ? MessageRole.User : MessageRole.Model;
};

// Helper function to convert MessageRole to database role
export const convertToDatabaseRole = (role: MessageRole): string => {
  return role === MessageRole.User ? 'user' : 'model';
};

// Convert database message to ChatMessage format
export const convertDbMessageToChatMessage = (dbMessage: any): ChatMessage => {
  const deserializedMetadata = deserializeMetadata(dbMessage.metadata);
  
  // Detect orphaned loading messages (empty content + isTyping true)
  const isOrphanedLoadingMessage = (
    dbMessage.role === 'model' && 
    (!dbMessage.content || dbMessage.content.trim() === '') && 
    deserializedMetadata.isTyping === true
  );
  
  // Convert orphaned loading messages to a friendly message without error state
  if (isOrphanedLoadingMessage) {
    console.log('Detected orphaned loading message, converting to friendly message:', dbMessage.id);
    return {
      id: dbMessage.id,
      role: convertToMessageRole(dbMessage.role),
      content: 'Lo siento, hubo un problema generando esta respuesta. Por favor, intenta de nuevo.',
      timestamp: new Date(dbMessage.created_at || ''),
      isTyping: false
    };
  }
  
  return {
    id: dbMessage.id,
    role: convertToMessageRole(dbMessage.role),
    content: dbMessage.content,
    timestamp: new Date(dbMessage.created_at || ''),
    ...deserializedMetadata
  };
};

// Helper function to deserialize metadata from database
const deserializeMetadata = (metadata: any) => {
  return metadata && typeof metadata === 'object' ? metadata : {};
};
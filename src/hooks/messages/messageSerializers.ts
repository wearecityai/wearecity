import { ChatMessage } from '../../types';

// Helper function to safely serialize metadata for database storage
export const serializeMetadata = (message: ChatMessage) => {
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
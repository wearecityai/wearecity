
import { ChatMessage, MessageRole } from '../../types';
import { useMessageParser } from '../useMessageParser';
import { useConversations } from '../useConversations';

export const useChatActions = () => {
  const { handleSeeMoreEvents: parseHandleSeeMoreEvents, clearEventTracking } = useMessageParser();
  const { createConversation } = useConversations();

  const handleSeeMoreEvents = (originalUserQuery?: string, onSendMessage?: (message: string) => void) => {
    parseHandleSeeMoreEvents(originalUserQuery, onSendMessage);
  };

  const handleClearMessages = (clearMessages: () => void) => {
    clearMessages();
    clearEventTracking();
  };

  const handleNewChat = async (clearMessages: () => void) => {
    const newConversation = await createConversation();
    if (newConversation) {
      clearMessages();
      clearEventTracking();
    }
  };

  const createUserMessage = (inputText: string): ChatMessage => {
    return { 
      id: crypto.randomUUID(), 
      role: MessageRole.User, 
      content: inputText, 
      timestamp: new Date() 
    };
  };

  return {
    handleSeeMoreEvents,
    handleClearMessages,
    handleNewChat,
    createUserMessage
  };
};

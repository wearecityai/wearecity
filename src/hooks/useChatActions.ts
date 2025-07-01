
import { useMessageParser } from './useMessageParser';

export const useChatActions = (
  clearMessages: () => void,
  createConversation: (title?: string) => Promise<any>
) => {
  const { clearEventTracking } = useMessageParser();

  const handleClearMessages = () => {
    clearMessages();
    clearEventTracking();
  };

  const handleNewChat = async () => {
    const newConversation = await createConversation();
    if (newConversation) {
      clearMessages();
      clearEventTracking();
    }
  };

  return {
    handleClearMessages,
    handleNewChat
  };
};

import { ChatMessage, MessageRole } from '../../types';
import { useMessageParser } from '../useMessageParser';
import { useConversations } from '../useConversations';

export const useChatActions = () => {
  const { handleSeeMoreEvents: parseHandleSeeMoreEvents, clearEventTracking } = useMessageParser();
  const { createConversation, updateConversationTitle } = useConversations();

  const generateConversationTitle = async (userMessage: string): Promise<string> => {
    try {
      // Simple title generation based on the first user message
      // Extract key concepts and create a meaningful title
      const words = userMessage.toLowerCase().trim().split(/\s+/);
      
      // Remove common words and keep meaningful ones
      const stopWords = ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'y', 'o', 'que', 'es', 'por', 'para', 'con', 'como', 'me', 'te', 'se', 'le', 'lo', 'su', 'mi', 'tu', 'este', 'esta', 'esto', 'ese', 'esa', 'eso', 'aquel', 'aquella', 'aquello', 'si', 'no', 'pero', 'mas', 'muy', 'mas', 'solo', 'tambien', 'ya', 'solo', 'donde', 'cuando', 'como', 'porque', 'aunque', 'hasta', 'desde', 'sobre', 'entre', 'durante', 'antes', 'despues', 'sin', 'hacia', 'contra'];
      
      const meaningfulWords = words.filter(word => 
        word.length > 2 && 
        !stopWords.includes(word) &&
        !/^\d+$/.test(word)
      );

      // Take the first 2-3 meaningful words and capitalize them
      const titleWords = meaningfulWords.slice(0, 3);
      
      if (titleWords.length === 0) {
        return 'Consulta general';
      }

      const title = titleWords
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Limit title length
      return title.length > 50 ? title.substring(0, 47) + '...' : title;
    } catch (error) {
      console.error('Error generating conversation title:', error);
      return 'Nueva consulta';
    }
  };

  const handleSeeMoreEvents = (originalUserQuery?: string, onSendMessage?: (message: string) => void) => {
    parseHandleSeeMoreEvents(originalUserQuery, onSendMessage);
  };

  const handleClearMessages = (clearMessages: () => void) => {
    clearMessages();
    clearEventTracking();
  };

  const handleNewChat = async (clearMessages: () => void, setCurrentConversationId?: (id: string | null) => void): Promise<void> => {
    console.log('Starting new chat');
    const newConversation = await createConversation('Nueva conversación');
    if (newConversation) {
      console.log('New chat conversation created:', newConversation.id);
      // Update the current conversation ID immediately
      if (setCurrentConversationId) {
        setCurrentConversationId(newConversation.id);
      }
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

  const handleCreateConversationWithAutoTitle = async (userMessage: string) => {
    console.log('Creating conversation with auto title for message:', userMessage);
    const generatedTitle = await generateConversationTitle(userMessage);
    const newConversation = await createConversation(generatedTitle);
    console.log('Conversation created with title:', generatedTitle, 'ID:', newConversation?.id);
    return newConversation;
  };

  const handleUpdateConversationTitle = async (conversationId: string, userMessage: string) => {
    console.log('Updating conversation title for ID:', conversationId);
    const generatedTitle = await generateConversationTitle(userMessage);
    await updateConversationTitle(conversationId, generatedTitle);
  };

  return {
    handleSeeMoreEvents,
    handleClearMessages,
    handleNewChat,
    createUserMessage,
    generateConversationTitle,
    handleCreateConversationWithAutoTitle,
    handleUpdateConversationTitle
  };
};

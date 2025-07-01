
import { useEffect } from 'react';
import { CustomChatConfig } from '../types';
import { useMessages } from './useMessages';
import { useConversations } from './useConversations';
import { useChatSession } from './chat/useChatSession';
import { useMessageHandler } from './chat/useMessageHandler';
import { useChatActions } from './chat/useChatActions';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useChatManager = (
  chatConfig: CustomChatConfig,
  userLocation: UserLocation | null,
  isGeminiReady: boolean,
  onError: (error: string) => void,
  onGeminiReadyChange: (ready: boolean) => void
) => {
  // Use hooks for conversations and messages
  const { 
    conversations, 
    currentConversationId, 
    setCurrentConversationId,
    createConversation 
  } = useConversations();
  
  const { 
    messages, 
    addMessage, 
    saveMessageOnly,
    updateMessage, 
    clearMessages, 
    setMessages 
  } = useMessages(currentConversationId);

  // Chat session management
  const {
    geminiChatSessionRef,
    initializeChatSession
  } = useChatSession(isGeminiReady, onError, onGeminiReadyChange);

  // Message processing
  const {
    isLoading,
    processMessage
  } = useMessageHandler(chatConfig, onError, onGeminiReadyChange);

  // Chat actions
  const {
    handleSeeMoreEvents,
    handleClearMessages,
    handleNewChat,
    createUserMessage
  } = useChatActions();

  const handleSendMessage = async (inputText: string) => {
    // Create conversation if it doesn't exist
    let conversationId = currentConversationId;
    if (!conversationId) {
      const newConversation = await createConversation('Nueva conversación');
      if (newConversation) {
        conversationId = newConversation.id;
      }
    }

    // Verify conversation exists before continuing
    if (!conversationId) {
      onError('No se pudo crear o recuperar la conversación.');
      return;
    }

    const userMessage = createUserMessage(inputText);
    
    await processMessage(
      geminiChatSessionRef.current,
      inputText,
      userMessage,
      addMessage,
      saveMessageOnly,
      setMessages,
      isGeminiReady
    );
  };

  // Initialize chat when ready
  useEffect(() => {
    if (isGeminiReady) {
      initializeChatSession(chatConfig, userLocation);
    }
  }, [isGeminiReady, chatConfig, userLocation, initializeChatSession]);

  return {
    messages,
    isLoading,
    handleSendMessage,
    handleSeeMoreEvents,
    clearMessages: () => handleClearMessages(clearMessages),
    setMessages,
    handleNewChat: () => handleNewChat(clearMessages),
    conversations,
    currentConversationId,
    setCurrentConversationId
  };
};

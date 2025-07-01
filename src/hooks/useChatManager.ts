
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
    createUserMessage,
    handleCreateConversationWithAutoTitle,
    handleUpdateConversationTitle
  } = useChatActions();

  const handleSendMessage = async (inputText: string) => {
    // Create conversation if it doesn't exist
    let conversationId = currentConversationId;
    let shouldUpdateTitle = false;

    if (!conversationId) {
      console.log('Creating new conversation for message:', inputText);
      const newConversation = await handleCreateConversationWithAutoTitle(inputText);
      if (newConversation) {
        conversationId = newConversation.id;
        // Immediately update the current conversation ID
        setCurrentConversationId(conversationId);
        console.log('New conversation created and set as current:', conversationId);
      }
    } else {
      // If it's the first real message in an existing conversation (not just "Nueva conversación")
      const currentConversation = conversations.find(c => c.id === conversationId);
      if (currentConversation && currentConversation.title === 'Nueva conversación' && messages.length <= 1) {
        shouldUpdateTitle = true;
      }
    }

    // Verify conversation exists before continuing
    if (!conversationId) {
      onError('No se pudo crear o recuperar la conversación.');
      return;
    }

    // Update title if needed
    if (shouldUpdateTitle) {
      await handleUpdateConversationTitle(conversationId, inputText);
    }

    const userMessage = createUserMessage(inputText);
    
    // Fix: Remove the extra conversationId argument since processMessage should handle it internally
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

  const handleNewChatWrapper = async () => {
    await handleNewChat(clearMessages, setCurrentConversationId);
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
    handleNewChat: handleNewChatWrapper,
    conversations,
    currentConversationId,
    setCurrentConversationId
  };
};

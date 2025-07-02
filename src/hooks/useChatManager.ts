
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
    createConversation,
    updateConversationTitle
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
    generateConversationTitle
  } = useChatActions();

  const handleSendMessage = async (inputText: string) => {
    try {
      // Determine the conversation ID to use
      let targetConversationId = currentConversationId;
      let isNewConversation = false;

      // If no current conversation exists, create one synchronously
      if (!targetConversationId) {
        console.log('Creating new conversation for message:', inputText);
        const generatedTitle = await generateConversationTitle(inputText);
        const newConversation = await createConversation(generatedTitle);
        
        if (!newConversation) {
          onError('No se pudo crear la conversación.');
          return;
        }
        
        targetConversationId = newConversation.id;
        isNewConversation = true;
        console.log('New conversation created:', targetConversationId);
      } else {
        // Check if we need to update the title for an existing conversation
        const currentConversation = conversations.find(c => c.id === targetConversationId);
        if (currentConversation && currentConversation.title === 'Nueva conversación' && messages.length <= 1) {
          console.log('Updating conversation title for existing conversation:', targetConversationId);
          const generatedTitle = await generateConversationTitle(inputText);
          await updateConversationTitle(targetConversationId, generatedTitle);
        }
      }

      // Create user message
      const userMessage = createUserMessage(inputText);
      
      // Process the message with the specific conversation ID
      await processMessage(
        geminiChatSessionRef.current,
        inputText,
        userMessage,
        addMessage,
        saveMessageOnly,
        setMessages,
        isGeminiReady,
        targetConversationId // Pass the conversation ID explicitly
      );

      // Update the current conversation ID only after successful message processing
      if (isNewConversation) {
        console.log('Setting current conversation ID after successful message processing:', targetConversationId);
        setCurrentConversationId(targetConversationId);
      }

    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      onError('Error al enviar el mensaje. Intenta de nuevo.');
    }
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

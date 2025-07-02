
import { useEffect } from 'react';
import { CustomChatConfig } from '../types';
import { useMessages } from './useMessages';
import { useChatSession } from './chat/useChatSession';
import { useMessageHandler } from './chat/useMessageHandler';
import { useChatActions } from './chat/useChatActions';

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface ConversationFunctions {
  conversations: Array<{ id: string; title: string }>;
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  createConversation: (title: string) => Promise<{ id: string; title: string } | null>;
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
}

export const useChatManager = (
  chatConfig: CustomChatConfig,
  userLocation: UserLocation | null,
  isGeminiReady: boolean,
  onError: (error: string) => void,
  onGeminiReadyChange: (ready: boolean) => void,
  conversationFunctions: ConversationFunctions
) => {
  // Destructure conversation functions from parameters
  const { 
    conversations, 
    currentConversationId, 
    setCurrentConversationId,
    createConversation,
    updateConversationTitle
  } = conversationFunctions;
  
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

  // Message processing - now passing userLocation as the second parameter
  const {
    isLoading,
    processMessage
  } = useMessageHandler(chatConfig, userLocation, onError, onGeminiReadyChange);

  // Chat actions
  const {
    handleSeeMoreEvents,
    handleClearMessages,
    handleNewChat,
    createUserMessage,
    generateConversationTitle
  } = useChatActions();

  const handleSendMessage = async (inputText: string) => {
    console.log('=== Starting handleSendMessage ===');
    console.log('Input text:', inputText);
    console.log('Current conversation ID at start:', currentConversationId);

    let targetConversationId = currentConversationId;

    try {
      // Step 1: Determine or create the target conversation
      if (!targetConversationId) {
        console.log('No current conversation, creating new one...');
        const generatedTitle = await generateConversationTitle(inputText);
        const newConversation = await createConversation(generatedTitle);
        
        if (!newConversation) {
          console.error('Failed to create conversation');
          onError('No se pudo crear la conversación.');
          return;
        }
        
        targetConversationId = newConversation.id;
        console.log('Created new conversation:', targetConversationId, 'with title:', generatedTitle);
        
        // Set the current conversation ID immediately after creation
        // This ensures all subsequent operations use the correct conversation ID
        console.log('Setting current conversation ID to newly created:', targetConversationId);
        setCurrentConversationId(targetConversationId);
      } else {
        // Update title if this is the first real message in an existing conversation
        const currentConversation = conversations.find(c => c.id === targetConversationId);
        if (currentConversation?.title === 'Nueva conversación' && messages.length <= 1) {
          console.log('Updating conversation title for existing conversation');
          const generatedTitle = await generateConversationTitle(inputText);
          await updateConversationTitle(targetConversationId, generatedTitle);
        }
      }

      console.log('Target conversation ID determined:', targetConversationId);

      // Step 2: Create user message
      const userMessage = createUserMessage(inputText);
      console.log('Created user message:', userMessage.id);

      // Step 3: Process the message with the stable conversation ID
      console.log('Processing message for conversation:', targetConversationId);
      await processMessage(
        geminiChatSessionRef.current,
        inputText,
        userMessage,
        addMessage,
        saveMessageOnly,
        updateMessage,
        setMessages,
        isGeminiReady,
        targetConversationId,
        () => {
          console.log('getCurrentMessages called, returning messages length:', messages.length);
          return messages;
        }
      );

      console.log('=== handleSendMessage completed successfully ===');

    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      onError('Error al enviar el mensaje. Intenta de nuevo.');
    }
  };

  const handleNewChatWrapper = async () => {
    console.log('handleNewChatWrapper called');
    await handleNewChat(clearMessages, setCurrentConversationId);
  };

  // Initialize chat when ready
  useEffect(() => {
    if (isGeminiReady) {
      console.log('Initializing chat session - isGeminiReady:', isGeminiReady);
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
    handleNewChat: handleNewChatWrapper
  };
};

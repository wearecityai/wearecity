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
  } = useChatSession();

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
    const callId = crypto.randomUUID();
    
    // Prevenir múltiples llamadas simultáneas
    if (isLoading) {
      console.log('Message sending already in progress, ignoring duplicate call');
      return;
    }
    
    try {
      console.log(`=== Starting handleSendMessage [${callId}] ===`);
      console.log('Input text:', inputText);
      console.log('Current conversation ID:', currentConversationId);
      console.log('Available conversations:', conversations.map(c => c.id));

      // Step 1: Determine or create the target conversation
      let targetConversationId = currentConversationId;
      let conversationWasCreated = false;

      // Check if currentConversationId exists in the user's conversations
      const conversationExists = conversations.some(c => c.id === currentConversationId);
      
      if (!targetConversationId || !conversationExists) {
        console.log('No current conversation or conversation not found, creating new one...');
        const generatedTitle = await generateConversationTitle(inputText);
        const newConversation = await createConversation(generatedTitle);
        
        if (!newConversation) {
          console.error('Failed to create conversation');
          onError('No se pudo crear la conversación.');
          return;
        }
        
        targetConversationId = newConversation.id;
        conversationWasCreated = true;
        console.log('Created new conversation:', targetConversationId, 'with title:', generatedTitle);
      } else {
        // Update title if this is the first real message in an existing conversation
        const currentConversation = conversations.find(c => c.id === targetConversationId);
        if (currentConversation?.title === 'Nueva conversación' && messages.length <= 1) {
          console.log('Updating conversation title for existing conversation');
          const generatedTitle = await generateConversationTitle(inputText);
          await updateConversationTitle(targetConversationId, generatedTitle);
        }
      }

      // Step 2: Create user message
      const userMessage = createUserMessage(inputText);
      console.log('Created user message:', userMessage.id);

      // Step 3: Process the message with the specific conversation ID
      console.log('Processing message for conversation:', targetConversationId);
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

      // Step 4: Update the current conversation ID if we created a new one
      if (conversationWasCreated) {
        console.log('Setting current conversation ID to newly created:', targetConversationId);
        setCurrentConversationId(targetConversationId);
      }

      console.log('=== handleSendMessage completed successfully ===');

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
      initializeChatSession();
    }
  }, [isGeminiReady, initializeChatSession]);

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


import { useState, useRef, useEffect } from 'react';
import { Chat as GeminiChat } from '@google/genai';
import { CustomChatConfig } from '../types';
import { useMessages } from './useMessages';
import { useConversations } from './useConversations';
import { useMessageHandling } from './useMessageHandling';
import { useChatInitialization } from './useChatInitialization';
import { useChatActions } from './useChatActions';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const geminiChatSessionRef = useRef<GeminiChat | null>(null);

  // Usar hooks de conversaciones y mensajes
  const { 
    conversations, 
    currentConversationId, 
    setCurrentConversationId,
    createConversation 
  } = useConversations();
  
  const { 
    messages, 
    addMessage, 
    updateMessage, 
    clearMessages, 
    setMessages 
  } = useMessages(currentConversationId);

  // Usar hooks especializados
  const { initializeChatAndGreet } = useChatInitialization(
    isGeminiReady,
    onError,
    onGeminiReadyChange,
    geminiChatSessionRef
  );

  const { handleSendMessage, handleSeeMoreEvents } = useMessageHandling(
    chatConfig,
    isGeminiReady,
    onError,
    onGeminiReadyChange,
    geminiChatSessionRef,
    addMessage,
    setMessages,
    createConversation,
    currentConversationId
  );

  const { handleClearMessages, handleNewChat } = useChatActions(
    clearMessages,
    createConversation
  );

  // Wrapper para manejar el estado de loading
  const handleSendMessageWithLoading = async (inputText: string) => {
    setIsLoading(true);
    try {
      await handleSendMessage(inputText);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize chat when ready
  useEffect(() => {
    if (isGeminiReady) {
      initializeChatAndGreet(chatConfig, userLocation, messages);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGeminiReady, chatConfig, userLocation]);

  return {
    messages,
    isLoading,
    handleSendMessage: handleSendMessageWithLoading,
    handleSeeMoreEvents,
    clearMessages: handleClearMessages,
    setMessages,
    handleNewChat,
    conversations,
    currentConversationId,
    setCurrentConversationId
  };
};

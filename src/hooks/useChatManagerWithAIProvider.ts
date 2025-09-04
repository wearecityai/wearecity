import { useEffect, useMemo } from 'react';
import { CustomChatConfig } from '../types';
import { useMessages } from './useMessages';
import { useChatSession } from './chat/useChatSession';
import { useMessageHandler } from './chat/useMessageHandler';
import { useMessageHandlerVertex } from './chat/useMessageHandlerVertex';
import { useChatActions } from './chat/useChatActions';
import { useAIProvider } from './useAIProvider';
import { useVertexAI } from './useVertexAI';

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

export const useChatManagerWithAIProvider = (
  chatConfig: CustomChatConfig,
  userLocation: UserLocation | null,
  onError: (error: string) => void,
  conversationFunctions: ConversationFunctions,
  citySlug?: string
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
    isLoading: messagesLoading, 
    addMessage, 
    saveMessageOnly,
    updateMessage, 
    clearMessages, 
    setMessages 
  } = useMessages(currentConversationId);

  // AI Provider management
  const { selectedProvider, isFirebase, isVertex } = useAIProvider();
  
  // Vertex AI status
  const { isReady: isVertexReady } = useVertexAI();

  // Chat session management
  const {
    chatSession,
    isSessionReady,
    resetSession
  } = useChatSession();

  // Message handlers for both providers
  const {
    isLoading: isFirebaseLoading,
    processMessage: processFirebaseMessage
  } = useMessageHandler(chatConfig, onError, () => {}, citySlug);

  const {
    isLoading: isVertexLoading,
    processMessage: processVertexMessage
  } = useMessageHandlerVertex(chatConfig, onError, () => {}, citySlug);

  // Chat actions
  const {
    handleSendMessage,
    handleDownloadPdf,
    handleSeeMoreEvents,
    handleSetLanguageCode
  } = useChatActions(
    conversations,
    currentConversationId,
    setCurrentConversationId,
    createConversation,
    updateConversationTitle,
    messages,
    setMessages
  );

  // Determine which AI provider to use and its readiness
  const currentAIProvider = useMemo(() => {
    if (isVertex && isVertexReady) {
      return {
        provider: 'vertex' as const,
        isReady: isVertexReady,
        isLoading: isVertexLoading,
        processMessage: processVertexMessage
      };
    } else {
      return {
        provider: 'firebase' as const,
        isReady: true, // Firebase AI is always ready
        isLoading: isFirebaseLoading,
        processMessage: processFirebaseMessage
      };
    }
  }, [isVertex, isVertexReady, isVertexLoading, isFirebaseLoading, processVertexMessage, processFirebaseMessage]);

  // Override handleSendMessage to use the current AI provider
  const handleSendMessageWithAIProvider = async (message: string) => {
    if (!currentAIProvider.isReady) {
      onError(`El proveedor de IA ${currentAIProvider.provider === 'vertex' ? 'Vertex AI' : 'Firebase AI'} no está disponible`);
      return;
    }

    try {
      await currentAIProvider.processMessage(
        chatSession,
        message,
        {
          id: crypto.randomUUID(),
          role: 'user' as const,
          content: message,
          timestamp: new Date()
        },
        addMessage,
        saveMessageOnly,
        setMessages,
        currentAIProvider.isReady,
        currentConversationId || 'default',
        messages
      );
    } catch (error) {
      console.error('Error processing message with AI provider:', error);
      onError('Error al procesar el mensaje. Por favor, intenta de nuevo.');
    }
  };

  // Reset session when AI provider changes
  useEffect(() => {
    resetSession();
  }, [selectedProvider, resetSession]);

  // Auto-create conversation if none exists
  useEffect(() => {
    if (!currentConversationId && conversations.length === 0) {
      createConversation('Nueva conversación');
    }
  }, [currentConversationId, conversations.length, createConversation]);

  return {
    // Messages
    messages,
    isLoading: messagesLoading || currentAIProvider.isLoading,
    addMessage,
    saveMessageOnly,
    updateMessage,
    clearMessages,
    setMessages,

    // Chat session
    chatSession,
    isSessionReady,
    resetSession,

    // AI Provider
    selectedProvider,
    currentAIProvider,
    isFirebase,
    isVertex,
    isVertexReady,

    // Actions
    handleSendMessage: handleSendMessageWithAIProvider,
    handleDownloadPdf,
    handleSeeMoreEvents,
    handleSetLanguageCode,

    // Conversations
    conversations,
    currentConversationId,
    setCurrentConversationId,
    createConversation,
    updateConversationTitle
  };
};

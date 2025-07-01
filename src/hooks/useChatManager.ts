import { useState, useCallback, useRef, useEffect } from 'react';
import { Chat as GeminiChat } from '@google/genai';
import { ChatMessage, MessageRole, CustomChatConfig } from '../types';
import { initChatSession, sendMessageToGeminiStream } from '../services/geminiService';
import { API_KEY_ERROR_MESSAGE } from '../constants';
import { useSystemInstructionBuilder } from './useSystemInstructionBuilder';
import { useMessageParser } from './useMessageParser';
import { useErrorHandler } from './useErrorHandler';
import { useMessages } from './useMessages';
import { useConversations } from './useConversations';

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

  const { buildFullSystemInstruction } = useSystemInstructionBuilder();
  const { parseAIResponse, handleSeeMoreEvents: parseHandleSeeMoreEvents, clearEventTracking } = useMessageParser();
  const { getFriendlyError } = useErrorHandler();
  
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
    saveMessageOnly, // Use the new function for saving without adding to local state
    updateMessage, 
    clearMessages, 
    setMessages 
  } = useMessages(currentConversationId);

  const initializeChatAndGreet = useCallback(async (
    configToUse: CustomChatConfig,
    location: UserLocation | null,
    currentMessages: ChatMessage[]
  ) => {
    if (!isGeminiReady) {
      onError(API_KEY_ERROR_MESSAGE);
      return;
    }
    try {
      const fullSystemInstruction = buildFullSystemInstruction(configToUse, location);
      geminiChatSessionRef.current = initChatSession(fullSystemInstruction, configToUse.enableGoogleSearch);

      if (currentMessages.length === 0) {
          // No automatic greeting for Gemini clone UI, empty state is handled by MessageList/App
      }
    } catch (e: any) {
      console.error("Gemini Initialization error:", e);
      const errorMessage = getFriendlyError(e, "Error al inicializar el chat con Gemini.");
      onError(errorMessage);
      if (errorMessage === API_KEY_ERROR_MESSAGE) onGeminiReadyChange(false);
    }
  }, [isGeminiReady, buildFullSystemInstruction, onError, onGeminiReadyChange, getFriendlyError]);

  const handleSendMessage = async (inputText: string) => {
    if (!geminiChatSessionRef.current || isLoading || !isGeminiReady) {
        if (!isGeminiReady) onError(API_KEY_ERROR_MESSAGE);
        return;
    }

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

    // 1. CREATE AND SAVE USER MESSAGE
    const userMessage: ChatMessage = { 
      id: crypto.randomUUID(), 
      role: MessageRole.User, 
      content: inputText, 
      timestamp: new Date() 
    };
    
    console.log('Creating user message:', userMessage.id);
    try {
      // Add to local state and save to database
      await addMessage(userMessage);
      console.log('User message added and saved successfully');
    } catch (e) {
      console.error('Error saving user message:', e);
      onError('No se pudo guardar tu mensaje. Intenta de nuevo.');
      return;
    }

    setIsLoading(true);
    
    // 2. CREATE TEMPORARY AI MESSAGE FOR UI DISPLAY
    const aiTempId = crypto.randomUUID();
    const tempAiMessage: ChatMessage = { 
      id: aiTempId, 
      role: MessageRole.Model, 
      content: '', 
      timestamp: new Date(), 
      isTyping: true 
    };
    
    // Add temporary message only to UI (not to database)
    console.log('Adding temporary AI message to UI:', aiTempId);
    setMessages(prev => [...prev, tempAiMessage]);
    
    let accumulatedContent = '';

    try {
      await sendMessageToGeminiStream(
        geminiChatSessionRef.current, 
        inputText,
        // Callback for text chunks (streaming)
        (chunkText) => {
          accumulatedContent += chunkText;
          // Update temporary message in UI
          setMessages(prev => prev.map(msg => 
            msg.id === aiTempId 
              ? { ...msg, content: accumulatedContent, isTyping: true } 
              : msg
          ));
        },
        // Callback when complete response is finished
        async (finalResponse) => {
          console.log('AI finished responding, processing final response');
          
          // Process AI response
          const parsedResponse = parseAIResponse(accumulatedContent, finalResponse, chatConfig, inputText);

          // 3. CREATE FINAL AI MESSAGE FOR DATABASE STORAGE
          const finalAiMessage: ChatMessage = {
            id: crypto.randomUUID(), // New ID for persistent message
            role: MessageRole.Model, 
            content: parsedResponse.processedContent, 
            timestamp: new Date(),
            groundingMetadata: parsedResponse.finalGroundingMetadata, 
            mapQuery: parsedResponse.mapQueryFromAI,
            events: parsedResponse.eventsForThisMessage.length > 0 ? parsedResponse.eventsForThisMessage : undefined,
            placeCards: parsedResponse.placeCardsForMessage.length > 0 ? parsedResponse.placeCardsForMessage : undefined,
            downloadablePdfInfo: parsedResponse.downloadablePdfInfoForMessage, 
            telematicProcedureLink: parsedResponse.telematicLinkForMessage,
            showSeeMoreButton: parsedResponse.showSeeMoreButtonForThisMessage, 
            originalUserQueryForEvents: parsedResponse.storedUserQueryForEvents,
          };
          
          console.log('Saving final AI response to database only:', finalAiMessage.id);
          
          // 4. SAVE TO DATABASE ONLY, THEN REPLACE TEMPORARY MESSAGE IN UI
          try {
            // Save to database without adding to local state
            await saveMessageOnly(finalAiMessage);
            console.log('AI response saved successfully to database');
            
            // Then update UI by replacing temporary with final
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiTempId ? finalAiMessage : msg
              )
            );
            
          } catch (e) {
            console.error('Error saving AI response:', e);
            
            // If error saving, show message in UI but mark the error
            setMessages(prev => prev.map(msg => 
              msg.id === aiTempId 
                ? { 
                    ...finalAiMessage, 
                    id: aiTempId, // Keep temporary ID
                    error: 'No se pudo guardar la respuesta' 
                  }
                : msg
            ));
            
            onError('No se pudo guardar la respuesta de la IA.');
          }
          
          setIsLoading(false);
        },
        // Callback for API errors
        async (apiError) => {
          console.error("Gemini API error:", apiError);
          const friendlyApiError = getFriendlyError(apiError, `Error: ${apiError.message}`);
          
          // 5. CREATE ERROR MESSAGE AND SAVE IT
          const errorAiMessage: ChatMessage = { 
            id: crypto.randomUUID(), 
            role: MessageRole.Model, 
            content: '', 
            timestamp: new Date(), 
            error: friendlyApiError 
          };
          
          console.log('Saving AI error message to database only');
          try {
            await saveMessageOnly(errorAiMessage);
            
            // Replace temporary message with error message
            setMessages(prev => prev.map(msg => 
              msg.id === aiTempId ? errorAiMessage : msg
            ));
            
          } catch (e) {
            console.error('Error saving error message:', e);
            
            // If can't save, at least show in UI
            setMessages(prev => prev.map(msg => 
              msg.id === aiTempId 
                ? { ...errorAiMessage, id: aiTempId }
                : msg
            ));
          }
          
          if (friendlyApiError === API_KEY_ERROR_MESSAGE) { 
            onError(API_KEY_ERROR_MESSAGE); 
            onGeminiReadyChange(false); 
          } else {
            onError(friendlyApiError);
          }
          setIsLoading(false);
        }
      );
    } catch (e: any) {
        console.error("General error sending message:", e);
        const errorMsg = getFriendlyError(e, "Error al enviar mensaje.");
        
        const errorAiMessage: ChatMessage = { 
          id: crypto.randomUUID(), 
          role: MessageRole.Model, 
          content: '', 
          timestamp: new Date(), 
          error: errorMsg 
        };
        
        try {
          await saveMessageOnly(errorAiMessage);
          setMessages(prev => prev.map(msg => 
            msg.id === aiTempId ? errorAiMessage : msg
          ));
        } catch (err) {
          console.error('Error saving error message:', err);
          setMessages(prev => prev.map(msg => 
            msg.id === aiTempId 
              ? { ...errorAiMessage, id: aiTempId }
              : msg
          ));
        }
        
        onError(errorMsg);
        if (errorMsg === API_KEY_ERROR_MESSAGE) onGeminiReadyChange(false);
        setIsLoading(false);
    }
  };

  const handleSeeMoreEvents = (originalUserQuery?: string) => {
    parseHandleSeeMoreEvents(originalUserQuery, handleSendMessage);
  };

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
    handleSendMessage,
    handleSeeMoreEvents,
    clearMessages: handleClearMessages,
    setMessages,
    handleNewChat,
    conversations,
    currentConversationId,
    setCurrentConversationId
  };
};

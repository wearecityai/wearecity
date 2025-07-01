
import { useState } from 'react';
import { ChatMessage, MessageRole, CustomChatConfig } from '../../types';
import { sendMessageToGeminiStream } from '../../services/geminiService';
import { API_KEY_ERROR_MESSAGE } from '../../constants';
import { useMessageParser } from '../useMessageParser';
import { useErrorHandler } from '../useErrorHandler';

export const useMessageHandler = (
  chatConfig: CustomChatConfig,
  onError: (error: string) => void,
  onGeminiReadyChange: (ready: boolean) => void
) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { parseAIResponse } = useMessageParser();
  const { getFriendlyError } = useErrorHandler();

  const processMessage = async (
    geminiChatSession: any,
    inputText: string,
    userMessage: ChatMessage,
    addMessage: (message: ChatMessage, targetConversationId?: string) => Promise<void>,
    saveMessageOnly: (message: ChatMessage, targetConversationId?: string) => Promise<void>,
    setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void,
    isGeminiReady: boolean,
    conversationId?: string
  ) => {
    if (!geminiChatSession || isLoading || !isGeminiReady) {
      if (!isGeminiReady) onError(API_KEY_ERROR_MESSAGE);
      return;
    }

    if (!conversationId) {
      onError('No se pudo determinar la conversación para guardar el mensaje.');
      return;
    }

    // Add user message to local state and save to database with specific conversation ID
    console.log('Creating user message:', userMessage.id, 'for conversation:', conversationId);
    try {
      await addMessage(userMessage, conversationId);
      console.log('User message added and saved successfully to conversation:', conversationId);
    } catch (e) {
      console.error('Error saving user message:', e);
      onError('No se pudo guardar tu mensaje. Intenta de nuevo.');
      return;
    }

    setIsLoading(true);
    
    // Create temporary AI message for UI display
    const aiTempId = crypto.randomUUID();
    const tempAiMessage: ChatMessage = { 
      id: aiTempId, 
      role: MessageRole.Model, 
      content: '', 
      timestamp: new Date(), 
      isTyping: true 
    };
    
    console.log('Adding temporary AI message to UI:', aiTempId);
    setMessages(prev => [...prev, tempAiMessage]);
    
    let accumulatedContent = '';

    try {
      await sendMessageToGeminiStream(
        geminiChatSession, 
        inputText,
        // Streaming callback
        (chunkText) => {
          accumulatedContent += chunkText;
          setMessages(prev => prev.map(msg => 
            msg.id === aiTempId 
              ? { ...msg, content: accumulatedContent, isTyping: true } 
              : msg
          ));
        },
        // Complete callback
        async (finalResponse) => {
          console.log('AI finished responding, processing final response for conversation:', conversationId);
          
          const parsedResponse = parseAIResponse(accumulatedContent, finalResponse, chatConfig, inputText);

          const finalAiMessage: ChatMessage = {
            id: crypto.randomUUID(),
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
          
          console.log('Saving final AI response to database only:', finalAiMessage.id, 'for conversation:', conversationId);
          
          try {
            await saveMessageOnly(finalAiMessage, conversationId);
            console.log('AI response saved successfully to database for conversation:', conversationId);
            
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiTempId ? finalAiMessage : msg
              )
            );
            
          } catch (e) {
            console.error('Error saving AI response:', e);
            
            setMessages(prev => prev.map(msg => 
              msg.id === aiTempId 
                ? { 
                    ...finalAiMessage, 
                    id: aiTempId,
                    error: 'No se pudo guardar la respuesta' 
                  }
                : msg
            ));
            
            onError('No se pudo guardar la respuesta de la IA.');
          }
          
          setIsLoading(false);
        },
        // Error callback
        async (apiError) => {
          console.error("Gemini API error:", apiError);
          const friendlyApiError = getFriendlyError(apiError, `Error: ${apiError.message}`);
          
          const errorAiMessage: ChatMessage = { 
            id: crypto.randomUUID(), 
            role: MessageRole.Model, 
            content: '', 
            timestamp: new Date(), 
            error: friendlyApiError 
          };
          
          console.log('Saving AI error message to database only for conversation:', conversationId);
          try {
            await saveMessageOnly(errorAiMessage, conversationId);
            
            setMessages(prev => prev.map(msg => 
              msg.id === aiTempId ? errorAiMessage : msg
            ));
            
          } catch (e) {
            console.error('Error saving error message:', e);
            
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
        await saveMessageOnly(errorAiMessage, conversationId);
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

  return {
    isLoading,
    processMessage
  };
};

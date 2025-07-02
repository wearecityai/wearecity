
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatSession {
  messages: ChatMessage[];
  sendMessage: (message: string) => Promise<string>;
  sendMessageStream: (
    message: string,
    onChunk: (chunk: string, isFirst: boolean) => void,
    onEnd: () => void,
    onError: (error: Error) => void
  ) => Promise<void>;
}

/**
 * Initializes the Gemini service (now using edge function proxy)
 */
export const initializeGeminiService = (): boolean => {
  console.log("Gemini service initialized (using edge function proxy).");
  return true;
};

/**
 * Creates a new chat session
 */
export const initChatSession = (
  customSystemInstruction?: string, 
  enableGoogleSearch?: boolean,
  allowMapDisplay?: boolean
): ChatSession => {
  const messages: ChatMessage[] = [];

  const sendMessage = async (message: string): Promise<string> => {
    messages.push({ role: 'user', content: message });

    try {
      const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: {
          messages: messages,
          systemInstruction: customSystemInstruction,
          enableGoogleSearch,
          allowMapDisplay,
          stream: false
        }
      });

      if (error) {
        console.error('Error calling gemini-proxy:', error);
        throw new Error('Failed to get response from AI');
      }

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from AI');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      messages.push({ role: 'model', content: responseText });
      
      return responseText;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  };

  const sendMessageStream = async (
    message: string,
    onChunk: (chunk: string, isFirst: boolean) => void,
    onEnd: () => void,
    onError: (error: Error) => void
  ): Promise<void> => {
    messages.push({ role: 'user', content: message });

    try {
      console.log('Starting streaming request to gemini-proxy...');
      
      // Use supabase.functions.invoke for streaming
      const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: {
          messages: messages,
          systemInstruction: customSystemInstruction,
          enableGoogleSearch,
          allowMapDisplay,
          stream: true
        }
      });

      if (error) {
        console.error('Error calling gemini-proxy for streaming:', error);
        throw new Error(`Failed to get streaming response from AI: ${error.message}`);
      }

      // For streaming responses, the data should contain the streamed text
      if (typeof data === 'string') {
        console.log('Received streaming response, length:', data.length);
        let responseText = data;
        messages.push({ role: 'model', content: responseText });
        
        // Call onChunk with the complete response
        onChunk(responseText, true);
        onEnd();
      } else if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        // Handle non-streaming response format
        const responseText = data.candidates[0].content.parts[0].text;
        console.log('Received non-streaming response, length:', responseText.length);
        messages.push({ role: 'model', content: responseText });
        
        onChunk(responseText, true);
        onEnd();
      } else {
        console.error('Invalid response format from streaming API:', data);
        throw new Error('Invalid response format from AI');
      }

    } catch (error) {
      console.error('Error in sendMessageStream:', error);
      onError(error instanceof Error ? error : new Error('Unknown streaming error'));
    }
  };

  return {
    messages,
    sendMessage,
    sendMessageStream
  };
};

// Legacy function for backward compatibility
export const sendMessageToGeminiStream = async (
  chat: ChatSession,
  message: string,
  onChunk: (chunkText: string, isFirstChunk: boolean) => void,
  onEnd: (finalResponse?: any) => void,
  onError: (error: Error) => void
): Promise<void> => {
  await chat.sendMessageStream(message, onChunk, onEnd, onError);
};

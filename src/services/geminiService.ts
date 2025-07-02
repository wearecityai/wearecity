
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
  // No longer need to initialize with API key since it's handled by edge function
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
      const response = await fetch(`https://irghpvvoparqettcnpnh.supabase.co/functions/v1/gemini-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          systemInstruction: customSystemInstruction,
          enableGoogleSearch,
          allowMapDisplay,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let isFirstChunk = true;
      let responseText = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.substring(6);
                if (jsonStr.trim() === '[DONE]') continue;
                
                const data = JSON.parse(jsonStr);
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                  const text = data.candidates[0].content.parts[0].text;
                  if (text) {
                    responseText += text;
                    onChunk(text, isFirstChunk);
                    isFirstChunk = false;
                  }
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }

        messages.push({ role: 'model', content: responseText });
        onEnd();
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error in sendMessageStream:', error);
      onError(error instanceof Error ? error : new Error('Unknown error'));
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

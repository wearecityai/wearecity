
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
    onError: (error: Error) => void,
    retryCount: number = 0
  ): Promise<void> => {
    const maxRetries = 3; // Increased retry count
    messages.push({ role: 'user', content: message });

    console.log(`=== Starting sendMessageStream (attempt ${retryCount + 1}/${maxRetries + 1}) ===`);
    console.log('Message:', message.substring(0, 100));
    console.log('Current session messages count:', messages.length);

    try {
      // Get the current session to use the auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }

      console.log('Making request to gemini-proxy...');
      const response = await fetch(`https://irghpvvoparqettcnpnh.supabase.co/functions/v1/gemini-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
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
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let isFirstChunk = true;
      let responseText = '';
      let hasReceivedData = false;
      let streamTimeout: NodeJS.Timeout;

      console.log('Starting to read stream...');

      // Set a timeout for the entire streaming process with exponential backoff
      const timeoutDuration = 30000 + (retryCount * 10000); // Increase timeout on retries
      const streamPromise = new Promise<void>((resolve, reject) => {
        streamTimeout = setTimeout(() => {
          console.error(`Stream timeout after ${timeoutDuration}ms (attempt ${retryCount + 1})`);
          reject(new Error('Stream timeout'));
        }, timeoutDuration);

        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log('Stream completed, done=true');
                break;
              }

              hasReceivedData = true;
              const chunk = new TextDecoder().decode(value);
              console.log('Received chunk length:', chunk.length);
              
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const jsonStr = line.substring(6).trim();
                    if (jsonStr === '[DONE]') {
                      console.log('Received [DONE] marker');
                      continue;
                    }
                    
                    if (jsonStr === '') continue; // Skip empty data lines
                    
                    const data = JSON.parse(jsonStr);
                    console.log('Parsed data:', data);
                    
                    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                      const text = data.candidates[0].content.parts[0].text;
                      if (text) {
                        console.log('Received text chunk:', text.substring(0, 50));
                        responseText += text;
                        onChunk(text, isFirstChunk);
                        isFirstChunk = false;
                        
                        // Reset timeout on each successful chunk
                        clearTimeout(streamTimeout);
                        streamTimeout = setTimeout(() => {
                          console.error('Stream timeout after receiving data');
                          reject(new Error('Stream timeout'));
                        }, 30000);
                      }
                    } else if (data.error) {
                      console.error('Gemini API error in stream:', data.error);
                      throw new Error(`Gemini API error: ${JSON.stringify(data.error)}`);
                    }
                  } catch (parseError) {
                    console.warn('Failed to parse SSE data:', parseError, 'Line:', line);
                  }
                }
              }
            }
            
            clearTimeout(streamTimeout);
            resolve();
          } catch (error) {
            clearTimeout(streamTimeout);
            reject(error);
          } finally {
            try {
              reader.releaseLock();
            } catch (e) {
              console.warn('Error releasing reader lock:', e);
            }
          }
        };

        readStream();
      });

      await streamPromise;

      // Validate that we received meaningful content
      if (!hasReceivedData || responseText.trim().length === 0) {
        throw new Error('No valid response data received from stream');
      }

      console.log('Stream completed successfully. Response length:', responseText.length);
      messages.push({ role: 'model', content: responseText });
      onEnd();

    } catch (error) {
      console.error(`Error in sendMessageStream (attempt ${retryCount + 1}):`, error);
      
      // Remove the user message we added at the start if this was the final attempt
      if (retryCount >= maxRetries) {
        messages.pop();
      }
      
      // Retry logic
      if (retryCount < maxRetries && 
          (error instanceof Error && 
           (error.message.includes('timeout') || 
            error.message.includes('HTTP error') || 
            error.message.includes('No valid response data')))) {
        
        console.log(`Retrying request (${retryCount + 1}/${maxRetries})...`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        
        // Remove the message we added so we don't duplicate it
        messages.pop();
        
        return sendMessageStream(message, onChunk, onEnd, onError, retryCount + 1);
      }
      
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

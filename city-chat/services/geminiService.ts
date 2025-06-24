
import { GoogleGenAI, Chat, GenerateContentResponse, Tool } from "@google/genai";
import { 
  GEMINI_MODEL_NAME, 
  INITIAL_SYSTEM_INSTRUCTION, 
  API_KEY_ERROR_MESSAGE, // This constant can still be used for generic error messages
  SHOW_MAP_PROMPT_SYSTEM_INSTRUCTION
} from '../constants';

// Hardcoded API key
const HARDCODED_API_KEY = "AIzaSyBHL5n8B2vCcQIZKVVLE2zVBgS4aYclt7g";

let ai: GoogleGenAI | null = null;

/**
 * Initializes the GoogleGenAI service with the hardcoded API key.
 * @returns True if initialization was successful, false otherwise.
 */
export const initializeGeminiService = (): boolean => {
  try {
    ai = new GoogleGenAI({ apiKey: HARDCODED_API_KEY });
    console.log("Servicio Gemini inicializado exitosamente.");
    return true;
  } catch (error) {
    console.error("Error al inicializar Gemini con la clave API:", error);
    ai = null;
    return false;
  }
};

/**
 * Gets the initialized GoogleGenAI instance.
 * Throws an error if the service has not been initialized.
 * @returns The GoogleGenAI instance.
 */
const getInternalAiInstance = (): GoogleGenAI => {
  if (!ai) {
    // This error should ideally be prevented by App.tsx ensuring initializeGeminiService was called and successful.
    throw new Error("El servicio Gemini no está inicializado. Por favor, configura la API Key primero.");
  }
  return ai;
};

export const initChatSession = (
  customSystemInstruction?: string, 
  enableGoogleSearch?: boolean,
  allowMapDisplay?: boolean
): Chat => {
  const currentAi = getInternalAiInstance(); // Uses the initialized instance
  const tools: Tool[] = [];
  if (enableGoogleSearch) {
    tools.push({ googleSearch: {} });
  }

  let systemInstructionParts: string[] = [];
  if (customSystemInstruction && customSystemInstruction.trim() !== "") {
    systemInstructionParts.push(customSystemInstruction.trim());
  }
  
  if (allowMapDisplay) {
    systemInstructionParts.push(SHOW_MAP_PROMPT_SYSTEM_INSTRUCTION);
  }

  let finalSystemInstruction: string | undefined = systemInstructionParts.join("\n\n").trim();

  if (!finalSystemInstruction && !enableGoogleSearch && !allowMapDisplay) { 
      finalSystemInstruction = INITIAL_SYSTEM_INSTRUCTION;
  }
  if (finalSystemInstruction === "") finalSystemInstruction = undefined;


  return currentAi.chats.create({
    model: GEMINI_MODEL_NAME,
    config: {
      ...(finalSystemInstruction ? { systemInstruction: finalSystemInstruction } : {}),
      ...(tools.length > 0 ? { tools } : {}),
    },
  });
};

export const sendMessageToGeminiStream = async (
  chat: Chat,
  message: string,
  onChunk: (chunkText: string, isFirstChunk: boolean) => void,
  onEnd: (finalResponse?: GenerateContentResponse) => void,
  onError: (error: Error) => void
): Promise<void> => {
  // getInternalAiInstance() is implicitly called by initChatSession,
  // so if chat object exists, AI service should be initialized.
  try {
    const stream = await chat.sendMessageStream({ message });
    
    let isFirstChunkForThisStream = true;
    let lastChunk: GenerateContentResponse | undefined = undefined;

    for await (const chunk of stream) {
      lastChunk = chunk; 
      const text = chunk.text; 
      if (typeof text === 'string') {
        onChunk(text, isFirstChunkForThisStream);
        if (isFirstChunkForThisStream) {
          isFirstChunkForThisStream = false;
        }
      }
    }
    onEnd(lastChunk);

  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    if (error instanceof Error) {
      onError(error);
    } else {
      onError(new Error('An unknown error occurred with Gemini API'));
    }
  }
};

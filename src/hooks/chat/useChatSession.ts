// Este hook ya no es necesario porque la sesión Gemini se gestiona en el backend
export const useChatSession = () => {
  return {
    geminiChatSessionRef: { current: null },
    initializeChatSession: () => {}
  };
};

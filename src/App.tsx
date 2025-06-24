
import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { initializeGeminiService } from '../city-chat/services/geminiService';
import CityChat from '../city-chat/App';

// Import the themed app wrapper from city-chat
import '../city-chat/index.tsx';

const App = () => {
  useEffect(() => {
    // Initialize Gemini service automatically with hardcoded API key
    initializeGeminiService();
  }, []);

  return (
    <BrowserRouter>
      <div id="city-chat-root">
        {/* The city-chat app will be rendered here by its own index.tsx */}
      </div>
    </BrowserRouter>
  );
};

export default App;

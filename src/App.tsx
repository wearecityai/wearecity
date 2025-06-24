
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import CityChat from '../city-chat/App';

// Import the themed app wrapper from city-chat
import '../city-chat/index.tsx';

const App = () => {
  return (
    <BrowserRouter>
      <div id="city-chat-root">
        {/* The city-chat app will be rendered here by its own index.tsx */}
      </div>
    </BrowserRouter>
  );
};

export default App;

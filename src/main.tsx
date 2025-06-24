import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// The city-chat app will handle its own rendering
// This file is kept for compatibility but the actual app is in city-chat/index.tsx

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

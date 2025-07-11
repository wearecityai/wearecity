import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Scroll hack para intentar ocultar la barra inferior de Safari en iOS
function isIosSafari() {
  const ua = window.navigator.userAgent;
  return /iP(ad|hone|od)/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/.test(ua);
}

window.addEventListener('load', () => {
  if (isIosSafari()) {
    setTimeout(() => {
      window.scrollTo(0, 1);
    }, 150);
  }
});

// The city-chat app will handle its own rendering
// This file is kept for compatibility but the actual app is in city-chat/index.tsx

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

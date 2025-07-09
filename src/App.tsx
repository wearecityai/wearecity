import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from './theme/ThemeProvider';
import Index from '@/pages/Index';
import AuthPage from '@/components/auth/AuthPage';
import ProfilePage from '@/components/auth/ProfilePage';
import { CityChat } from '@/pages/CityChat';
import { PublicChatPage } from '@/pages/PublicChatPage';

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/city/:citySlug" element={<CityChat />} />
            <Route path="/chat/:chatSlug" element={<PublicChatPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

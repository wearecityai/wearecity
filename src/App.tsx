import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from './theme/ThemeProvider';
import Index from '@/pages/Index';
import AuthPage from '@/components/auth/AuthPage';
import { CityChat } from '@/pages/CityChat';
import { PublicChatPage } from '@/pages/PublicChatPage';
import NotFound from '@/pages/NotFound';
import AdminPage from '@/pages/AdminPage';

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/city/:citySlug" element={<CityChat />} />
            <Route path="/chat/:chatSlug" element={<PublicChatPage />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from './theme/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';

import Index from '@/pages/Index';
import AuthPage from '@/components/auth/AuthPage';
import { CityChat } from '@/pages/CityChat';
import { PublicChatPage } from '@/pages/PublicChatPage';
import NotFound from '@/pages/NotFound';
import AdminPage from '@/pages/AdminPage';
import AppErrorBoundary from '@/components/AppErrorBoundary';

const App = () => {
  return (
    <AppErrorBoundary 
      onError={(error, errorInfo) => {
        console.error('App Error Boundary caught an error:', error, errorInfo);
        
        // Log production errors with context
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          console.log('[PROD ERROR BOUNDARY]', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          });
        }
      }}
    >
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
        <Toaster richColors closeButton />
      </ThemeProvider>
    </AppErrorBoundary>
  );
};

export default App;
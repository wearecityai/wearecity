import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from './theme/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { useAutoLanguage } from '@/hooks/useAutoLanguage';

import PersistentLayout from '@/components/PersistentLayout';
import AuthPage from '@/components/auth/AuthPage';
import NotFound from '@/pages/NotFound';
import AppErrorBoundary from '@/components/AppErrorBoundary';

const App = () => {
  useAutoLanguage(); // Inicializar detección automática de idioma

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
              {/* Rutas que usan el layout persistente */}
              <Route path="/" element={<PersistentLayout />} />
              <Route path="/admin" element={<PersistentLayout />} />
              <Route path="/chat/:chatSlug" element={<PersistentLayout />} />
              <Route path="/city/:citySlug" element={<PersistentLayout />} />
              
              {/* Rutas independientes */}
              <Route path="/auth" element={<AuthPage />} />
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
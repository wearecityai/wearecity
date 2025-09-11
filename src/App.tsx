import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from './theme/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { useAutoLanguage } from '@/hooks/useAutoLanguage';

import PersistentLayout from '@/components/PersistentLayout';
import AuthPage from '@/components/auth/AuthPage';
import LandingPage from '@/pages/LandingPage';
import SearchCityPage from '@/pages/SearchCityPage';
import NotFound from '@/pages/NotFound';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import { SuperAdminGuard } from '@/components/SuperAdminGuard';
import { SuperAdminRedirect } from '@/components/SuperAdminRedirect';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';

const App = () => {
  useAutoLanguage();
  // console.log('🗺️ FULL APP: App component rendering with all components');
  
  return (
    <AppErrorBoundary 
      onError={(error, errorInfo) => {
        console.error('App Error Boundary caught an error:', error, errorInfo);
        
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
            <SuperAdminRedirect>
              <Routes>
              {/* Landing page */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Search city page (sin sidebar) */}
              <Route path="/searchcity" element={<SearchCityPage />} />
              
              {/* SuperAdmin route (protected and independent) */}
              <Route path="/superadmin" element={
                <SuperAdminGuard>
                  <SuperAdminDashboard />
                </SuperAdminGuard>
              } />
              
              {/* Rutas que usan el layout persistente (con sidebar) */}
              <Route path="/admin" element={<PersistentLayout />} />
              <Route path="/admin/:citySlug" element={<PersistentLayout />} />
              <Route path="/admin/metrics" element={<PersistentLayout />} />
              <Route path="/chat/:chatSlug" element={<PersistentLayout />} />
              <Route path="/city/:citySlug" element={<PersistentLayout />} />
              
              {/* Rutas independientes */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </SuperAdminRedirect>
          </AuthProvider>
        </BrowserRouter>
        <Toaster richColors closeButton />
      </ThemeProvider>
    </AppErrorBoundary>
  );
};

export default App;
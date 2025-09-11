import React from 'react';
import { useAuth } from '@/hooks/useAuthFirebase';
import { Navigate } from 'react-router-dom';

interface SuperAdminGuardProps {
  children: React.ReactNode;
}

export const SuperAdminGuard: React.FC<SuperAdminGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // Still loading authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Only allow access to wearecity.ai@gmail.com
  const isSuperAdmin = user?.email === 'wearecity.ai@gmail.com';

  if (!user || !isSuperAdmin) {
    // Redirect to home if not authorized
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
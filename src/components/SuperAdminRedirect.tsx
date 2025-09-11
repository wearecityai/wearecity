import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuthFirebase';
import { useNavigate, useLocation } from 'react-router-dom';

interface SuperAdminRedirectProps {
  children: React.ReactNode;
}

export const SuperAdminRedirect: React.FC<SuperAdminRedirectProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if user is authenticated, not loading, and is the superadmin
    if (!isLoading && user && user.email === 'wearecity.ai@gmail.com') {
      // Don't redirect if already on superadmin page or auth pages
      if (location.pathname !== '/superadmin' && 
          location.pathname !== '/auth' && 
          !location.pathname.startsWith('/auth')) {
        console.log('SuperAdmin user detected, redirecting to /superadmin');
        navigate('/superadmin', { replace: true });
      }
    }
  }, [user, isLoading, location.pathname, navigate]);

  return <>{children}</>;
};
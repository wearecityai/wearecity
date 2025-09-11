import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuthFirebase';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from './ui/loading-screen';

interface SuperAdminGuardProps {
  children: React.ReactNode;
}

export const SuperAdminGuard: React.FC<SuperAdminGuardProps> = ({ children }) => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSuperAdminAccess = () => {
      if (isLoading) return;

      if (!user || !profile) {
        navigate('/auth', { replace: true });
        return;
      }

      // Solo permitir acceso si es superadmin
      if (profile.role !== 'superadmin') {
        // Si no es superadmin, redirigir según el rol
        if (profile.role === 'administrativo') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/searchcity', { replace: true });
        }
        return;
      }

      // Verificar que el email sea específicamente wearecity.ai@gmail.com
      if (user.email !== 'wearecity.ai@gmail.com') {
        console.log('❌ Acceso denegado: Email no autorizado para superadmin');
        navigate('/auth', { replace: true });
        return;
      }

      setIsChecking(false);
    };

    checkSuperAdminAccess();
  }, [user, profile, isLoading, navigate]);

  if (isLoading || isChecking) {
    return <LoadingScreen />;
  }

  if (!user || profile?.role !== 'superadmin') {
    return null; // Se redirigirá automáticamente
  }

  return <>{children}</>;
};

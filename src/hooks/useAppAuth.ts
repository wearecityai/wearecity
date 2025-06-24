
import { useCallback } from 'react';

interface User {
  id: string;
  email?: string;
}

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'ciudadano' | 'administrativo';
  created_at: string;
  updated_at: string;
}

interface UseAppAuthProps {
  user?: User | null;
  profile?: Profile | null;
  onLogin?: () => void;
  handleOpenFinetuning: () => void;
}

export const useAppAuth = ({ 
  user, 
  profile, 
  onLogin, 
  handleOpenFinetuning 
}: UseAppAuthProps) => {
  
  const handleOpenFinetuningWithAuth = useCallback(() => {
    console.log('Checking admin access...', { user, profile });
    if (!user || !profile || profile.role !== 'administrativo') {
      console.log('Acceso denegado: Solo los administradores pueden acceder al panel de configuración');
      if (onLogin) {
        onLogin();
      }
      return;
    }
    handleOpenFinetuning();
  }, [user, profile, onLogin, handleOpenFinetuning]);

  return {
    handleOpenFinetuningWithAuth
  };
};

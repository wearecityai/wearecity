import React from 'react';
import FinetuningPage from './FinetuningPage';

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

interface AdminRouteProps {
  user?: User | null;
  profile?: Profile | null;
  chatConfig: any;
  handleSaveCustomization: (newConfig: any, userId: string) => void;
  onCancel: () => void;
  googleMapsScriptLoaded: boolean;
  setCurrentView: React.Dispatch<React.SetStateAction<'chat' | 'finetuning'>>;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  profileImagePreview?: string;
  setProfileImagePreview?: React.Dispatch<React.SetStateAction<string | undefined>>;
}

const AdminRoute: React.FC<AdminRouteProps> = ({
  user,
  profile,
  chatConfig,
  handleSaveCustomization,
  onCancel,
  googleMapsScriptLoaded,
  setCurrentView,
  setIsMenuOpen,
  profileImagePreview,
  setProfileImagePreview
}) => {
  // Check if user has admin access
  if (!user || !profile || profile.role !== 'administrativo') {
    setCurrentView('chat');
    setIsMenuOpen(false);
    return null;
  }
  
  return (
    <FinetuningPage
      currentConfig={chatConfig}
      onSave={(config) => user ? handleSaveCustomization(config, user.id) : undefined}
      onCancel={onCancel}
      googleMapsScriptLoaded={googleMapsScriptLoaded}
      apiKeyForMaps=""
      profileImagePreview={profileImagePreview}
      setProfileImagePreview={setProfileImagePreview}
    />
  );
};

export default AdminRoute;

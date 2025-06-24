
import React from 'react';
import AppContainer from './components/AppContainer';
import { useAppState } from './hooks/useAppState';

// Global callback for Google Maps
(window as any).initMap = () => {
  // console.log("Google Maps API script (potentially) loaded via callback.");
};

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

interface AppProps {
  toggleTheme: () => void;
  currentThemeMode: 'light' | 'dark';
  user?: User | null;
  profile?: Profile | null;
  onLogin?: () => void;
}

const App: React.FC<AppProps> = ({ 
  toggleTheme, 
  currentThemeMode, 
  user = null, 
  profile = null, 
  onLogin 
}) => {
  const appState = useAppState();

  return (
    <AppContainer
      toggleTheme={toggleTheme}
      currentThemeMode={currentThemeMode}
      user={user}
      profile={profile}
      onLogin={onLogin}
      {...appState}
    />
  );
};

export default App;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import UserButton from '@/components/auth/UserButton';
import AppContainer from '../components/AppContainer';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { deepPurple, amber } from '@mui/material/colors';
import { useAppState } from '../hooks/useAppState';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading } = useAuth();
  const [currentThemeMode, setCurrentThemeMode] = React.useState<'light' | 'dark'>('light');
  const appState = useAppState();

  const toggleTheme = () => {
    setCurrentThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const theme = createTheme({
    palette: {
      mode: currentThemeMode,
      primary: {
        main: currentThemeMode === 'light' ? deepPurple[600] : deepPurple[400],
      },
      secondary: {
        main: currentThemeMode === 'light' ? amber[600] : amber[400],
      },
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="relative">
        {user && (
          <div className="absolute top-4 right-4 z-50">
            <UserButton />
          </div>
        )}
        <AppContainer 
          toggleTheme={toggleTheme} 
          currentThemeMode={currentThemeMode}
          user={user}
          profile={profile}
          onLogin={handleLogin}
          theme={theme}
          {...appState}
        />
      </div>
    </ThemeProvider>
  );
};

export default Index;

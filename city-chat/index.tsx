
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { deepPurple, amber } from '@mui/material/colors';
import App from './App';

const ThemedApp = () => {
  const [themeMode, setThemeMode] = React.useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const theme = createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: themeMode === 'light' ? deepPurple[600] : deepPurple[400],
      },
      secondary: {
        main: themeMode === 'light' ? amber[600] : amber[400],
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App toggleTheme={toggleTheme} currentThemeMode={themeMode} />
    </ThemeProvider>
  );
};

// Check if we're in the main app or sub-app context
const rootElement = document.getElementById('city-chat-root') || document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<ThemedApp />);
}

export default ThemedApp;

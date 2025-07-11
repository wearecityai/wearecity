import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import { omitLovProps } from '../lib/omitLovProps';

interface ThemeContextType {
  currentThemeMode: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [currentThemeMode, setCurrentThemeMode] = useState<'light' | 'dark'>('light');

  // Initialize theme based on device preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-mode');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setCurrentThemeMode(savedTheme);
    } else {
      // Use device preference if no saved preference
      setCurrentThemeMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode]);

  const toggleTheme = () => {
    const newMode = currentThemeMode === 'light' ? 'dark' : 'light';
    setCurrentThemeMode(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: currentThemeMode,
          ...(currentThemeMode === 'light'
            ? {
                // Light mode colors
                primary: {
                  main: '#1976d2',
                },
                secondary: {
                  main: '#dc004e',
                },
                background: {
                  default: '#ffffff',
                  paper: '#f5f5f5',
                },
                text: {
                  primary: '#000000',
                  secondary: '#666666',
                },
              }
            : {
                // Dark mode colors
                primary: {
                  main: '#90caf9',
                },
                secondary: {
                  main: '#f48fb1',
                },
                background: {
                  default: '#121212',
                  paper: '#1e1e1e',
                },
                text: {
                  primary: '#ffffff',
                  secondary: '#b0b0b0',
                },
              }),
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundColor: theme.palette.background.default,
                scrollbarColor: currentThemeMode === 'dark' ? '#6b6b6b #2b2b2b' : '#c1c1c1 #f1f1f1',
                '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                  backgroundColor: currentThemeMode === 'dark' ? '#2b2b2b' : '#f1f1f1',
                },
                '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                  borderRadius: 8,
                  backgroundColor: currentThemeMode === 'dark' ? '#6b6b6b' : '#c1c1c1',
                  minHeight: 24,
                  border: `3px solid ${currentThemeMode === 'dark' ? '#2b2b2b' : '#f1f1f1'}`,
                },
                '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
                  backgroundColor: currentThemeMode === 'dark' ? '#959595' : '#a8a8a8',
                },
                '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
                  backgroundColor: currentThemeMode === 'dark' ? '#959595' : '#a8a8a8',
                },
                '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: currentThemeMode === 'dark' ? '#959595' : '#a8a8a8',
                },
              },
            },
          },
        },
      }),
    [currentThemeMode]
  );

  return (
    <ThemeContext.Provider value={{ currentThemeMode, toggleTheme }}>
      <MUIThemeProvider {...omitLovProps({ theme })}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

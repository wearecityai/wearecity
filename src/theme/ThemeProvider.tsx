import React, { createContext, useContext, useEffect, useState } from 'react';

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
  const [currentThemeMode, setCurrentThemeMode] = useState<'light' | 'dark'>('light');

  // Initialize theme based on device preference or saved preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-mode');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setCurrentThemeMode(savedTheme);
    } else {
      // Use device preference if no saved preference
      setCurrentThemeMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, []);

  // Update document class and meta theme-color based on mode
  useEffect(() => {
    const color = currentThemeMode === 'dark' ? '#0f0f0f' : '#f2f2f2';
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);

    // Apply/remove 'dark' class to html element for Tailwind dark mode
    const htmlElement = document.documentElement;
    if (currentThemeMode === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, [currentThemeMode]);

  const toggleTheme = () => {
    const newMode = currentThemeMode === 'light' ? 'dark' : 'light';
    setCurrentThemeMode(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  return (
    <ThemeContext.Provider value={{ currentThemeMode, toggleTheme }}>
      <div className="h-screen bg-background text-foreground overflow-hidden pwa-safe-area" style={{
        height: '100dvh',
        maxHeight: '100dvh'
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
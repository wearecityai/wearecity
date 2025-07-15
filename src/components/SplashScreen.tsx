import React from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

const SplashScreen: React.FC = () => {
  // Detectar dark mode nativo del sistema para evitar parpadeo
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const backgroundColor = isDark ? '#121212' : '#ffffff';
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        bgcolor: backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <CircularProgress size={48} thickness={4} />
    </Box>
  );
};

export default SplashScreen; 
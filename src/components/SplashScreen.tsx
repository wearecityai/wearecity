import React from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

const SplashScreen: React.FC = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        CityCore
      </Typography>
      <CircularProgress
        size={48}
        thickness={4}
        sx={{
          color: theme.palette.primary.main,
        }}
      />
      <Typography variant="body2" sx={{ mt: 3, color: theme.palette.text.secondary }}>
        Cargando...
      </Typography>
    </Box>
  );
};

export default SplashScreen; 
import React from 'react';
import { Box, Typography, Button, Container, Paper, Alert } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

interface ErrorBoundaryFallbackProps {
  error?: Error;
  resetError?: () => void;
}

const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({ 
  error, 
  resetError 
}) => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Container maxWidth="sm" sx={{ 
      minHeight: '100vh',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      py: 4
    }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', width: '100%' }}>
        <ErrorOutline 
          sx={{ 
            fontSize: 64, 
            color: 'error.main', 
            mb: 2 
          }} 
        />
        
        <Typography variant="h4" component="h1" gutterBottom>
          ¡Ups! Algo salió mal
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          La aplicación encontró un error inesperado. 
          Esto puede deberse a un problema temporal.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2" component="pre" sx={{ 
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              fontSize: '0.75rem'
            }}>
              {error.message}
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
          {resetError && (
            <Button
              variant="contained"
              onClick={resetError}
              startIcon={<Refresh />}
            >
              Intentar de nuevo
            </Button>
          )}
          
          <Button
            variant="outlined"
            onClick={handleReload}
            startIcon={<Refresh />}
          >
            Recargar página
          </Button>
        </Box>

        <Typography 
          variant="caption" 
          display="block" 
          color="text.secondary" 
          sx={{ mt: 3 }}
        >
          Si el problema persiste, intenta refrescar la página o contacta con soporte.
        </Typography>
      </Paper>
    </Container>
  );
};

export default ErrorBoundaryFallback;
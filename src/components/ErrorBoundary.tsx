
import React from 'react';
import { Container, Paper, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { API_KEY_ERROR_MESSAGE } from '../constants';

interface ErrorBoundaryProps {
  isGeminiReady: boolean;
  appError: string | null;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ isGeminiReady, appError }) => {
  if (!isGeminiReady && appError === API_KEY_ERROR_MESSAGE) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h5" component="h2" gutterBottom>Error de Configuración</Typography>
          <Typography variant="body1" color="text.secondary" paragraph>{API_KEY_ERROR_MESSAGE}</Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Consulta la documentación para configurar la API_KEY.
            <Button size="small" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Obtén una API Key</Button>
          </Typography>
        </Paper>
      </Container>
    );
  }

  return null;
};

export default ErrorBoundary;

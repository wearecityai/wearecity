
import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Container,
  Alert,
  CircularProgress
} from '@mui/material';
import { LocationCity as LocationCityIcon } from '@mui/icons-material';

interface LoginPageProps {
  onLogin: (apiKey: string) => void;
  error?: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    
    setIsLoading(true);
    try {
      onLogin(apiKey.trim());
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          py: 3
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%', 
            textAlign: 'center',
            borderRadius: 2
          }}
        >
          <LocationCityIcon 
            sx={{ 
              fontSize: 64, 
              color: 'primary.main', 
              mb: 2 
            }} 
          />
          
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            City Chat
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary" paragraph>
            Asistente de IA especializado en información y servicios para ciudades
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="Google Gemini API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ingresa tu API Key de Gemini"
              variant="outlined"
              sx={{ mb: 3 }}
              disabled={isLoading}
              helperText="Necesitas una API Key de Google Gemini para usar esta aplicación"
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={!apiKey.trim() || isLoading}
              sx={{ 
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem'
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
            ¿No tienes una API Key?{' '}
            <Button 
              size="small" 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
            >
              Obtén una aquí
            </Button>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;

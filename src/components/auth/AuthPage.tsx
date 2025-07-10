
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Tabs,
  Tab,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Stack
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ArrowBack
} from '@mui/icons-material';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'ciudadano' | 'administrativo'>('ciudadano');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting login with email:', loginEmail);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          setError('Credenciales incorrectas. Verifica tu email y contraseña.');
        } else {
          setError(error.message);
        }
      } else {
        console.log('Login successful:', data);
        navigate('/');
      }
    } catch (err) {
      console.error('Login catch error:', err);
      setError('Error inesperado al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Attempting signup with email:', signupEmail);
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        if (error.message.includes('User already registered')) {
          setError('Este email ya está registrado. Intenta iniciar sesión.');
        } else {
          setError(`Error de registro: ${error.message}`);
        }
      } else {
        console.log('Signup successful:', data);
        if (data.user && !data.session) {
          setSuccess('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
        } else {
          setSuccess('¡Registro exitoso! Ya puedes usar la aplicación.');
          // If user is automatically logged in, redirect to main page
          setTimeout(() => navigate('/'), 1000);
        }
        // Clear form
        setSignupEmail('');
        setSignupPassword('');
        setFirstName('');
        setLastName('');
        setRole('ciudadano');
      }
    } catch (err) {
      console.error('Signup catch error:', err);
      setError('Error inesperado al registrarse.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: 'background.default'
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Button
          variant="text"
          onClick={() => navigate('/')}
          startIcon={<ArrowBack />}
          sx={{ mb: 2 }}
        >
          Volver al chat
        </Button>

        <Card>
          <CardHeader
            title="Acceso al Sistema"
            subheader="Inicia sesión o regístrate para guardar tus conversaciones"
            sx={{ textAlign: 'center' }}
          />
          <CardContent>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
              >
                <Tab label="Iniciar Sesión" />
                <Tab label="Registrarse" />
              </Tabs>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {tabValue === 0 && (
              <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
                <Stack spacing={2}>
                  <TextField
                    label="Email"
                    type="email"
                    placeholder="tu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isLoading}
                    sx={{ mt: 2 }}
                  >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </Stack>
              </Box>
            )}

            {tabValue === 1 && (
              <Box component="form" onSubmit={handleSignup} sx={{ mt: 2 }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Nombre"
                      placeholder="Nombre"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Apellido"
                      placeholder="Apellido"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      fullWidth
                    />
                  </Box>
                  <TextField
                    label="Email"
                    type="email"
                    placeholder="tu@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    fullWidth
                    inputProps={{ minLength: 6 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Usuario</InputLabel>
                    <Select
                      value={role}
                      label="Tipo de Usuario"
                      onChange={(e) => setRole(e.target.value as 'ciudadano' | 'administrativo')}
                    >
                      <MenuItem value="ciudadano">Ciudadano</MenuItem>
                      <MenuItem value="administrativo">Administrativo</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isLoading}
                    sx={{ mt: 2 }}
                  >
                    {isLoading ? 'Registrando...' : 'Registrarse'}
                  </Button>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AuthPage;

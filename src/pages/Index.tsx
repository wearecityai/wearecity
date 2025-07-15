import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Stack, 
  Chip, 
  IconButton, 
  AppBar, 
  Toolbar,
  InputAdornment,
  Autocomplete,
  Paper,
  Divider
} from '@mui/material';
import { 
  Search as SearchIcon, 
  LocationOn as LocationIcon,
  Chat as ChatIcon,
  SmartToy as AIIcon,
  Public as PublicIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@mui/material/styles';
import { supabase } from '@/integrations/supabase/client';


interface City {
  id: string;
  name: string;
  slug: string;
  assistant_name: string;
}

const Index = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, profile } = useAuth();
  
  const [cities, setCities] = useState<City[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar ciudades disponibles
  useEffect(() => {
    const loadCities = async () => {
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('id, name, slug, assistant_name')
          .eq('is_active', true)
          .eq('is_public', true)
          .order('name');

        if (error) {
          console.error('Error loading cities:', error);
          return;
        }

        setCities(data || []);
      } catch (error) {
        console.error('Error loading cities:', error);
      }
    };

    loadCities();
  }, []);

  const handleCitySelect = (city: City | null) => {
    setSelectedCity(city);
    if (city) {
      navigate(`/chat/${city.slug}`);
    }
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const features = [
    {
      icon: <AIIcon sx={{ fontSize: 40 }} />,
      title: 'IA Especializada',
      description: 'Cada ciudad tiene su propio asistente IA entrenado con información local específica.'
    },
    {
      icon: <LocationIcon sx={{ fontSize: 40 }} />,
      title: 'Información Local',
      description: 'Accede a información actualizada sobre servicios, eventos y procedimientos de tu ciudad.'
    },
    {
      icon: <ChatIcon sx={{ fontSize: 40 }} />,
      title: 'Conversación Natural',
      description: 'Pregunta de forma natural y obtén respuestas precisas sobre tu ciudad.'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Datos Seguros',
      description: 'Tus conversaciones están protegidas y los datos se manejan con total seguridad.'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Respuesta Rápida',
      description: 'Obtén respuestas instantáneas a tus consultas sobre servicios municipales.'
    },
    {
      icon: <PublicIcon sx={{ fontSize: 40 }} />,
      title: 'Acceso Público',
      description: 'Disponible para todos los ciudadanos sin necesidad de registro.'
    }
  ];



  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            CityChat
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton size="small">
              <SearchIcon />
            </IconButton>
            {user ? (
              profile?.role === 'administrativo' ? (
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/admin')}
                  sx={{ borderRadius: 2 }}
                >
                  Panel Admin
                </Button>
              ) : (
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/chat/finestrat')}
                  sx={{ borderRadius: 2 }}
                >
                  Ir al Chat
                </Button>
              )
            ) : (
              <Button 
                variant="outlined" 
                onClick={handleLogin}
                sx={{ borderRadius: 2 }}
              >
                Iniciar sesión
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold', 
              mb: 3,
              fontSize: { xs: '2.5rem', md: '3.5rem' }
            }}
          >
            Tu Asistente de Ciudad
          </Typography>
          <Typography 
            variant="h5" 
            color="text.secondary" 
            sx={{ 
              mb: 6,
              maxWidth: 600,
              mx: 'auto',
              fontSize: { xs: '1.1rem', md: '1.3rem' }
            }}
          >
            Descubre información local, servicios municipales y todo lo que necesitas saber sobre tu ciudad a través de una conversación natural con IA.
          </Typography>

          {/* Buscador de Ciudades */}
          <Paper 
            elevation={3} 
            sx={{ 
              maxWidth: 600, 
              mx: 'auto', 
              p: 3, 
              borderRadius: 3,
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
              ¿En qué ciudad te encuentras?
            </Typography>
            <Autocomplete
              options={cities}
              getOptionLabel={(option) => option.name}
              value={selectedCity}
              onChange={(_, newValue) => handleCitySelect(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Busca tu ciudad..."
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <LocationIcon color="action" />
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {option.name}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Selecciona tu ciudad para comenzar a chatear con el asistente local
            </Typography>
          </Paper>
        </Box>

        {/* Características */}
        <Box sx={{ py: 8 }}>
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              textAlign: 'center', 
              mb: 6,
              fontWeight: 'bold',
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            ¿Por qué CityChat?
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    height: '100%', 
                    borderRadius: 3,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 4 }}>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 'medium' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography 
            variant="h4" 
            component="h2" 
            sx={{ 
              mb: 3,
              fontWeight: 'bold',
              fontSize: { xs: '1.8rem', md: '2.2rem' }
            }}
          >
            ¿Listo para empezar?
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
          >
            Selecciona tu ciudad arriba y comienza a explorar todo lo que tu asistente local puede hacer por ti.
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => document.getElementById('city-search')?.scrollIntoView({ behavior: 'smooth' })}
            sx={{ 
              borderRadius: 3, 
              px: 4, 
              py: 1.5,
              fontSize: '1.1rem'
            }}
          >
            Buscar mi Ciudad
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', py: 4, mt: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                CityChat
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tu asistente de ciudad inteligente. Información local, servicios municipales y más, todo en un solo lugar.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Enlaces Útiles
              </Typography>
              <Stack spacing={1}>
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={() => navigate('/auth')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Iniciar Sesión
                </Button>
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={() => navigate('/chat/finestrat')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Chat de Ejemplo
                </Button>
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Typography variant="body2" color="text.secondary" textAlign="center">
            © 2024 CityChat. Todos los derechos reservados.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Index;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Container,
  Grid, 
  Card, 
  CardContent, 
  Stack, 
  Chip, 
  Paper,
  Divider,
  Button,
  InputAdornment,
  Autocomplete,
  Fade,
  Slide,
  IconButton,
  Avatar,
  Tooltip,
  Fab
} from '@mui/material';
import { 
  Search as SearchIcon, 
  LocationOn as LocationIcon,
  Chat as ChatIcon,
  SmartToy as AIIcon,
  Public as PublicIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  ArrowForward as ArrowForwardIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Star as StarIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Person as PersonIcon,
  ScienceOutlined as ScienceOutlinedIcon,
  ArrowDropDown as ArrowDropDownIcon
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@mui/material/styles';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/AppHeader';

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
  const [showScrollTop, setShowScrollTop] = useState(false);
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

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const features = [
    {
      icon: <AIIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'IA Especializada',
      description: 'Cada ciudad tiene su asistente IA personalizado, entrenado con información local específica y actualizada en tiempo real.',
      color: theme.palette.primary.main,
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.primary.main}10)`
    },
    {
      icon: <LocationIcon sx={{ fontSize: 48, color: 'success.main' }} />,
      title: 'Información Local',
      description: 'Accede a servicios municipales, eventos, procedimientos administrativos y datos precisos de tu ciudad.',
      color: theme.palette.success.main,
      gradient: `linear-gradient(135deg, ${theme.palette.success.main}20, ${theme.palette.success.main}10)`
    },
    {
      icon: <ChatIcon sx={{ fontSize: 48, color: 'secondary.main' }} />,
      title: 'Conversación Natural',
      description: 'Pregunta como le harías a un vecino. Nuestro asistente entiende el lenguaje natural y el contexto local.',
      color: theme.palette.secondary.main,
      gradient: `linear-gradient(135deg, ${theme.palette.secondary.main}20, ${theme.palette.secondary.main}10)`
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48, color: 'error.main' }} />,
      title: 'Privacidad Garantizada',
      description: 'Tus conversaciones están protegidas con encriptación de extremo a extremo. Tu privacidad es nuestra prioridad.',
      color: theme.palette.error.main,
      gradient: `linear-gradient(135deg, ${theme.palette.error.main}20, ${theme.palette.error.main}10)`
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 48, color: 'warning.main' }} />,
      title: 'Respuestas Instantáneas',
      description: 'Obtén información precisa al instante, sin esperas ni formularios complicados. La eficiencia que mereces.',
      color: theme.palette.warning.main,
      gradient: `linear-gradient(135deg, ${theme.palette.warning.main}20, ${theme.palette.warning.main}10)`
    },
    {
      icon: <PublicIcon sx={{ fontSize: 48, color: 'info.main' }} />,
      title: 'Acceso Universal',
      description: 'Disponible para todos los ciudadanos, sin registro obligatorio. Democratizando el acceso a la información pública.',
      color: theme.palette.info.main,
      gradient: `linear-gradient(135deg, ${theme.palette.info.main}20, ${theme.palette.info.main}10)`
    }
  ];

  const useCases = [
    {
      icon: <ScheduleIcon sx={{ color: 'primary.main' }} />,
      title: 'Horarios y Servicios',
      example: '"¿A qué hora abre el ayuntamiento el lunes?"',
      color: 'primary'
    },
    {
      icon: <GroupIcon sx={{ color: 'secondary.main' }} />,
      title: 'Trámites y Procedimientos',
      example: '"¿Cómo solicito el certificado de empadronamiento?"',
      color: 'secondary'
    },
    {
      icon: <StarIcon sx={{ color: 'warning.main' }} />,
      title: 'Eventos y Actividades',
      example: '"¿Qué eventos culturales hay este fin de semana?"',
      color: 'warning'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header usando el mismo componente del chat */}
      <AppHeader
        isMobile={false}
        onMenuToggle={() => {}}
        currentThemeMode={theme.palette.mode}
        onToggleTheme={() => {}}
        onOpenSettings={() => {}}
        isAuthenticated={!!user}
        onLogin={handleLogin}
      />

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
        <Fade in timeout={1000}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip 
              label="🚀 Revolucionando la comunicación ciudadana" 
              sx={{ 
                mb: 4, 
                fontSize: '0.9rem',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
                border: `1px solid ${theme.palette.primary.main}30`
              }} 
            />
            
            <Typography 
              variant="h1" 
              component="h1" 
              sx={{ 
                fontWeight: 800,
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3,
                lineHeight: 1.1
              }}
            >
              ¿En qué puedo ayudarte?
            </Typography>
            
            <Typography 
              variant="h4" 
              color="text.secondary" 
              sx={{ 
                mb: 6,
                maxWidth: 700,
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.5,
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' }
              }}
            >
              Tu asistente de ciudad inteligente. Obtén información local, servicios municipales 
              y respuestas instantáneas a través de conversaciones naturales con IA.
            </Typography>

            {/* Buscador de Ciudades Mejorado */}
            <Paper 
              elevation={8} 
              sx={{ 
                maxWidth: 650, 
                mx: 'auto', 
                p: 4, 
                borderRadius: 4,
                background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.paper}90)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.palette.divider}`,
                mb: 8
              }}
            >
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
                Selecciona tu ciudad para comenzar
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
                          <SearchIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        fontSize: '1.1rem',
                        '& fieldset': {
                          borderWidth: 2,
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
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
                        <Typography variant="caption" color="text.secondary">
                          {option.assistant_name}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Conecta con el asistente especializado de tu ciudad
              </Typography>
            </Paper>

            {/* Casos de Uso */}
            <Grid container spacing={3} sx={{ maxWidth: 900, mx: 'auto', mb: 8 }}>
              {useCases.map((useCase, index) => (
                <Grid size={{ xs: 12, md: 4 }} key={index}>
                  <Slide in timeout={1000 + index * 200} direction="up">
                    <Card 
                      elevation={3}
                      sx={{ 
                        p: 3, 
                        height: '100%',
                        borderRadius: 3,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        borderLeft: `4px solid`,
                        borderLeftColor: `${useCase.color}.main`,
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: theme.shadows[12],
                        }
                      }}
                    >
                      <CardContent sx={{ p: '0!important' }}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                          {useCase.icon}
                          <Typography variant="h6" fontWeight="600">
                            {useCase.title}
                          </Typography>
                        </Stack>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            fontStyle: 'italic',
                            fontSize: '0.9rem'
                          }}
                        >
                          {useCase.example}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Slide>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>
      </Container>

      {/* Features Section */}
      <Box sx={{ 
        py: 10, 
        background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`,
        borderTop: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              component="h2" 
              sx={{ 
                fontWeight: 700, 
                mb: 3,
                fontSize: { xs: '2rem', md: '3rem' },
                color: 'text.primary'
              }}
            >
              ¿Por qué elegir CityChat?
            </Typography>
            <Typography 
              variant="h5" 
              color="text.secondary" 
              sx={{ 
                maxWidth: 600, 
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Una nueva forma de interactuar con tu ciudad, diseñada para ser intuitiva, 
              segura y accesible para todos los ciudadanos.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={index}>
                <Fade in timeout={1200 + index * 150}>
                  <Card 
                    elevation={4}
                    sx={{ 
                      height: '100%',
                      borderRadius: 4,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: feature.gradient,
                      border: `1px solid ${feature.color}20`,
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-12px) scale(1.02)',
                        boxShadow: `0 20px 40px ${feature.color}20`,
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ 
                          display: 'inline-flex',
                          p: 2,
                          borderRadius: 2,
                          background: `${feature.color}15`,
                          mb: 2
                        }}>
                          {feature.icon}
                        </Box>
                        <Typography variant="h5" component="h3" sx={{ fontWeight: 600, mb: 2 }}>
                          {feature.title}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        sx={{ 
                          lineHeight: 1.7,
                          flexGrow: 1
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How it Works */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography 
            variant="h2" 
            component="h2" 
            sx={{ 
              fontWeight: 700, 
              mb: 3,
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            Así de simple funciona
          </Typography>
          <Typography variant="h5" color="text.secondary">
            Tres pasos para obtener la información que necesitas
          </Typography>
        </Box>

        <Grid container spacing={6} alignItems="center">
          {[
            {
              step: '1',
              title: 'Selecciona tu ciudad',
              description: 'Busca y selecciona tu ciudad en el campo de búsqueda inteligente'
            },
            {
              step: '2', 
              title: 'Haz tu pregunta',
              description: 'Escribe tu consulta de forma natural, como le preguntarías a un vecino'
            },
            {
              step: '3',
              title: 'Obtén respuestas',
              description: 'Recibe información precisa y actualizada sobre tu ciudad al instante'
            }
          ].map((item, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
              <Fade in timeout={1500 + index * 300}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: 'primary.main',
                      mx: 'auto', 
                      mb: 3,
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      boxShadow: theme.shadows[8]
                    }}
                  >
                    {item.step}
                  </Avatar>
                  <Typography variant="h4" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                    {item.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ lineHeight: 1.6, maxWidth: 280, mx: 'auto' }}
                  >
                    {item.description}
                  </Typography>
                </Box>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ 
        py: 10, 
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        color: 'white',
        textAlign: 'center'
      }}>
        <Container maxWidth="md">
          <Typography 
            variant="h2" 
            component="h2" 
            sx={{ 
              fontWeight: 700, 
              mb: 3,
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            ¿Listo para comenzar?
          </Typography>
          <Typography variant="h5" sx={{ mb: 6, opacity: 0.9 }}>
            Únete a miles de ciudadanos que ya están usando CityChat para obtener información local
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={scrollToTop}
            endIcon={<ArrowForwardIcon />}
            sx={{ 
              borderRadius: 3, 
              px: 6, 
              py: 2,
              fontSize: '1.2rem',
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'grey.100',
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[12]
              }
            }}
          >
            Buscar mi Ciudad
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', py: 8, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>
                CityChat
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Democratizando el acceso a la información municipal a través de 
                inteligencia artificial conversacional. Construyendo ciudades más conectadas.
              </Typography>
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Enlaces Útiles
              </Typography>
              <Stack spacing={2}>
                <Button 
                  variant="text" 
                  onClick={handleLogin}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Iniciar Sesión
                </Button>
                <Button 
                  variant="text" 
                  onClick={() => navigate('/chat/finestrat')}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Chat de Ejemplo
                </Button>
              </Stack>
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Sobre el Proyecto
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                CityChat es una iniciativa innovadora para mejorar la comunicación entre 
                ciudadanos y administraciones locales usando tecnología de IA de vanguardia.
              </Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4 }} />
          <Typography variant="body2" color="text.secondary" textAlign="center">
            © 2024 CityChat. Construyendo el futuro de la administración digital.
          </Typography>
        </Container>
      </Box>

      {/* Scroll to Top FAB */}
      <Fade in={showScrollTop}>
        <Fab 
          color="primary" 
          size="medium"
          onClick={scrollToTop}
          sx={{ 
            position: 'fixed', 
            bottom: 32, 
            right: 32,
            zIndex: 1000
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Fade>
    </Box>
  );
};

export default Index;
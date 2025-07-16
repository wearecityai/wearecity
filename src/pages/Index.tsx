import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Container,
  Card, 
  CardContent, 
  Stack, 
  Button,
  InputAdornment,
  Autocomplete,
  Chip,
  Divider,
  useTheme,
  alpha,
  Paper
} from '@mui/material';
import { 
  Search as SearchIcon, 
  LocationOn as LocationIcon,
  Chat as ChatIcon,
  SmartToy as AIIcon,
  Public as PublicIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  MyLocation as MyLocationIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { IconButton, Avatar } from '@mui/material';
import { Menu as MenuIcon, AccountCircle as AccountCircleIcon } from '@mui/icons-material';
import UserButton from '@/components/auth/UserButton';
import { findNearestCity } from '@/utils/locationUtils';

interface City {
  id: string;
  name: string;
  slug: string;
  assistant_name: string;
  profile_image_url?: string;
  restricted_city?: any;
}

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user, profile } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isManualLocationLoading, setIsManualLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Función para formatear el nombre de la ciudad
  const formatCityName = (city: City) => {
    try {
      if (city.restricted_city) {
        const rc = typeof city.restricted_city === 'string' 
          ? JSON.parse(city.restricted_city) 
          : city.restricted_city;
        if (rc && rc.name && rc.region && rc.country) {
          // Usar 'region' si existe
          return `${rc.name}, ${rc.region}, ${rc.country}`;
        }
        // Fallback si solo existe administrative_area_level_1
        if (rc && rc.name && rc.administrative_area_level_1 && rc.country) {
          return `${rc.name}, ${rc.administrative_area_level_1}, ${rc.country}`;
        }
      }
      // Fallback: usar el nombre de la ciudad con formato genérico
      return `${city.name}, España`;
    } catch {
      return `${city.name}, España`;
    }
  };

  // Filtrar ciudades basado en el input
  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(inputValue.toLowerCase()) ||
    city.assistant_name.toLowerCase().includes(inputValue.toLowerCase()) ||
    formatCityName(city).toLowerCase().includes(inputValue.toLowerCase())
  );

  // Función para activar geolocalización manualmente
  const handleManualLocation = async () => {
    setIsManualLocationLoading(true);
    setLocationError(null);
    
    try {
      if (!navigator.geolocation) {
        setLocationError('Tu navegador no soporta geolocalización.');
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Obtener API key del backend
      let apiKey = 'AIzaSyBHL5n8B2vCcQIZKVVLE2zVBgS4aYclt7g'; // Fallback
      try {
        const response = await fetch('https://irghpvvoparqettcnpnh.functions.supabase.co/chat-ia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage: 'test',
            requestType: 'get_api_key'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.apiKey) {
            apiKey = data.apiKey;
          }
        }
      } catch (apiError) {
        console.warn('Could not fetch API key from backend, using fallback');
      }

      // Geocodificar las coordenadas
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results[0]) {
        const result = geocodeData.results[0];
        const addressComponents = result.address_components;
        const city = addressComponents.find(c => c.types.includes('locality'))?.long_name || '';
        const region = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.long_name || '';
        const country = addressComponents.find(c => c.types.includes('country'))?.long_name || '';

        const manualLocation = {
          city,
          region,
          country,
          lat,
          lng,
          place_id: result.place_id,
          address_components: addressComponents
        };

        // Buscar ciudad recomendada con la ubicación manual
        const placeId = manualLocation.place_id;
        const municipalityName = manualLocation.city;
        const cityResult = await findNearestCity(lat, lng, placeId, municipalityName);
        
        if (cityResult) {
          console.log('Ciudad encontrada manualmente:', cityResult);
          // En lugar de mostrar recomendación, seleccionar la ciudad automáticamente
          setSelectedCity(cityResult);
          setInputValue(formatCityName(cityResult));
          setLocationError(null);
        } else {
          setLocationError('No encontramos una ciudad cercana en nuestra base de datos.');
        }
      } else {
        setLocationError('No se pudo obtener información de tu ubicación.');
      }
    } catch (error) {
      console.error('Error en geolocalización manual:', error);
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Permiso de geolocalización denegado. Por favor, permite el acceso a la ubicación en tu navegador.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Información de ubicación no disponible. Verifica tu conexión GPS.');
            break;
          case error.TIMEOUT:
            setLocationError('Tiempo de espera agotado al obtener la ubicación.');
            break;
          default:
            setLocationError('Error al obtener tu ubicación. Inténtalo de nuevo.');
        }
      } else {
        setLocationError('Error al obtener tu ubicación. Inténtalo de nuevo.');
      }
    } finally {
      setIsManualLocationLoading(false);
    }
  };

  // Focus search input when navigating from chat
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('focus') === 'search') {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [location.search]);

  // Cargar ciudades disponibles
  useEffect(() => {
    const loadCities = async () => {
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('id, name, slug, assistant_name, profile_image_url, restricted_city')
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
      setInputValue(formatCityName(city));
    }
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleChatStart = () => {
    if (selectedCity) {
      navigate(`/public-chat/${selectedCity.slug}`);
    }
  };

  const features = [
    {
      icon: <AutoAwesomeIcon sx={{ fontSize: 40, color: '#4285f4' }} />,
      title: "Inteligencia Local",
      description: "Asistente IA especializado con información actualizada de tu ciudad y servicios municipales.",
      color: '#4285f4'
    },
    {
      icon: <LocationIcon sx={{ fontSize: 40, color: '#34a853' }} />,
      title: "Contexto Geográfico",
      description: "Respuestas precisas basadas en tu ubicación y conocimiento específico de tu municipio.",
      color: '#34a853'
    },
    {
      icon: <ChatIcon sx={{ fontSize: 40, color: '#ea4335' }} />,
      title: "Conversación Natural",
      description: "Interactúa como si hablaras con un vecino experto. Lenguaje natural y contexto local.",
      color: '#ea4335'
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#0f0f0f',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      position: 'relative',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Background decorative elements */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(66, 133, 244, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(52, 168, 83, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 60%, rgba(234, 67, 53, 0.05) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
        zIndex: 0
      }} />
      
      {/* Header exacto como en AppLayout */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: (theme) => theme.zIndex.appBar || 1300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          minHeight: '64px',
          bgcolor: 'background.default',
          color: 'text.primary',
          py: { xs: 1, sm: 2 },
        }}
      >
        {/* Título CityCore centrado absolutamente */}
        <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              bgcolor: theme => theme.palette.mode === 'dark' ? '#232428' : '#f5f5f5',
              borderRadius: 4,
              px: 3,
              py: 1.2,
              color: 'transparent',
              backgroundImage: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 50%, #90caf9 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              letterSpacing: 2,
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.35rem' },
              pointerEvents: 'auto',
              display: 'inline-block',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.04)',
              },
            }}
          >
            CityCore
          </Typography>
        </Box>
        {/* Fin título centrado */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          {user ? (
            <UserButton />
          ) : (
            <>
              <IconButton
                color="inherit"
                aria-label="user account"
                onClick={handleLogin}
                id="user-avatar-button"
                sx={{ p: 0 }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: theme => theme.palette.background.paper,
                    color: theme => theme.palette.text.primary,
                    fontSize: 28,
                    border: `1px solid ${theme => theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AccountCircleIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ pt: 8, pb: 12, position: 'relative', zIndex: 2, minHeight: '100vh' }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 16 }}>
          <Typography 
            variant="h1" 
            component="h1" 
            sx={{ 
              fontWeight: 400,
              mb: 4,
              color: '#ffffff',
              fontSize: { xs: '4rem', md: '6rem' },
              letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}
          >
            CityChat
          </Typography>
          
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 8,
              fontWeight: 400,
              color: '#9aa0a6',
              maxWidth: 800,
              mx: 'auto',
              fontSize: { xs: '1.5rem', md: '2rem' },
              lineHeight: 1.4
            }}
          >
            Tu asistente municipal más inteligente
          </Typography>

          {/* City Search Input */}
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              p: 0,
              borderRadius: '28px',
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              maxWidth: '600px',
              width: '100%',
              minWidth: 0,
              mx: 'auto',
              mb: 6
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', px: { xs: 2, sm: 3 }, pt: 2, pb: 2, minWidth: 0 }}>
              <Stack direction="column" sx={{ flexGrow: 1, minWidth: 0 }}>
                <TextField
                  inputRef={searchInputRef}
                  placeholder="Busca tu ciudad..."
                  variant="standard"
                  fullWidth
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  InputProps={{
                    disableUnderline: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#4285f4', fontSize: 24 }} />
                      </InputAdornment>
                    ),
                    sx: {
                      py: 0,
                      fontSize: { xs: '1.1rem', sm: '1.15rem' },
                      lineHeight: '1.4',
                      minWidth: 0,
                    },
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: 'transparent',
                      minWidth: 0,
                      width: '100%',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                    },
                    minWidth: 0,
                    width: '100%',
                    flex: 1,
                    fontWeight: 500,
                    color: '#ffffff',
                    '& input': {
                      color: '#ffffff',
                      width: '100%',
                      minWidth: 0,
                      flex: 1,
                      textOverflow: 'clip',
                      overflow: 'visible',
                      '&::placeholder': {
                        color: 'rgba(255, 255, 255, 0.6)',
                        opacity: 1
                      }
                    }
                  }}
                />
                
                {/* City suggestions */}
                {inputValue && filteredCities.length > 0 && (
                  <Box sx={{ 
                    borderRadius: 2,
                    pt: 2,
                    maxHeight: 200,
                    overflowY: 'auto'
                  }}>
                    {filteredCities.slice(0, 5).map((city) => (
                      <Button
                        key={city.id}
                        fullWidth
                        variant="text"
                        onClick={() => handleCitySelect(city)}
                        sx={{
                          justifyContent: 'flex-start',
                          px: 2,
                          py: 1.5,
                          borderRadius: 1,
                          color: '#ffffff',
                          fontWeight: 400,
                          textTransform: 'none',
                          fontSize: '1rem',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                          }
                        }}
                      >
                        <LocationIcon sx={{ mr: 2, color: '#4285f4', fontSize: 18 }} />
                        {formatCityName(city)}
                      </Button>
                    ))}
                  </Box>
                )}
              </Stack>
              
              {/* Geolocation button */}
              <Button
                variant="text"
                onClick={handleManualLocation}
                disabled={isManualLocationLoading}
                sx={{
                  minWidth: 'auto',
                  p: 1.5,
                  borderRadius: 2,
                  color: '#4285f4',
                  '&:hover': {
                    bgcolor: 'rgba(66, 133, 244, 0.1)',
                  },
                  '&:disabled': {
                    color: 'rgba(66, 133, 244, 0.5)',
                  }
                }}
              >
                <MyLocationIcon sx={{ fontSize: 24 }} />
              </Button>
            </Box>
          </Paper>

          {/* Error message */}
          {locationError && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#ea4335',
                textAlign: 'center',
                mb: 4,
                px: 2
              }}
            >
              {locationError}
            </Typography>
          )}

          {/* Action buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            {selectedCity ? (
              <Button
                variant="contained"
                size="large"
                onClick={handleChatStart}
                sx={{
                  borderRadius: '24px',
                  px: 6,
                  py: 2,
                  bgcolor: '#4285f4',
                  color: '#ffffff',
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 20px rgba(66, 133, 244, 0.3)',
                  '&:hover': {
                    bgcolor: '#3367d6',
                    boxShadow: '0 6px 24px rgba(66, 133, 244, 0.4)',
                  }
                }}
                endIcon={<ArrowForwardIcon />}
              >
                Chatear con {selectedCity.assistant_name || selectedCity.name}
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    const element = document.getElementById('features-section');
                    if (element) {
                      element.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }
                  }}
                  sx={{
                    borderRadius: '24px',
                    px: 6,
                    py: 2,
                    bgcolor: '#4285f4',
                    color: '#ffffff',
                    fontWeight: 500,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 20px rgba(66, 133, 244, 0.3)',
                    '&:hover': {
                      bgcolor: '#3367d6',
                      boxShadow: '0 6px 24px rgba(66, 133, 244, 0.4)',
                    }
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Explorar CityChat
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleLogin}
                  sx={{
                    borderRadius: '24px',
                    px: 6,
                    py: 2,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: '#ffffff',
                    fontWeight: 500,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                    }
                  }}
                >
                  Iniciar Sesión
                </Button>
              </>
            )}
          </Stack>
        </Box>

        {/* Description Section */}
        <Box sx={{ textAlign: 'center', mb: 16 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 400,
              mb: 6,
              color: '#ffffff',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              lineHeight: 1.2,
              maxWidth: 1000,
              mx: 'auto'
            }}
          >
            CityChat es capaz de entender y responder a consultas específicas de tu municipio, 
            proporcionando información precisa y actualizada.
          </Typography>
          
          {/* Navigation tabs */}
          <Stack 
            direction="row" 
            spacing={1} 
            justifyContent="center" 
            sx={{ mb: 8, flexWrap: 'wrap', gap: 1 }}
          >
            {['Servicios', 'Trámites', 'Eventos', 'Información', 'Contacto'].map((tab, index) => (
              <Button
                key={tab}
                variant={index === 0 ? "contained" : "text"}
                sx={{
                  borderRadius: '20px',
                  px: 3,
                  py: 1,
                  bgcolor: index === 0 ? '#4285f4' : 'transparent',
                  color: index === 0 ? '#ffffff' : '#9aa0a6',
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: index === 0 ? '#3367d6' : 'rgba(255, 255, 255, 0.05)',
                  }
                }}
              >
                {tab}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* Model Family Section */}
        <Box id="features-section" sx={{ mb: 16 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              textAlign: 'center',
              mb: 4,
              fontWeight: 400,
              color: '#ffffff',
              fontSize: { xs: '2.5rem', md: '3rem' }
            }}
          >
            Familia de Asistentes
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              textAlign: 'center',
              mb: 8,
              fontWeight: 400,
              color: '#9aa0a6',
              fontSize: { xs: '1.2rem', md: '1.4rem' },
              maxWidth: 800,
              mx: 'auto'
            }}
          >
            CityChat se adapta a las necesidades específicas de cada municipio con 
            tecnología de vanguardia y conocimiento local especializado.
          </Typography>
          
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={4}
            sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 4
            }}
          >
            {[
              {
                title: "CityChat Pro",
                subtitle: "DISPONIBILIDAD GENERAL",
                description: "Ideal para ciudades grandes y consultas complejas de administración municipal",
                icon: <PublicIcon sx={{ fontSize: 60, color: '#4285f4' }} />,
                selected: true
              },
              {
                title: "CityChat Express",
                subtitle: "DISPONIBILIDAD GENERAL", 
                description: "Perfecto para respuestas rápidas sobre servicios básicos y trámites cotidianos",
                icon: <SpeedIcon sx={{ fontSize: 60, color: '#4285f4' }} />,
                selected: false
              },
              {
                title: "CityChat Lite",
                subtitle: "VISTA PREVIA",
                description: "Optimizado para municipios pequeños con funcionalidades esenciales",
                icon: <SecurityIcon sx={{ fontSize: 60, color: '#4285f4' }} />,
                selected: false
              }
            ].map((model, index) => (
              <Card 
                key={index}
                sx={{ 
                  p: 4,
                  height: '100%',
                  borderRadius: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  border: model.selected ? '2px solid #4285f4' : '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                    borderColor: '#4285f4'
                  }
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  {model.icon}
                </Box>
                
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block',
                    textAlign: 'center',
                    color: '#9aa0a6',
                    fontWeight: 500,
                    mb: 2,
                    letterSpacing: '0.1em'
                  }}
                >
                  {model.subtitle}
                </Typography>
                
                <Typography 
                  variant="h5" 
                  fontWeight="500" 
                  sx={{ 
                    mb: 3, 
                    textAlign: 'center',
                    color: '#ffffff'
                  }}
                >
                  {model.title}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineHeight: 1.6
                  }}
                >
                  {model.description}
                </Typography>
              </Card>
            ))}
          </Stack>
        </Box>

        {/* Adaptive Section */}
        <Box sx={{ mb: 16 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              textAlign: 'center',
              mb: 4,
              fontWeight: 400,
              color: '#ffffff',
              fontSize: { xs: '2.5rem', md: '3rem' }
            }}
          >
            Adaptación inteligente y gestión eficiente
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              textAlign: 'center',
              mb: 8,
              fontWeight: 400,
              color: '#9aa0a6',
              fontSize: { xs: '1.2rem', md: '1.4rem' },
              maxWidth: 800,
              mx: 'auto'
            }}
          >
            Controles adaptativos y presupuestos de procesamiento ajustables 
            te permiten equilibrar rendimiento y costes.
          </Typography>
          
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={4}
            sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 4
            }}
          >
            {[
              {
                title: "Calibrado",
                description: "El modelo explora diversas estrategias de consulta, llevando a respuestas más precisas y relevantes.",
                icon: <Box sx={{ width: 60, height: 60, border: '2px solid #4285f4', borderRadius: 2, borderStyle: 'dashed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ width: 20, height: 20, bgcolor: '#4285f4', borderRadius: '50%' }} />
                </Box>
              },
              {
                title: "Controlable", 
                description: "Los administradores tienen control detallado sobre el proceso de respuesta del modelo, permitiendo gestionar el uso de recursos.",
                icon: <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  {[1, 2, 3].map(i => (
                    <Box key={i} sx={{ width: 40, height: 8, bgcolor: i === 2 ? '#4285f4' : 'rgba(66, 133, 244, 0.3)', borderRadius: 1 }} />
                  ))}
                </Box>
              },
              {
                title: "Adaptativo",
                description: "Cuando no se establece presupuesto de procesamiento, el modelo evalúa la complejidad de la consulta y calibra el procesamiento.",
                icon: <Box sx={{ width: 60, height: 60, border: '2px solid #4285f4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowForwardIcon sx={{ color: '#4285f4', fontSize: 30 }} />
                </Box>
              }
            ].map((feature, index) => (
              <Card 
                key={index}
                sx={{ 
                  p: 4,
                  height: '100%',
                  borderRadius: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                    borderColor: '#4285f4'
                  }
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  {feature.icon}
                </Box>
                
                <Typography 
                  variant="h6" 
                  fontWeight="500" 
                  sx={{ 
                    mb: 3, 
                    textAlign: 'center',
                    color: '#ffffff'
                  }}
                >
                  {feature.title}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineHeight: 1.6
                  }}
                >
                  {feature.description}
                </Typography>
              </Card>
            ))}
          </Stack>
        </Box>

        {/* Performance Section */}
        <Box sx={{ textAlign: 'center', mb: 16 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              color: '#9aa0a6',
              fontWeight: 500,
              mb: 4,
              letterSpacing: '0.1em'
            }}
          >
            RENDIMIENTO
          </Typography>
          
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 400,
              mb: 6,
              color: '#ffffff',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              lineHeight: 1.2,
              maxWidth: 900,
              mx: 'auto'
            }}
          >
            CityChat es estado del arte en una amplia gama de métricas municipales.
          </Typography>
          
          <Button
            variant="outlined"
            sx={{
              borderRadius: '24px',
              px: 4,
              py: 1.5,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
              }
            }}
            endIcon={<ArrowForwardIcon />}
          >
            Ver reporte técnico
          </Button>
        </Box>

        {/* CTA Section */}
        <Box sx={{ textAlign: 'center' }}>
          <Card 
            sx={{ 
              p: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 3,
                fontWeight: 400,
                color: '#ffffff',
                fontSize: { xs: '1.8rem', md: '2.2rem' }
              }}
            >
              ¿Listo para transformar la atención ciudadana?
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 4,
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1.1rem',
                lineHeight: 1.6,
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              Únete a los municipios que ya están utilizando CityChat para ofrecer 
              un servicio ciudadano más eficiente y accesible las 24 horas del día.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => {
                window.scrollTo({ 
                  top: 0,
                  behavior: 'smooth'
                });
              }}
              sx={{ 
                borderRadius: '24px',
                px: 6,
                py: 2,
                bgcolor: '#4285f4',
                color: '#ffffff',
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '1.1rem',
                boxShadow: '0 4px 20px rgba(66, 133, 244, 0.3)',
                '&:hover': {
                  bgcolor: '#3367d6',
                  boxShadow: '0 6px 24px rgba(66, 133, 244, 0.4)',
                }
              }}
              endIcon={<ArrowForwardIcon />}
            >
              Comenzar ahora
            </Button>
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default Index;
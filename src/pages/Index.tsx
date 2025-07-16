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
  
  // Typing animation state
  const [typingText, setTypingText] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  
  const typingCities = [
    'Valencia, España',
    'Barcelona, España', 
    'La Vila Joiosa, España',
    'Madrid, España',
    'Sevilla, España',
    'Bilbao, España'
  ];

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

  // Typing animation effect
  useEffect(() => {
    if (!isTyping) return;

    const currentCity = typingCities[typingIndex];
    
    if (typingText.length < currentCity.length) {
      // Typing forward
      const timer = setTimeout(() => {
        setTypingText(currentCity.slice(0, typingText.length + 1));
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Finished typing current city, wait then start deleting
      const waitTimer = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
      return () => clearTimeout(waitTimer);
    }
  }, [typingText, typingIndex, isTyping]);

  // Delete animation effect
  useEffect(() => {
    if (isTyping) return;

    if (typingText.length > 0) {
      // Deleting backward
      const timer = setTimeout(() => {
        setTypingText(typingText.slice(0, -1));
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Finished deleting, move to next city
      const nextTimer = setTimeout(() => {
        setTypingIndex((prev) => (prev + 1) % typingCities.length);
        setIsTyping(true);
      }, 500);
      return () => clearTimeout(nextTimer);
    }
  }, [typingText, isTyping, typingIndex]);

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
      background: `
        linear-gradient(rgba(15, 15, 15, 0.4), rgba(15, 15, 15, 0.4)),
        url('/lovable-uploads/4c349cf3-97bc-4a5f-98fc-a3b7c56d82c4.png')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
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
        <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', pointerEvents: 'none', pl: 3 }}>
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

      <Container maxWidth="lg" sx={{ pt: 8, pb: 0, position: 'relative', zIndex: 2 }}>
        {/* Main Value Proposition - Primera sección principal */}
        <Box sx={{ 
          textAlign: 'center', 
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 0
        }}>
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 700,
              mb: 6,
              color: '#ffffff',
              fontSize: { xs: '2.5rem', md: '4rem', lg: '5rem' },
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              maxWidth: 1000,
              textAlign: 'center'
            }}
          >
            Todo sobre tu <Box component="span" sx={{ color: '#4285f4' }}>ciudad</Box>,<br />en un solo chat
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 8,
              fontWeight: 300,
              color: 'rgba(255, 255, 255, 0.8)',
              maxWidth: 800,
              mx: 'auto',
              fontSize: { xs: '1.1rem', md: '1.25rem' },
              lineHeight: 1.6,
              textAlign: 'center'
            }}
          >
            Consulta trámites, descubre eventos, encuentra lugares y recibe ayuda sin esperas.
          </Typography>

          {/* City Selector integrado en hero section */}
          <Box sx={{ maxWidth: 600, width: '100%' }}>
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
                width: '100%',
                minWidth: 0,
                mb: 4
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', px: { xs: 2, sm: 3 }, pt: 2, pb: 2, minWidth: 0 }}>
                <Stack direction="column" sx={{ flexGrow: 1, minWidth: 0 }}>
                  <TextField
                    inputRef={searchInputRef}
                    placeholder={inputValue ? "Busca tu ciudad..." : typingText + "|"}
                    variant="standard"
                    fullWidth
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    autoComplete="off"
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
                  
                  {/* Sugerencias integradas dentro del input */}
                  {inputValue && filteredCities.length > 0 && (
                    <Box sx={{ 
                      mt: 1, 
                      bgcolor: 'rgba(15, 15, 15, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(20px)',
                      overflow: 'hidden',
                      maxHeight: 300,
                      overflowY: 'auto'
                    }}>
                      {filteredCities.map((city, index) => (
                        <Box
                          key={city.id}
                          onClick={() => handleCitySelect(city)}
                          sx={{
                            py: 2,
                            px: 3,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            borderBottom: index < filteredCities.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                            '&:hover': {
                              bgcolor: 'rgba(66, 133, 244, 0.1)',
                              borderLeft: '3px solid #4285f4'
                            },
                            '&:last-child': {
                              borderBottom: 'none'
                            }
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar 
                              src={city.profile_image_url || undefined}
                              sx={{ 
                                width: 32, 
                                height: 32, 
                                bgcolor: city.profile_image_url ? 'transparent' : 'rgba(66, 133, 244, 0.2)',
                                color: '#4285f4'
                              }}
                            >
                              {!city.profile_image_url && <LocationIcon sx={{ fontSize: 18 }} />}
                            </Avatar>
                            <Box sx={{ flex: 1, textAlign: 'left' }}>
                              <Typography variant="body1" fontWeight="500" sx={{ color: '#ffffff', mb: 0, textAlign: 'left' }}>
                                {city.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'left' }}>
                                {formatCityName(city)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      ))}
                    </Box>
                  )}
                  {/* Fila de acciones (geolocalización) */}
                  <Box
                    sx={{
                      mt: 2.5,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 3,
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '1rem',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Button
                        onClick={handleManualLocation}
                        disabled={isManualLocationLoading}
                        startIcon={isManualLocationLoading ? null : <MyLocationIcon />}
                        sx={{
                          borderRadius: 999,
                          minHeight: { xs: 28, sm: 36 },
                          px: { xs: 1, sm: 1.5 },
                          py: { xs: 0.25, sm: 0.5 },
                          color: 'rgba(255, 255, 255, 0.8)',
                          bgcolor: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          textTransform: 'none',
                          fontSize: { xs: '0.95em', sm: '1em' },
                          fontWeight: 500,
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            borderColor: 'rgba(255, 255, 255, 0.3)'
                          },
                          '& .MuiButton-startIcon': {
                            color: 'rgba(255, 255, 255, 0.8)',
                          }
                        }}
                      >
                        {isManualLocationLoading ? 'Localizando...' : 'Localizar mi ciudad'}
                      </Button>
                    </Box>
                    
                    {/* Botón de ir al chat */}
                    <Button
                      onClick={() => {
                        if (selectedCity) {
                          navigate(`/chat/${selectedCity.slug}`);
                        }
                      }}
                      disabled={!selectedCity}
                      sx={{
                        borderRadius: 999,
                        minHeight: { xs: 28, sm: 36 },
                        px: { xs: 1, sm: 1.5 },
                        py: { xs: 0.25, sm: 0.5 },
                        color: selectedCity ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                        bgcolor: selectedCity ? '#4285f4' : 'transparent',
                        border: selectedCity ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                        textTransform: 'none',
                        fontSize: { xs: '0.95em', sm: '1em' },
                        fontWeight: 500,
                        '&:hover': {
                          bgcolor: selectedCity ? '#3367d6' : 'rgba(255, 255, 255, 0.1)',
                          borderColor: selectedCity ? 'none' : 'rgba(255, 255, 255, 0.3)'
                        }
                      }}
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 20 }} />}
                    >
                      Ir al chat
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Paper>

            {/* Location Error */}
            {locationError && (
              <Card 
                sx={{ 
                  p: 3, 
                  mb: 4,
                  borderRadius: 3,
                  bgcolor: 'rgba(234, 67, 53, 0.1)',
                  border: '1px solid rgba(234, 67, 53, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Typography variant="body2" sx={{ color: '#ea4335', textAlign: 'center' }}>
                  {locationError}
                </Typography>
              </Card>
            )}
          </Box>

        </Box>
      </Container>

      <Container maxWidth="lg" sx={{ pt: 0, pb: 12, position: 'relative', zIndex: 2 }}>

        {/* Hero Content Card - Similar to Gemini showcase */}
        <Box sx={{ 
          mb: 20, 
          display: 'flex', 
          justifyContent: 'center',
          px: { xs: 2, md: 0 }
        }}>
          <Card
            sx={{
              maxWidth: 900,
              width: '100%',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              backdropFilter: 'blur(20px)',
              p: { xs: 3, md: 6 },
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 500,
                mb: 2,
                display: 'block'
              }}>
                CIUDADES
              </Typography>
              <Typography variant="h5" sx={{ 
                color: '#ffffff',
                fontWeight: 300,
                mb: 2,
                fontSize: { xs: '1.5rem', md: '2rem' }
              }}>
                Conexión inteligente con tu municipio
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: 1.6,
                maxWidth: 600,
                mx: 'auto'
              }}>
                Cada ciudad tiene su propia personalidad digital. CityCore comprende el contexto único de tu municipio y te conecta con información hiperlocal de manera intuitiva.
              </Typography>
            </Box>
            
            {/* Visual indicator dots like Gemini */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 1,
              mb: 4
            }}>
              {[0, 1, 2].map((dot, index) => (
                <Box key={index} sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: index === 1 ? '#4285f4' : 'rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease'
                }} />
              ))}
            </Box>
          </Card>
        </Box>

        {/* Navigation Tabs Section - Like Gemini */}
        <Box id="features" sx={{ mb: 20 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 8,
            px: { xs: 2, md: 0 }
          }}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={0}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50px',
                p: 1,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {['Inteligencia', 'Experiencia', 'Rendimiento', 'Seguridad', 'Evolución'].map((tab, index) => (
                <Button
                  key={tab}
                  sx={{
                    borderRadius: '50px',
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 400,
                    color: index === 0 ? '#000000' : 'rgba(255, 255, 255, 0.8)',
                    bgcolor: index === 0 ? '#4285f4' : 'transparent',
                    minWidth: { xs: '100%', sm: 'auto' },
                    '&:hover': {
                      bgcolor: index === 0 ? '#3367d6' : 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  {tab}
                </Button>
              ))}
            </Stack>
          </Box>

          {/* Main Content Area */}
          <Box sx={{ textAlign: 'center', mb: 12 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 300,
                mb: 6,
                color: '#ffffff',
                fontSize: { xs: '2.5rem', md: '4rem' },
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                maxWidth: 1200,
                mx: 'auto'
              }}
            >
              Familia de productos municipales
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 300,
                color: 'rgba(255, 255, 255, 0.8)',
                maxWidth: 800,
                mx: 'auto',
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                lineHeight: 1.6,
                mb: 8
              }}
            >
              CityCore evoluciona constantemente, integrando las mejores prácticas de gestión municipal con tecnología de vanguardia y un diseño centrado en el ciudadano.
            </Typography>

            {/* Product Cards Grid */}
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              spacing={4}
              sx={{ 
                maxWidth: 1200,
                mx: 'auto',
                px: { xs: 2, md: 0 }
              }}
            >
              {[
                {
                  title: 'CityCore Pro',
                  subtitle: 'DISPONIBILIDAD GENERAL',
                  description: 'Ideal para administraciones y tareas municipales complejas',
                  highlight: false
                },
                {
                  title: 'CityCore Ciudadano',
                  subtitle: 'DISPONIBILIDAD GENERAL', 
                  description: 'Perfecto para consultas rápidas y gestiones cotidianas',
                  highlight: false
                },
                {
                  title: 'CityCore Turismo',
                  subtitle: 'VISTA PREVIA',
                  description: 'Optimizado para visitantes y promoción territorial',
                  highlight: true
                }
              ].map((product, index) => (
                <Card
                  key={index}
                  sx={{
                    flex: 1,
                    p: 4,
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    border: product.highlight ? '2px solid #4285f4' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '20px',
                    backdropFilter: 'blur(20px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
                    }
                  }}
                >
                  {/* Product Icon */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mb: 4,
                    height: 120,
                    alignItems: 'center'
                  }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        bgcolor: 'rgba(66, 133, 244, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: '#4285f4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: '#ffffff'
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 500,
                    mb: 2,
                    display: 'block'
                  }}>
                    {product.subtitle}
                  </Typography>

                  <Typography variant="h5" sx={{ 
                    color: '#ffffff',
                    fontWeight: 400,
                    mb: 2
                  }}>
                    {product.title}
                  </Typography>

                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineHeight: 1.6
                  }}>
                    {product.description}
                  </Typography>
                </Card>
              ))}
            </Stack>
          </Box>
        </Box>

        {/* Performance Section - Like Gemini */}
        <Box sx={{ mb: 20 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 300,
                mb: 6,
                color: '#ffffff',
                fontSize: { xs: '2.5rem', md: '4rem' },
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                maxWidth: 1000,
                mx: 'auto'
              }}
            >
              CityCore alcanza el máximo rendimiento en una amplia gama de casos de uso municipales
            </Typography>
            
            <Button
              variant="outlined"
              sx={{
                borderRadius: '50px',
                px: 4,
                py: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 400,
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  bgcolor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
              endIcon={<ArrowForwardIcon />}
            >
              Ver informe técnico
            </Button>
          </Box>

          {/* Performance Grid */}
          <Box sx={{ 
            position: 'relative',
            maxWidth: 1200,
            mx: 'auto',
            px: { xs: 2, md: 0 }
          }}>
            {/* Background grid effect */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                linear-gradient(90deg, rgba(66, 133, 244, 0.1) 1px, transparent 1px),
                linear-gradient(rgba(66, 133, 244, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              opacity: 0.3,
              zIndex: 0
            }} />
            
            {/* Curved line element */}
            <Box sx={{
              position: 'absolute',
              top: '20%',
              right: '10%',
              width: 200,
              height: 200,
              border: '2px solid #4285f4',
              borderRadius: '50%',
              opacity: 0.3,
              zIndex: 1
            }} />

            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              spacing={4}
              sx={{ position: 'relative', zIndex: 2 }}
            >
              {[
                {
                  title: 'Respuesta Inteligente',
                  description: 'El sistema comprende consultas complejas y proporciona respuestas contextualizadas que van más allá de la información básica.'
                },
                {
                  title: 'Gestión Adaptativa',
                  description: 'CityCore se adapta a las necesidades específicas de cada municipio, aprendiendo de patrones de uso y optimizando respuestas.'
                },
                {
                  title: 'Integración Perfecta',
                  description: 'Cuando no se establece presupuesto de procesamiento, el sistema evalúa automáticamente la complejidad y calibra la respuesta apropiada.'
                }
              ].map((item, index) => (
                <Card
                  key={index}
                  sx={{
                    flex: 1,
                    p: 4,
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '20px',
                    backdropFilter: 'blur(20px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)'
                    }
                  }}
                >
                  {/* Icon */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mb: 3
                  }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 2,
                        bgcolor: 'rgba(66, 133, 244, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {index === 0 && <AutoAwesomeIcon sx={{ fontSize: 30, color: '#4285f4' }} />}
                      {index === 1 && <SpeedIcon sx={{ fontSize: 30, color: '#4285f4' }} />}
                      {index === 2 && <SecurityIcon sx={{ fontSize: 30, color: '#4285f4' }} />}
                    </Box>
                  </Box>

                  <Typography variant="h6" sx={{ 
                    color: '#ffffff',
                    fontWeight: 400,
                    mb: 2,
                    textAlign: 'center'
                  }}>
                    {item.title}
                  </Typography>

                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineHeight: 1.6,
                    textAlign: 'center'
                  }}>
                    {item.description}
                  </Typography>
                </Card>
              ))}
            </Stack>
          </Box>
        </Box>

        {/* Bottom CTA */}
        <Box sx={{ textAlign: 'center' }}>
          <Card 
            sx={{ 
              p: 8,
              borderRadius: '24px',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(20px)',
              maxWidth: 800,
              mx: 'auto'
            }}
          >
            <Typography 
              variant="h3" 
              sx={{ 
                mb: 4,
                fontWeight: 300,
                color: '#ffffff',
                fontSize: { xs: '2rem', md: '2.5rem' },
                lineHeight: 1.2
              }}
            >
              El futuro de la administración municipal está aquí
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 6,
                color: 'rgba(255, 255, 255, 0.8)',
                maxWidth: 600,
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 300
              }}
            >
              Únete a la nueva generación de ciudades inteligentes que priorizan la experiencia del ciudadano y la eficiencia administrativa.
            </Typography>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={3} 
              justifyContent="center"
            >
              <Button 
                variant="contained" 
                size="large"
                onClick={() => {
                  const element = document.getElementById('city-selector');
                  if (element) {
                    element.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                    });
                  }
                }}
                sx={{ 
                  borderRadius: '50px',
                  px: 6,
                  py: 2.5,
                  bgcolor: '#4285f4',
                  color: '#ffffff',
                  fontWeight: 400,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  '&:hover': {
                    bgcolor: '#3367d6'
                  }
                }}
                endIcon={<ArrowForwardIcon />}
              >
                Comenzar ahora
              </Button>
              
              <Button 
                variant="outlined" 
                size="large"
                onClick={handleLogin}
                sx={{ 
                  borderRadius: '50px',
                  px: 6,
                  py: 2.5,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  fontWeight: 400,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    bgcolor: 'rgba(255, 255, 255, 0.05)'
                  }
                }}
                endIcon={<PersonIcon />}
              >
                Acceso administrativo
              </Button>
            </Stack>
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default Index;
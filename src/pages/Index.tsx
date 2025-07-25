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
  AutoAwesome as AutoAwesomeIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
  Business as BusinessIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { IconButton, Avatar } from '@mui/material';
import { Menu as MenuIcon, AccountCircle as AccountCircleIcon } from '@mui/icons-material';
import UserButton from '@/components/auth/UserButton';
import { findNearestCity } from '@/utils/locationUtils';
import { useThemeContext } from '@/theme/ThemeProvider';

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
  const { currentThemeMode } = useThemeContext();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const nextSectionRef = useRef<HTMLDivElement>(null);
  
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isManualLocationLoading, setIsManualLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Typing animation state
  const [typingText, setTypingText] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  
  // Scroll state for header transparency
  const [scrollY, setScrollY] = useState(0);
  
  // Auto-scroll state
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false);
  
  // Scroll reveal state for the second section title
  const [scrollRevealText, setScrollRevealText] = useState('');
  const [wordOpacities, setWordOpacities] = useState<number[]>([]);
  
  // Estados para la infografía
  const [step1Visible, setStep1Visible] = useState(false);
  const [step2Visible, setStep2Visible] = useState(false);
  const [step3Visible, setStep3Visible] = useState(false);
  const [line1Visible, setLine1Visible] = useState(false);
  const [line2Visible, setLine2Visible] = useState(false);
  
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

      // Obtener API key del backend con mejor manejo de errores
      let apiKey = 'AIzaSyBHL5n8B2vCcQIZKVVLE2zVBgS4aYclt7g'; // Fallback
      try {
        const functionUrl = window.location.hostname === 'localhost' 
          ? 'http://127.0.0.1:54321/functions/v1/chat-ia'
          : 'https://irghpvvoparqettcnpnh.functions.supabase.co/chat-ia';
          
        const response = await fetch(functionUrl, {
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
        console.warn('Could not fetch API key from backend, using fallback:', apiError);
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
      // Limpiar el estado de error después de un tiempo para no bloquear la UI
      setTimeout(() => setLocationError(null), 5000);
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

  // Scroll effect for header transparency and auto-scroll
  useEffect(() => {
    const handleScroll = () => {
      // Try multiple sources for scroll position
      const currentScrollY = window.scrollY || 
                            document.documentElement.scrollTop || 
                            document.body.scrollTop ||
                            mainContainerRef.current?.scrollTop ||
                            0;
      

      
      setScrollY(currentScrollY);
      
      // Auto-scroll logic: if user scrolls down slightly from hero section, jump to next section
      if (!hasAutoScrolled && currentScrollY > 100 && currentScrollY < 300) {
        setHasAutoScrolled(true);
        if (nextSectionRef.current) {
          // Scroll to the section with some padding to show the title properly
          const element = nextSectionRef.current;
          const elementTop = element.offsetTop;
          const headerHeight = 80; // Approximate header height
          const padding = 40; // Extra padding for better visibility
          
          window.scrollTo({
            top: elementTop - headerHeight - padding,
            behavior: 'smooth'
          });
        }
      }
      
      // Reset auto-scroll flag when user scrolls back to top
      if (currentScrollY < 50) {
        setHasAutoScrolled(false);
      }
      

      

      
      // Scroll reveal effect for the second section title
      const fullText = "Una plataforma conversacional que transforma la relación entre los ciudadanos y su administración.";
      const words = fullText.split(' ');
      const revealStart = 100; // Start revealing at 100px scroll
      const revealEnd = 300;   // Finish revealing at 300px scroll (faster appearance)
      
      if (currentScrollY >= revealStart && currentScrollY <= revealEnd) {
        const progress = (currentScrollY - revealStart) / (revealEnd - revealStart);
        const wordProgress = progress * words.length;
        
        // Calculate opacity for each word with gradient effect
        const opacities = words.map((_, index) => {
          const wordStart = index;
          const wordEnd = index + 1;
          
          if (wordProgress <= wordStart) {
            return 0; // Word not yet visible
          } else if (wordProgress >= wordEnd) {
            return 1; // Word fully visible
          } else {
            // Word is partially visible - calculate gradient opacity
            return wordProgress - wordStart;
          }
        });
        
        setWordOpacities(opacities);
        setScrollRevealText(fullText); // Always show full text, control visibility with opacity
      } else if (currentScrollY > revealEnd) {
        setWordOpacities(words.map(() => 1)); // All words fully visible
        setScrollRevealText(fullText);
      } else if (currentScrollY < revealStart) {
        setWordOpacities(words.map(() => 0)); // All words hidden
        setScrollRevealText('');
      }

        // Control de aparición progresiva de la infografía basada en scroll con secuencia
        const step1Start = 200;   // Círculo 1 aparece
        const line1Start = 220;   // Línea 1 aparece después de completar círculo 1
        const step2Start = 240;   // Círculo 2 aparece después de completar línea 1
        const line2Start = 260;   // Línea 2 aparece después de completar círculo 2
        const step3Start = 280;   // Círculo 3 aparece después de completar línea 2
        
        // Secuencia dependiente: evaluar condiciones en tiempo real
        const shouldShowStep1 = currentScrollY >= step1Start;
        const shouldShowLine1 = currentScrollY >= line1Start && shouldShowStep1;
        const shouldShowStep2 = currentScrollY >= step2Start && shouldShowLine1;
        const shouldShowLine2 = currentScrollY >= line2Start && shouldShowStep2;
        const shouldShowStep3 = currentScrollY >= step3Start && shouldShowLine2;
        
        setStep1Visible(shouldShowStep1);
        setLine1Visible(shouldShowLine1);
        setStep2Visible(shouldShowStep2);
        setLine2Visible(shouldShowLine2);
        setStep3Visible(shouldShowStep3);
    };

    // Listen to scroll on both window and document
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also listen to scroll on the main container if it exists
    const mainContainer = mainContainerRef.current;
    if (mainContainer) {
      mainContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    // Additional listeners for mobile
    document.documentElement.addEventListener('scroll', handleScroll, { passive: true });
    document.body.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      if (mainContainer) {
        mainContainer.removeEventListener('scroll', handleScroll);
      }
      document.documentElement.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('scroll', handleScroll);
    };
  }, [hasAutoScrolled]);

  // Cargar ciudades disponibles
  useEffect(() => {
    const loadCities = async () => {
      try {
        console.log('Loading cities from Supabase...');
        const { data, error } = await supabase
          .from('cities')
          .select('id, name, slug, assistant_name, profile_image_url, restricted_city')
          .eq('is_active', true)
          .eq('is_public', true)
          .order('name');

        if (error) {
          console.error('Error loading cities:', error);
          // No bloquear la aplicación si las ciudades no se cargan
          setCities([]);
          return;
        }

        console.log('Cities loaded successfully:', data?.length || 0);
        setCities(data || []);
      } catch (error) {
        console.error('Critical error loading cities:', error);
        // Asegurar que la aplicación no se bloquee
        setCities([]);
      }
    };

    loadCities();
  }, []);

  // Estado para saber si estamos en cliente
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);



  // Calcular el parallax para el fondo de edificios


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
      icon: <AutoAwesomeIcon sx={{ fontSize: 40, color: currentThemeMode === 'dark' ? '#ffffff' : '#212121' }} />,
      title: "Inteligencia Local",
      description: "Asistente IA especializado con información actualizada de tu ciudad y servicios municipales.",
      color: currentThemeMode === 'dark' ? '#ffffff' : '#212121'
    },
    {
      icon: <LocationIcon sx={{ fontSize: 40, color: currentThemeMode === 'dark' ? '#ffffff' : '#212121' }} />,
      title: "Contexto Geográfico",
      description: "Respuestas precisas basadas en tu ubicación y conocimiento específico de tu municipio.",
      color: currentThemeMode === 'dark' ? '#ffffff' : '#212121'
    },
    {
      icon: <ChatIcon sx={{ fontSize: 40, color: currentThemeMode === 'dark' ? '#ffffff' : '#212121' }} />,
      title: "Conversación Natural",
      description: "Interactúa como si hablaras con un vecino experto. Lenguaje natural y contexto local.",
      color: currentThemeMode === 'dark' ? '#ffffff' : '#212121'
    }
  ];



  return (
        <Box 
      ref={mainContainerRef}
      sx={{ 
        minHeight: '100vh', 
        bgcolor: currentThemeMode === 'dark' ? '#0a0a0a' : '#f8f9fa',
        position: 'relative',
        overflowY: 'auto',
        overflowX: 'hidden',
        '@keyframes blink': {
          '0%, 50%': {
            opacity: 1,
          },
          '51%, 100%': {
            opacity: 0,
          },
        },
      }}>
      {/* Background estático */}
      {isClient && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: [
              currentThemeMode === 'dark'
                ? `url('/lovable-uploads/City_dark_mobile.png')`
                : `url('/lovable-uploads/City_light_mobile.png')`,
              currentThemeMode === 'dark'
                ? `url('/lovable-uploads/City_dark_mobile.png')`
                : `url('/lovable-uploads/City_light_mobile.png')`,
              currentThemeMode === 'dark'
                ? `url('/lovable-uploads/dark.png')`
                : `url('/lovable-uploads/light.png')`,
              currentThemeMode === 'dark'
                ? `url('/lovable-uploads/dark.png')`
                : `url('/lovable-uploads/light.png')`,
            ],
            backgroundSize: 'cover',
            backgroundPosition: [
              'center 100%', // xs
              'center 100%', // sm
              'center 105%', // md
              'center 105%', // lg
              'center 105%', // xl
            ],
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            opacity: 1,
            zIndex: 1
          }}
        />
      )}
      
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
          p: { xs: 1, sm: 1.5 },
          minHeight: '48px',
          willChange: 'background-color, border-bottom, box-shadow',
          bgcolor:
            scrollY > 50
              ? currentThemeMode === 'dark'
                ? 'rgba(10, 10, 10, 0.95)'
                : 'rgba(255, 255, 255, 0.95)'
              : 'transparent',
          borderBottom:
            scrollY > 50
              ? currentThemeMode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : '1px solid rgba(0, 0, 0, 0.08)'
              : 'none',
          boxShadow: 'none',
          color: 'text.primary',
          py: { xs: 0.5, sm: 1 },
          transition: 'background-color 0.3s ease, border-bottom 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        {/* Título CityCore centrado absolutamente */}
        <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', pointerEvents: 'none' }}>
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
              backgroundImage: currentThemeMode === 'dark' 
                ? 'linear-gradient(90deg, #ffffff 0%, #cccccc 50%, #999999 100%)'
                : 'linear-gradient(90deg, #212121 0%, #666666 50%, #999999 100%)',
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
            <Avatar
              onClick={handleLogin}
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'transparent',
                color: theme => theme.palette.text.primary,
                fontSize: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  opacity: 0.8
                }
              }}
            >
              <AccountCircleIcon sx={{ fontSize: 32 }} />
            </Avatar>
          )}
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ pt: 8, pb: 0, position: 'relative', zIndex: 2 }}>
        {/* Main Value Proposition - Primera sección principal */}
        <Box 
          ref={heroSectionRef}
          sx={{ 
            textAlign: 'center', 
            minHeight: { xs: '100dvh', md: '100vh' },
            height: { xs: '100dvh', md: '100vh' },
            pt: { xs: 6, md: 6, lg: 8, xl: 18 },
            pb: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: { xs: 'flex-start', md: 'flex-start' },
            alignItems: 'center',
            py: 0,
            position: 'relative',
          }}
        >
           <Typography 
             variant="h2" 
             sx={{ 
               fontWeight: 700,
               mb: { xs: 2.5, sm: 3, md: 3, lg: 4 },
               color: currentThemeMode === 'dark' ? '#fff' : '#111',
               fontSize: { xs: '2.1rem', sm: '2.7rem', md: '2.3rem', lg: '3.2rem', xl: '4.5rem' },
               letterSpacing: '-0.02em',
               lineHeight: { xs: 1.13, sm: 1.12, md: 1.1 },
               maxWidth: 900,
               textAlign: 'center'
             }}
           >
             Todo sobre tu ciudad<br />
             <Box component="span" sx={{ color: currentThemeMode === 'dark' ? '#fff' : '#111', fontWeight: 700, display: 'inline' }}>en </Box>
             <Box component="span" sx={{ color: '#448aff', fontWeight: 800, display: 'inline' }}>CityCore</Box>
           </Typography>
           
           <Typography 
             variant="h6" 
             sx={{ 
               mb: { xs: 4, sm: 5, md: 4, lg: 5 },
               fontWeight: 400,
               color: currentThemeMode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(33, 33, 33, 0.85)',
               maxWidth: 600,
               mx: 'auto',
               fontSize: { xs: '1.15rem', sm: '1.25rem', md: '1.05rem', lg: '1.15rem', xl: '1.25rem' },
               lineHeight: { xs: 1.35, sm: 1.5, md: 1.4, lg: 1.5, xl: 1.6 },
               textAlign: 'center'
             }}
           >
            Consulta trámites, descubre eventos, encuentra lugares...
          </Typography>

          {/* City Selector integrado en hero section */}
          <Box
            sx={{
              maxWidth: 600,
              width: '100%',
              position: { xs: 'absolute', md: 'static' },
              left: 0,
              right: 0,
              bottom: { xs: 'calc(64px + env(safe-area-inset-bottom, 0px))', md: 'auto' },
              mx: 'auto',
              zIndex: 3,
              // En mobile, el input va pegado abajo
              pb: { xs: 0, md: 0 },
              // En desktop, mantiene el flujo normal
            }}
          >
             <Paper
               elevation={0}
               sx={{
                 display: 'flex',
                 flexDirection: 'column',
                 justifyContent: 'center',
                 p: 0,
                 borderRadius: '28px',
                 bgcolor: {
                  xs: currentThemeMode === 'dark' ? '#111' : '#fff',
                  sm: currentThemeMode === 'dark' ? '#111' : '#fff',
                  md: currentThemeMode === 'dark' ? '#111' : 'rgba(255,255,255,0.92)',
                },
                border: {
                  xs: currentThemeMode === 'dark' ? '1.5px solid #222' : '1.5px solid #e0e0e0',
                  sm: currentThemeMode === 'dark' ? '1.5px solid #222' : '1.5px solid #e0e0e0',
                  md: currentThemeMode === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.10)',
                },
                boxShadow: 'none',
                backdropFilter: { md: 'blur(10px)' },
                 width: '100%',
                 minWidth: 0,
                 mb: 3,
                 fontSize: { xs: '1rem', sm: '1.05rem', md: '0.95rem', lg: '1.05rem', xl: '1.15rem' },
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
                          <SearchIcon sx={{ color: currentThemeMode === 'dark' ? '#fff' : '#111', fontSize: 24 }} />
                        </InputAdornment>
                      ),
                      sx: {
                        py: 0,
                        fontSize: { xs: '1.1rem', sm: '1.15rem' },
                        lineHeight: '1.4',
                        minWidth: 0,
                        color: currentThemeMode === 'dark' ? '#fff' : '#111',
                        backgroundColor: 'transparent',
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
                       color: currentThemeMode === 'dark' ? '#fff' : '#111',
                       '& input': {
                         color: currentThemeMode === 'dark' ? '#fff' : '#111',
                         width: '100%',
                         minWidth: 0,
                         flex: 1,
                         textOverflow: 'clip',
                         overflow: 'visible',
                         '&::placeholder': {
                           color: currentThemeMode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(33,33,33,0.7)',
                            opacity: 1
                          }
                        }
                    }}
                  />
                  
                  {/* Sugerencias integradas dentro del input */}
                  {inputValue && filteredCities.length > 0 && (
                    <Box sx={{ 
                      mt: 1, 
                      bgcolor: currentThemeMode === 'dark' 
                        ? 'rgba(15, 15, 15, 0.95)' 
                        : 'rgba(255, 255, 255, 0.95)',
                      border: currentThemeMode === 'dark' 
                        ? '1px solid rgba(255, 255, 255, 0.1)' 
                        : '1px solid rgba(0, 0, 0, 0.1)',
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
                            borderBottom: index < filteredCities.length - 1 
                              ? currentThemeMode === 'dark' 
                                ? '1px solid rgba(255, 255, 255, 0.05)' 
                                : '1px solid rgba(0, 0, 0, 0.05)'
                              : 'none',
                            '&:hover': {
                              bgcolor: currentThemeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(33, 33, 33, 0.1)',
                              borderLeft: currentThemeMode === 'dark' ? '3px solid #ffffff' : '3px solid #212121'
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
                                                              bgcolor: city.profile_image_url ? 'transparent' : (currentThemeMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(33, 33, 33, 0.2)'),
                              color: currentThemeMode === 'dark' ? '#ffffff' : '#212121'
                              }}
                            >
                              {!city.profile_image_url && <LocationIcon sx={{ fontSize: 18 }} />}
                            </Avatar>
                            <Box sx={{ flex: 1, textAlign: 'left' }}>
                              <Typography variant="body1" fontWeight="500" sx={{ 
                                color: currentThemeMode === 'dark' ? '#ffffff' : '#212121', 
                                mb: 0, 
                                textAlign: 'left' 
                              }}>
                                {city.name}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                color: currentThemeMode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.6)' 
                                  : 'rgba(33, 33, 33, 0.6)', 
                                textAlign: 'left' 
                              }}>
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
                    gap: 2,
                      color: currentThemeMode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.8)' 
                        : 'rgba(33, 33, 33, 0.8)',
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
                           color: currentThemeMode === 'dark' 
                             ? 'rgba(255, 255, 255, 0.8)' 
                             : 'rgba(33, 33, 33, 0.8)',
                           bgcolor: 'transparent',
                           border: currentThemeMode === 'dark' 
                             ? '1px solid rgba(255, 255, 255, 0.2)' 
                             : '1px solid rgba(33, 33, 33, 0.2)',
                           textTransform: 'none',
                           fontSize: { xs: '0.95em', sm: '1em' },
                           fontWeight: 500,
                           '&:hover': {
                             bgcolor: currentThemeMode === 'dark' 
                               ? 'rgba(255, 255, 255, 0.1)' 
                               : 'rgba(33, 33, 33, 0.1)',
                             borderColor: currentThemeMode === 'dark' 
                               ? 'rgba(255, 255, 255, 0.3)' 
                               : 'rgba(33, 33, 33, 0.3)'
                           },
                           '& .MuiButton-startIcon': {
                             color: currentThemeMode === 'dark' 
                               ? 'rgba(255, 255, 255, 0.8)' 
                               : 'rgba(33, 33, 33, 0.8)',
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
                         color: selectedCity ? '#ffffff' : (currentThemeMode === 'dark' 
                           ? 'rgba(255, 255, 255, 0.4)' 
                           : 'rgba(33, 33, 33, 0.4)'),
                         bgcolor: selectedCity ? (currentThemeMode === 'dark' ? '#666666' : '#333333') : 'transparent',
                         border: selectedCity ? 'none' : (currentThemeMode === 'dark' 
                           ? '1px solid rgba(255, 255, 255, 0.2)' 
                           : '1px solid rgba(33, 33, 33, 0.2)'),
                         textTransform: 'none',
                         fontSize: { xs: '0.95em', sm: '1em' },
                         fontWeight: 500,
                         '&:hover': {
                                                       bgcolor: selectedCity ? (currentThemeMode === 'dark' ? '#555555' : '#222222') : (currentThemeMode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.1)' 
                              : 'rgba(33, 33, 33, 0.1)'),
                           borderColor: selectedCity ? 'none' : (currentThemeMode === 'dark' 
                             ? 'rgba(255, 255, 255, 0.3)' 
                             : 'rgba(33, 33, 33, 0.3)')
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

      {/* Infografía - Separada del hero section en mobile */}
      <Container maxWidth="lg" sx={{ pt: { xs: 4, md: 0 }, pb: { xs: 8, md: 0 }, position: 'relative', zIndex: 1 }}>
        {/* Título de la infografía - Mobile */}
        <Box sx={{
          display: { xs: 'block', md: 'none' },
          textAlign: 'center',
          mb: 6
        }}>
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 300,
              mb: 4,
              color: currentThemeMode === 'dark' ? '#ffffff' : '#212121',
              fontSize: { xs: '2rem', sm: '2.5rem' },
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              maxWidth: 800,
              mx: 'auto',
              minHeight: '2.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              textAlign: 'center'
            }}
          >
            {"Toda la información en tus manos".split(' ').map((word, index) => (
              <Typography
                key={index}
                component="span"
                variant="inherit"
                sx={{
                  opacity: 1,
                  transition: 'opacity 0.3s ease-out',
                  display: 'inline',
                  marginRight: '0.5rem',
                  '&::after': {
                    content: 'none'
                  },
                  '&::before': {
                    content: 'none'
                  }
                }}
              >
                {word}
              </Typography>
            ))}
          </Typography>
        </Box>

                <Box sx={{
          display: { xs: 'flex', md: 'none' },
          flexDirection: 'column',
          alignItems: 'center',
          mb: 4,
          maxWidth: 400,
          mx: 'auto'
        }}>
          {/* Paso 1 - Círculo */}
          <Box sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'transparent',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            opacity: step1Visible ? 1 : 0,
            transform: step1Visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
            transition: 'opacity 1s ease, transform 1s ease',
            mb: 2
          }}>
            <svg
              width="60"
              height="60"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: 'rotate(-90deg)'
              }}
            >
              <circle
                cx="30"
                cy="30"
                r="28.5"
                fill="none"
                stroke="rgba(0, 0, 0, 0.1)"
                strokeWidth="3"
              />
              <circle
                cx="30"
                cy="30"
                r="28.5"
                fill="none"
                stroke="#448aff"
                strokeWidth="3"
                strokeDasharray={`${step1Visible ? 2 * Math.PI * 28.5 : 0} ${2 * Math.PI * 28.5}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dasharray 2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transformOrigin: 'center'
                }}
              />
            </svg>
            <SendIcon sx={{ 
              fontSize: 24, 
              color: step1Visible ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
              transition: 'color 2s ease',
              zIndex: 1,
              position: 'relative'
            }} />
          </Box>

          {/* Texto paso 1 */}
          <Box sx={{
            opacity: step1Visible ? 1 : 0,
            transition: 'opacity 0.5s ease',
            mb: 2,
            textAlign: 'center'
          }}>
            <Typography sx={{
              color: '#ffffff',
              fontSize: '1.1rem',
              fontWeight: 700,
              lineHeight: 1.2
            }}>
              Enviar una<br />consulta
            </Typography>
          </Box>

          {/* Línea vertical 1 */}
          <Box sx={{
            width: 6,
            height: 56,
            mb: 2,
            opacity: line1Visible ? 1 : 0,
            transition: 'opacity 0.5s ease',
            overflow: 'visible'
          }}>
            <svg width={6} height={56} style={{ overflow: 'visible' }}>
              <line
                x1={3}
                y1={3}
                x2={3}
                y2={53}
                stroke="rgba(0, 0, 0, 0.1)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <line
                x1={3}
                y1={3}
                x2={3}
                y2={53}
                stroke="#448aff"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${line1Visible ? 50 : 0} 50`}
                strokeDashoffset="0"
                style={{
                  transition: 'stroke-dasharray 2s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: line1Visible ? 'drop-shadow(0 0 5px rgba(68, 138, 255, 0.3))' : 'none'
                }}
              />
            </svg>
          </Box>

          {/* Paso 2 - Círculo */}
          <Box sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'transparent',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            opacity: step2Visible ? 1 : 0,
            transform: step2Visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
            transition: 'opacity 1s ease, transform 1s ease',
            mb: 2
          }}>
            <svg
              width="60"
              height="60"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: 'rotate(-90deg)'
              }}
            >
              <circle
                cx="30"
                cy="30"
                r="28.5"
                fill="none"
                stroke="rgba(0, 0, 0, 0.1)"
                strokeWidth="3"
              />
              <circle
                cx="30"
                cy="30"
                r="28.5"
                fill="none"
                stroke="#448aff"
                strokeWidth="3"
                strokeDasharray={`${step2Visible ? 2 * Math.PI * 28.5 : 0} ${2 * Math.PI * 28.5}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dasharray 2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transformOrigin: 'center'
                }}
              />
            </svg>
            <BusinessIcon sx={{ 
              fontSize: 24, 
              color: step2Visible ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
              transition: 'color 2s ease',
              zIndex: 1,
              position: 'relative'
            }} />
          </Box>

          {/* Texto paso 2 */}
          <Box sx={{
            opacity: step2Visible ? 1 : 0,
            transition: 'opacity 0.5s ease',
            mb: 2,
            textAlign: 'center'
          }}>
            <Typography sx={{
              color: '#ffffff',
              fontSize: '1.1rem',
              fontWeight: 700,
              lineHeight: 1.2
            }}>
              Procesamiento<br />en City AI
            </Typography>
          </Box>

          {/* Línea vertical 2 */}
          <Box sx={{
            width: 6,
            height: 56,
            mb: 2,
            opacity: line2Visible ? 1 : 0,
            transition: 'opacity 0.5s ease',
            overflow: 'visible'
          }}>
            <svg width={6} height={56} style={{ overflow: 'visible' }}>
              <line
                x1={3}
                y1={3}
                x2={3}
                y2={53}
                stroke="rgba(0, 0, 0, 0.1)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <line
                x1={3}
                y1={3}
                x2={3}
                y2={53}
                stroke="#448aff"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${line2Visible ? 50 : 0} 50`}
                strokeDashoffset="0"
                style={{
                  transition: 'stroke-dasharray 2s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: line2Visible ? 'drop-shadow(0 0 5px rgba(68, 138, 255, 0.3))' : 'none'
                }}
              />
            </svg>
          </Box>

          {/* Paso 3 - Círculo */}
          <Box sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'transparent',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            opacity: step3Visible ? 1 : 0,
            transform: step3Visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
            transition: 'opacity 1s ease, transform 1s ease',
            mb: 2
          }}>
            <svg
              width="60"
              height="60"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: 'rotate(-90deg)'
              }}
            >
              <circle
                cx="30"
                cy="30"
                r="28.5"
                fill="none"
                stroke="rgba(0, 0, 0, 0.1)"
                strokeWidth="3"
              />
              <circle
                cx="30"
                cy="30"
                r="28.5"
                fill="none"
                stroke="#448aff"
                strokeWidth="3"
                strokeDasharray={`${step3Visible ? 2 * Math.PI * 28.5 : 0} ${2 * Math.PI * 28.5}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dasharray 2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transformOrigin: 'center'
                }}
              />
            </svg>
            <CheckIcon sx={{ 
              fontSize: 24, 
              color: step3Visible ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
              transition: 'color 2s ease',
              zIndex: 1,
              position: 'relative'
            }} />
          </Box>

          {/* Texto paso 3 */}
          <Box sx={{
            opacity: step3Visible ? 1 : 0,
            transition: 'opacity 0.5s ease',
            textAlign: 'center'
          }}>
            <Typography sx={{
              color: '#ffffff',
              fontSize: '1.1rem',
              fontWeight: 700,
              lineHeight: 1.2
            }}>
              Consultar<br />respuesta
            </Typography>
          </Box>
        </Box>
      </Container>



      {/* Título e Infografía - Desktop (sección 2) */}
      <Container maxWidth="lg" sx={{ pt: { xs: 0, md: 8 }, pb: { xs: 0, md: 4 }, position: 'relative', zIndex: 1 }}>
        {/* Título de la infografía - Desktop */}
        <Box sx={{
          display: { xs: 'none', md: 'block' },
          textAlign: 'center',
          mb: 20
        }}>
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 300,
              mb: 4,
              color: currentThemeMode === 'dark' ? '#ffffff' : '#212121',
              fontSize: { md: '2.5rem', lg: '3rem' },
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              maxWidth: 800,
              mx: 'auto',
              minHeight: '3.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              textAlign: 'center'
            }}
          >
            {"Toda la información en tus manos".split(' ').map((word, index) => (
              <Typography
                key={index}
                component="span"
                variant="inherit"
                sx={{
                  opacity: 1,
                  transition: 'opacity 0.3s ease-out',
                  display: 'inline',
                  marginRight: '0.5rem',
                  '&::after': {
                    content: 'none'
                  },
                  '&::before': {
                    content: 'none'
                  }
                }}
              >
                {word}
              </Typography>
            ))}
          </Typography>
        </Box>

        {/* Infografía - Desktop */}
        <Box sx={{
          display: { xs: 'none', md: 'flex' },
          justifyContent: 'center',
          alignItems: 'center',
          mb: 8,
          mt: 4
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 0,
            maxWidth: 600,
            px: 2,
            position: 'relative'
          }}>
            {/* Barra de progreso completa */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              position: 'relative'
            }}>
              {/* Texto del paso 1 */}
              <Box sx={{
                position: 'absolute',
                top: -60,
                left: 30,
                transform: 'translateX(-50%)',
                opacity: step1Visible ? 1 : 0,
                transition: 'opacity 0.5s ease',
                zIndex: 100,
                pointerEvents: 'none'
              }}>
                <Typography sx={{
                  color: currentThemeMode === 'dark' ? '#ffffff' : '#000000',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  lineHeight: 1.2,
                  textShadow: currentThemeMode === 'dark' ? 'none' : '0 1px 2px rgba(255,255,255,0.8)'
                }}>
                  Enviar una<br />consulta
                </Typography>
              </Box>

              {/* Primer círculo */}
              <Box sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'transparent',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: step1Visible ? 1 : 0,
                transform: step1Visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
                transition: 'opacity 1s ease, transform 1s ease',
                position: 'relative'
              }}>
                <svg
                  width="60"
                  height="60"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: 'rotate(-90deg)'
                  }}
                >
                  <circle
                    cx="30"
                    cy="30"
                    r="28.5"
                    fill="none"
                    stroke="rgba(0, 0, 0, 0.1)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="28.5"
                    fill="none"
                    stroke="#448aff"
                    strokeWidth="3"
                    strokeDasharray={`${step1Visible ? 2 * Math.PI * 28.5 : 0} ${2 * Math.PI * 28.5}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dasharray 2s cubic-bezier(0.4, 0, 0.2, 1)',
                      transformOrigin: 'center'
                    }}
                  />
                </svg>
                <SendIcon sx={{ 
                  fontSize: 24, 
                  color: step1Visible ? (currentThemeMode === 'dark' ? '#ffffff' : '#333333') : (currentThemeMode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'),
                  transition: 'color 2s ease',
                  zIndex: 1,
                  position: 'relative'
                }} />
              </Box>
              
              {/* Línea entre círculos 1 y 2 */}
              <Box sx={{
                width: 150,
                height: 3,
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                {/* Línea horizontal */}
                <Box sx={{ position: 'absolute', top: 0, left: 0 }}>
                  <svg width={150} height={3}>
                    <line
                      x1={0}
                      y1={1.5}
                      x2={150}
                      y2={1.5}
                      stroke="rgba(0, 0, 0, 0.1)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity={line1Visible ? 1 : 0}
                      style={{
                        transition: 'opacity 0.5s ease'
                      }}
                    />
                    <line
                      x1={0}
                      y1={1.5}
                      x2={150}
                      y2={1.5}
                      stroke="#448aff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${line1Visible ? 150 : 0} 150`}
                      strokeDashoffset="0"
                      opacity={line1Visible ? 1 : 0}
                      style={{
                        transition: 'stroke-dasharray 2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease',
                        filter: line1Visible ? 'drop-shadow(0 0 5px rgba(68, 138, 255, 0.3))' : 'none'
                      }}
                    />
                  </svg>
                </Box>
              </Box>
          
              {/* Texto del paso 2 */}
              <Box sx={{
                position: 'absolute',
                top: -60,
                left: 240,
                transform: 'translateX(-50%)',
                opacity: step2Visible ? 1 : 0,
                transition: 'opacity 0.5s ease',
                zIndex: 100,
                pointerEvents: 'none'
              }}>
                <Typography sx={{
                  color: currentThemeMode === 'dark' ? '#ffffff' : '#000000',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  lineHeight: 1.2,
                  textShadow: currentThemeMode === 'dark' ? 'none' : '0 1px 2px rgba(255,255,255,0.8)'
                }}>
                  Procesamiento<br />en City AI
                </Typography>
              </Box>

              {/* Segundo círculo */}
              <Box sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'transparent',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: step2Visible ? 1 : 0,
                transform: step2Visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
                transition: 'opacity 1s ease, transform 1s ease',
                position: 'relative'
              }}>
                <svg
                  width="60"
                  height="60"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: 'rotate(-90deg)'
                  }}
                >
                  <circle
                    cx="30"
                    cy="30"
                    r="28.5"
                    fill="none"
                    stroke="rgba(0, 0, 0, 0.1)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="28.5"
                    fill="none"
                    stroke="#448aff"
                    strokeWidth="3"
                    strokeDasharray={`${step2Visible ? 2 * Math.PI * 28.5 : 0} ${2 * Math.PI * 28.5}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dasharray 2s cubic-bezier(0.4, 0, 0.2, 1)',
                      transformOrigin: 'center'
                    }}
                  />
                </svg>
                <BusinessIcon sx={{ 
                  fontSize: 24, 
                  color: step2Visible ? (currentThemeMode === 'dark' ? '#ffffff' : '#333333') : (currentThemeMode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'),
                  transition: 'color 2s ease',
                  zIndex: 1,
                  position: 'relative'
                }} />
              </Box>
              
              {/* Línea entre círculos 2 y 3 */}
              <Box sx={{
                width: 150,
                height: 3,
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                {/* Línea horizontal */}
                <Box sx={{ position: 'absolute', top: 0, left: 0 }}>
                  <svg width={150} height={3}>
                    <line
                      x1={0}
                      y1={1.5}
                      x2={150}
                      y2={1.5}
                      stroke="rgba(0, 0, 0, 0.1)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity={line2Visible ? 1 : 0}
                      style={{
                        transition: 'opacity 0.5s ease'
                      }}
                    />
                    <line
                      x1={0}
                      y1={1.5}
                      x2={150}
                      y2={1.5}
                      stroke="#448aff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${line2Visible ? 150 : 0} 150`}
                      strokeDashoffset="0"
                      opacity={line2Visible ? 1 : 0}
                      style={{
                        transition: 'stroke-dasharray 2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease',
                        filter: line2Visible ? 'drop-shadow(0 0 5px rgba(68, 138, 255, 0.3))' : 'none'
                      }}
                    />
                  </svg>
                </Box>
              </Box>
          
              {/* Texto del paso 3 */}
              <Box sx={{
                position: 'absolute',
                top: -60,
                left: 450,
                transform: 'translateX(-50%)',
                opacity: step3Visible ? 1 : 0,
                transition: 'opacity 0.5s ease',
                zIndex: 100,
                pointerEvents: 'none'
              }}>
                <Typography sx={{
                  color: currentThemeMode === 'dark' ? '#ffffff' : '#000000',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  lineHeight: 1.2,
                  textShadow: currentThemeMode === 'dark' ? 'none' : '0 1px 2px rgba(255,255,255,0.8)'
                }}>
                  Consultar<br />respuesta
                </Typography>
              </Box>

              {/* Tercer círculo */}
              <Box sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'transparent',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: step3Visible ? 1 : 0,
                transform: step3Visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
                transition: 'opacity 1s ease, transform 1s ease',
                position: 'relative'
              }}>
                <svg
                  width="60"
                  height="60"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: 'rotate(-90deg)'
                  }}
                >
                  <circle
                    cx="30"
                    cy="30"
                    r="28.5"
                    fill="none"
                    stroke="rgba(0, 0, 0, 0.1)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="28.5"
                    fill="none"
                    stroke="#448aff"
                    strokeWidth="3"
                    strokeDasharray={`${step3Visible ? 2 * Math.PI * 28.5 : 0} ${2 * Math.PI * 28.5}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dasharray 2s cubic-bezier(0.4, 0, 0.2, 1)',
                      transformOrigin: 'center'
                    }}
                  />
                </svg>
                <CheckIcon sx={{ 
                  fontSize: 24, 
                  color: step3Visible ? (currentThemeMode === 'dark' ? '#ffffff' : '#333333') : (currentThemeMode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'),
                  transition: 'color 2s ease',
                  zIndex: 1,
                  position: 'relative'
                }} />
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Performance Section - Moved right after hero */}
      <Container maxWidth="lg" sx={{ pt: 0, pb: 12, position: 'relative', zIndex: 1 }}>
        <Box ref={nextSectionRef} sx={{ mb: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 8, mt: { xs: 8, md: 12 } }}>
            <Typography 
              variant="h2" 
              sx={{ 
                 fontWeight: 300,
                 mb: 6,
                 color: currentThemeMode === 'dark' ? '#ffffff' : '#212121',
                 fontSize: { xs: '2.5rem', md: '4rem' },
                 letterSpacing: '-0.02em',
                 lineHeight: 1.1,
                 maxWidth: 1000,
                 mx: 'auto',
                 minHeight: '4.4rem', // Maintain consistent height
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 flexWrap: 'wrap',
                 textAlign: 'center'
               }}
             >
               {scrollRevealText.split(' ').map((word, index) => (
                 <Typography
                   key={index}
                   component="span"
                   variant="inherit"
                   sx={{
                     opacity: wordOpacities[index] || 0,
                     transition: 'opacity 0.3s ease-out',
                     display: 'inline',
                     marginRight: '0.5rem',
                     '&::after': {
                       content: 'none'
                     },
                     '&::before': {
                       content: 'none'
                     }
                   }}
                 >
                   {word}
                 </Typography>
               ))}

             </Typography>
             
             <Button
               variant="outlined"
               sx={{
                 borderRadius: '50px',
                 px: 4,
                 py: 1.5,
                 borderColor: currentThemeMode === 'dark' 
                   ? 'rgba(255, 255, 255, 0.3)' 
                   : 'rgba(33, 33, 33, 0.3)',
                 color: currentThemeMode === 'dark' ? '#ffffff' : '#212121',
                 textTransform: 'none',
                 fontWeight: 400,
                 '&:hover': {
                   borderColor: currentThemeMode === 'dark' 
                     ? 'rgba(255, 255, 255, 0.5)' 
                     : 'rgba(33, 33, 33, 0.5)',
                   bgcolor: currentThemeMode === 'dark' 
                     ? 'rgba(255, 255, 255, 0.05)' 
                     : 'rgba(33, 33, 33, 0.05)'
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
            {/* Background grid effect - removed to avoid covering background */}
            {/* <Box sx={{
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
            }} /> */}
            
            {/* Curved line element */}
            <Box sx={{
              position: 'absolute',
              top: '20%',
              right: '10%',
              width: 200,
              height: 200,
              border: currentThemeMode === 'dark' ? '2px solid #ffffff' : '2px solid #212121',
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
                     bgcolor: currentThemeMode === 'dark' 
                       ? 'rgba(255, 255, 255, 0.08)' 
                       : 'rgba(255, 255, 255, 0.9)',
                     border: currentThemeMode === 'dark' 
                       ? '1px solid rgba(255, 255, 255, 0.12)' 
                       : '1px solid rgba(0, 0, 0, 0.1)',
                     borderRadius: '20px',
                     backdropFilter: 'blur(20px)',
                     transition: 'all 0.3s ease',
                     '&:hover': {
                       transform: 'translateY(-4px)',
                       boxShadow: currentThemeMode === 'dark' 
                         ? '0 12px 24px rgba(0, 0, 0, 0.3)' 
                         : '0 12px 24px rgba(0, 0, 0, 0.1)'
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
                      {index === 0 && <AutoAwesomeIcon sx={{ fontSize: 30, color: currentThemeMode === 'dark' ? '#ffffff' : '#212121' }} />}
                      {index === 1 && <SpeedIcon sx={{ fontSize: 30, color: currentThemeMode === 'dark' ? '#ffffff' : '#212121' }} />}
                      {index === 2 && <SecurityIcon sx={{ fontSize: 30, color: currentThemeMode === 'dark' ? '#ffffff' : '#212121' }} />}
                     </Box>
                   </Box>

                   <Typography variant="h6" sx={{ 
                     color: currentThemeMode === 'dark' ? '#ffffff' : '#212121',
                     fontWeight: 400,
                     mb: 2,
                     textAlign: 'center'
                   }}>
                     {item.title}
                   </Typography>

                   <Typography variant="body2" sx={{ 
                     color: currentThemeMode === 'dark' 
                       ? 'rgba(255, 255, 255, 0.8)' 
                       : 'rgba(33, 33, 33, 0.8)',
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
              bgcolor: currentThemeMode === 'dark' 
                ? 'rgba(255, 255, 255, 0.08)' 
                : 'rgba(255, 255, 255, 0.9)',
              border: currentThemeMode === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.12)' 
                : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '20px',
              backdropFilter: 'blur(20px)',
              p: { xs: 3, md: 6 },
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="caption" sx={{ 
                color: currentThemeMode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.6)' 
                  : 'rgba(33, 33, 33, 0.6)',
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
                color: currentThemeMode === 'dark' ? '#ffffff' : '#212121',
                fontWeight: 300,
                mb: 2,
                fontSize: { xs: '1.5rem', md: '2rem' }
              }}>
                Conexión inteligente con tu municipio
              </Typography>
              <Typography variant="body1" sx={{ 
                color: currentThemeMode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.8)' 
                  : 'rgba(33, 33, 33, 0.8)',
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
                                     bgcolor: index === 1 ? (currentThemeMode === 'dark' ? '#ffffff' : '#212121') : (currentThemeMode === 'dark' 
                     ? 'rgba(255, 255, 255, 0.3)' 
                     : 'rgba(33, 33, 33, 0.3)'),
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
                 bgcolor: currentThemeMode === 'dark' 
                   ? 'rgba(255, 255, 255, 0.05)' 
                   : 'rgba(255, 255, 255, 0.9)',
                 borderRadius: '50px',
                 p: 1,
                 border: currentThemeMode === 'dark' 
                   ? '1px solid rgba(255, 255, 255, 0.1)' 
                   : '1px solid rgba(0, 0, 0, 0.1)'
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
                     color: index === 0 ? '#ffffff' : (currentThemeMode === 'dark' 
                       ? 'rgba(255, 255, 255, 0.8)' 
                       : 'rgba(33, 33, 33, 0.8)'),
                     bgcolor: index === 0 ? (currentThemeMode === 'dark' ? '#666666' : '#333333') : 'transparent',
                     minWidth: { xs: '100%', sm: 'auto' },
                     '&:hover': {
                                               bgcolor: index === 0 ? (currentThemeMode === 'dark' ? '#555555' : '#222222') : (currentThemeMode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(33, 33, 33, 0.1)')
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
                 color: currentThemeMode === 'dark' ? '#ffffff' : '#212121',
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
                 color: currentThemeMode === 'dark' 
                   ? 'rgba(255, 255, 255, 0.8)' 
                   : 'rgba(33, 33, 33, 0.8)',
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
                     bgcolor: currentThemeMode === 'dark' 
                       ? 'rgba(255, 255, 255, 0.08)' 
                       : 'rgba(255, 255, 255, 0.9)',
                                           border: product.highlight 
                        ? (currentThemeMode === 'dark' ? '2px solid #ffffff' : '2px solid #212121') 
                        : currentThemeMode === 'dark' 
                          ? '1px solid rgba(255, 255, 255, 0.12)' 
                          : '1px solid rgba(0, 0, 0, 0.1)',
                     borderRadius: '20px',
                     backdropFilter: 'blur(20px)',
                     transition: 'all 0.3s ease',
                     '&:hover': {
                       transform: 'translateY(-8px)',
                       boxShadow: currentThemeMode === 'dark' 
                         ? '0 20px 40px rgba(0, 0, 0, 0.4)' 
                         : '0 20px 40px rgba(0, 0, 0, 0.1)'
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
                          bgcolor: currentThemeMode === 'dark' ? '#666666' : '#333333',
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
                     color: currentThemeMode === 'dark' 
                       ? 'rgba(255, 255, 255, 0.6)' 
                       : 'rgba(33, 33, 33, 0.6)',
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
                     color: currentThemeMode === 'dark' ? '#ffffff' : '#212121',
                     fontWeight: 400,
                     mb: 2
                   }}>
                     {product.title}
                   </Typography>

                   <Typography variant="body2" sx={{ 
                     color: currentThemeMode === 'dark' 
                       ? 'rgba(255, 255, 255, 0.8)' 
                       : 'rgba(33, 33, 33, 0.8)',
                     lineHeight: 1.6
                   }}>
                     {product.description}
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
               bgcolor: currentThemeMode === 'dark' 
                 ? 'rgba(255, 255, 255, 0.08)' 
                 : 'rgba(255, 255, 255, 0.9)',
               border: currentThemeMode === 'dark' 
                 ? '1px solid rgba(255, 255, 255, 0.12)' 
                 : '1px solid rgba(0, 0, 0, 0.1)',
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
                 color: currentThemeMode === 'dark' ? '#ffffff' : '#212121',
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
                 color: currentThemeMode === 'dark' 
                   ? 'rgba(255, 255, 255, 0.8)' 
                   : 'rgba(33, 33, 33, 0.8)',
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
                                     bgcolor: currentThemeMode === 'dark' ? '#666666' : '#333333',
                  color: '#ffffff',
                  fontWeight: 400,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  '&:hover': {
                    bgcolor: currentThemeMode === 'dark' ? '#555555' : '#222222'
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
                   borderColor: currentThemeMode === 'dark' 
                     ? 'rgba(255, 255, 255, 0.3)' 
                     : 'rgba(33, 33, 33, 0.3)',
                   color: currentThemeMode === 'dark' ? '#ffffff' : '#212121',
                   fontWeight: 400,
                   textTransform: 'none',
                   fontSize: '1.1rem',
                   '&:hover': {
                     borderColor: currentThemeMode === 'dark' 
                       ? 'rgba(255, 255, 255, 0.5)' 
                       : 'rgba(33, 33, 33, 0.5)',
                     bgcolor: currentThemeMode === 'dark' 
                       ? 'rgba(255, 255, 255, 0.05)' 
                       : 'rgba(33, 33, 33, 0.05)'
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
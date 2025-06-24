import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Container, Paper, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import FinetuningPage from './components/FinetuningPage';
import AppHeader from './components/AppHeader';
import AppDrawer from './components/AppDrawer';
import ChatContainer from './components/ChatContainer';
import {
    ChatMessage, CustomChatConfig, PlaceCardInfo
} from './types';
import { initializeGeminiService } from './services/geminiService';
import { useChatManager } from './hooks/useChatManager';
import { useGeolocation } from './hooks/useGeolocation';
import {
    API_KEY_ERROR_MESSAGE,
    MAPS_API_KEY_INVALID_ERROR_MESSAGE,
    DEFAULT_CHAT_CONFIG,
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE_CODE,
    DEFAULT_CHAT_TITLE,
} from './constants';

type View = 'chat' | 'finetuning';

interface UserLocation {
  latitude: number;
  longitude: number;
}

(window as any).initMap = () => {
  // console.log("Google Maps API script (potentially) loaded via callback.");
};

interface AppProps {
  toggleTheme: () => void;
  currentThemeMode: 'light' | 'dark';
}

const App: React.FC<AppProps> = ({ toggleTheme, currentThemeMode }) => {
  const [appError, setAppError] = useState<string | null>(null);
  const [isGeminiReady, setIsGeminiReady] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>('chat');
  const [chatTitles, setChatTitles] = useState<string[]>([DEFAULT_CHAT_TITLE]);
  const [selectedChatIndex, setSelectedChatIndex] = useState<number>(0);

  const [chatConfig, setChatConfig] = useState<CustomChatConfig>(() => {
    let loadedConfig: CustomChatConfig = { ...DEFAULT_CHAT_CONFIG };
    try {
      const savedConfigString = localStorage.getItem('chatConfig');
      if (savedConfigString) {
        const savedConfig = JSON.parse(savedConfigString) as Partial<CustomChatConfig>;
        loadedConfig = {
            ...loadedConfig,
            ...savedConfig,
            recommendedPrompts: savedConfig.recommendedPrompts || DEFAULT_CHAT_CONFIG.recommendedPrompts,
            serviceTags: savedConfig.serviceTags || DEFAULT_CHAT_CONFIG.serviceTags,
            procedureSourceUrls: savedConfig.procedureSourceUrls || DEFAULT_CHAT_CONFIG.procedureSourceUrls,
            uploadedProcedureDocuments: savedConfig.uploadedProcedureDocuments || DEFAULT_CHAT_CONFIG.uploadedProcedureDocuments,
            restrictedCity: savedConfig.restrictedCity !== undefined ? savedConfig.restrictedCity : DEFAULT_CHAT_CONFIG.restrictedCity,
            sedeElectronicaUrl: savedConfig.sedeElectronicaUrl || DEFAULT_CHAT_CONFIG.sedeElectronicaUrl,
        };
      }
    } catch (error) {
      console.error("Error parsing saved chatConfig from localStorage:", error);
    }

    const isValidSavedLanguage = loadedConfig.currentLanguageCode && SUPPORTED_LANGUAGES.some(l => l.code === loadedConfig.currentLanguageCode);
    if (!isValidSavedLanguage) {
      let detectedLangCode = DEFAULT_LANGUAGE_CODE;
      if (typeof navigator !== 'undefined' && navigator.language) {
        const browserLang = navigator.language;
        const baseBrowserLang = browserLang.split('-')[0];
        const exactMatch = SUPPORTED_LANGUAGES.find(l => l.code.toLowerCase() === browserLang.toLowerCase());
        if (exactMatch) detectedLangCode = exactMatch.code;
        else {
          const baseMatch = SUPPORTED_LANGUAGES.find(l => l.code.split('-')[0].toLowerCase() === baseBrowserLang.toLowerCase());
          if (baseMatch) detectedLangCode = baseMatch.code;
        }
      }
      loadedConfig.currentLanguageCode = detectedLangCode;
    }
    return loadedConfig;
  });

  const { userLocation, geolocationError, geolocationStatus } = useGeolocation(chatConfig.allowGeolocation);

  const [googleMapsScriptLoaded, setGoogleMapsScriptLoaded] = useState(false);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { messages, isLoading, handleSendMessage, handleSeeMoreEvents, clearMessages, setMessages } = useChatManager(
    chatConfig,
    userLocation,
    isGeminiReady,
    setAppError,
    setIsGeminiReady
  );

  useEffect(() => {
    const handleAuthFailure = () => {
      console.error("Google Maps API Authentication Failure (gm_authFailure). Invalid API Key or configuration for Maps.");
      setAppError(MAPS_API_KEY_INVALID_ERROR_MESSAGE);
      setGoogleMapsScriptLoaded(false);
    };

    (window as any).gm_authFailure = handleAuthFailure;

    return () => {
      if ((window as any).gm_authFailure === handleAuthFailure) {
        delete (window as any).gm_authFailure;
      }
    };
  }, []);

  useEffect(() => {
    if (isMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen, isMobile]);

  const loadGoogleMapsScript = useCallback((apiKey: string) => {
    if (googleMapsScriptLoaded || (typeof google !== 'undefined' && google.maps && google.maps.places)) {
      setGoogleMapsScriptLoaded(true);
      if (typeof google !== 'undefined' && google.maps && google.maps.places && !placesServiceRef.current) {
        placesServiceRef.current = new google.maps.places.PlacesService(document.createElement('div'));
      }
      return;
    }
    if (document.getElementById('google-maps-script')) return;
     if (!apiKey) {
        console.warn("Google Maps API key is missing. Maps features will be disabled.");
        setGoogleMapsScriptLoaded(false);
        return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleMapsScriptLoaded(true);
      if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        placesServiceRef.current = new google.maps.places.PlacesService(document.createElement('div'));
      }
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps API script.");
      setAppError("Error al cargar Google Maps API. Funciones de mapa desactivadas.");
      setGoogleMapsScriptLoaded(false);
    };
    document.head.appendChild(script);
  }, [googleMapsScriptLoaded]);

  useEffect(() => {
    // Initialize Gemini service with hardcoded API key
    if (initializeGeminiService()) {
      setIsGeminiReady(true);
      setAppError(null);
      // Load Google Maps script (you might want to add a hardcoded Maps API key here too)
      // loadGoogleMapsScript('YOUR_MAPS_API_KEY');
    } else {
      setIsGeminiReady(false);
      setAppError("Error al inicializar el servicio Gemini.");
    }
  }, [loadGoogleMapsScript]);

  const updatePlaceCardInMessage = useCallback((messageId: string, placeCardId: string, updates: Partial<PlaceCardInfo>) => {
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId && msg.placeCards) {
          return {
            ...msg,
            placeCards: msg.placeCards.map(card =>
              card.id === placeCardId ? { ...card, ...updates } : card
            ),
          };
        }
        return msg;
      })
    );
  }, [setMessages]);

  const fetchPlaceDetailsAndUpdateMessage = useCallback(async (messageId: string, placeCardId: string, placeId?: string, searchQuery?: string) => {
    if (!googleMapsScriptLoaded || !placesServiceRef.current) {
        updatePlaceCardInMessage(messageId, placeCardId, { isLoadingDetails: false, errorDetails: "Servicio de Google Places no disponible." });
        return;
    }
    const requestFields = ['name', 'place_id', 'formatted_address', 'photo', 'rating', 'user_ratings_total', 'url', 'geometry', 'website'];
    const processPlaceResult = (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            let photoUrl: string | undefined = undefined;
            let photoAttributions: string[] | undefined = undefined;
            if (place.photos && place.photos.length > 0) {
                photoUrl = place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 });
                photoAttributions = place.photos[0].html_attributions;
            }
            let distanceString: string | undefined = undefined;
            if (userLocation && place.geometry?.location && typeof google !== 'undefined' && google.maps?.geometry?.spherical) {
                const placeLocation = new google.maps.LatLng(place.geometry.location.lat(), place.geometry.location.lng());
                const currentUserLocation = new google.maps.LatLng(userLocation.latitude, userLocation.longitude);
                const distInMeters = google.maps.geometry.spherical.computeDistanceBetween(currentUserLocation, placeLocation);
                if (distInMeters < 1000) distanceString = `${Math.round(distInMeters)} m`;
                else distanceString = `${(distInMeters / 1000).toFixed(1)} km`;
            }
            updatePlaceCardInMessage(messageId, placeCardId, {
                isLoadingDetails: false, photoUrl, photoAttributions, rating: place.rating,
                userRatingsTotal: place.user_ratings_total, address: place.formatted_address,
                mapsUrl: place.url, website: place.website, distance: distanceString, errorDetails: undefined,
            });
        } else {
            updatePlaceCardInMessage(messageId, placeCardId, { isLoadingDetails: false, errorDetails: `No se encontraron detalles (${status}).` });
        }
    };

    if (placeId) {
        placesServiceRef.current.getDetails({ placeId, fields: requestFields, language: chatConfig.currentLanguageCode || DEFAULT_LANGUAGE_CODE }, processPlaceResult);
    } else if (searchQuery) {
        placesServiceRef.current.textSearch({ query: searchQuery, fields: requestFields, language: chatConfig.currentLanguageCode || DEFAULT_LANGUAGE_CODE }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                if (results[0].place_id) {
                    placesServiceRef.current!.getDetails({ placeId: results[0].place_id, fields: requestFields, language: chatConfig.currentLanguageCode || DEFAULT_LANGUAGE_CODE }, processPlaceResult);
                } else processPlaceResult(results[0], status);
            } else {
                updatePlaceCardInMessage(messageId, placeCardId, { isLoadingDetails: false, errorDetails: `Lugar no encontrado (${status}).` });
            }
        });
    } else {
        updatePlaceCardInMessage(messageId, placeCardId, { isLoadingDetails: false, errorDetails: "Falta ID o consulta." });
    }
  }, [userLocation, updatePlaceCardInMessage, chatConfig.currentLanguageCode, googleMapsScriptLoaded]);

  useEffect(() => {
    if (!googleMapsScriptLoaded || !placesServiceRef.current) return;
    messages.forEach(msg => {
      if (msg.role === 'model' && msg.placeCards) {
        msg.placeCards.forEach(card => {
          if (card.isLoadingDetails && (card.placeId || card.searchQuery)) {
            if (!card.errorDetails && !card.photoUrl) {
              fetchPlaceDetailsAndUpdateMessage(msg.id, card.id, card.placeId, card.searchQuery);
            } else {
              updatePlaceCardInMessage(msg.id, card.id, { isLoadingDetails: false });
            }
          }
        });
      }
    });
  }, [messages, googleMapsScriptLoaded, fetchPlaceDetailsAndUpdateMessage, updatePlaceCardInMessage]);

  const handleNewChat = (newChatTitle: string = DEFAULT_CHAT_TITLE) => {
    clearMessages();
    if (appError && !appError.toLowerCase().includes("google maps") && !appError.includes("API_KEY") && appError !== MAPS_API_KEY_INVALID_ERROR_MESSAGE) {
      setAppError(null);
    }
    if(isMobile) setIsMenuOpen(false);
  };

  const handleSetCurrentLanguageCode = (newLangCode: string) => {
    setChatConfig(prevConfig => {
        if (prevConfig.currentLanguageCode === newLangCode) return prevConfig;
        const updatedConfig = { ...prevConfig, currentLanguageCode: newLangCode };
        localStorage.setItem('chatConfig', JSON.stringify(updatedConfig));
        clearMessages();
        return updatedConfig;
    });
  };

  const handleSaveCustomization = async (newConfig: CustomChatConfig) => {
    const configToSave: CustomChatConfig = { ...DEFAULT_CHAT_CONFIG, ...newConfig };
    configToSave.assistantName = newConfig.assistantName.trim() || DEFAULT_CHAT_CONFIG.assistantName;
    configToSave.systemInstruction = typeof newConfig.systemInstruction === 'string' ? newConfig.systemInstruction.trim() : DEFAULT_CHAT_CONFIG.systemInstruction;
    configToSave.currentLanguageCode = newConfig.currentLanguageCode && SUPPORTED_LANGUAGES.some(l => l.code === newConfig.currentLanguageCode) ? newConfig.currentLanguageCode : DEFAULT_CHAT_CONFIG.currentLanguageCode;
    configToSave.restrictedCity = newConfig.restrictedCity !== undefined ? newConfig.restrictedCity : DEFAULT_CHAT_CONFIG.restrictedCity;
    configToSave.procedureSourceUrls = newConfig.procedureSourceUrls || DEFAULT_CHAT_CONFIG.procedureSourceUrls;
    configToSave.uploadedProcedureDocuments = newConfig.uploadedProcedureDocuments || DEFAULT_CHAT_CONFIG.uploadedProcedureDocuments;
    configToSave.sedeElectronicaUrl = newConfig.sedeElectronicaUrl || DEFAULT_CHAT_CONFIG.sedeElectronicaUrl;

    localStorage.setItem('chatConfig', JSON.stringify(configToSave));
    setChatConfig(configToSave);
    setCurrentView('chat');
    clearMessages();
    setIsMenuOpen(false);
    if (appError && !appError.includes("API_KEY") && !appError.toLowerCase().includes("google maps") && !appError.toLowerCase().includes("offline") && !appError.toLowerCase().includes("network") && appError !== MAPS_API_KEY_INVALID_ERROR_MESSAGE) {
        setAppError(null);
    }
  };

  const handleDownloadPdf = (pdfInfo: NonNullable<ChatMessage['downloadablePdfInfo']>) => {
    try {
        const byteCharacters = atob(pdfInfo.base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {type: pdfInfo.mimeType});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = pdfInfo.fileName;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Error downloading PDF:", e);
        setAppError(`Error al descargar PDF: ${pdfInfo.fileName}.`);
    }
  };

  const handleSelectChat = (index: number) => {
    setSelectedChatIndex(index);
    if (index !== selectedChatIndex) {
        clearMessages(); // Clear for demo
    }
    if (isMobile) setIsMenuOpen(false);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleOpenFinetuning = () => {
    setCurrentView('finetuning');
  };

  const handleOpenSettings = () => {
    setCurrentView('finetuning');
  };

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

  if (currentView === 'finetuning') {
    return (
      <FinetuningPage
        currentConfig={chatConfig}
        onSave={handleSaveCustomization}
        onCancel={() => {setCurrentView('chat'); setIsMenuOpen(false);}}
        googleMapsScriptLoaded={googleMapsScriptLoaded}
        apiKeyForMaps=""
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', maxHeight: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <AppDrawer
        isMenuOpen={isMenuOpen}
        onMenuToggle={handleMenuToggle}
        onNewChat={handleNewChat}
        onOpenFinetuning={handleOpenFinetuning}
        chatTitles={chatTitles}
        selectedChatIndex={selectedChatIndex}
        onSelectChat={handleSelectChat}
        chatConfig={chatConfig}
        userLocation={userLocation}
        geolocationStatus={geolocationStatus}
      />

      <Box component="main" sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        ...(isMenuOpen && !isMobile && {
            transition: theme.transitions.create(['margin', 'width'], {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
        }),
      }}>
        <AppHeader
          isMobile={isMobile}
          onMenuToggle={handleMenuToggle}
          currentThemeMode={currentThemeMode}
          onToggleTheme={toggleTheme}
          onOpenSettings={handleOpenSettings}
        />

        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          appError={appError}
          chatConfig={chatConfig}
          onSendMessage={handleSendMessage}
          onDownloadPdf={handleDownloadPdf}
          onSeeMoreEvents={handleSeeMoreEvents}
          onSetLanguageCode={handleSetCurrentLanguageCode}
        />
      </Box>
    </Box>
  );
};

export default App;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chat as GeminiChat } from '@google/genai';
import {
    Box, Drawer, AppBar, Toolbar, IconButton, Typography, Button, Container, Alert, AlertTitle,
    List, ListItem, ListItemButton, ListItemIcon, ListItemText, CircularProgress, useTheme, Stack, useMediaQuery, Paper,
    Avatar, Chip, Divider, Menu, MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add'; // Fallback, prefer more specific
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'; // For "Nueva conversación"
import LocationCityIcon from '@mui/icons-material/LocationCity'; // For "Descubrir ciudades"
import HistoryIcon from '@mui/icons-material/History'; // For "Actividad"
import TuneIcon from '@mui/icons-material/Tune'; // For "Configurar chat"
import SettingsIcon from '@mui/icons-material/Settings'; // For settings menu
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'; // For "Probar"
import PersonIcon from '@mui/icons-material/Person'; // For Avatar
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // Sparkle icon
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import GpsNotFixedIcon from '@mui/icons-material/GpsNotFixed';
import GpsOffIcon from '@mui/icons-material/GpsOff';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';


import {
    ChatMessage, MessageRole, CustomChatConfig, GroundingMetadata, RestrictedCityInfo, EventInfo, PlaceCardInfo, SupportedLanguage, UploadedProcedureDocument
} from './types';
import { initializeGeminiService, initChatSession, sendMessageToGeminiStream } from './services/geminiService';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import FinetuningPage from './components/FinetuningPage';
import {
  API_KEY_ERROR_MESSAGE,
  MAPS_API_KEY_INVALID_ERROR_MESSAGE,
  DEFAULT_ASSISTANT_NAME,
  INITIAL_SYSTEM_INSTRUCTION,
  SHOW_MAP_MARKER_START,
  SHOW_MAP_MARKER_END,
  SHOW_MAP_PROMPT_SYSTEM_INSTRUCTION,
  EVENT_CARD_START_MARKER,
  EVENT_CARD_END_MARKER,
  EVENT_CARD_SYSTEM_INSTRUCTION,
  MAX_INITIAL_EVENTS,
  PLACE_CARD_START_MARKER,
  PLACE_CARD_END_MARKER,
  PLACE_CARD_SYSTEM_INSTRUCTION,
  GEOLOCATION_PROMPT_CLAUSE,
  RESTRICT_TO_CITY_SYSTEM_INSTRUCTION_CLAUSE,
  CITY_PROCEDURES_SYSTEM_INSTRUCTION_CLAUSE,
  PROCEDURE_URLS_PREAMBLE_TEXT_TEMPLATE,
  PROCEDURE_URLS_GUIDANCE_TEXT_TEMPLATE,
  UPLOADED_DOCUMENTS_CONTEXT_CLAUSE,
  UPLOADED_PDF_PROCEDURE_INSTRUCTION_TEMPLATE,
  TECA_LINK_BUTTON_START_MARKER,
  TECA_LINK_BUTTON_END_MARKER,
  RICH_TEXT_FORMATTING_SYSTEM_INSTRUCTION,
  DEFAULT_CHAT_CONFIG,
  LANGUAGE_PROMPT_CLAUSE,
  DEFAULT_LANGUAGE_CODE,
  SUPPORTED_LANGUAGES,
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


const getFriendlyError = (error: any, defaultMessage: string): string => {
  let message = defaultMessage;
  if (!error) return defaultMessage;

  if (typeof error.message === 'string') {
    if (error.message.toLowerCase().includes('failed to fetch') || error.message.toLowerCase().includes('networkerror')) {
      message = "Error de red. Verifica tu conexión a internet.";
    } else if (error.message.includes("API Key") || error.message.toLowerCase().includes("api_key")) {
      message = API_KEY_ERROR_MESSAGE;
    } else {
      message = error.message;
    }
  }

  if (message === defaultMessage && navigator && !navigator.onLine) {
    message = "Parece que no hay conexión a internet.";
  }
  return message;
};

interface AppProps {
  toggleTheme: () => void;
  currentThemeMode: 'light' | 'dark';
}

const App: React.FC<AppProps> = ({ toggleTheme, currentThemeMode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [appError, setAppError] = useState<string | null>(null);
  const geminiChatSessionRef = useRef<GeminiChat | null>(null);

  const [isGeminiReady, setIsGeminiReady] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>('chat');
  const [chatTitles, setChatTitles] = useState<string[]>([DEFAULT_CHAT_TITLE]); // Placeholder for recent chats
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

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [geolocationStatus, setGeolocationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const [googleMapsScriptLoaded, setGoogleMapsScriptLoaded] = useState(false);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const displayedEventUniqueKeys = useRef(new Set<string>());
  const lastUserQueryThatLedToEvents = useRef<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const drawerWidth = 260;
  const collapsedDrawerWidth = 72; // Width when collapsed, for icons only

  const [userMenuAnchorEl, setUserMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const openUserMenu = Boolean(userMenuAnchorEl);


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

  const buildFullSystemInstruction = (config: CustomChatConfig, location: UserLocation | null): string => {
    let systemInstructionParts: string[] = [];
    systemInstructionParts.push(LANGUAGE_PROMPT_CLAUSE.replace('{languageCode}', config.currentLanguageCode || DEFAULT_LANGUAGE_CODE));
    systemInstructionParts.push(RICH_TEXT_FORMATTING_SYSTEM_INSTRUCTION);
    const cityContextForProcedures = config.restrictedCity?.name ? `el municipio de ${config.restrictedCity.name}, España` : "la ciudad consultada";
    let procedureUrlsPreambleText = "";
    let procedureUrlsGuidanceText = "";
    if (config.procedureSourceUrls && config.procedureSourceUrls.length > 0) {
        const urlListString = config.procedureSourceUrls.map(url => `- ${url}`).join("\n");
        procedureUrlsPreambleText = PROCEDURE_URLS_PREAMBLE_TEXT_TEMPLATE.replace('{procedureUrlList}', urlListString);
        procedureUrlsGuidanceText = PROCEDURE_URLS_GUIDANCE_TEXT_TEMPLATE;
    }
    let uploadedDocsListString = "No hay documentos PDF de trámites disponibles.";
    if (config.uploadedProcedureDocuments && config.uploadedProcedureDocuments.length > 0) {
        uploadedDocsListString = "Documentos PDF de trámites disponibles:\n" +
            config.uploadedProcedureDocuments.map(doc => `- Trámite: \"${doc.procedureName}\", Archivo: \"${doc.fileName}\"`).join("\n");
        systemInstructionParts.push(UPLOADED_PDF_PROCEDURE_INSTRUCTION_TEMPLATE);
    }
    const finalUploadedDocsContext = UPLOADED_DOCUMENTS_CONTEXT_CLAUSE.replace('{uploadedDocumentsListPlaceholder}', uploadedDocsListString);
    systemInstructionParts.push(finalUploadedDocsContext);
    const finalCityProceduresInstruction = CITY_PROCEDURES_SYSTEM_INSTRUCTION_CLAUSE
        .replace(/{cityContext}/g, cityContextForProcedures)
        .replace(/{procedureUrlsPreamble}/g, procedureUrlsPreambleText)
        .replace(/{procedureUrlsGuidance}/g, procedureUrlsGuidanceText)
        .replace(/{configuredSedeElectronicaUrl}/g, config.sedeElectronicaUrl || '');
    systemInstructionParts.push(finalCityProceduresInstruction);
    if (config.restrictedCity && config.restrictedCity.name) {
      systemInstructionParts.push(RESTRICT_TO_CITY_SYSTEM_INSTRUCTION_CLAUSE.replace(/{cityName}/g, config.restrictedCity.name));
    }
    if (config.serviceTags && config.serviceTags.length > 0) {
      systemInstructionParts.push(`Especialización: ${config.serviceTags.join(", ")} en ${config.restrictedCity ? config.restrictedCity.name : 'la ciudad'}.`);
    }
    if (typeof config.systemInstruction === 'string' && config.systemInstruction.trim()) {
        systemInstructionParts.push(config.systemInstruction.trim());
    } else if (systemInstructionParts.length <=1 || (systemInstructionParts.length <=2 && config.restrictedCity)) {
        const cityContext = config.restrictedCity ? ` sobre ${config.restrictedCity.name}` : "";
        systemInstructionParts.push(INITIAL_SYSTEM_INSTRUCTION.replace("sobre ciudades", cityContext));
    }
    if (config.allowGeolocation && location) {
      const locationClause = GEOLOCATION_PROMPT_CLAUSE
        .replace('{latitude}', location.latitude.toFixed(5))
        .replace('{longitude}', location.longitude.toFixed(5));
      systemInstructionParts.push(locationClause);
    }
    if (config.allowMapDisplay) systemInstructionParts.push(SHOW_MAP_PROMPT_SYSTEM_INSTRUCTION);
    systemInstructionParts.push(EVENT_CARD_SYSTEM_INSTRUCTION);
    systemInstructionParts.push(PLACE_CARD_SYSTEM_INSTRUCTION);
    let fullInstruction = systemInstructionParts.join("\n\n").trim();
    if (!fullInstruction && !config.enableGoogleSearch && !config.allowMapDisplay) {
        fullInstruction = INITIAL_SYSTEM_INSTRUCTION;
    }
    return fullInstruction.trim() || INITIAL_SYSTEM_INSTRUCTION;
  };

  const initializeChatAndGreet = useCallback(async (
    configToUse: CustomChatConfig,
    location: UserLocation | null,
    currentMessages: ChatMessage[]
  ) => {
    if (!isGeminiReady) {
      if (!appError) setAppError(API_KEY_ERROR_MESSAGE);
      return;
    }
    try {
      const fullSystemInstruction = buildFullSystemInstruction(configToUse, location);
      geminiChatSessionRef.current = initChatSession(fullSystemInstruction, configToUse.enableGoogleSearch);

      if (currentMessages.length === 0) {
          // No automatic greeting for Gemini clone UI, empty state is handled by MessageList/App
      }
      if (appError && !appError.includes("API_KEY") && !appError.toLowerCase().includes("google maps") && appError !== MAPS_API_KEY_INVALID_ERROR_MESSAGE) {
        setAppError(null);
      }
    } catch (e: any) {
      console.error("Gemini Initialization error:", e);
      const errorMessage = getFriendlyError(e, "Error al inicializar el chat con Gemini.");
       if (!(appError && (appError.toLowerCase().includes("offline") || appError.toLowerCase().includes("network") || appError.toLowerCase().includes("google maps")))) {
         setAppError(errorMessage);
      }
       if (errorMessage === API_KEY_ERROR_MESSAGE) setIsGeminiReady(false);
    }
  }, [isGeminiReady, appError, buildFullSystemInstruction]);


  useEffect(() => {
    const apiKeyFromEnv = process.env.API_KEY;
    if (apiKeyFromEnv && apiKeyFromEnv.trim() !== "") {
      if (initializeGeminiService(apiKeyFromEnv)) {
        setIsGeminiReady(true);
        if (!googleMapsScriptLoaded) loadGoogleMapsScript(apiKeyFromEnv);
      } else {
        setIsGeminiReady(false);
        setAppError(API_KEY_ERROR_MESSAGE);
      }
    } else {
      setIsGeminiReady(false);
      setGoogleMapsScriptLoaded(false);
      setAppError(API_KEY_ERROR_MESSAGE);
    }
  }, [loadGoogleMapsScript, googleMapsScriptLoaded]);

  useEffect(() => {
    if (isGeminiReady) {
      initializeChatAndGreet(chatConfig, userLocation, messages);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGeminiReady, chatConfig, userLocation]);

  useEffect(() => {
    if (chatConfig.allowGeolocation) {
      setGeolocationStatus('pending');
      setGeolocationError("Obteniendo ubicación...");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
            setGeolocationError(null);
            setGeolocationStatus('success');
          },
          (geoError) => {
            console.warn("Geolocation error:", geoError);
            let message = "No se pudo obtener la ubicación.";
             switch(geoError.code) {
              case geoError.PERMISSION_DENIED: message = "Permiso de ubicación denegado."; break;
              case geoError.POSITION_UNAVAILABLE: message = "Información de ubicación no disponible."; break;
              case geoError.TIMEOUT: message = "Solicitud de ubicación agotada."; break;
            }
            setGeolocationError(message); setUserLocation(null); setGeolocationStatus('error');
          }, { timeout: 10000, enableHighAccuracy: false }
        );
      } else {
        setGeolocationError("Geolocalización no soportada."); setUserLocation(null); setGeolocationStatus('error');
      }
    } else {
      setUserLocation(null);
      setGeolocationError("Geolocalización desactivada.");
      setGeolocationStatus('idle');
    }
  }, [chatConfig.allowGeolocation]);

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
  }, []);

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
      if (msg.role === MessageRole.Model && msg.placeCards) {
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
    setMessages([]);
    displayedEventUniqueKeys.current.clear();
    lastUserQueryThatLedToEvents.current = null;
    // For now, new chat just clears messages. In a real app, you'd manage chat history.
    // Add new chat title to list, select it.
    // const newIndex = chatTitles.length;
    // setChatTitles(prev => [...prev, newChatTitle]);
    // setSelectedChatIndex(newIndex);

    if (appError && !appError.toLowerCase().includes("google maps") && !appError.includes("API_KEY") && appError !== MAPS_API_KEY_INVALID_ERROR_MESSAGE) {
      setAppError(null);
    }
    if (isGeminiReady) initializeChatAndGreet(chatConfig, userLocation, []);
    if(isMobile) setIsMenuOpen(false);
  };

  const parseDate = (dateStr: string): Date | null => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return (year && month && day) ? new Date(year, month - 1, day) : null;
  };
  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date); result.setDate(result.getDate() + days); return result;
  };
  const formatDate = (date: Date): string => date.toISOString().split('T')[0];

  const handleSendMessage = async (inputText: string) => {
    if (!geminiChatSessionRef.current || isLoading || !isGeminiReady) {
        if (!isGeminiReady) setAppError(API_KEY_ERROR_MESSAGE);
        return;
    }
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: MessageRole.User, content: inputText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    if (appError && !appError.toLowerCase().includes("offline") && !appError.toLowerCase().includes("network") && !appError.includes("API_KEY") && !appError.toLowerCase().includes("google maps") && appError !== MAPS_API_KEY_INVALID_ERROR_MESSAGE) {
        setAppError(null);
    }
    setIsLoading(true);
    const aiClientTempId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: aiClientTempId, role: MessageRole.Model, content: '', timestamp: new Date(), isTyping: true }]);
    let currentAiContent = '';

    try {
      await sendMessageToGeminiStream(
        geminiChatSessionRef.current, inputText,
        (chunkText) => {
          currentAiContent += chunkText;
          setMessages(prev => prev.map(msg => msg.id === aiClientTempId ? { ...msg, content: currentAiContent, isTyping: true } : msg));
        },
        async (finalResponse) => {
          let finalGroundingMetadata: GroundingMetadata | undefined = undefined;
          let processedContent = currentAiContent;
          let mapQueryFromAI: string | undefined = undefined;
          const rawParsedEventsFromAI: EventInfo[] = [];
          const placeCardsForMessage: PlaceCardInfo[] = [];
          let downloadablePdfInfoForMessage: ChatMessage['downloadablePdfInfo'] = undefined;
          let telematicLinkForMessage: ChatMessage['telematicProcedureLink'] = undefined;
          let storedUserQueryForEvents: string | undefined = undefined;

          if (finalResponse?.candidates?.[0]?.groundingMetadata) {
            finalGroundingMetadata = { groundingChunks: finalResponse.candidates[0].groundingMetadata.groundingChunks?.map(c => ({ web: c.web ? { uri: c.web.uri || '', title: c.web.title || '' } : undefined })) };
          }
          const eventRegex = new RegExp(`${EVENT_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${EVENT_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
          let match;
          let tempContentForProcessing = processedContent;
          while ((match = eventRegex.exec(tempContentForProcessing)) !== null) {
            let jsonStrToParse = match[1].replace(/\[CITE:\s*\d+\][%]?$/, "").trim();
            try {
              const eventData = JSON.parse(jsonStrToParse);
              if (eventData.title && eventData.date) rawParsedEventsFromAI.push({ ...eventData });
            } catch (e) { console.error("Failed to parse event JSON:", jsonStrToParse, e); }
          }
          const currentYear = new Date().getFullYear();
          const currentYearRawEvents = rawParsedEventsFromAI.filter(event => {
            try { return new Date(event.date).getFullYear() === currentYear; }
            catch (e) { return false; }
          });
          const sortedEventsFromAI = currentYearRawEvents.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()) || new Date(a.date).getTime() - new Date(b.date).getTime());
          const tempGroupedEvents: EventInfo[] = [];
          for (let i = 0; i < sortedEventsFromAI.length; i++) {
            const currentEvent = sortedEventsFromAI[i];
            if (currentEvent.endDate && currentEvent.endDate !== currentEvent.date) { tempGroupedEvents.push(currentEvent); continue; }
            let j = i;
            while (j + 1 < sortedEventsFromAI.length && sortedEventsFromAI[j + 1].title.toLowerCase() === currentEvent.title.toLowerCase()) {
              const currentDateObj = parseDate(sortedEventsFromAI[j].date);
              const nextDateObj = parseDate(sortedEventsFromAI[j + 1].date);
              if (currentDateObj && nextDateObj && formatDate(addDays(currentDateObj, 1)) === formatDate(nextDateObj)) j++; else break;
            }
            if (j > i) { tempGroupedEvents.push({ ...currentEvent, endDate: sortedEventsFromAI[j].date }); i = j; }
            else tempGroupedEvents.push(currentEvent);
          }
          const eventsForThisMessageCandidate: EventInfo[] = [];
          for (const event of tempGroupedEvents) {
            const startDate = parseDate(event.date); const endDate = event.endDate ? parseDate(event.endDate) : startDate;
            let isNew = false; const eventIndividualDateKeys: string[] = [];
            if (startDate && endDate) {
              for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dayKey = `${event.title.toLowerCase()}+${formatDate(d)}`; eventIndividualDateKeys.push(dayKey);
                if (!displayedEventUniqueKeys.current.has(dayKey)) isNew = true;
              }
            } else {
              const dayKey = `${event.title.toLowerCase()}+${event.date}`; eventIndividualDateKeys.push(dayKey);
              if (!displayedEventUniqueKeys.current.has(dayKey)) isNew = true;
            }
            if (isNew) { eventsForThisMessageCandidate.push(event); eventIndividualDateKeys.forEach(key => displayedEventUniqueKeys.current.add(key)); }
          }
          const eventsForThisMessage = eventsForThisMessageCandidate.slice(0, MAX_INITIAL_EVENTS);
          const showSeeMoreButtonForThisMessage = eventsForThisMessageCandidate.length > MAX_INITIAL_EVENTS;
          if (eventsForThisMessage.length > 0) { lastUserQueryThatLedToEvents.current = inputText; storedUserQueryForEvents = inputText; }
          processedContent = processedContent.replace(eventRegex, "").trim();
          tempContentForProcessing = processedContent;

          const placeCardRegex = new RegExp(`${PLACE_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${PLACE_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
          while ((match = placeCardRegex.exec(tempContentForProcessing)) !== null) {
            let jsonStrToParse = match[1].replace(/\[CITE:\s*\d+\][%]?$/, "").trim();
            try {
              const placeData = JSON.parse(jsonStrToParse);
              if (placeData.name && (placeData.placeId || placeData.searchQuery)) placeCardsForMessage.push({ id: crypto.randomUUID(), name: placeData.name, placeId: placeData.placeId, searchQuery: placeData.searchQuery, isLoadingDetails: true });
            } catch (e) { console.error("Failed to parse place card JSON:", jsonStrToParse, e); }
          }
          processedContent = processedContent.replace(placeCardRegex, "").trim();

          if (chatConfig.allowMapDisplay && processedContent.includes(SHOW_MAP_MARKER_START)) {
            const startIndex = processedContent.indexOf(SHOW_MAP_MARKER_START); const endIndex = processedContent.indexOf(SHOW_MAP_MARKER_END, startIndex);
            if (startIndex !== -1 && endIndex !== -1) {
                mapQueryFromAI = processedContent.substring(startIndex + SHOW_MAP_MARKER_START.length, endIndex).trim();
                processedContent = (processedContent.substring(0, startIndex) + processedContent.substring(endIndex + SHOW_MAP_MARKER_END.length)).trim();
            }
          }
          const pdfMarkerRegex = /\[PROVIDE_DOWNLOAD_LINK_FOR_UPLOADED_PDF:(.+?)\]\s*$/m;
          const pdfMarkerMatch = processedContent.match(pdfMarkerRegex);
          if (pdfMarkerMatch && pdfMarkerMatch[1]) {
            const matchedProcedureName = pdfMarkerMatch[1].trim();
            processedContent = processedContent.replace(pdfMarkerRegex, "").trim();
            const pdfDoc = chatConfig.uploadedProcedureDocuments.find(doc => doc.procedureName === matchedProcedureName);
            if (pdfDoc) downloadablePdfInfoForMessage = { ...pdfDoc };
            else console.warn(`AI requested PDF '\''${matchedProcedureName}\'', not found.`);
          }
          const tecaLinkRegex = new RegExp(`${TECA_LINK_BUTTON_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${TECA_LINK_BUTTON_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
          tempContentForProcessing = processedContent;
          let tecaMatch;
          while ((tecaMatch = tecaLinkRegex.exec(tempContentForProcessing)) !== null) {
            const jsonPayload = tecaMatch[1];
            try {
              const linkData = JSON.parse(jsonPayload);
              if (linkData.url && typeof linkData.url === 'string' && linkData.text && typeof linkData.text === 'string') telematicLinkForMessage = { url: linkData.url, text: linkData.text };
              else console.warn("Invalid TECA link JSON:", jsonPayload);
            } catch (e) { console.error("Failed to parse TECA link JSON:", jsonPayload, e); }
          }
          processedContent = processedContent.replace(tecaLinkRegex, "").trim();

          const finalAiMessage: ChatMessage = {
            id: crypto.randomUUID(), role: MessageRole.Model, content: processedContent, timestamp: new Date(),
            groundingMetadata: finalGroundingMetadata, mapQuery: mapQueryFromAI,
            events: eventsForThisMessage.length > 0 ? eventsForThisMessage : undefined,
            placeCards: placeCardsForMessage.length > 0 ? placeCardsForMessage : undefined,
            downloadablePdfInfo: downloadablePdfInfoForMessage, telematicProcedureLink: telematicLinkForMessage,
            showSeeMoreButton: showSeeMoreButtonForThisMessage, originalUserQueryForEvents: storedUserQueryForEvents,
          };
          setMessages(prev => prev.filter(msg => msg.id !== aiClientTempId).concat(finalAiMessage));
          setIsLoading(false);
        },
        async (apiError) => {
          console.error("API Error:", apiError);
          const friendlyApiError = getFriendlyError(apiError, `Error: ${apiError.message}`);
          const errorAiMessage: ChatMessage = { id: crypto.randomUUID(), role: MessageRole.Model, content: '', timestamp: new Date(), error: friendlyApiError };
          setMessages(prev => prev.filter(msg => msg.id !== aiClientTempId).concat(errorAiMessage));
          if (friendlyApiError === API_KEY_ERROR_MESSAGE) { setAppError(API_KEY_ERROR_MESSAGE); setIsGeminiReady(false); }
          else setAppError(friendlyApiError);
          setIsLoading(false);
        }
      );
    } catch (e: any) {
        console.error("Error sending message:", e);
        const errorMsg = getFriendlyError(e, "Error al enviar mensaje.");
        const errorAiMessage: ChatMessage = { id: crypto.randomUUID(), role: MessageRole.Model, content: '', timestamp: new Date(), error: errorMsg };
        setMessages(prev => prev.filter(msg => msg.id !== aiClientTempId).concat(errorAiMessage));
        setAppError(errorMsg);
        if (errorMsg === API_KEY_ERROR_MESSAGE) setIsGeminiReady(false);
        setIsLoading(false);
    }
  };

  const handleSetCurrentLanguageCode = (newLangCode: string) => {
    setChatConfig(prevConfig => {
        if (prevConfig.currentLanguageCode === newLangCode) return prevConfig;
        const updatedConfig = { ...prevConfig, currentLanguageCode: newLangCode };
        localStorage.setItem('chatConfig', JSON.stringify(updatedConfig));
        setMessages([]); displayedEventUniqueKeys.current.clear(); lastUserQueryThatLedToEvents.current = null;
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
    setMessages([]); displayedEventUniqueKeys.current.clear(); lastUserQueryThatLedToEvents.current = null;
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

  const handleSeeMoreEvents = (originalUserQuery?: string) => {
    const queryToUse = originalUserQuery || lastUserQueryThatLedToEvents.current || "eventos";
    const seenEventTitlesAndDates = Array.from(displayedEventUniqueKeys.current).map(key => {
        const parts = key.split('+'); return `${parts[0]} (fecha: ${parts[1]})`;
    }).join('; ');
    const seeMorePrompt = `Considerando mi pregunta sobre "${queryToUse}", muéstrame más eventos. Ya he visto: ${seenEventTitlesAndDates}. No los repitas.`;
    handleSendMessage(seeMorePrompt);
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };
  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
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
        apiKeyForMaps={process.env.API_KEY || ''}
      />
    );
  }

  const drawerContent = (
    <Box sx={{ width: isMenuOpen ? drawerWidth : collapsedDrawerWidth, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', pt: 1 }} role="presentation">
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, mb: 1 }}>
        <IconButton
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          sx={{
            minWidth: 0,
            mr: isMenuOpen ? 1 : 0,
            transition: theme.transitions.create(['margin-right'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <MenuIcon />
        </IconButton>
        {isMenuOpen && (
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Menu
          </Typography>
        )}
      </Box>
      <Button
        variant="contained"
        startIcon={<EditOutlinedIcon />}
        onClick={() => handleNewChat("Nuevo chat")}
        title={!isMenuOpen ? "Nueva conversación" : undefined}
        sx={{
          m: '12px 16px',
          bgcolor: theme.palette.mode === 'dark' ? '#2e2f32' :'#e0e0e0',
          color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.primary,
          '&:hover': {
             bgcolor: theme.palette.mode === 'dark' ? '#3c3d40' :'#d5d5d5',
          },
          borderRadius: '24px',
          py: 1.25,
          boxShadow: 'none',
          width: isMenuOpen ? 'auto' : collapsedDrawerWidth - 24,
          minWidth: isMenuOpen ? 'auto' : 0,
          justifyContent: isMenuOpen ? 'flex-start' : 'center',
          px: isMenuOpen ? '16px' : '0px',
          overflow: 'hidden',
          '& .MuiButton-startIcon': {
            mr: isMenuOpen ? 1 : 0,
            ml: isMenuOpen ? 0 : 0,
          }
        }}
      >
        {isMenuOpen && "Nueva conversación"}
      </Button>
       <List sx={{ flexGrow: 1, px:1 }}>
         <ListItemButton 
            onClick={() => console.log("Descubrir ciudades clicked")}
            title={!isMenuOpen ? "Descubrir ciudades" : undefined}
            sx={{
              justifyContent: !isMenuOpen ? 'center' : 'flex-start',
              px: !isMenuOpen ? 2 : 3,
            }}
          >
             <ListItemIcon sx={{minWidth: isMenuOpen ? 32 : 0, mr: isMenuOpen ? 2 : 0}}><LocationCityIcon /></ListItemIcon>
            {isMenuOpen && <ListItemText primary="Descubrir ciudades" primaryTypographyProps={{fontSize: '0.875rem'}} />}
          </ListItemButton>

        <Typography variant="caption" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 500, display: isMenuOpen ? 'block' : 'none' }}>
          RECIENTE
        </Typography>
        {isMenuOpen && chatTitles.map((title, index) => (
          <ListItemButton
            key={index}
            selected={index === selectedChatIndex}
            title={!isMenuOpen ? title : undefined}
            onClick={() => {
                setSelectedChatIndex(index);
                if (index !== selectedChatIndex) {
                    setMessages([]); // Clear for demo
                     if (isGeminiReady) initializeChatAndGreet(chatConfig, userLocation, []);
                }
                if (isMobile) setIsMenuOpen(false);
            }}
            sx={{
              justifyContent: !isMenuOpen ? 'center' : 'flex-start',
              px: !isMenuOpen ? 2 : 3,
            }}
          >
            <ListItemText primary={title} primaryTypographyProps={{fontSize: '0.875rem', noWrap: true, textOverflow: 'ellipsis'}} />
          </ListItemButton>
        ))}
         {isMenuOpen && <ListItemButton 
           onClick={() => console.log("Mostrar más clicked")}
           title={!isMenuOpen ? "Mostrar más" : undefined}
           sx={{
             justifyContent: !isMenuOpen ? 'center' : 'flex-start',
             px: !isMenuOpen ? 2 : 3,
           }}
         >
            <ListItemIcon sx={{minWidth: isMenuOpen ? 32 : 0, mr: isMenuOpen ? 2 : 0}}><ExpandMoreIcon /></ListItemIcon>
            <ListItemText primary="Mostrar más" primaryTypographyProps={{fontSize: '0.875rem'}}/>
        </ListItemButton>}
      </List>

      {/* Bottom Drawer Section */}
      <List sx={{pb:1, px:1}}>
        <Divider sx={{my:1, display: isMenuOpen ? 'block' : 'none'}}/>
        <ListItemButton 
          onClick={() => console.log("Actividad clicked")}
          title={!isMenuOpen ? "Actividad" : undefined}
          sx={{
            justifyContent: !isMenuOpen ? 'center' : 'flex-start',
            px: !isMenuOpen ? 2 : 3,
          }}
        >
            <ListItemIcon sx={{minWidth: isMenuOpen ? 32 : 0, mr: isMenuOpen ? 2 : 0}}><HistoryIcon /></ListItemIcon>
            {isMenuOpen && <ListItemText primary="Actividad" primaryTypographyProps={{fontSize: '0.875rem'}}/>}
        </ListItemButton>
        <ListItemButton 
          onClick={() => { setCurrentView('finetuning'); if (isMobile) setIsMenuOpen(false); }}
          title={!isMenuOpen ? "Configurar chat" : undefined}
          sx={{
            justifyContent: !isMenuOpen ? 'center' : 'flex-start',
            px: !isMenuOpen ? 2 : 3,
          }}
        >
            <ListItemIcon sx={{minWidth: isMenuOpen ? 32 : 0, mr: isMenuOpen ? 2 : 0}}><TuneIcon /></ListItemIcon>
            {isMenuOpen && <ListItemText primary="Configurar chat" primaryTypographyProps={{fontSize: '0.875rem'}}/>}
        </ListItemButton>
        <Divider sx={{my:1, display: isMenuOpen ? 'block' : 'none'}}/>
        {/* Location Section - Always visible, text hidden when collapsed */}
        <ListItem
            sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                pt: 0.5,
                pb: 0.5,
                px: !isMenuOpen ? 2 : 3,
                cursor: 'default',
            }}
            title={!isMenuOpen ? (chatConfig.restrictedCity?.name || (userLocation ? "Ubicación actual" : "Ubicación desconocida")) : undefined}
        >
            <ListItemIcon 
                sx={{ 
                    minWidth: isMenuOpen ? 32 : 0,
                    mr: isMenuOpen ? 2 : 0,
                    mt: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: !isMenuOpen ? 'center' : 'flex-start'
                }}
            >
                <LocationOnIcon />
            </ListItemIcon>
            {isMenuOpen && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexGrow: 1 }}>
                     <Typography variant="body2" sx={{fontWeight:'500'}}>
                        {chatConfig.restrictedCity?.name || (userLocation ? "Ubicación actual" : "Ubicación desconocida")}
                        {chatConfig.restrictedCity?.name && chatConfig.restrictedCity.formattedAddress ? `, ${chatConfig.restrictedCity.formattedAddress.split(',').slice(-2).join(', ').trim()}` : ''}
                     </Typography>
                     <Typography variant="caption" color="text.secondary">
                        {geolocationStatus === 'success' && userLocation && !chatConfig.restrictedCity ? `Lat: ${userLocation.latitude.toFixed(2)}, Lon: ${userLocation.longitude.toFixed(2)}` : "De tu dirección IP"}
                     </Typography>
                    <Button
                        variant="text"
                        size="small"
                        onClick={() => chatConfig.allowGeolocation && navigator.geolocation.getCurrentPosition(() => {}, () => {}, {})} 
                        sx={{p:0, justifyContent:'flex-start', textTransform:'none', color: 'primary.main', mt:0.25, fontSize:'0.75rem'}}
                    >
                        Actualizar ubicación
                    </Button>
                </Box>
            )}
        </ListItem>
      </List>
    </Box>
  );

  let geoIcon = <GpsOffIcon fontSize="inherit" color="action" />;
  let geoText = "Geolocalización desactivada";

  if (chatConfig.allowGeolocation) {
    if (geolocationStatus === 'pending') {
      geoIcon = <CircularProgress size={14} color="inherit" />;
      geoText = "Obteniendo ubicación...";
    } else if (geolocationStatus === 'success' && userLocation) {
      geoIcon = <GpsFixedIcon fontSize="inherit" color="success" />;
      geoText = `Ubicación activa`;
    } else if (geolocationStatus === 'error' || geolocationError) {
      geoIcon = <GpsNotFixedIcon fontSize="inherit" color="error" />;
      geoText = geolocationError || "Error de ubicación";
    }
  }


  return (
    <Box sx={{ display: 'flex', height: '100vh', maxHeight: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? isMenuOpen : true}
        onClose={() => setIsMenuOpen(false)}
        sx={{
          width: isMenuOpen ? drawerWidth : collapsedDrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isMenuOpen ? drawerWidth : collapsedDrawerWidth,
            boxSizing: 'border-box',
            borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
            transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
            boxShadow: isMobile ? theme.shadows[3] : 'none',
            overflowX: 'hidden',
          },
          '& .MuiListItemIcon-root': {
            transition: theme.transitions.create(['margin-right', 'min-width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
          '& .MuiListItemText-root': {
            opacity: isMenuOpen ? 1 : 0,
            transition: theme.transitions.create('opacity', {
              easing: theme.transitions.easing.sharp,
              duration: isMenuOpen ? theme.transitions.duration.enteringScreen : 0,
            }),
          }
        }}
        ModalProps={{ keepMounted: true }}
      >
        {drawerContent}
      </Drawer>

      <Box component="main" sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxHeight: '100vh',
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
        <AppBar position="static" sx={{ bgcolor: 'background.default', color: 'text.primary' }}>
          <Toolbar sx={{ minHeight: '56px!important', px: 2 }}>
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 500 }}>
              Gemini
            </Typography>
            <Button
                size="small"
                color="inherit"
                endIcon={<ArrowDropDownIcon />}
                sx={{ ml: 1, mr: 'auto', textTransform: 'none', color: 'text.secondary', borderRadius: '16px', '&:hover': {bgcolor: 'action.hover'} }}
            >
                2.5 Flash
            </Button>

             <Chip
                label="Probar"
                icon={<ScienceOutlinedIcon sx={{fontSize: '1.1rem !important'}}/>}
                onClick={() => console.log("Probar clicked")}
                size="small"
                sx={{
                    mr: 1.5, borderRadius: '8px',
                    bgcolor: theme.palette.mode === 'dark' ? '#303134' : '#e8f0fe',
                    color: theme.palette.mode === 'dark' ? '#e8eaed' : '#1967d2',
                    '&:hover': { bgcolor: theme.palette.mode === 'dark' ? '#3c4043' : '#d2e3fc'},
                    display: {xs: 'none', sm: 'flex'}
                }}
            />
            <IconButton onClick={handleUserMenuClick} size="small">
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <PersonIcon fontSize="small"/>
                </Avatar>
            </IconButton>
            <Menu
                anchorEl={userMenuAnchorEl}
                open={openUserMenu}
                onClose={handleUserMenuClose}
                MenuListProps={{ 'aria-labelledby': 'user-avatar-button' }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={() => { toggleTheme(); handleUserMenuClose(); }}>
                    <ListItemIcon>
                        {currentThemeMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText>Cambiar a modo {currentThemeMode === 'dark' ? 'Claro' : 'Oscuro'}</ListItemText>
                </MenuItem>
                 <MenuItem onClick={() => { setCurrentView('finetuning'); handleUserMenuClose(); }}>
                    <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Ajustes</ListItemText>
                </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Stack
            direction="column"
            sx={{
                flexGrow: 1,
                overflow: 'hidden',
                position: 'relative',
                width: '100%',
                maxWidth: { sm: '800px' },
                margin: '0 auto',
                padding: { xs: '0', sm: '0 32px' }, // 32px padding on desktop
            }}
        >
            {appError && !messages.some(msg => msg.error && msg.error.includes(appError)) && (
            <Alert
                severity={appError.toLowerCase().includes("offline") || appError.toLowerCase().includes("network") ? "warning" : "error"}
                sx={{ mx: 2, mt:1, borderRadius: 2 }} // 16px margin (2 in MUI spacing)
                iconMapping={{
                    warning: <SyncProblemIcon fontSize="inherit" />,
                    error: <ErrorOutlineIcon fontSize="inherit" />
                }}
            >
                <AlertTitle>
                {appError.toLowerCase().includes("offline") || appError.toLowerCase().includes("network") ? 'Aviso de Conexión'
                : appError === API_KEY_ERROR_MESSAGE || appError.toLowerCase().includes("google maps") || appError.toLowerCase().includes("api_key") || appError.toLowerCase().includes("invalidkeymaperror") || appError === MAPS_API_KEY_INVALID_ERROR_MESSAGE ? 'Error de Configuración de API'
                : 'Error'}
                </AlertTitle>
                {appError}
            </Alert>
            )}

            {messages.length === 0 && !isLoading && (
                 <Box sx={{flexGrow: 1, display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', p:3, textAlign: 'center'}}>
                    <AutoAwesomeIcon sx={{fontSize: 48, color: 'primary.main', mb:2}}/>
                    <Typography variant="h5" sx={{mb:1}}>
                        ¡Hola! ¿Cómo puedo ayudarte hoy
                        {chatConfig.restrictedCity ? ` desde ${chatConfig.restrictedCity.name}` : ''}?
                    </Typography>
                 </Box>
            )}
            <MessageList
                messages={messages}
                isLoading={isLoading && messages.length === 0}
                onDownloadPdf={handleDownloadPdf}
                configuredSedeElectronicaUrl={chatConfig.sedeElectronicaUrl}
                onSeeMoreEvents={handleSeeMoreEvents}
            />
            <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                recommendedPrompts={chatConfig.recommendedPrompts}
                currentLanguageCode={chatConfig.currentLanguageCode || DEFAULT_LANGUAGE_CODE}
                onSetLanguageCode={handleSetCurrentLanguageCode}
            />
            <Typography variant="caption" sx={{ textAlign: 'center', p: 1, color: 'text.secondary', fontSize: '0.7rem' }}>
                Gemini puede cometer errores, incluso sobre personas, así que comprueba sus respuestas. <a href="#" style={{color: theme.palette.text.secondary}}>Tu privacidad y Gemini</a>
            </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

export default App;

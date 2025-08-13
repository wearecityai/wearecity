import { CustomChatConfig, SupportedLanguage, RecommendedPrompt } from './types';

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

export const DEFAULT_ASSISTANT_NAME = "Asistente de Ciudad";
export const INITIAL_SYSTEM_INSTRUCTION = ""; // Moved to backend for security
export const DEFAULT_RECOMMENDED_PROMPTS: RecommendedPrompt[] = [
  { text: "¿Qué eventos hay este fin de semana?", img: "event" },
  { text: "Recomiéndame un buen restaurante italiano.", img: "restaurant" },
  { text: "¿Cómo llego al museo principal en transporte público?", img: "directions_bus" },
  { text: "Horarios de la biblioteca municipal", img: "library" },
];
export const AVAILABLE_SERVICE_TAGS: string[] = [
  "Información Turística",
  "Eventos Locales",
  "Restaurantes y Cafeterías",
  "Transporte Público",
  "Servicios Municipales", // This tag makes the new procedures instruction especially relevant
  "Trámites del Ayuntamiento", // Added a more specific tag
  "Puntos de Interés",
  "Parques y Recreación",
  "Tráfico y Movilidad",
  "Alojamiento",
  "Vida Nocturna",
  "Cultura y Arte",
  "Seguridad y Emergencias",
];
export const DEFAULT_SERVICE_TAGS: string[] = [];
export const DEFAULT_ENABLE_GOOGLE_SEARCH = true; // Default to true for city info
export const DEFAULT_ALLOW_MAP_DISPLAY = true;    // Default to true for city navigation
export const DEFAULT_ALLOW_GEOLOCATION = true;   // Default to true for location-aware assistance

export const API_KEY_ERROR_MESSAGE = "La variable de entorno API_KEY de Google no está configurada o no es válida. Esta clave es necesaria para las funciones de IA (Gemini) y mapas (Google Maps). Por favor, asegúrate de que esté correctamente configurada en el entorno de ejecución.";
export const MAPS_API_KEY_INVALID_ERROR_MESSAGE = "La API Key de Google proporcionada no es válida para Google Maps o no está configurada correctamente. Por favor, verifica en Google Cloud Console que la 'Maps JavaScript API' esté habilitada y que la clave no tenga restricciones incorrectas (como referrers HTTP o restricciones de API). Las funciones de mapa están desactivadas.";
// API_KEY_INSTRUCTION_MESSAGE is removed as user input for API key is prohibited.


// Marker syntax only - instructions moved to backend for security
export const SHOW_MAP_MARKER_START = "[SHOW_MAP:";
export const SHOW_MAP_MARKER_END = "]";

// Marker syntax only - instructions moved to backend for security
export const MAX_INITIAL_EVENTS = 6; // Max events to show initially
export const EVENT_CARD_START_MARKER = "[EVENT_CARD_START]";
export const EVENT_CARD_END_MARKER = "[EVENT_CARD_END]";

// Marker syntax only - instructions moved to backend for security
export const PLACE_CARD_START_MARKER = "[PLACE_CARD_START]";
export const PLACE_CARD_END_MARKER = "[PLACE_CARD_END]";

// Marker syntax only - instructions moved to backend for security
export const TECA_LINK_BUTTON_START_MARKER = "[TECA_LINK_BUTTON_START]";
export const TECA_LINK_BUTTON_END_MARKER = "[TECA_LINK_BUTTON_END]";

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'es-ES', name: 'Español (España)', abbr: 'ES', flagEmoji: '🇪🇸' },
  { code: 'en-US', name: 'English (US)', abbr: 'EN', flagEmoji: '🇺🇸' },
  { code: 'fr-FR', name: 'Français (France)', abbr: 'FR', flagEmoji: '🇫🇷' },
  { code: 'de-DE', name: 'Deutsch (Deutschland)', abbr: 'DE', flagEmoji: '🇩🇪' },
  { code: 'it-IT', name: 'Italiano (Italia)', abbr: 'IT', flagEmoji: '🇮🇹' },
  { code: 'pt-PT', name: 'Português (Portugal)', abbr: 'PT', flagEmoji: '🇵🇹' },
];

export const DEFAULT_LANGUAGE_CODE: string = 'es-ES';

export const DEFAULT_CHAT_CONFIG: CustomChatConfig = {
  assistantName: DEFAULT_ASSISTANT_NAME,
  systemInstruction: INITIAL_SYSTEM_INSTRUCTION,
  recommendedPrompts: DEFAULT_RECOMMENDED_PROMPTS,
  serviceTags: DEFAULT_SERVICE_TAGS,
  enableGoogleSearch: true,
  allowMapDisplay: true,
  allowGeolocation: true,
  currentLanguageCode: DEFAULT_LANGUAGE_CODE,
  procedureSourceUrls: [],
  uploadedProcedureDocuments: [],
  restrictedCity: null,
  sedeElectronicaUrl: '',
  agendaEventosUrls: [], // URLs for event calendars and agendas
  profileImageUrl: '', // Nueva propiedad por defecto
};

export const DEFAULT_CHAT_TITLE = "Nuevo Chat de Ciudad";

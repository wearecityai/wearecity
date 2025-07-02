
import { CustomChatConfig, SupportedLanguage } from './types';

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

export const DEFAULT_ASSISTANT_NAME = "Asistente de Ciudad";
export const INITIAL_SYSTEM_INSTRUCTION = "Eres 'Asistente de Ciudad', un IA amigable y servicial especializado en información sobre ciudades. Proporciona respuestas concisas y directas a consultas sobre turismo, servicios locales, eventos, transporte y vida urbana. Si una pregunta requiere contexto de una ciudad específica y el usuario no la ha mencionado, pide amablemente que especifique la ciudad. De lo contrario, responde de la mejor manera posible con información general si aplica.";
export const DEFAULT_RECOMMENDED_PROMPTS: string[] = [
  "¿Qué eventos hay este fin de semana?",
  "Recomiéndame un buen restaurante italiano.",
  "¿Cómo llego al museo principal en transporte público?",
  "Horarios de la biblioteca municipal",
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


// Marker syntax and system instruction for AI-instructed map display (fallbacks - real values come from DB)
export const SHOW_MAP_MARKER_START = "[SHOW_MAP:";
export const SHOW_MAP_MARKER_END = "]";

// Marker syntax and system instruction for AI-instructed event cards (fallbacks - real values come from DB)
export const MAX_INITIAL_EVENTS = 6; // Max events to show initially
export const EVENT_CARD_START_MARKER = "[EVENT_CARD_START]";
export const EVENT_CARD_END_MARKER = "[EVENT_CARD_END]";

// Marker syntax and system instruction for AI-instructed place cards (fallbacks - real values come from DB)
export const PLACE_CARD_START_MARKER = "[PLACE_CARD_START]";
export const PLACE_CARD_END_MARKER = "[PLACE_CARD_END]";

// Marker for Telematic Procedure Link Button (fallbacks - real values come from DB)
export const TECA_LINK_BUTTON_START_MARKER = "[TECA_LINK_BUTTON_START]";
export const TECA_LINK_BUTTON_END_MARKER = "[TECA_LINK_BUTTON_END]";

// Templates for procedures URLs (these are still used in frontend processing)
export const PROCEDURE_URLS_PREAMBLE_TEXT_TEMPLATE = `SECCIÓN DE URLs PRIORITARIAS PARA TRÁMITES:
Como parte de tu configuración, se han proporcionado las siguientes URLs como fuentes primarias para información sobre trámites del ayuntamiento. Cuando un usuario pregunte sobre un trámite, DEBES CONSULTAR ESTAS URLs PRIMERO. Busca en su contenido la información relevante y, crucialmente, los enlaces de descarga directa de formularios si existen y son pertinentes para la consulta:
{procedureUrlList}
---

`;

export const PROCEDURE_URLS_GUIDANCE_TEXT_TEMPLATE = `Después de haber consultado las URLs prioritarias (detalladas en la sección "SECCIÓN DE URLs PRIORITARIAS PARA TRÁMITES" al inicio de estas instrucciones de trámites), si la información necesaria (especialmente los enlaces de descarga directa a formularios) no se encuentra en ellas, o si dichas URLs no son relevantes para la consulta específica del usuario, entonces `;

export const UPLOADED_DOCUMENTS_CONTEXT_CLAUSE = `CONTEXTO DE FORMULARIOS PDF DISPONIBLES:
Para ciertos trámites, es posible que haya formularios PDF disponibles en tu configuración. Si se listan a continuación, y si la consulta de un usuario se refiere claramente por su nombre a uno de estos trámites, DEBES activar y seguir las "INSTRUCCIONES PARA ASISTIR CON UN TRÁMITE CON FORMULARIO PDF DISPONIBLE" específicas para ese trámite. NO menciones al usuario que estos archivos fueron "adjuntados" o "subidos"; trátalos como recursos que tienes disponibles.
{uploadedDocumentsListPlaceholder}
`;

export const UPLOADED_PDF_PROCEDURE_INSTRUCTION_TEMPLATE = `
INSTRUCCIONES PARA ASISTIR CON UN TRÁMITE CON FORMULARIO PDF DISPONIBLE ('{procedureName}' - archivo: '{fileName}'):
Tu objetivo principal es ayudar al usuario con el trámite '{procedureName}'. Un formulario PDF llamado '{fileName}' está asociado con este procedimiento y lo tienes disponible.
Explica claramente que el usuario DEBE RELLENAR el formulario PDF que se le va a ofrecer para descargar.
Busca información complementaria para completar y presentar ESTE FORMULARIO ESPECÍFICO EXCLUSIVAMENTE en el sitio web oficial del ayuntamiento de {cityContext} y en otras páginas gubernamentales directamente relevantes. NO expliques cómo o dónde has buscado. NO devuelvas ninguna fuente web (grounding chunks) en tu respuesta.
La información que debes buscar incluye:
*   Instrucciones paso a paso para el proceso general que involucra este formulario.
*   Dónde presentarlo (portales online con enlaces, oficinas físicas con direcciones/horarios). Detalla ambos si aplican. Si la presentación puede ser telemática a través de la Sede Electrónica general del ayuntamiento (cuya URL podría estar configurada), menciónalo. El sistema mostrará un botón para ir a la Sede Electrónica configurada si existe, además del botón de descarga del PDF.
*   Cualquier tasa asociada, métodos de pago.
*   Documentos adicionales requeridos.
*   Tiempos de tramitación estimados.
*   Cualquier actualización reciente o aviso importante sobre este trámite.
Después de proporcionar toda esta información, DEBES informar al usuario de forma clara y explícita: "Puedes descargar el formulario PDF '{fileName}' para este trámite haciendo clic en el botón que aparecerá en mi respuesta."
Finalmente, y de manera OBLIGATORIA, incluye el siguiente marcador en una nueva línea por sí mismo, sin ningún texto adicional antes o después en esa línea:
[PROVIDE_DOWNLOAD_LINK_FOR_UPLOADED_PDF:{procedureName}]
`;

export const RICH_TEXT_FORMATTING_SYSTEM_INSTRUCTION = `
GUÍA DE FORMATO DE TEXTO ENRIQUECIDO:
Para mejorar la legibilidad y la presentación de tus respuestas, utiliza las siguientes convenciones de formato cuando sea apropiado:
- **Listas con Viñetas:** Utiliza un guion (-) o un asterisco (*) seguido de un espacio al inicio de cada elemento de una lista. Ejemplo:
  - Elemento 1
  - Elemento 2
  * Elemento A
  * Elemento B
- **Negrita:** Para enfatizar títulos, términos clave o frases importantes, envuélvelos en dobles asteriscos. Ejemplo: **Este es un texto importante**.
- **Cursiva:** Para un énfasis sutil o para nombres propios de obras, etc., envuélvelos en asteriscos simples. Ejemplo: *Este texto está en cursiva*.
- **Tachado:** Para indicar texto eliminado o no relevante, envuélvelo en virgulillas. Ejemplo: ~Esto está tachado~.
- **Emojis Sutiles y Relevantes:** Considera el uso de emojis discretos y contextualmente apropiados para añadir claridad o un toque visual amigable, pero no abuses de ellos. Ejemplos:
  ✅ Para listas de verificación o confirmaciones.
  ➡️ Para indicar el siguiente paso o una dirección.
  💡 Para ideas o sugerencias.
  ⚠️ Para advertencias o puntos importantes.
  🗓️ Para fechas.
  📍 Para ubicaciones.
  🔗 Para enlaces.
- **Párrafos Claros:** Estructura respuestas más largas en párrafos bien definidos para facilitar la lectura.
- **Enlaces Markdown:** Si necesitas incluir un enlace, utiliza el formato Markdown: [texto del enlace](URL_del_enlace). El sistema ya intenta auto-enlazar URLs, pero este formato es más explícito y permite un texto descriptivo.

Evita el uso excesivo de formato. El objetivo es mejorar la claridad, no sobrecargar la respuesta visualmente.
`;


export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'es-ES', name: 'Español (España)', abbr: 'ES', flagEmoji: '🇪🇸' },
  { code: 'en-US', name: 'English (US)', abbr: 'EN', flagEmoji: '🇺🇸' },
  { code: 'fr-FR', name: 'Français (France)', abbr: 'FR', flagEmoji: '🇫🇷' },
  { code: 'de-DE', name: 'Deutsch (Deutschland)', abbr: 'DE', flagEmoji: '🇩🇪' },
  { code: 'it-IT', name: 'Italiano (Italia)', abbr: 'IT', flagEmoji: '🇮🇹' },
  { code: 'pt-PT', name: 'Português (Portugal)', abbr: 'PT', flagEmoji: '🇵🇹' },
];

export const DEFAULT_LANGUAGE_CODE: string = 'es-ES';

export const LANGUAGE_PROMPT_CLAUSE: string = "Por favor, interactúa y responde en el idioma con el código: {languageCode}. Ajusta tu tono y expresiones para que sean naturales en ese idioma.";

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
  profileImageUrl: '', // Nueva propiedad por defecto
};

export const DEFAULT_CHAT_TITLE = "Nuevo Chat de Ciudad";

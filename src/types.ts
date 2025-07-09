export enum MessageRole {
  User = 'user',
  Model = 'model',
}

export interface WebSource {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: WebSource;
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

export interface EventInfo {
  title: string;
  date: string; // Expected format: YYYY-MM-DD (Start date for multi-day events)
  endDate?: string; // Expected format: YYYY-MM-DD (End date for multi-day events, optional)
  time?: string; // Expected format: HH:mm
  location?: string; // Optional location of the event
  sourceUrl?: string; // Optional URL to the source of the event information
  sourceTitle?: string; // Optional title of the event source page
}

export interface PlaceCardInfo {
  id: string; // Unique ID for this card instance
  name: string;
  placeId?: string;
  searchQuery?: string; // If placeId is not available

  // Details to be fetched by the frontend
  photoUrl?: string;
  photoAttributions?: string[]; // HTML attributions for the photo
  rating?: number; // e.g., 4.5
  userRatingsTotal?: number; // e.g., 1500
  address?: string;
  distance?: string; // e.g., "500 m" or "1.2 km"
  mapsUrl?: string; // Link to Google Maps for the place
  website?: string; // Official website of the place

  isLoadingDetails: boolean;
  errorDetails?: string;
}

export interface UploadedProcedureDocument {
  procedureName: string; // User-defined name for the trámite
  fileName: string;      // Original filename of the PDF
  mimeType: string;      // e.g., "application/pdf"
  base64Data: string;    // The PDF content encoded as a base64 string
}

export interface RecommendedPrompt {
  text: string;
  img: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  error?: string;
  events?: EventInfo[];
  placeCards?: PlaceCardInfo[];
  mapQuery?: string;
  downloadablePdfInfo?: DownloadablePdfInfo;
  telematicProcedureLink?: { url: string; text: string } | null;
  showSeeMoreButton?: boolean;
  originalUserQueryForEvents?: string;
  groundingMetadata?: any;
  isTyping?: boolean;
}

export interface RestrictedCityInfo {
  name: string;
  placeId?: string; // Google Place ID
  formattedAddress?: string; // Full address from Google, useful for display
}

export interface SupportedLanguage {
  code: string; // e.g., 'es-ES', 'en-US'
  name: string; // e.g., 'Español (España)', 'English (US)'
  abbr: string; // e.g., 'ES', 'EN'
  flagEmoji?: string; // Optional: e.g., '🇪🇸', '🇺🇸'
}

export interface CustomChatConfig {
  assistantName: string;
  systemInstruction: string;
  recommendedPrompts: RecommendedPrompt[];
  serviceTags: string[];
  enableGoogleSearch: boolean;
  allowMapDisplay: boolean;
  allowGeolocation: boolean;
  currentLanguageCode?: string;
  procedureSourceUrls: string[];
  uploadedProcedureDocuments: UploadedProcedureDocument[];
  restrictedCity: RestrictedCityInfo | null;
  sedeElectronicaUrl?: string; // URL for the City Council's Electronic Office
  profileImageUrl?: string; // Nueva propiedad para la foto de perfil
}

// Nuevos tipos para el sistema de ciudades
export interface City {
  id: string;
  name: string;
  slug: string;
  admin_user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface CityConfig extends CustomChatConfig {
  city_id: string;
  city?: City;
}

// Tipo para información de PDF descargable
export interface DownloadablePdfInfo {
  procedureName: string;
  fileName: string;
  base64Data: string;
  mimeType: string;
}

// Tipos para el sistema de chat público
export interface PublicChat {
  id: string;
  config_name: string;
  assistant_name: string;
  system_instruction: string;
  chat_slug: string;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface ChatSlugUpdate {
  chat_id: string;
  new_slug: string;
  is_public: boolean;
}

// Google Maps API Type Declarations
declare global {
  // Declare the 'google' namespace globally
  namespace google {
    namespace maps {
      export class LatLng {
        constructor(lat: number, lng: number, noWrap?: boolean);
        lat(): number;
        lng(): number;
        equals(other: LatLng | null): boolean;
        toString(): string;
        toJSON(): LatLngLiteral;
      }

      export interface LatLngLiteral {
        lat: number;
        lng: number;
      }

      export interface Point {
        x: number;
        y: number;
        equals(other: Point | null): boolean;
        toString(): string;
      }

      export interface Size {
        width: number;
        height: number;
        equals(other: Size | null): boolean;
        toString(): string;
      }
      
      export interface MapsEventListener {
        remove: () => void;
      }

      namespace event {
          export function addListener(instance: object, eventName: string, handler: Function): MapsEventListener;
          export function clearInstanceListeners(instance: object): void;
          // Other event functions can be added here if needed
      }
      
      export class Map {
          constructor(mapDiv: Element, opts?: MapOptions);
          // Add methods and properties as needed
          getCenter(): LatLng;
          setCenter(latLng: LatLng | LatLngLiteral): void;
          getZoom(): number;
          setZoom(zoom: number): void;
          // ... other methods
      }

      export interface MapOptions {
          center?: google.maps.LatLng | google.maps.LatLngLiteral;
          zoom?: number;
          mapId?: string; // For Cloud-based Maps Styling
          // Many other options
      }


      namespace places {
        export class PlacesService {
          constructor(attrContainer: HTMLDivElement | google.maps.Map);
          getDetails(
            request: PlaceDetailsRequest,
            callback: (
              result: PlaceResult | null,
              status: PlacesServiceStatus
            ) => void
          ): void;
          textSearch(
            request: TextSearchRequest,
            callback: (
              results: PlaceResult[] | null,
              status: PlacesServiceStatus
            ) => void
          ): void;
          // findPlaceFromQuery, nearbySearch, etc. can be added if needed
        }

        export interface PlaceDetailsRequest {
          placeId: string;
          fields?: string[];
          sessionToken?: AutocompleteSessionToken;
          language?: string;
          region?: string;
        }
        
        export interface TextSearchRequest {
          query: string;
          fields?: string[];
          location?: google.maps.LatLng | google.maps.LatLngLiteral;
          radius?: number;
          type?: string | string[];
          language?: string;
          region?: string;
          // And others like rankBy, openNow, etc.
        }

        export interface PlaceResult {
          address_components?: GeocoderAddressComponent[];
          formatted_address?: string;
          geometry?: PlaceGeometry;
          name?: string;
          photos?: PlacePhoto[];
          place_id?: string;
          rating?: number;
          types?: string[];
          url?: string; // Google Maps URL
          user_ratings_total?: number;
          website?: string; // Official website
          vicinity?: string;
          // opening_hours, price_level, etc.
        }

        export interface PlaceGeometry {
          location?: google.maps.LatLng;
          viewport?: LatLngBounds;
        }

        export interface PlacePhoto {
          height: number;
          html_attributions: string[];
          width: number;
          getUrl(opts?: PhotoOptions): string;
        }

        export interface PhotoOptions {
          maxHeight?: number;
          maxWidth?: number;
        }
        
        export interface GeocoderAddressComponent {
          long_name: string;
          short_name: string;
          types: string[];
        }
        
        export enum PlacesServiceStatus {
          OK = "OK",
          ZERO_RESULTS = "ZERO_RESULTS",
          OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
          REQUEST_DENIED = "REQUEST_DENIED",
          INVALID_REQUEST = "INVALID_REQUEST",
          UNKNOWN_ERROR = "UNKNOWN_ERROR",
          NOT_FOUND = "NOT_FOUND",
        }
        
        export class Autocomplete {
          constructor(inputElement: HTMLInputElement, opts?: AutocompleteOptions);
          addListener(eventName: string, handler: (this: Autocomplete) => void): google.maps.MapsEventListener;
          getPlace(): PlaceResult;
          setBounds(bounds: LatLngBounds | LatLngBoundsLiteral | undefined): void;
          setComponentRestrictions(restrictions: ComponentRestrictions | undefined): void;
          setFields(fields: string[] | undefined): void;
          setOptions(options: AutocompleteOptions): void;
          setTypes(types: string[] | undefined): void;
        }

        export interface AutocompleteOptions {
          bounds?: LatLngBounds | LatLngBoundsLiteral;
          componentRestrictions?: ComponentRestrictions;
          fields?: string[];
          placeIdOnly?: boolean;
          strictBounds?: boolean;
          types?: string[];
          // type?: string - deprecated
        }

        export interface ComponentRestrictions {
          country: string | string[];
        }
        
        export class AutocompleteSessionToken {} 
        
        export class LatLngBounds {
          constructor(sw?: google.maps.LatLng | google.maps.LatLngLiteral, ne?: google.maps.LatLng | google.maps.LatLngLiteral);
          contains(latLng: google.maps.LatLng | google.maps.LatLngLiteral): boolean;
          equals(other: LatLngBounds | LatLngBoundsLiteral | null): boolean;
          extend(point: google.maps.LatLng | google.maps.LatLngLiteral): LatLngBounds;
          getCenter(): google.maps.LatLng;
          getNorthEast(): google.maps.LatLng;
          getSouthWest(): google.maps.LatLng;
          intersects(other: LatLngBounds | LatLngBoundsLiteral): boolean;
          isEmpty(): boolean;
          toJSON(): LatLngBoundsLiteral;
          toString(): string;
          toUrlValue(precision?: number): string;
          union(other: LatLngBounds | LatLngBoundsLiteral): LatLngBounds;
        }
        export interface LatLngBoundsLiteral {
          east: number;
          north: number;
          south: number;
          west: number;
        }

      } // end namespace places
      
      namespace geometry { 
          namespace spherical {
              export function computeDistanceBetween(from: google.maps.LatLng, to: google.maps.LatLng, radius?: number): number;
              // computeArea, computeHeading, computeLength, computeOffset, computeOffsetOrigin, computeSignedArea, interpolate, etc.
          }
          // encoding, poly namespaces can be added if needed
      } // end namespace geometry

    } // end namespace maps
  } // end namespace google

  // Web Speech API related types
  interface SpeechRecognitionEventMap {
    "audiostart": Event;
    "soundstart": Event;
    "speechstart": Event;
    "speechend": Event;
    "soundend": Event;
    "audioend": Event;
    "result": SpeechRecognitionEvent;
    "nomatch": SpeechRecognitionEvent;
    "error": SpeechRecognitionErrorEvent;
    "start": Event;
    "end": Event;
  }

  interface SpeechRecognitionStatic {
    new(): SpeechRecognition;
  }
  
  interface SpeechRecognition extends EventTarget {
    grammars: SpeechGrammarList;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    serviceURI: string;
  
    start(): void;
    stop(): void;
    abort(): void;
  
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  
    addEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
  }
  
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
    readonly interpretation: any;
    readonly emma: Document | null;
  }
  
  interface SpeechRecognitionErrorEvent extends Event { // Changed from SpeechRecognitionError to SpeechRecognitionErrorEvent
    readonly error: string; // Typically a SpeechRecognitionErrorCode but simplified to string
    readonly message: string;
  }

  interface SpeechGrammarList {
    readonly length: number;
    item(index: number): SpeechGrammar;
    addFromURI(src: string, weight?: number): void;
    addFromString(string: string, weight?: number): void;
  }
  
  interface SpeechGrammar {
    src: string;
    weight: number;
  }
  
  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
  }
  
  interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    readonly isFinal: boolean;
  }
  
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  // Augment the existing global Window interface
  interface Window {
    google?: typeof google; // 'google' now refers to the globally declared 'google' namespace
    initMap?: () => void;
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}

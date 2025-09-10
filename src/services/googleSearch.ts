/**
 * Servicio para búsquedas en tiempo real con Google Search
 * Busca eventos, información actual y cualquier dato que no esté en la base de conocimiento
 */

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  formattedUrl: string;
  pagemap?: {
    metatags?: Array<{
      [key: string]: string;
    }>;
    cse_thumbnail?: Array<{
      src: string;
      width: string;
      height: string;
    }>;
  };
}

export interface SearchResponse {
  items: SearchResult[];
  searchInformation: {
    searchTime: number;
    formattedSearchTime: string;
    totalResults: string;
    formattedTotalResults: string;
  };
  queries: {
    request: Array<{
      title: string;
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
    }>;
  };
}

export interface SearchRequest {
  query: string;
  num?: number; // número de resultados (1-10)
  start?: number; // índice de inicio
  language?: string;
  country?: string;
  dateRestrict?: 'd1' | 'w1' | 'm1' | 'y1' | 'all'; // restricción de fecha
  safe?: 'active' | 'off'; // filtro de contenido seguro
  fileType?: string; // tipo de archivo
  siteSearch?: string; // buscar en un sitio específico
}

export class GoogleSearchService {
  private static instance: GoogleSearchService;
  private backendUrl: string;

  private constructor() {
    // Use secure backend endpoint instead of direct API access
    this.backendUrl = import.meta.env.VITE_FUNCTIONS_BASE_URL || 'https://us-central1-wearecity-2ab89.cloudfunctions.net';
    console.log('✅ Google Search service configured to use secure backend');
  }

  public static getInstance(): GoogleSearchService {
    if (!GoogleSearchService.instance) {
      GoogleSearchService.instance = new GoogleSearchService();
    }
    return GoogleSearchService.instance;
  }

  /**
   * Realizar búsqueda general usando el backend seguro
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    try {
      // Get authentication token
      const { auth } = await import('../integrations/firebase/config');
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('Usuario no autenticado. Inicia sesión para usar la búsqueda.');
      }

      const idToken = await user.getIdToken();
      
      // Call secure backend endpoint
      const response = await fetch(`${this.backendUrl}/secureGoogleSearch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error en la respuesta del servidor');
      }

      return result.data;
    } catch (error) {
      console.error('Error performing search:', error);
      throw new Error(`Error al realizar búsqueda: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Buscar eventos actuales
   */
  async searchEvents(city: string, dateRange: 'today' | 'week' | 'month' = 'week'): Promise<SearchResult[]> {
    const dateRestrict = dateRange === 'today' ? 'd1' : dateRange === 'week' ? 'w1' : 'm1';
    
    const response = await this.search({
      query: `eventos ${city} agenda cultural conciertos festivales`,
      num: 10,
      dateRestrict,
      language: 'es',
      country: 'ES'
    });

    return response.items || [];
  }

  /**
   * Buscar información de trámites municipales
   */
  async searchMunicipalProcedures(city: string, procedure?: string): Promise<SearchResult[]> {
    const query = procedure 
      ? `trámites ${procedure} ${city} ayuntamiento`
      : `trámites municipales ${city} ayuntamiento`;

    const response = await this.search({
      query,
      num: 8,
      language: 'es',
      country: 'ES',
      siteSearch: `${city.toLowerCase().replace(/\s+/g, '')}.es`
    });

    return response.items || [];
  }

  /**
   * Buscar información de transporte público
   */
  async searchTransportInfo(city: string, transportType?: string): Promise<SearchResult[]> {
    const query = transportType
      ? `transporte público ${transportType} ${city} horarios tarifas`
      : `transporte público ${city} horarios tarifas metro bus`;

    const response = await this.search({
      query,
      num: 8,
      language: 'es',
      country: 'ES'
    });

    return response.items || [];
  }

  /**
   * Buscar información de emergencias y servicios de salud
   */
  async searchEmergencyInfo(city: string): Promise<SearchResult[]> {
    const response = await this.search({
      query: `emergencias servicios salud hospitales farmacias guardia ${city}`,
      num: 8,
      language: 'es',
      country: 'ES'
    });

    return response.items || [];
  }

  /**
   * Buscar información turística
   */
  async searchTouristInfo(city: string, topic?: string): Promise<SearchResult[]> {
    const query = topic
      ? `turismo ${topic} ${city} qué ver hacer`
      : `turismo ${city} qué ver hacer monumentos`;

    const response = await this.search({
      query,
      num: 10,
      language: 'es',
      country: 'ES'
    });

    return response.items || [];
  }

  /**
   * Buscar información actual y noticias
   */
  async searchCurrentInfo(query: string, city?: string): Promise<SearchResult[]> {
    const searchQuery = city ? `${query} ${city}` : query;
    
    const response = await this.search({
      query: searchQuery,
      num: 8,
      dateRestrict: 'w1', // última semana
      language: 'es',
      country: 'ES'
    });

    return response.items || [];
  }

  /**
   * Buscar información específica en sitios oficiales
   */
  async searchOfficialInfo(query: string, city: string, officialSites: string[] = []): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    // Buscar en sitios oficiales específicos
    for (const site of officialSites) {
      try {
        const response = await this.search({
          query,
          num: 5,
          siteSearch: site,
          language: 'es'
        });
        
        if (response.items) {
          results.push(...response.items);
        }
      } catch (error) {
        console.warn(`Error searching in ${site}:`, error);
      }
    }

    // Buscar en el sitio oficial de la ciudad
    try {
      const citySite = `${city.toLowerCase().replace(/\s+/g, '')}.es`;
      const response = await this.search({
        query,
        num: 5,
        siteSearch: citySite,
        language: 'es'
      });
      
      if (response.items) {
        results.push(...response.items);
      }
    } catch (error) {
      console.warn(`Error searching in city site:`, error);
    }

    return results;
  }

  /**
   * Buscar información de restaurantes y gastronomía
   */
  async searchRestaurantInfo(city: string, cuisine?: string): Promise<SearchResult[]> {
    const query = cuisine
      ? `restaurantes ${cuisine} ${city} gastronomía`
      : `restaurantes ${city} gastronomía recomendaciones`;

    const response = await this.search({
      query,
      num: 8,
      language: 'es',
      country: 'ES'
    });

    return response.items || [];
  }

  /**
   * Buscar información de cultura y ocio
   */
  async searchCultureInfo(city: string, activity?: string): Promise<SearchResult[]> {
    const query = activity
      ? `cultura ${activity} ${city} ocio entretenimiento`
      : `cultura ocio entretenimiento ${city} actividades`;

    const response = await this.search({
      query,
      num: 8,
      language: 'es',
      country: 'ES'
    });

    return response.items || [];
  }

  /**
   * Verificar si el servicio está disponible
   */
  isAvailable(): boolean {
    return !!(this.backendUrl);
  }

  /**
   * Obtener información del servicio
   */
  getServiceInfo() {
    return {
      name: 'Google Custom Search API',
      provider: 'Google',
      features: [
        'Búsqueda de eventos en tiempo real',
        'Búsqueda de información actual',
        'Búsqueda de trámites municipales',
        'Búsqueda de información de transporte',
        'Búsqueda de información de emergencias',
        'Búsqueda de información turística',
        'Búsqueda en sitios oficiales',
        'Búsqueda de restaurantes y gastronomía',
        'Búsqueda de cultura y ocio',
        'Filtros por fecha y ubicación'
      ],
      available: this.isAvailable()
    };
  }
}

// Exportar instancia singleton
export const googleSearchService = GoogleSearchService.getInstance();

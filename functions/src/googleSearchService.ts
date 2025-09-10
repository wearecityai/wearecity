/**
 * Servicio de Google Search API para Firebase Functions
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
  private apiKey: string;
  private searchEngineId: string;
  private baseUrl = 'https://www.googleapis.com/customsearch/v1';

  constructor() {
    // Keys will be loaded from Secret Manager when needed
    this.apiKey = '';
    this.searchEngineId = '';
    console.log('✅ Google Search service initialized - will load keys from Secret Manager');
  }
  
  /**
   * Initialize API keys from Secret Manager
   */
  private async initializeKeys(): Promise<void> {
    if (!this.apiKey) {
      try {
        const { secretManager } = await import('./secretManager');
        this.apiKey = await secretManager.getSecret('GOOGLE_SEARCH_API_KEY');
        this.searchEngineId = await secretManager.getSecret('GOOGLE_SEARCH_ENGINE_ID');
        console.log('✅ Google Search API keys loaded from Secret Manager');
      } catch (error) {
        console.warn('⚠️ Failed to load from Secret Manager, using environment variables');
        this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
        this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
      }
    }
  }

  /**
   * Realizar búsqueda general
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    // Initialize keys from Secret Manager if not already loaded
    await this.initializeKeys();
    
    if (!this.apiKey || !this.searchEngineId) {
      throw new Error('Google Search API key or Search Engine ID not configured');
    }

    const params = new URLSearchParams({
      key: this.apiKey,
      cx: this.searchEngineId,
      q: request.query,
      num: (request.num || 10).toString(),
      start: (request.start || 1).toString(),
      lr: `lang_${request.language || 'es'}`,
      cr: `country${request.country || 'ES'}`,
      safe: request.safe || 'active'
    });

    // Añadir restricciones opcionales
    if (request.dateRestrict) {
      params.append('dateRestrict', request.dateRestrict);
    }

    if (request.fileType) {
      params.append('fileType', request.fileType);
    }

    if (request.siteSearch) {
      params.append('siteSearch', request.siteSearch);
    }

    try {
      const response = await fetch(`${this.baseUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as any;
      
      if (data.error) {
        throw new Error(`Google Search API error: ${data.error.message}`);
      }

      return data as SearchResponse;
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
    return !!(this.apiKey && this.searchEngineId);
  }
}

// Exportar instancia singleton
export const googleSearchService = new GoogleSearchService();

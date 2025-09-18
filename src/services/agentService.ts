import { auth } from '@/integrations/firebase/config';

interface AgentResponse {
  success: boolean;
  response: string;
  error?: string;
}

interface AgentStats {
  totalEvents: number;
  totalRAGSources: number;
  activeCities: number;
  eventsBySource: { [key: string]: number };
  averageConfidence: number;
}

class AgentService {
  private baseUrl = 'https://us-central1-wearecity-2ab89.cloudfunctions.net/hybridIntelligentProxy';

  private async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    return await user.getIdToken();
  }

  private async makeAgentRequest(query: string, citySlug: string, isAdmin: boolean = true): Promise<AgentResponse> {
    try {
      const token = await this.getAuthToken();
      const user = auth.currentUser;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query,
          citySlug,
          userId: user?.uid || 'unknown',
          isAdmin
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        return result;
      } else {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error en solicitud al agente:', error);
      throw error;
    }
  }

  /**
   * Obtener URLs configuradas para una ciudad
   */
  async getCityUrls(citySlug: string): Promise<AgentResponse> {
    return this.makeAgentRequest(
      `Obtener todas las URLs configuradas para ${citySlug}`,
      citySlug,
      true
    );
  }

  /**
   * Ejecutar scraping manual para una ciudad
   */
  async runScraping(citySlug: string): Promise<AgentResponse> {
    return this.makeAgentRequest(
      `Primero obtén las URLs configuradas para ${citySlug}, luego scrapea eventos de todas las URLs encontradas e insértalos en el sistema RAG`,
      citySlug,
      true
    );
  }

  /**
   * Ejecutar scraping de una URL específica
   */
  async runScrapingForUrl(url: string, citySlug: string): Promise<AgentResponse> {
    return this.makeAgentRequest(
      `Scrapear eventos de ${url} para ${citySlug} e insertarlos en el sistema RAG`,
      citySlug,
      true
    );
  }

  /**
   * Obtener estadísticas del sistema RAG
   */
  async getStats(citySlug?: string): Promise<AgentResponse> {
    const query = citySlug 
      ? `Obtener estadísticas completas del sistema RAG para ${citySlug}`
      : 'Obtener estadísticas globales del sistema RAG para todas las ciudades';
    
    return this.makeAgentRequest(query, citySlug || 'all', true);
  }

  /**
   * Limpiar datos de una ciudad
   */
  async clearCityData(citySlug: string): Promise<AgentResponse> {
    return this.makeAgentRequest(
      `Limpiar todos los eventos y datos RAG de ${citySlug}`,
      citySlug,
      true
    );
  }

  /**
   * Limpiar todos los datos del sistema
   */
  async clearAllData(): Promise<AgentResponse> {
    return this.makeAgentRequest(
      'Limpiar TODOS los datos RAG del sistema completo',
      'all',
      true
    );
  }

  /**
   * Probar conexión con el agente
   */
  async testAgent(citySlug: string): Promise<AgentResponse> {
    return this.makeAgentRequest(
      `Test de conectividad del agente para ${citySlug}`,
      citySlug,
      true
    );
  }

  /**
   * Parsear estadísticas de la respuesta del agente
   */
  parseStatsFromResponse(response: string): AgentStats {
    const stats: AgentStats = {
      totalEvents: 0,
      totalRAGSources: 0,
      activeCities: 0,
      eventsBySource: {},
      averageConfidence: 0
    };

    try {
      // Extraer números de la respuesta usando regex
      const eventMatch = response.match(/(\d+)\s*eventos?/i);
      const sourceMatch = response.match(/(\d+)\s*fuentes?\s*RAG/i);
      const cityMatch = response.match(/(\d+)\s*ciudades?\s*activas?/i);
      const confidenceMatch = response.match(/confianza.*?(\d+(?:\.\d+)?)/i);

      if (eventMatch) stats.totalEvents = parseInt(eventMatch[1]);
      if (sourceMatch) stats.totalRAGSources = parseInt(sourceMatch[1]);
      if (cityMatch) stats.activeCities = parseInt(cityMatch[1]);
      if (confidenceMatch) stats.averageConfidence = parseFloat(confidenceMatch[1]);

      // Extraer fuentes de eventos
      const sourceMatches = response.match(/(\w+):\s*(\d+)\s*eventos?/gi);
      if (sourceMatches) {
        sourceMatches.forEach(match => {
          const [, source, count] = match.match(/(\w+):\s*(\d+)/) || [];
          if (source && count) {
            stats.eventsBySource[source] = parseInt(count);
          }
        });
      }

    } catch (error) {
      console.error('Error parseando estadísticas:', error);
    }

    return stats;
  }

  /**
   * Ejecutar scraping programado
   */
  async runScheduledScraping(operation: 'daily_scrape' | 'weekly_scrape' | 'monthly_cleanup', cities: string[]): Promise<any> {
    try {
      const response = await fetch('https://handlescheduledscraping-7gaozpdiza-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation,
          cities,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error en scraping programado:', error);
      throw error;
    }
  }

  /**
   * Obtener estado de salud del sistema
   */
  async getSystemHealth(): Promise<any> {
    try {
      const response = await fetch('https://getsystemhealth-7gaozpdiza-uc.a.run.app');
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error obteniendo estado del sistema:', error);
      throw error;
    }
  }

  /**
   * Obtener métricas históricas del sistema
   */
  async getSystemMetrics(period: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<any> {
    try {
      const response = await fetch(`https://getsystemmetrics-7gaozpdiza-uc.a.run.app?period=${period}`);
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error obteniendo métricas del sistema:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const agentService = new AgentService();
export default agentService;

/**
 * Servicio del cliente para búsqueda en tiempo real usando Firebase Functions
 * Este servicio actúa como proxy para las Firebase Functions que manejan Google APIs
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../integrations/firebase/config';

// Inicializar Firebase Functions
const functions = getFunctions(app);

export interface RealTimeSearchRequest {
  query: string;
  city: string;
  location?: { lat: number; lng: number };
  userType?: 'tourist' | 'resident';
  urgency?: 'low' | 'medium' | 'high';
}

export interface RealTimeSearchResponse {
  places?: any[];
  searchResults?: any[];
  events?: any[];
  info?: any[];
  timestamp: string;
  city: string;
  query: string;
}

export class FirebaseRealTimeSearchService {
  private static instance: FirebaseRealTimeSearchService;

  private constructor() {}

  public static getInstance(): FirebaseRealTimeSearchService {
    if (!FirebaseRealTimeSearchService.instance) {
      FirebaseRealTimeSearchService.instance = new FirebaseRealTimeSearchService();
    }
    return FirebaseRealTimeSearchService.instance;
  }

  /**
   * Búsqueda inteligente que determina automáticamente qué servicios usar
   */
  async intelligentSearch(request: RealTimeSearchRequest): Promise<RealTimeSearchResponse> {
    try {
      const intelligentSearch = httpsCallable(functions, 'intelligentSearch');
      
      const result = await intelligentSearch({
        query: request.query,
        city: request.city,
        location: request.location,
        userType: request.userType || 'resident',
        urgency: request.urgency || 'low'
      });

      return result.data as RealTimeSearchResponse;
    } catch (error) {
      console.error('Error in intelligent search:', error);
      throw new Error(`Error en búsqueda inteligente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Buscar lugares específicos
   */
  async searchPlaces(
    query: string,
    city: string,
    location?: { lat: number; lng: number },
    userType: 'tourist' | 'resident' = 'resident'
  ): Promise<any[]> {
    try {
      const searchPlaces = httpsCallable(functions, 'searchPlaces');
      
      const result = await searchPlaces({
        query,
        city,
        location,
        userType
      });

      return result.data.places || [];
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  /**
   * Buscar eventos
   */
  async searchEvents(query: string, city: string): Promise<any[]> {
    try {
      const searchEvents = httpsCallable(functions, 'searchEvents');
      
      const result = await searchEvents({
        query,
        city
      });

      return result.data.events || [];
    } catch (error) {
      console.error('Error searching events:', error);
      return [];
    }
  }

  /**
   * Buscar información específica por categoría
   */
  async searchByCategory(
    category: 'restaurants' | 'monuments' | 'institutions' | 'transport' | 'emergency' | 'culture' | 'procedures',
    city: string,
    location?: { lat: number; lng: number }
  ): Promise<RealTimeSearchResponse> {
    try {
      const searchByCategory = httpsCallable(functions, 'searchByCategory');
      
      const result = await searchByCategory({
        category,
        city,
        location
      });

      return result.data as RealTimeSearchResponse;
    } catch (error) {
      console.error(`Error searching by category ${category}:`, error);
      throw new Error(`Error al buscar información de ${category}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Verificar disponibilidad de servicios
   */
  isAvailable(): boolean {
    // Siempre disponible si Firebase Functions está configurado
    return true;
  }

  /**
   * Obtener información del servicio
   */
  getServiceInfo() {
    return {
      name: 'Firebase Real Time Search Service',
      provider: 'Firebase Functions + Google APIs',
      features: [
        'Búsqueda inteligente automática',
        'Análisis de intenciones de consulta',
        'Búsqueda de lugares en tiempo real',
        'Búsqueda de eventos actuales',
        'Búsqueda de información general',
        'Búsqueda por categorías específicas',
        'Contexto de usuario (turista/residente)',
        'Búsquedas paralelas optimizadas',
        'Seguridad mejorada (API keys en servidor)'
      ],
      available: this.isAvailable()
    };
  }
}

// Exportar instancia singleton
export const firebaseRealTimeSearchService = FirebaseRealTimeSearchService.getInstance();

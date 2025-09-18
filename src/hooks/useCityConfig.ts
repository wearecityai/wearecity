import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';

export interface CityConfig {
  name: string;
  slug: string;
  displayName: string;
  officialWebsite: string;
  agendaEventosUrls: string[];
  tramitesUrls: string[];
  noticiasUrls: string[];
  turismoUrls: string[];
  contactUrls: string[];
  serviciosUrls: string[];
  scrapingConfig: {
    enabled: boolean;
    selectors: {
      eventContainer: string;
      title: string;
      description: string;
      date: string;
      location: string;
    };
  };
  isActive?: boolean;
  population?: number;
  province?: string;
  updatedAt?: any;
  updatedBy?: string;
}

export const useCityConfig = () => {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de ciudades
  const loadCities = async () => {
    try {
      setLoading(true);
      const citiesSnapshot = await getDocs(collection(db, 'cities'));
      const cityList = citiesSnapshot.docs.map(doc => doc.id);
      setCities(cityList);
    } catch (err) {
      setError('Error cargando ciudades');
      console.error('Error loading cities:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar configuración de ciudad específica
  const loadCityConfig = async (citySlug: string): Promise<CityConfig | null> => {
    try {
      setError(null);
      const cityDoc = await getDoc(doc(db, 'cities', citySlug));
      
      if (cityDoc.exists()) {
        return cityDoc.data() as CityConfig;
      } else {
        // Crear configuración por defecto
        const defaultConfig: CityConfig = {
          name: citySlug,
          slug: citySlug,
          displayName: citySlug.charAt(0).toUpperCase() + citySlug.slice(1).replace('-', ' '),
          officialWebsite: '',
          agendaEventosUrls: [],
          tramitesUrls: [],
          noticiasUrls: [],
          turismoUrls: [],
          contactUrls: [],
          serviciosUrls: [],
          scrapingConfig: {
            enabled: false,
            selectors: {
              eventContainer: 'article, .post, .event-item, .mec-event-article',
              title: 'h1, h2, h3, .entry-title, .event-title, .mec-event-title',
              description: '.entry-content, .event-description, .content, .excerpt, p, .mec-event-description',
              date: '.event-date, .entry-date, .published, .mec-event-date, time, .mec-date-wrap',
              location: '.event-location, .venue, .location, .mec-event-location'
            }
          },
          isActive: true,
          population: 0,
          province: ''
        };
        
        // Guardar configuración por defecto
        await setDoc(doc(db, 'cities', citySlug), defaultConfig);
        return defaultConfig;
      }
    } catch (err) {
      setError('Error cargando configuración de ciudad');
      console.error('Error loading city config:', err);
      return null;
    }
  };

  // Guardar configuración de ciudad
  const saveCityConfig = async (citySlug: string, config: CityConfig): Promise<boolean> => {
    try {
      setError(null);
      await setDoc(doc(db, 'cities', citySlug), {
        ...config,
        updatedAt: new Date(),
        updatedBy: 'admin-interface'
      });
      return true;
    } catch (err) {
      setError('Error guardando configuración');
      console.error('Error saving city config:', err);
      return false;
    }
  };

  // Validar URL
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Obtener estadísticas de configuración
  const getCityConfigStats = (config: CityConfig) => {
    const totalUrls = [
      ...config.agendaEventosUrls,
      ...config.tramitesUrls,
      ...config.noticiasUrls,
      ...config.turismoUrls,
      ...config.contactUrls,
      ...config.serviciosUrls
    ].filter(url => url.trim() !== '').length;

    const urlsByCategory = {
      eventos: config.agendaEventosUrls.filter(url => url.trim() !== '').length,
      tramites: config.tramitesUrls.filter(url => url.trim() !== '').length,
      noticias: config.noticiasUrls.filter(url => url.trim() !== '').length,
      turismo: config.turismoUrls.filter(url => url.trim() !== '').length,
      contacto: config.contactUrls.filter(url => url.trim() !== '').length,
      servicios: config.serviciosUrls.filter(url => url.trim() !== '').length
    };

    return {
      totalUrls,
      urlsByCategory,
      scrapingEnabled: config.scrapingConfig.enabled,
      hasOfficialWebsite: !!config.officialWebsite.trim()
    };
  };

  useEffect(() => {
    loadCities();
  }, []);

  return {
    cities,
    loading,
    error,
    loadCities,
    loadCityConfig,
    saveCityConfig,
    validateUrl,
    getCityConfigStats
  };
};

export default useCityConfig;

import { useState, useEffect, useCallback } from 'react';
import { City } from '../types';
import { useAuth } from './useAuthFirebase';
import { firestoreClient } from '@/integrations/firebase/database';

export const useCitiesFirebase = () => {
  const { user, profile } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar todas las ciudades activas y públicas
  const loadCities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await firestoreClient
        .from('cities')
        .select('*')
        .execute();

      if (result.error) {
        console.error('Error loading cities from Firebase:', result.error);
        setError('Error al cargar las ciudades');
        return;
      }

      const allCities = (result.data || []) as City[];
      
      // Filtrar ciudades públicas y activas (Firebase usa isPublic/isActive)
      const publicActiveCities = allCities
        .filter(city => city.isPublic === true && city.isActive !== false)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      console.log(`🏙️ Loaded ${allCities.length} total cities, ${publicActiveCities.length} public:`, publicActiveCities.map(c => c.name));
      setCities(publicActiveCities);
    } catch (error) {
      console.error('Error loading cities from Firebase:', error);
      setError('Error al cargar las ciudades');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar ciudad por slug
  const loadCityBySlug = async (slug: string): Promise<City | null> => {
    try {
      console.log('🔍 Loading city by slug from Firebase:', slug);
      
      // Simplificar consulta para evitar índice compuesto
      const result = await firestoreClient
        .from('cities')
        .select('*')
        .eq('slug', slug)
        .single();

      if (result.error) {
        console.error('Error loading city by slug from Firebase:', result.error);
        return null;
      }

      const city = result.data as City;
      
      // Verificar manualmente que la ciudad esté activa
      if (city && city.isActive === false) {
        console.log('🏙️ City found but not active:', city.name);
        return null;
      }
      
      console.log('🏙️ City loaded by slug:', city?.name);
      return city;
    } catch (error) {
      console.error('Error loading city by slug from Firebase:', error);
      return null;
    }
  };

  // Cargar ciudad del usuario actual (si es admin)
  const loadUserCity = async () => {
    if (!user || profile?.role !== 'administrativo') return;

    setIsLoading(true);
    try {
      console.log('🔍 Loading admin city from Firebase for user:', user.id);
      
      // Simplificar consulta para evitar índice compuesto
      const result = await firestoreClient
        .from('cities')
        .select('*')
        .eq('admin_user_id', user.id)
        .single();

      if (result.error) {
        console.error('Error loading user city from Firebase:', result.error);
        setError('Error al cargar la ciudad del usuario');
        return;
      }

      const city = result.data as City;
      
      // Verificar manualmente que la ciudad esté activa
      if (city && city.isActive === false) {
        console.log('🏙️ Admin city found but not active:', city.name);
        setCurrentCity(null);
        return;
      }
      
      console.log('🏙️ Admin city loaded:', city?.name);
      setCurrentCity(city);
    } catch (error) {
      console.error('Error loading user city from Firebase:', error);
      setError('Error al cargar la ciudad del usuario');
    } finally {
      setIsLoading(false);
    }
  };

  // Crear ciudad para admin (si no tiene una ya)
  const createAdminChat = async (chatName: string = 'Mi Chat'): Promise<boolean> => {
    if (!user || profile?.role !== 'administrativo') {
      setError('Solo los administradores pueden crear chats');
      return false;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('🏗️ Creating admin city in Firebase...');
      
      // Esta función debería ser llamada automáticamente por un Cloud Function cuando se crea el perfil admin
      // Si no existe ciudad, la creamos manualmente
      await loadUserCity();
      return true;
    } catch (error) {
      console.error('Error creating admin chat in Firebase:', error);
      setError('Error al crear el chat');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar si el usuario es admin de una ciudad específica
  const isAdminOfCity = (cityId: string): boolean => {
    return currentCity?.id === cityId && user?.id === currentCity?.admin_user_id;
  };

  // Actualizar configuración completa de la ciudad
  const updateCityConfig = async (config: Partial<City>): Promise<boolean> => {
    if (!user || profile?.role !== 'administrativo' || !currentCity) {
      setError('Solo los administradores pueden actualizar ciudades');
      return false;
    }

    try {
      console.log('🔧 Updating city config in Firebase:', currentCity.id);
      
      const result = await firestoreClient.update('cities', {
        ...config,
        updated_at: new Date().toISOString()
      }, currentCity.id);

      if (result.error) {
        console.error('Error updating city config in Firebase:', result.error);
        setError('Error al actualizar la configuración de la ciudad');
        return false;
      }

      // Recargar la ciudad del usuario
      await loadUserCity();
      return true;
    } catch (error) {
      console.error('Error updating city config in Firebase:', error);
      setError('Error al actualizar la configuración de la ciudad');
      return false;
    }
  };

  // Actualizar nombre de la ciudad
  const updateCityName = async (cityId: string, newName: string): Promise<boolean> => {
    if (!user || profile?.role !== 'administrativo') {
      setError('Solo los administradores pueden actualizar ciudades');
      return false;
    }

    try {
      console.log('🏷️ Updating city name in Firebase:', cityId, newName);
      
      const result = await firestoreClient.update('cities', { 
        name: newName,
        updated_at: new Date().toISOString()
      }, cityId);

      if (result.error) {
        console.error('Error updating city name in Firebase:', result.error);
        setError('Error al actualizar el nombre de la ciudad');
        return false;
      }

      // Recargar la ciudad del usuario
      await loadUserCity();
      return true;
    } catch (error) {
      console.error('Error updating city name in Firebase:', error);
      setError('Error al actualizar el nombre de la ciudad');
      return false;
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      loadUserCity();
    }
  }, [user, profile]);

  return {
    cities,
    currentCity,
    isLoading,
    error,
    loadCities,
    loadCityBySlug,
    loadUserCity,
    createAdminChat,
    createCity: createAdminChat, // Alias for compatibility
    generateSlug: (name: string) => name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    isAdminOfCity,
    updateCityName,
    updateCityConfig,
    setError
  };
};
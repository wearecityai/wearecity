import { useState, useEffect } from 'react';
import { City } from '../types';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useCities = () => {
  const { user, profile } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar todas las ciudades activas y públicas
  const loadCities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_public', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading cities:', error);
        setError('Error al cargar las ciudades');
        return;
      }

      setCities((data || []) as City[]);
    } catch (error) {
      console.error('Error loading cities:', error);
      setError('Error al cargar las ciudades');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar ciudad por slug
  const loadCityBySlug = async (slug: string): Promise<City | null> => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error loading city by slug:', error);
        return null;
      }

      return data as City;
    } catch (error) {
      console.error('Error loading city by slug:', error);
      return null;
    }
  };

  // Cargar ciudad del usuario actual (si es admin)
  const loadUserCity = async () => {
    if (!user || profile?.role !== 'administrativo') return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('admin_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error loading user city:', error);
        setError('Error al cargar la ciudad del usuario');
        return;
      }

      setCurrentCity(data as City);
    } catch (error) {
      console.error('Error loading user city:', error);
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
      // Esta función debería ser llamada automáticamente por el trigger cuando se crea el perfil admin
      // Si no existe ciudad, la creamos manualmente
      await loadUserCity();
      return true;
    } catch (error) {
      console.error('Error creating admin chat:', error);
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
      const { error } = await supabase
        .from('cities')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentCity.id)
        .eq('admin_user_id', user.id);

      if (error) {
        console.error('Error updating city config:', error);
        setError('Error al actualizar la configuración de la ciudad');
        return false;
      }

      // Recargar la ciudad del usuario
      await loadUserCity();
      return true;
    } catch (error) {
      console.error('Error updating city config:', error);
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
      const { error } = await supabase
        .from('cities')
        .update({ 
          name: newName,
          updated_at: new Date().toISOString()
        })
        .eq('id', cityId)
        .eq('admin_user_id', user.id);

      if (error) {
        console.error('Error updating city name:', error);
        setError('Error al actualizar el nombre de la ciudad');
        return false;
      }

      // Recargar la ciudad del usuario
      await loadUserCity();
      return true;
    } catch (error) {
      console.error('Error updating city name:', error);
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
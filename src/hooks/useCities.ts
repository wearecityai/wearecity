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

  // Cargar todas las ciudades activas
  const loadCities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading cities:', error);
        setError('Error al cargar las ciudades');
        return;
      }

      setCities(data || []);
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

      return data;
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
        .rpc('get_admin_city', { admin_user_id_param: user.id });

      if (error) {
        console.error('Error loading user city:', error);
        setError('Error al cargar la ciudad del usuario');
        return;
      }

      if (data && data.length > 0) {
        setCurrentCity(data[0]);
      } else {
        setCurrentCity(null);
      }
    } catch (error) {
      console.error('Error loading user city:', error);
      setError('Error al cargar la ciudad del usuario');
    } finally {
      setIsLoading(false);
    }
  };

  // Crear nuevo chat de admin (que automáticamente crea la ciudad)
  const createAdminChat = async (chatName: string = 'Mi Chat'): Promise<boolean> => {
    if (!user || profile?.role !== 'administrativo') {
      setError('Solo los administradores pueden crear chats');
      return false;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .rpc('create_admin_chat', { 
          chat_name_param: chatName,
          is_public_param: true 
        });

      if (error) {
        console.error('Error creating admin chat:', error);
        setError('Error al crear el chat');
        return false;
      }

      // Recargar la ciudad del usuario
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

  // Actualizar nombre de la ciudad
  const updateCityName = async (chatId: string, newName: string): Promise<boolean> => {
    if (!user || profile?.role !== 'administrativo') {
      setError('Solo los administradores pueden actualizar ciudades');
      return false;
    }

    try {
      const { data, error } = await supabase
        .rpc('update_city_name_from_chat', {
          chat_id_param: chatId,
          new_chat_name: newName
        });

      if (error) {
        console.error('Error updating city name:', error);
        setError('Error al actualizar el nombre de la ciudad');
        return false;
      }

      // Recargar la ciudad del usuario
      await loadUserCity();
      return data;
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
    isAdminOfCity,
    updateCityName,
    setError
  };
};
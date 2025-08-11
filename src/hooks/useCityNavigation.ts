import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DefaultChat {
  conversationId: string;
  title: string;
  citySlug?: string;
}

export const useCityNavigation = () => {
  const { user } = useAuth();
  const [defaultChat, setDefaultChat] = useState<DefaultChat | null>(null);
  const [lastVisitedCity, setLastVisitedCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos de navegación del usuario desde Supabase
  useEffect(() => {
    const loadUserNavigationData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('default_chat_data, last_visited_city')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading user navigation data:', error);
        } else {
          // Cargar ciudad predeterminada
          if (data?.default_chat_data && typeof data.default_chat_data === 'object') {
            const chatData = data.default_chat_data as any;
            if (chatData.citySlug) {
              setDefaultChat(chatData as DefaultChat);
            }
          }

          // Cargar última ciudad visitada
          if (data?.last_visited_city) {
            setLastVisitedCity(data.last_visited_city);
          }
        }
      } catch (error) {
        console.error('Error loading user navigation data:', error);
      } finally {
        // Delay más agresivo para asegurar que NO se muestre el sidebar prematuramente
        setTimeout(() => {
          setLoading(false);
        }, 1200);
      }
    };

    loadUserNavigationData();
  }, [user]);

  // Establecer ciudad como predeterminada
  const setDefaultCity = async (citySlug: string, conversationId?: string, title?: string) => {
    if (!user) return;

    const chatData: DefaultChat = {
      conversationId: conversationId || '',
      title: title || `Chat de ${citySlug}`,
      citySlug: citySlug
    };
    
    console.log('Setting default city:', chatData);
    setDefaultChat(chatData);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ default_chat_data: chatData as any })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving default city:', error);
        throw error;
      } else {
        console.log('Default city saved successfully');
      }
    } catch (error) {
      console.error('Error saving default city:', error);
      throw error;
    }
  };

  // Quitar ciudad predeterminada
  const removeDefaultCity = async () => {
    if (!user) return;

    console.log('Removing default city');
    setDefaultChat(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ default_chat_data: null })
        .eq('id', user.id);

      if (error) {
        console.error('Error removing default city:', error);
        throw error;
      } else {
        console.log('Default city removed successfully');
      }
    } catch (error) {
      console.error('Error removing default city:', error);
      throw error;
    }
  };

  // Actualizar última ciudad visitada
  const updateLastVisitedCity = async (citySlug: string) => {
    if (!user) return;

    console.log('Updating last visited city:', citySlug);
    setLastVisitedCity(citySlug);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ last_visited_city: citySlug })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating last visited city:', error);
        throw error;
      } else {
        console.log('Last visited city updated successfully');
      }
    } catch (error) {
      console.error('Error updating last visited city:', error);
      throw error;
    }
  };

  // Verificar si una ciudad es la predeterminada
  const isDefaultCity = (citySlug: string) => {
    return defaultChat?.citySlug === citySlug;
  };

  // Obtener la ciudad de destino para la navegación inicial
  const getInitialCityDestination = () => {
    // Prioridad 1: Ciudad predeterminada
    if (defaultChat?.citySlug) {
      return defaultChat.citySlug;
    }
    
    // Prioridad 2: Última ciudad visitada
    if (lastVisitedCity) {
      return lastVisitedCity;
    }
    
    // Prioridad 3: No hay ciudad específica
    return null;
  };

  return {
    defaultChat,
    lastVisitedCity,
    setDefaultCity,
    removeDefaultCity,
    updateLastVisitedCity,
    isDefaultCity,
    getInitialCityDestination,
    loading
  };
};

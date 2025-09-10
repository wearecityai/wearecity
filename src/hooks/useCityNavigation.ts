import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

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

  // Navigation data is now handled locally (Supabase removed)
  useEffect(() => {
    const loadUserNavigationData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Load from localStorage as fallback
        const storedDefaultChat = localStorage.getItem('defaultChat');
        const storedLastVisitedCity = localStorage.getItem('lastVisitedCity');
        
        if (storedDefaultChat) {
          try {
            const chatData = JSON.parse(storedDefaultChat);
            setDefaultChat(chatData);
          } catch (e) {
            console.error('Error parsing stored default chat:', e);
          }
        }
        
        if (storedLastVisitedCity) {
          setLastVisitedCity(storedLastVisitedCity);
        }
      } catch (error) {
        console.error('Error loading user navigation data:', error);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 500);
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
      // Save to localStorage instead of Supabase
      localStorage.setItem('defaultChat', JSON.stringify(chatData));
      console.log('Default city saved successfully');
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
      // Remove from localStorage instead of Supabase
      localStorage.removeItem('defaultChat');
      console.log('Default city removed successfully');
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
      // Save to localStorage instead of Supabase
      localStorage.setItem('lastVisitedCity', citySlug);
      console.log('Last visited city updated successfully');
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

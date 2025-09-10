import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { firestoreClient } from '@/integrations/firebase/database';

interface DefaultChat {
  conversationId: string;
  title: string;
  citySlug?: string;
}

export const useCityNavigation = () => {
  const { user } = useAuth();
  const [defaultChat, setDefaultChat] = useState<DefaultChat | null>(null);
  const [lastVisitedCity, setLastVisitedCity] = useState<string | null>(null);
  const [recentCities, setRecentCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use refs to access current values in memoized functions
  const lastVisitedCityRef = useRef(lastVisitedCity);
  const recentCitiesRef = useRef(recentCities);
  
  // Update refs when state changes
  useEffect(() => {
    lastVisitedCityRef.current = lastVisitedCity;
  }, [lastVisitedCity]);
  
  useEffect(() => {
    recentCitiesRef.current = recentCities;
  }, [recentCities]);

  // Load user navigation data from Firestore
  const loadUserNavigationData = useCallback(async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 Loading user navigation data for user:', user.id);
        
        // Load from Firestore
        const profileResult = await firestoreClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileResult.data) {
          const profile = profileResult.data;
          console.log('📋 Profile data loaded:', {
            last_visited_city: profile.last_visited_city,
            recent_cities: profile.recent_cities
          });
          
          // Load recent cities from profile
          if (profile.recent_cities && Array.isArray(profile.recent_cities)) {
            setRecentCities(profile.recent_cities);
            console.log('✅ Recent cities set:', profile.recent_cities);
          }
          
          // Load last visited city from profile
          if (profile.last_visited_city !== null && profile.last_visited_city !== undefined) {
            setLastVisitedCity(profile.last_visited_city);
            console.log('✅ Last visited city set:', profile.last_visited_city);
          }
          
          // Load default chat from profile
          if (profile.default_chat) {
            setDefaultChat(profile.default_chat);
          }
        } else {
          console.log('❌ No profile data found');
        }

        // Fallback to localStorage for backward compatibility
        const storedDefaultChat = localStorage.getItem('defaultChat');
        const storedLastVisitedCity = localStorage.getItem('lastVisitedCity');
        const storedRecentCities = localStorage.getItem('recentCities');
        
        if (storedDefaultChat && !defaultChat) {
          try {
            const chatData = JSON.parse(storedDefaultChat);
            setDefaultChat(chatData);
          } catch (e) {
            console.error('Error parsing stored default chat:', e);
          }
        }
        
        if (storedLastVisitedCity && !lastVisitedCity) {
          setLastVisitedCity(storedLastVisitedCity);
        }
        
        if (storedRecentCities && recentCities.length === 0) {
          try {
            const recentCitiesData = JSON.parse(storedRecentCities);
            setRecentCities(recentCitiesData);
          } catch (e) {
            console.error('Error parsing stored recent cities:', e);
          }
        }
      } catch (error) {
        console.error('Error loading user navigation data:', error);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    }, [user]);

  // Load data when user changes
  useEffect(() => {
    loadUserNavigationData();
  }, [user, loadUserNavigationData]);

  // Establecer ciudad como predeterminada
  const setDefaultCity = useCallback(async (citySlug: string, conversationId?: string, title?: string) => {
    if (!user) return;

    const chatData: DefaultChat = {
      conversationId: conversationId || '',
      title: title || `Chat de ${citySlug}`,
      citySlug: citySlug
    };
    
    console.log('Setting default city:', chatData);
    setDefaultChat(chatData);
    
    try {
      // Update profile in Firestore
      const updateData = {
        default_chat: chatData,
        updated_at: new Date().toISOString()
      };

      await firestoreClient.update('profiles', updateData, user.id);

      console.log('Default city saved to Firestore successfully');
      
      // Also save to localStorage as backup
      localStorage.setItem('defaultChat', JSON.stringify(chatData));
      
      // Reload data to ensure UI is in sync
      await loadUserNavigationData();
    } catch (error) {
      console.error('Error saving default city to Firestore:', error);
      throw error;
    }
  }, [user]);

  // Quitar ciudad predeterminada
  const removeDefaultCity = useCallback(async () => {
    if (!user) return;

    console.log('Removing default city');
    setDefaultChat(null);
    
    try {
      // Update profile in Firestore
      const updateData = {
        default_chat: null,
        updated_at: new Date().toISOString()
      };

      await firestoreClient.update('profiles', updateData, user.id);

      console.log('Default city removed from Firestore successfully');
      
      // Also remove from localStorage
      localStorage.removeItem('defaultChat');
      
      // Reload data to ensure UI is in sync
      await loadUserNavigationData();
    } catch (error) {
      console.error('Error removing default city from Firestore:', error);
      throw error;
    }
  }, [user]);

  // Validar que una ciudad existe en la base de datos
  const validateCityExists = useCallback(async (citySlug: string): Promise<boolean> => {
    try {
      const { data, error } = await firestoreClient
        .from('cities')
        .select('slug')
        .eq('slug', citySlug)
        .eq('isPublic', true)
        .single();
      
      if (error || !data) {
        console.warn(`City validation failed for ${citySlug}:`, error?.message || 'City not found');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating city:', error);
      return false;
    }
  }, []);

  // Actualizar última ciudad visitada
  const updateLastVisitedCity = useCallback(async (citySlug: string) => {
    if (!user) {
      console.log('❌ No user found, skipping city update');
      return;
    }

    console.log('🔄 Updating last visited city:', citySlug, 'for user:', user.id);
    
    // Validar que la ciudad existe antes de guardarla
    const isValidCity = await validateCityExists(citySlug);
    if (!isValidCity) {
      console.warn(`❌ Skipping update for invalid city: ${citySlug}`);
      return;
    }
    
    console.log('✅ City validation passed for:', citySlug);
    
    // Si hay una ciudad anterior, agregarla a recientes (excluyendo la actual)
    let newRecentCities = [...recentCitiesRef.current];
    if (lastVisitedCityRef.current && lastVisitedCityRef.current !== citySlug) {
      // Agregar la ciudad anterior a recientes (si no es la misma que estamos visitando)
      newRecentCities = [lastVisitedCityRef.current, ...newRecentCities.filter(slug => slug !== lastVisitedCityRef.current && slug !== citySlug)].slice(0, 3);
    }
    
    setLastVisitedCity(citySlug);
    setRecentCities(newRecentCities);
    
    try {
      // Update profile in Firestore
      const updateData = {
        last_visited_city: citySlug,
        recent_cities: newRecentCities,
        updated_at: new Date().toISOString()
      };

      await firestoreClient.update('profiles', updateData, user.id);

      console.log('Last visited city and recent cities updated in Firestore successfully');
      console.log('Current city:', citySlug);
      console.log('Recent cities (excluding current):', newRecentCities);
      
      // Also save to localStorage as backup
      localStorage.setItem('lastVisitedCity', citySlug);
      localStorage.setItem('recentCities', JSON.stringify(newRecentCities));
    } catch (error) {
      console.error('Error updating last visited city in Firestore:', error);
      throw error;
    }
  }, [user, validateCityExists]);

  // Verificar si una ciudad es la predeterminada
  const isDefaultCity = useCallback((citySlug: string) => {
    return defaultChat?.citySlug === citySlug;
  }, [defaultChat]);

  // Obtener la ciudad de destino para la navegación inicial
  const getInitialCityDestination = useCallback(() => {
    console.log('🎯 getInitialCityDestination called:', {
      defaultChat: defaultChat,
      defaultChatCitySlug: defaultChat?.citySlug,
      lastVisitedCity: lastVisitedCity
    });

    // Prioridad 1: Ciudad predeterminada
    if (defaultChat?.citySlug) {
      console.log('✅ getInitialCityDestination - Using default city:', defaultChat.citySlug);
      return defaultChat.citySlug;
    }
    
    // Prioridad 2: Última ciudad visitada
    if (lastVisitedCity) {
      console.log('✅ getInitialCityDestination - Using last visited city:', lastVisitedCity);
      return lastVisitedCity;
    }
    
    // Prioridad 3: No hay ciudad específica
    console.log('❌ getInitialCityDestination - No city found');
    return null;
  }, [defaultChat, lastVisitedCity]);

  return {
    defaultChat,
    lastVisitedCity,
    recentCities,
    setDefaultCity,
    removeDefaultCity,
    updateLastVisitedCity,
    isDefaultCity,
    getInitialCityDestination,
    loading
  };
};

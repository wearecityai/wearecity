import { useState, useEffect } from 'react';
import { City } from '../types';
import { useAuth } from './useAuth';

// Versión temporal usando localStorage hasta que configuremos las funciones SQL
export const useCities = () => {
  const { user } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar ciudades desde localStorage
  const loadCities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedCities = localStorage.getItem('cities');
      if (storedCities) {
        setCities(JSON.parse(storedCities));
      }
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
      const storedCities = localStorage.getItem('cities');
      if (storedCities) {
        const cities: City[] = JSON.parse(storedCities);
        return cities.find(city => city.slug === slug) || null;
      }
      return null;
    } catch (error) {
      console.error('Error loading city by slug:', error);
      return null;
    }
  };

  // Cargar ciudad del usuario actual (si es admin)
  const loadUserCity = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const storedCities = localStorage.getItem('cities');
      if (storedCities) {
        const cities: City[] = JSON.parse(storedCities);
        const userCity = cities.find(city => city.admin_user_id === user.id);
        setCurrentCity(userCity || null);
      }
    } catch (error) {
      console.error('Error loading user city:', error);
      setError('Error al cargar la ciudad del usuario');
    } finally {
      setIsLoading(false);
    }
  };

  // Crear nueva ciudad
  const createCity = async (name: string, slug: string): Promise<City | null> => {
    if (!user) {
      setError('Usuario no autenticado');
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const storedCities = localStorage.getItem('cities');
      const cities: City[] = storedCities ? JSON.parse(storedCities) : [];

      // Verificar que el usuario no tenga ya una ciudad
      if (cities.some(city => city.admin_user_id === user.id)) {
        setError('Ya tienes una ciudad asignada');
        return null;
      }

      // Verificar que el slug no esté en uso
      if (cities.some(city => city.slug === slug)) {
        setError('El slug ya está en uso');
        return null;
      }

      // Crear nueva ciudad
      const newCity: City = {
        id: crypto.randomUUID(),
        name,
        slug,
        admin_user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedCities = [...cities, newCity];
      localStorage.setItem('cities', JSON.stringify(updatedCities));

      // Actualizar estado local
      setCities(updatedCities);
      setCurrentCity(newCity);

      return newCity;
    } catch (error) {
      console.error('Error creating city:', error);
      setError('Error al crear la ciudad');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar si el usuario es admin de una ciudad específica
  const isAdminOfCity = (cityId: string): boolean => {
    return currentCity?.id === cityId;
  };

  // Generar slug desde nombre
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
      .replace(/\s+/g, '-') // Espacios a guiones
      .replace(/-+/g, '-') // Múltiples guiones a uno
      .trim()
      .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio/final
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadCities();
    if (user) {
      loadUserCity();
    }
  }, [user]);

  return {
    cities,
    currentCity,
    isLoading,
    error,
    loadCities,
    loadCityBySlug,
    loadUserCity,
    createCity,
    isAdminOfCity,
    generateSlug,
    setError
  };
}; 
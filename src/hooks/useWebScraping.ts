
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ScrapedWebsite {
  id: string;
  name: string;
  base_url: string;
  description?: string;
  is_active: boolean;
  last_scraped_at?: string;
  scraping_frequency_hours: number;
  max_pages: number;
  allowed_domains: string[];
  created_at: string;
  updated_at: string;
}

interface CreateWebsiteData {
  name: string;
  base_url: string;
  description?: string;
  max_pages?: number;
  allowed_domains?: string[];
  scraping_frequency_hours?: number;
}

export const useWebScraping = () => {
  const [websites, setWebsites] = useState<ScrapedWebsite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadWebsites = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading websites for user:', user.id);
      const { data, error } = await supabase
        .from('scraped_websites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading websites:', error);
        throw error;
      }

      console.log('Loaded websites:', data);
      setWebsites(data || []);
    } catch (err) {
      console.error('Error loading websites:', err);
      setError('Error al cargar los sitios web');
    } finally {
      setIsLoading(false);
    }
  };

  const createWebsite = async (websiteData: CreateWebsiteData) => {
    if (!user) {
      setError('Usuario no autenticado');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating website with data:', websiteData);
      const { data, error } = await supabase
        .from('scraped_websites')
        .insert({
          user_id: user.id,
          name: websiteData.name,
          base_url: websiteData.base_url,
          description: websiteData.description,
          max_pages: websiteData.max_pages || 100,
          allowed_domains: websiteData.allowed_domains || [],
          scraping_frequency_hours: websiteData.scraping_frequency_hours || 24,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating website:', error);
        throw error;
      }

      console.log('Website created successfully:', data);
      setWebsites(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating website:', err);
      setError('Error al crear el sitio web');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateWebsite = async (id: string, updates: Partial<CreateWebsiteData>) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Updating website:', id, 'with updates:', updates);
      const { data, error } = await supabase
        .from('scraped_websites')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating website:', error);
        throw error;
      }

      console.log('Website updated successfully:', data);
      setWebsites(prev => prev.map(site => 
        site.id === id ? data : site
      ));

      return data;
    } catch (err) {
      console.error('Error updating website:', err);
      setError('Error al actualizar el sitio web');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWebsite = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Deleting website:', id);
      const { error } = await supabase
        .from('scraped_websites')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting website:', error);
        throw error;
      }

      console.log('Website deleted successfully');
      setWebsites(prev => prev.filter(site => site.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting website:', err);
      setError('Error al eliminar el sitio web');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const startScraping = async (websiteId: string) => {
    if (!user) {
      setError('Usuario no autenticado');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('=== STARTING SCRAPING PROCESS ===');
      console.log('Website ID:', websiteId);
      console.log('User ID:', user.id);
      console.log('Current time:', new Date().toISOString());

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session ? 'Valid' : 'Invalid');
      
      if (!session) {
        throw new Error('No hay sesión válida de usuario');
      }

      console.log('Calling intelligent-scraper edge function...');
      
      const functionCall = supabase.functions.invoke('intelligent-scraper', {
        body: {
          websiteId: websiteId,
          action: 'scrape'
        }
      });

      console.log('Function call initiated, waiting for response...');

      const { data, error } = await functionCall;

      console.log('=== EDGE FUNCTION RESPONSE ===');
      console.log('Data received:', data);
      console.log('Error received:', error);

      if (error) {
        console.error('Edge function error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          context: error.context
        });
        
        throw new Error(`Error del servidor: ${error.message || 'Error desconocido'}`);
      }

      if (!data) {
        console.error('No data received from edge function');
        throw new Error('No se recibió respuesta del servidor');
      }

      if (!data.success) {
        console.error('Edge function returned failure:', data);
        throw new Error(data.error || 'El scraping falló sin detalles específicos');
      }

      console.log('=== SCRAPING COMPLETED SUCCESSFULLY ===');
      console.log('Stats:', data.stats);

      // Reload websites to get updated last_scraped_at
      console.log('Reloading websites to refresh data...');
      await loadWebsites();

      return data;
    } catch (err) {
      console.error('=== SCRAPING FAILED ===');
      console.error('Full error object:', err);
      console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error inesperado al iniciar el scraping');
      }
      return null;
    } finally {
      console.log('=== SCRAPING PROCESS ENDED ===');
      setIsLoading(false);
    }
  };

  const searchContent = async (query: string, limit: number = 10) => {
    if (!user || !query.trim()) return [];

    try {
      console.log('Searching content with query:', query);
      const { data, error } = await supabase.rpc('search_scraped_content', {
        search_query: query.trim(),
        user_id_param: user.id,
        limit_param: limit
      });

      if (error) {
        console.error('Error searching content:', error);
        throw error;
      }

      console.log('Search results:', data);
      return data || [];
    } catch (err) {
      console.error('Error searching content:', err);
      return [];
    }
  };

  return {
    websites,
    isLoading,
    error,
    loadWebsites,
    createWebsite,
    updateWebsite,
    deleteWebsite,
    startScraping,
    searchContent
  };
};

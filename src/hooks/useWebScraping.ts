
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
          max_pages: websiteData.max_pages || 25, // Reduced default
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

      // Check if user is authenticated and get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session check:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        error: sessionError 
      });
      
      if (!session || sessionError) {
        console.error('No valid user session:', sessionError);
        throw new Error('No hay sesión válida de usuario');
      }

      console.log('Making request to intelligent-scraper edge function...');

      // The edge function now returns immediately with 202 status
      const { data, error } = await supabase.functions.invoke('intelligent-scraper', {
        body: {
          websiteId: websiteId,
          action: 'scrape'
        }
      });

      console.log('=== EDGE FUNCTION RESPONSE ===');
      console.log('Response data:', data);
      console.log('Response error:', error);

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Error del servidor');
      }

      if (!data) {
        console.error('No data received from edge function');
        throw new Error('No se recibió respuesta del servidor');
      }

      console.log('=== SCRAPING REQUEST SUCCESSFUL ===');
      
      // The scraping is now running in the background
      // We should show a success message and refresh the data periodically
      if (data.status === 'background_processing') {
        console.log('Scraping started in background:', data.message);
        
        // Start polling for updates every 30 seconds
        const pollForUpdates = async () => {
          setTimeout(async () => {
            console.log('Polling for website updates...');
            await loadWebsites();
          }, 30000);
        };
        
        pollForUpdates();
      }

      return data;
    } catch (err) {
      console.error('=== SCRAPING FAILED ===');
      console.error('Error details:', err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error inesperado al iniciar el scraping');
      }
      return null;
    } finally {
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

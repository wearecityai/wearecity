
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
      const { data, error } = await supabase
        .from('scraped_websites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

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

      if (error) throw error;

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
      const { data, error } = await supabase
        .from('scraped_websites')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

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
      const { error } = await supabase
        .from('scraped_websites')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting scraping for website:', websiteId);

      const { data, error } = await supabase.functions.invoke('intelligent-scraper', {
        body: {
          websiteId: websiteId,
          action: 'scrape'
        }
      });

      if (error) throw error;

      console.log('Scraping result:', data);

      // Reload websites to get updated last_scraped_at
      await loadWebsites();

      return data;
    } catch (err) {
      console.error('Error starting scraping:', err);
      setError('Error al iniciar el scraping');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const searchContent = async (query: string, limit: number = 10) => {
    if (!user || !query.trim()) return [];

    try {
      const { data, error } = await supabase.rpc('search_scraped_content', {
        search_query: query.trim(),
        user_id_param: user.id,
        limit_param: limit
      });

      if (error) throw error;

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

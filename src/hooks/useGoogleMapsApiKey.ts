import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/integrations/firebase/config';
import { useAuth } from '@/hooks/useAuthFirebase';

export const useGoogleMapsApiKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Only fetch API key if user is authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    const getApiKey = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔑 Fetching Google Maps API key from Firebase...');
        
        const getGoogleMapsApiKey = httpsCallable(functions, 'getGoogleMapsApiKey');
        const result = await getGoogleMapsApiKey({});
        
        const { apiKey: fetchedApiKey } = result.data as { apiKey: string };
        
        if (fetchedApiKey) {
          console.log('✅ Google Maps API key fetched successfully');
          setApiKey(fetchedApiKey);
        } else {
          throw new Error('No API key returned from Firebase');
        }
      } catch (err) {
        console.error('❌ Error fetching Google Maps API key:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch API key');
        
        // Fallback to environment variable or hardcoded key
        const fallbackKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || 'AIzaSyDksNTEkRDILZimpnX7vUc36u66SAAH5l0';
        console.log('🔄 Using fallback API key:', fallbackKey ? 'FOUND' : 'NOT FOUND');
        setApiKey(fallbackKey);
      } finally {
        setLoading(false);
      }
    };

    getApiKey();
  }, [user]);

  return { apiKey, loading, error };
};

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
// Supabase removed - hook functionality disabled

interface DefaultChat {
  conversationId: string;
  title: string;
  citySlug?: string;
}

export const useDefaultChat = () => {
  const { user } = useAuth();
  const [defaultChat, setDefaultChat] = useState<DefaultChat | null>(null);
  const [loading, setLoading] = useState(false); // No loading needed

  // Hook disabled - Supabase functionality removed
  useEffect(() => {
    setLoading(false);
  }, [user]);

  // All functions now return empty/null results
  const setDefaultChatHandler = async (conversationId: string, title: string, citySlug?: string) => {
    console.log('useDefaultChat: Function disabled (Supabase removed)');
  };

  const removeDefaultChat = async () => {
    console.log('useDefaultChat: Function disabled (Supabase removed)');
  };

  const isDefaultChat = (citySlug: string) => {
    return false; // Always return false
  };

  return {
    defaultChat: null,
    setDefaultChat: setDefaultChatHandler,
    removeDefaultChat,
    isDefaultChat,
    loading: false
  };
};
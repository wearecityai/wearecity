import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DefaultChat {
  conversationId: string;
  title: string;
  citySlug?: string;
}

export const useDefaultChat = () => {
  const { user } = useAuth();
  const [defaultChat, setDefaultChat] = useState<DefaultChat | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar chat predeterminado de Supabase
  useEffect(() => {
    const loadDefaultChat = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('default_chat_data')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading default chat:', error);
        } else if (data?.default_chat_data) {
          setDefaultChat(data.default_chat_data);
        }
      } catch (error) {
        console.error('Error loading default chat:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDefaultChat();
  }, [user]);

  // Establecer chat como predeterminado
  const setDefaultChatHandler = async (conversationId: string, title: string, citySlug?: string) => {
    if (!user) return;

    // Si no se proporciona citySlug, intentar obtenerlo de la URL actual
    const currentCitySlug = citySlug || (window.location.pathname.startsWith('/city/') 
      ? window.location.pathname.split('/city/')[1] 
      : undefined);
    
    const chatData: DefaultChat = {
      conversationId,
      title,
      citySlug: currentCitySlug
    };
    
    console.log('Setting default chat data:', chatData)
    setDefaultChat(chatData);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ default_chat_data: chatData })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving default chat:', error);
      } else {
        console.log('Default chat saved successfully')
      }
    } catch (error) {
      console.error('Error saving default chat:', error);
    }
  };

  // Quitar chat predeterminado
  const removeDefaultChat = async () => {
    if (!user) return;

    console.log('Removing default chat')
    setDefaultChat(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ default_chat_data: null })
        .eq('id', user.id);

      if (error) {
        console.error('Error removing default chat:', error);
      } else {
        console.log('Default chat removed successfully')
      }
    } catch (error) {
      console.error('Error removing default chat:', error);
    }
  };

  // Verificar si un chat es el predeterminado
  const isDefaultChat = (citySlug: string) => {
    return defaultChat?.citySlug === citySlug || defaultChat?.conversationId === citySlug;
  };

  return {
    defaultChat,
    setDefaultChat: setDefaultChatHandler,
    removeDefaultChat,
    isDefaultChat,
    loading
  };
};
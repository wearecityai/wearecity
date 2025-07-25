import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface DefaultChat {
  conversationId: string;
  title: string;
  citySlug?: string;
}

export const useDefaultChat = () => {
  const { user } = useAuth();
  const [defaultChat, setDefaultChat] = useState<DefaultChat | null>(null);

  // Cargar chat predeterminado del localStorage
  useEffect(() => {
    const loadDefaultChat = () => {
      try {
        const storageKey = user ? `defaultChat_${user.id}` : 'defaultChat_guest';
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsedChat = JSON.parse(stored);
          setDefaultChat(parsedChat);
        }
      } catch (error) {
        console.error('Error loading default chat:', error);
      }
    };

    loadDefaultChat();
  }, [user]);

  // Establecer chat como predeterminado
  const setDefaultChatHandler = (conversationId: string, title: string, citySlug?: string) => {
    // Si no se proporciona citySlug, intentar obtenerlo de la URL actual
    const currentCitySlug = citySlug || (window.location.pathname.startsWith('/city/') 
      ? window.location.pathname.split('/city/')[1] 
      : undefined);
    
    const chatData: DefaultChat = {
      conversationId,
      title,
      citySlug: currentCitySlug
    };
    
    setDefaultChat(chatData);
    
    const storageKey = user ? `defaultChat_${user.id}` : 'defaultChat_guest';
    localStorage.setItem(storageKey, JSON.stringify(chatData));
  };

  // Quitar chat predeterminado
  const removeDefaultChat = () => {
    setDefaultChat(null);
    
    const storageKey = user ? `defaultChat_${user.id}` : 'defaultChat_guest';
    localStorage.removeItem(storageKey);
  };

  // Verificar si un chat es el predeterminado
  const isDefaultChat = (conversationId: string) => {
    return defaultChat?.conversationId === conversationId;
  };

  return {
    defaultChat,
    setDefaultChat: setDefaultChatHandler,
    removeDefaultChat,
    isDefaultChat
  };
};
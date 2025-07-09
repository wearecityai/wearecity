import { useState, useEffect } from 'react';
import { PublicChat } from '../types';
import { useAuth } from './useAuth';

// Versión temporal usando localStorage hasta que configuremos las funciones SQL
export const usePublicChats = () => {
  const { user } = useAuth();
  const [userChats, setUserChats] = useState<PublicChat[]>([]);
  const [currentChat, setCurrentChat] = useState<PublicChat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar chats del usuario
  const loadUserChats = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const storedChats = localStorage.getItem(`chats_${user.id}`);
      if (storedChats) {
        setUserChats(JSON.parse(storedChats));
      }
    } catch (error) {
      console.error('Error loading user chats:', error);
      setError('Error al cargar los chats');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar chat por slug
  const loadChatBySlug = async (slug: string): Promise<PublicChat | null> => {
    try {
      // Buscar en todos los chats almacenados
      const allChats: PublicChat[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('chats_')) {
          const chats = JSON.parse(localStorage.getItem(key) || '[]');
          allChats.push(...chats);
        }
      }
      
      return allChats.find(chat => chat.chat_slug === slug) || null;
    } catch (error) {
      console.error('Error loading chat by slug:', error);
      return null;
    }
  };

  // Crear nuevo chat público
  const createPublicChat = async (
    configName: string,
    assistantName: string,
    systemInstruction: string,
    isPublic: boolean = false
  ): Promise<PublicChat | null> => {
    if (!user) {
      setError('Usuario no autenticado');
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const storedChats = localStorage.getItem(`chats_${user.id}`);
      const chats: PublicChat[] = storedChats ? JSON.parse(storedChats) : [];

      // Generar slug único
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const newSlug = `chat_${timestamp}_${random.toString().padStart(3, '0')}`;

      // Crear nuevo chat
      const newChat: PublicChat = {
        id: crypto.randomUUID(),
        config_name: configName,
        assistant_name: assistantName,
        system_instruction: systemInstruction,
        chat_slug: newSlug,
        is_public: isPublic,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedChats = [...chats, newChat];
      localStorage.setItem(`chats_${user.id}`, JSON.stringify(updatedChats));

      // Actualizar estado local
      setUserChats(updatedChats);
      setCurrentChat(newChat);

      return newChat;
    } catch (error) {
      console.error('Error creating public chat:', error);
      setError('Error al crear el chat');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar slug del chat
  const updateChatSlug = async (
    chatId: string,
    newSlug: string,
    isPublic: boolean
  ): Promise<boolean> => {
    if (!user) {
      setError('Usuario no autenticado');
      return false;
    }

    setIsLoading(true);
    setError(null);
    try {
      const storedChats = localStorage.getItem(`chats_${user.id}`);
      const chats: PublicChat[] = storedChats ? JSON.parse(storedChats) : [];

      // Verificar que el slug no esté en uso
      const slugExists = chats.some(chat => chat.chat_slug === newSlug && chat.id !== chatId);
      if (slugExists) {
        setError('El slug ya está en uso');
        return false;
      }

      // Actualizar chat
      const updatedChats = chats.map(chat => 
        chat.id === chatId 
          ? { ...chat, chat_slug: newSlug, is_public: isPublic, updated_at: new Date().toISOString() }
          : chat
      );

      localStorage.setItem(`chats_${user.id}`, JSON.stringify(updatedChats));

      // Actualizar estado local
      setUserChats(updatedChats);
      const updatedChat = updatedChats.find(chat => chat.id === chatId);
      if (updatedChat) {
        setCurrentChat(updatedChat);
      }

      return true;
    } catch (error) {
      console.error('Error updating chat slug:', error);
      setError('Error al actualizar el slug');
      return false;
    } finally {
      setIsLoading(false);
    }
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

  // Verificar si un slug está disponible
  const isSlugAvailable = async (slug: string): Promise<boolean> => {
    try {
      // Buscar en todos los chats almacenados
      const allChats: PublicChat[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('chats_')) {
          const chats = JSON.parse(localStorage.getItem(key) || '[]');
          allChats.push(...chats);
        }
      }
      
      return !allChats.some(chat => chat.chat_slug === slug);
    } catch (error) {
      console.error('Error checking slug availability:', error);
      return false;
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      loadUserChats();
    }
  }, [user]);

  return {
    userChats,
    currentChat,
    isLoading,
    error,
    loadUserChats,
    loadChatBySlug,
    createPublicChat,
    updateChatSlug,
    generateSlug,
    isSlugAvailable,
    setError
  };
}; 
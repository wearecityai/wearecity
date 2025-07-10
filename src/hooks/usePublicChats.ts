import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AdminChat {
  id: string;
  chat_name: string;
  chat_slug: string;
  is_public: boolean;
  admin_user_id: string;
  assistant_name?: string;
  config_name?: string;
  system_instruction?: string;
  created_at: string;
  updated_at: string;
}

interface AdminFinetuningConfig {
  id: string;
  config_name: string;
  assistant_name: string;
  system_instruction: string;
  recommended_prompts: any[];
  service_tags: any[];
  enable_google_search: boolean;
  allow_map_display: boolean;
  allow_geolocation: boolean;
  current_language_code: string;
  procedure_source_urls: any[];
  uploaded_procedure_documents: any;
  sede_electronica_url: string;
  restricted_city: any;
}

export const useAdminChats = () => {
  const { user, profile } = useAuth();
  const [userChats, setUserChats] = useState<AdminChat[]>([]);
  const [currentChat, setCurrentChat] = useState<AdminChat | null>(null);
  const [currentConfig, setCurrentConfig] = useState<AdminFinetuningConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar chats del usuario admin
  const loadUserChats = async () => {
    if (!user || profile?.role !== 'administrativo') return;

    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .rpc('get_admin_chats');

      if (error) {
        console.error('Error loading user chats:', error);
        setError('Error al cargar los chats');
        return;
      }

      setUserChats((data || []) as AdminChat[]);
    } catch (error) {
      console.error('Error loading user chats:', error);
      setError('Error al cargar los chats');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar chat por slug (público o del admin)
  const loadChatBySlug = async (slug: string): Promise<AdminChat | null> => {
    try {
      const { data, error } = await supabase
        .rpc('get_admin_chat_by_slug', { chat_slug_param: slug });

      if (error) {
        console.error('Error loading chat by slug:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error loading chat by slug:', error);
      return null;
    }
  };

  // Cargar configuración de finetuning para un chat
  const loadChatConfig = async (chatId: string): Promise<AdminFinetuningConfig | null> => {
    if (!user || profile?.role !== 'administrativo') return null;

    try {
      const { data, error } = await supabase
        .rpc('get_admin_finetuning_config', { chat_id_param: chatId });

      if (error) {
        console.error('Error loading chat config:', error);
        return null;
      }

      const result = data && data.length > 0 ? data[0] : null;
      if (result) {
        const configResult: AdminFinetuningConfig = {
          ...result,
          recommended_prompts: Array.isArray(result.recommended_prompts) ? result.recommended_prompts : [],
          service_tags: Array.isArray(result.service_tags) ? result.service_tags : [],
          procedure_source_urls: Array.isArray(result.procedure_source_urls) ? result.procedure_source_urls : [],
        };
        setCurrentConfig(configResult);
        return configResult;
      }
      return null;
    } catch (error) {
      console.error('Error loading chat config:', error);
      return null;
    }
  };

  // Crear nuevo chat
  const createChat = async (chatName: string = 'Mi Chat', isPublic: boolean = false): Promise<AdminChat | null> => {
    if (!user || profile?.role !== 'administrativo') {
      setError('Solo los administradores pueden crear chats');
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .rpc('create_admin_chat', { 
          chat_name_param: chatName,
          is_public_param: isPublic 
        });

      if (error) {
        console.error('Error creating chat:', error);
        setError('Error al crear el chat');
        return null;
      }

      const newChatData = data && data.length > 0 ? data[0] : null;
      if (newChatData) {
        const newChat: AdminChat = {
          ...newChatData,
          admin_user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setCurrentChat(newChat);
        await loadUserChats();
        return newChat;
      }

      return null;
    } catch (error) {
      console.error('Error creating chat:', error);
      setError('Error al crear el chat');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar configuración de finetuning
  const updateChatConfig = async (chatId: string, configData: Partial<AdminFinetuningConfig>): Promise<boolean> => {
    if (!user || profile?.role !== 'administrativo') {
      setError('Solo los administradores pueden actualizar configuraciones');
      return false;
    }

    try {
      const { data, error } = await supabase
        .rpc('update_admin_finetuning_config', {
          chat_id_param: chatId,
          config_data: configData
        });

      if (error) {
        console.error('Error updating chat config:', error);
        setError('Error al actualizar la configuración');
        return false;
      }

      const updatedConfig = await loadChatConfig(chatId);
      if (updatedConfig) {
        setCurrentConfig(updatedConfig);
      }

      return data;
    } catch (error) {
      console.error('Error updating chat config:', error);
      setError('Error al actualizar la configuración');
      return false;
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (user && profile?.role === 'administrativo') {
      loadUserChats();
    }
  }, [user, profile]);

  return {
    userChats,
    currentChat,
    currentConfig,
    isLoading,
    error,
    loadUserChats,
    loadChatBySlug,
    loadChatConfig,
    createChat,
    updateChatConfig,
    setCurrentChat,
    setCurrentConfig,
    setError
  };
};

// Mantener compatibilidad con el hook anterior
export const usePublicChats = () => {
  const adminChats = useAdminChats();
  return {
    ...adminChats,
    userChats: adminChats.userChats,
    currentChat: adminChats.currentChat,
    createPublicChat: adminChats.createChat,
    loadChatBySlug: adminChats.loadChatBySlug,
    updateChatSlug: async () => true,
    generateSlug: (name: string) => name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    isSlugAvailable: async () => true
  };
};
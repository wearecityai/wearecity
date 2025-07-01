
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar conversaciones del usuario
  const loadConversations = async () => {
    if (!user) {
      console.log('No user found, clearing conversations');
      setConversations([]);
      return;
    }
    
    console.log('Loading conversations for user:', user.id);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      console.log('Loaded conversations:', data);
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Crear nueva conversación
  const createConversation = async (title: string = 'Consulta general') => {
    if (!user) {
      console.log('No user found, cannot create conversation');
      return null;
    }

    console.log('Creating conversation for user:', user.id, 'with title:', title);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{
          user_id: user.id,
          title,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }
      
      console.log('Created conversation:', data);
      setConversations(prev => [data, ...prev]);
      setCurrentConversationId(data.id);
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  // Actualizar título de conversación
  const updateConversationTitle = async (conversationId: string, title: string) => {
    if (!user) return;

    console.log('Updating conversation title:', conversationId, title);
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating conversation title:', error);
        return;
      }

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, title, updated_at: new Date().toISOString() }
            : conv
        )
      );
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };

  // Eliminar conversación
  const deleteConversation = async (conversationId: string) => {
    if (!user) return;

    console.log('Deleting conversation:', conversationId);
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting conversation:', error);
        return;
      }

      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversationId(null);
    }
  }, [user]);

  return {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    isLoading,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    loadConversations
  };
};

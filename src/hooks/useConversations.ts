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
      // Cargar conversaciones de localStorage
      const local = localStorage.getItem('chat_conversations');
      let localConvs: Conversation[] = [];
      if (local) {
        try {
          localConvs = JSON.parse(local);
        } catch {}
      }
      setConversations(localConvs);
      // Seleccionar la última conversación activa si existe
      const lastId = localStorage.getItem('chat_current_conversation_id');
      setCurrentConversationId(lastId || (localConvs[0]?.id ?? null));
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
      // Crear conversación local
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newConv: Conversation = { id, title, created_at: now, updated_at: now };
      setConversations(prev => {
        const updated = [newConv, ...prev];
        localStorage.setItem('chat_conversations', JSON.stringify(updated));
        localStorage.setItem('chat_current_conversation_id', id);
        return updated;
      });
      setCurrentConversationId(id);
      return newConv;
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
      // Update local state immediately
      setConversations(prev => [data, ...prev]);
      // Set as current conversation immediately
      setCurrentConversationId(data.id);
      console.log('Conversation added to state and set as current:', data.id);
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  // Actualizar título de conversación
  const updateConversationTitle = async (conversationId: string, title: string) => {
    if (!user) {
      setConversations(prev => {
        const updated = prev.map(conv => conv.id === conversationId ? { ...conv, title, updated_at: new Date().toISOString() } : conv);
        localStorage.setItem('chat_conversations', JSON.stringify(updated));
        return updated;
      });
      return;
    }

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

      // Update local state immediately
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, title, updated_at: new Date().toISOString() }
            : conv
        )
      );
      console.log('Conversation title updated in state:', conversationId, title);
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };

  // Eliminar conversación
  const deleteConversation = async (conversationId: string) => {
    if (!user) {
      setConversations(prev => {
        const updated = prev.filter(conv => conv.id !== conversationId);
        localStorage.setItem('chat_conversations', JSON.stringify(updated));
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null);
          localStorage.removeItem('chat_current_conversation_id');
        }
        return updated;
      });
      return;
    }

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
      loadConversations();
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

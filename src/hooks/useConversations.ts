import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';
import { useAuth } from './useAuth';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  city_slug?: string; // Añadir campo para identificar la ciudad
}

export const useConversations = (citySlug?: string) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar conversaciones del usuario para una ciudad específica
  const loadConversations = async () => {
    if (!user) {
      // Cargar conversaciones de localStorage filtradas por ciudad
      const local = localStorage.getItem(`chat_conversations_${citySlug || 'general'}`);
      let localConvs: Conversation[] = [];
      if (local) {
        try {
          localConvs = JSON.parse(local);
        } catch {}
      }
      setConversations(localConvs);
      // Seleccionar la última conversación activa si existe
      const lastId = localStorage.getItem(`chat_current_conversation_id_${citySlug || 'general'}`);
      setCurrentConversationId(lastId || (localConvs[0]?.id ?? null));
      return;
    }
    
    console.log('Loading conversations for user:', user.id, 'in city:', citySlug);
    setIsLoading(true);
    try {
      const conversationsRef = collection(db, 'conversations');
      let q = query(conversationsRef, where('user_id', '==', user.id));
      
      const querySnapshot = await getDocs(q);
      const allConversations: Conversation[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        allConversations.push({
          id: doc.id,
          title: data.title,
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          city_slug: data.city_slug
        });
      });

      // Filtrar por ciudad después de obtener los datos
      let filteredData = allConversations;
      if (citySlug) {
        filteredData = filteredData.filter(conv => conv.city_slug === citySlug);
      } else {
        filteredData = filteredData.filter(conv => !conv.city_slug);
      }
      
      // Ordenar por fecha de creación descendente
      filteredData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setConversations(filteredData);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Crear nueva conversación para una ciudad específica
  const createConversation = async (title: string = 'Consulta general') => {
    if (!user) {
      // Crear conversación local
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newConv: Conversation = { 
        id, 
        title, 
        created_at: now, 
        updated_at: now,
        city_slug: citySlug 
      };
      setConversations(prev => {
        const updated = [newConv, ...prev];
        const storageKey = `chat_conversations_${citySlug || 'general'}`;
        localStorage.setItem(storageKey, JSON.stringify(updated));
        localStorage.setItem(`chat_current_conversation_id_${citySlug || 'general'}`, id);
        return updated;
      });
      setCurrentConversationId(id);
      return newConv;
    }

    console.log('Creating conversation for user:', user.id, 'in city:', citySlug, 'with title:', title);
    try {
      const conversationData: any = {
        user_id: user.id,
        title,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      };
      
      // Añadir city_slug si se especifica
      if (citySlug) {
        conversationData.city_slug = citySlug;
      }
      
      const conversationsRef = collection(db, 'conversations');
      const docRef = await addDoc(conversationsRef, conversationData);
      
      const newConversation: Conversation = {
        id: docRef.id,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        city_slug: citySlug
      };
      
      // Update local state immediately
      setConversations(prev => [newConversation, ...prev]);
      // Set as current conversation immediately
      setCurrentConversationId(docRef.id);
      return newConversation;
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
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        title,
        updated_at: Timestamp.now()
      });

      // Update local state immediately
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
      const conversationRef = doc(db, 'conversations', conversationId);
      await deleteDoc(conversationRef);

      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user, citySlug]);

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

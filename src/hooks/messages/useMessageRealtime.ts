import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '../../types';
import { convertDbMessageToChatMessage } from './messageConverters';

export const useMessageRealtime = (
  conversationId: string | null,
  user: any,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) => {
  useEffect(() => {
    if (!conversationId || !user) {
      return;
    }

    console.log('Setting up realtime subscription for conversation:', conversationId);

    // Set up realtime subscription for messages in this conversation
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Realtime message change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new;
            const chatMessage = convertDbMessageToChatMessage(newMessage);
            
            setMessages(prev => {
              // Avoid duplicates - check if message already exists
              if (prev.find(m => m.id === chatMessage.id)) return prev;
              return [...prev, chatMessage];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new;
            const chatMessage = convertDbMessageToChatMessage(updatedMessage);
            
            setMessages(prev => 
              prev.map(msg => 
                msg.id === chatMessage.id ? chatMessage : msg
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setMessages(prev => prev.filter(msg => msg.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from messages realtime for conversation:', conversationId);
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, setMessages]);
};
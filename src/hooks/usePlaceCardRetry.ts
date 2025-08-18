import { useCallback } from 'react';
import { useGoogleMaps } from './useGoogleMaps';
import { ChatMessage, PlaceCardInfo } from '../types';

export const usePlaceCardRetry = () => {
  const { fetchPlaceDetailsAndUpdateMessage } = useGoogleMaps(undefined, undefined, undefined);

  const retryPlaceCard = useCallback((
    messageId: string,
    placeCard: PlaceCardInfo,
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  ) => {
    console.log('🔄 Retrying place card:', placeCard.name);
    
    // Marcar como cargando nuevamente
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId && msg.placeCards) {
          return {
            ...msg,
            placeCards: msg.placeCards.map(card =>
              card.id === placeCard.id 
                ? { ...card, isLoadingDetails: true, errorDetails: undefined }
                : card
            ),
          };
        }
        return msg;
      })
    );

    // Reintentar cargar los detalles
    fetchPlaceDetailsAndUpdateMessage(
      messageId, 
      placeCard.id, 
      placeCard.placeId, 
      placeCard.searchQuery, 
      setMessages
    );
  }, [fetchPlaceDetailsAndUpdateMessage]);

  return { retryPlaceCard };
};


import { PlaceCardInfo } from '../../types';
import {
  PLACE_CARD_START_MARKER,
  PLACE_CARD_END_MARKER,
} from '../../constants';

export const usePlaceCardParser = () => {
  const parsePlaceCards = (content: string) => {
    const placeCardsForMessage: PlaceCardInfo[] = [];

    // Parse place cards
    const tempContentForProcessing = content;
    const placeCardRegex = new RegExp(`${PLACE_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${PLACE_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    let match;
    while ((match = placeCardRegex.exec(tempContentForProcessing)) !== null) {
      let jsonStrToParse = match[1].replace(/\[CITE:\s*\d+\][%]?$/, "").trim();
      try {
        const placeData = JSON.parse(jsonStrToParse);
        if (placeData.name && (placeData.placeId || placeData.searchQuery)) {
          placeCardsForMessage.push({ 
            id: crypto.randomUUID(), 
            name: placeData.name, 
            placeId: placeData.placeId, 
            searchQuery: placeData.searchQuery, 
            isLoadingDetails: true 
          });
        }
      } catch (e) { 
        console.error("Failed to parse place card JSON:", jsonStrToParse, e); 
      }
    }

    return { placeCardsForMessage };
  };

  return { parsePlaceCards };
};

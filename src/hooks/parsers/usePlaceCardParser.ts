
import { PlaceCardInfo } from '../../types';

interface SystemMarkers {
  PLACE_CARD_START_MARKER: string;
  PLACE_CARD_END_MARKER: string;
}

export const usePlaceCardParser = (markers?: SystemMarkers) => {
  const parsePlaceCards = (content: string) => {
    const placeCardsForMessage: PlaceCardInfo[] = [];

    // Use markers from parameters or fallback values
    const PLACE_START = markers?.PLACE_CARD_START_MARKER || '[PLACE_CARD_START]';
    const PLACE_END = markers?.PLACE_CARD_END_MARKER || '[PLACE_CARD_END]';

    // Parse place cards
    const tempContentForProcessing = content;
    const placeCardRegex = new RegExp(`${PLACE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${PLACE_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
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

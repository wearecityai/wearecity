import { PlaceCardInfo } from '../../types';
import {
  PLACE_CARD_START_MARKER,
  PLACE_CARD_END_MARKER,
} from '../../constants';

export const usePlaceCardParser = () => {
  const parsePlaceCards = (content: string) => {
    const placeCardsForMessage: PlaceCardInfo[] = [];

    console.log('🔍 Parsing place cards from content:', content);
    console.log('🔍 Content length:', content.length);
    console.log('🔍 Looking for markers:', PLACE_CARD_START_MARKER, PLACE_CARD_END_MARKER);

    // Parse place cards con marcadores completos
    const tempContentForProcessing = content;
    const placeCardRegex = new RegExp(`${PLACE_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${PLACE_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    
    console.log('🔍 Place card regex:', placeCardRegex);
    
    let match;
    let matchCount = 0;
    while ((match = placeCardRegex.exec(tempContentForProcessing)) !== null) {
      matchCount++;
      console.log(`🔍 Match ${matchCount} found:`, match[0]);
      console.log(`🔍 JSON content:`, match[1]);
      
      let jsonStrToParse = match[1].replace(/\[CITE:\s*\d+\][%]?$/, "").trim();
      console.log('🔍 Cleaned JSON string:', jsonStrToParse);
      
      try {
        const placeData = JSON.parse(jsonStrToParse);
        console.log('🔍 Parsed place data:', placeData);
        
        if (placeData.name && (placeData.placeId || placeData.searchQuery)) {
          const placeCard = { 
            id: crypto.randomUUID(), 
            name: placeData.name, 
            placeId: placeData.placeId, 
            searchQuery: placeData.searchQuery, 
            isLoadingDetails: true 
          };
          placeCardsForMessage.push(placeCard);
          console.log('✅ Found complete place card:', placeCard);
        } else {
          console.warn('⚠️ Place data missing required fields:', placeData);
        }
      } catch (e) { 
        console.error("Failed to parse place card JSON:", jsonStrToParse, e); 
      }
    }

    // Check if abbreviated markers are present (for debugging)
    if (content.includes('[PLT]') || content.includes('[PL]')) {
      console.warn('⚠️ WARNING: Found abbreviated markers [PLT] or [PL] in content. AI should use [PLACE_CARD_START] and [PLACE_CARD_END]');
    }

    console.log('🎯 Total place cards found:', placeCardsForMessage.length);
    return { placeCardsForMessage };
  };

  return { parsePlaceCards };
};

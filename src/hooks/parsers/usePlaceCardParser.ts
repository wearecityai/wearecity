import { PlaceCardInfo } from '../../types';
import {
  PLACE_CARD_START_MARKER,
  PLACE_CARD_END_MARKER,
} from '../../constants';
import { validateCityInSearchQuery } from '../../constants/cities';

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
          // VALIDACIÓN CRÍTICA: Verificar que el searchQuery contenga la ciudad restringida
          if (placeData.searchQuery) {
            // Verificar que el searchQuery contenga al menos una ciudad española válida
            if (!validateCityInSearchQuery(placeData.searchQuery)) {
              console.warn('⚠️ Place card searchQuery validation failed:', placeData.searchQuery);
              
              // INTELIGENCIA ADICIONAL: Verificar si el nombre del lugar contiene indicadores de ciudad
              const placeNameLower = placeData.name.toLowerCase();
              const hasCityIndicators = placeNameLower.includes('valencia') || 
                                      placeNameLower.includes('alicante') || 
                                      placeNameLower.includes('villajoyosa') ||
                                      placeNameLower.includes('la vila') ||
                                      placeNameLower.includes('benidorm') ||
                                      placeNameLower.includes('torrevieja');
              
              if (hasCityIndicators) {
                console.log('✅ Place card accepted by name validation:', placeData.name);
              } else {
                console.warn('❌ Place card rejected: no valid city found in searchQuery or name');
                continue; // Saltar esta place card
              }
            }
            
            console.log('✅ Place card city validation passed:', placeData.searchQuery);
          }
          
          const placeCard: PlaceCardInfo = { 
            id: crypto.randomUUID(), 
            name: placeData.name, 
            placeId: placeData.placeId, 
            searchQuery: placeData.searchQuery, 
            photoUrl: placeData.photoUrl,
            photoAttributions: placeData.photoAttributions,
            rating: placeData.rating,
            userRatingsTotal: placeData.userRatingsTotal,
            address: placeData.address,
            distance: placeData.distance,
            mapsUrl: placeData.mapsUrl,
            website: placeData.website,
            description: placeData.description,
            priceLevel: placeData.priceLevel,
            types: placeData.types,
            openingHours: placeData.openingHours,
            phoneNumber: placeData.phoneNumber,
            isLoadingDetails: !placeData.photoUrl && !placeData.rating && !placeData.address // Solo cargar si no hay datos básicos
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

import { ChatMessage, GroundingMetadata } from '../types';
import { useEventParser } from './parsers/useEventParser';
import { usePlaceCardParser } from './parsers/usePlaceCardParser';
import { useContentParser } from './parsers/useContentParser';
import { useSystemMarkers } from './useSystemMarkers';
import { API_KEY_ERROR_MESSAGE } from '../constants';

export const useMessageParser = () => {
  const { markers, isLoaded } = useSystemMarkers();
  
  const { parseEvents, handleSeeMoreEvents: eventHandleSeeMoreEvents, clearEventTracking } = useEventParser({
    EVENT_CARD_START_MARKER: markers.EVENT_CARD_START_MARKER,
    EVENT_CARD_END_MARKER: markers.EVENT_CARD_END_MARKER,
    MAX_INITIAL_EVENTS: markers.MAX_INITIAL_EVENTS,
  });
  
  const { parsePlaceCards } = usePlaceCardParser({
    PLACE_CARD_START_MARKER: markers.PLACE_CARD_START_MARKER,
    PLACE_CARD_END_MARKER: markers.PLACE_CARD_END_MARKER,
  });
  
  const { parseContent } = useContentParser({
    SHOW_MAP_MARKER_START: markers.SHOW_MAP_MARKER_START,
    SHOW_MAP_MARKER_END: markers.SHOW_MAP_MARKER_END,
    TECA_LINK_BUTTON_START_MARKER: markers.TECA_LINK_BUTTON_START_MARKER,
    TECA_LINK_BUTTON_END_MARKER: markers.TECA_LINK_BUTTON_END_MARKER,
  });

  const parseAIResponse = (content: string, finalResponse: any, chatConfig: any, inputText: string) => {
    // Don't parse if markers aren't loaded yet
    if (!isLoaded) {
      return {
        processedContent: content,
        finalGroundingMetadata: undefined,
        mapQueryFromAI: undefined,
        eventsForThisMessage: [],
        placeCardsForMessage: [],
        downloadablePdfInfoForMessage: undefined,
        telematicLinkForMessage: undefined,
        showSeeMoreButtonForThisMessage: false,
        storedUserQueryForEvents: undefined
      };
    }

    let processedContent = content;

    // Parse grounding metadata
    let finalGroundingMetadata: GroundingMetadata | undefined = undefined;
    if (finalResponse?.candidates?.[0]?.groundingMetadata) {
      finalGroundingMetadata = { 
        groundingChunks: finalResponse.candidates[0].groundingMetadata.groundingChunks?.map(c => ({ 
          web: c.web ? { uri: c.web.uri || '', title: c.web.title || '' } : undefined 
        })) 
      };
    }

    // Parse events and remove event markers from content
    const { eventsForThisMessage, showSeeMoreButtonForThisMessage, storedUserQueryForEvents } = parseEvents(content, inputText);
    const eventRegex = new RegExp(`${markers.EVENT_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${markers.EVENT_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    processedContent = processedContent.replace(eventRegex, "").trim();

    // Parse place cards and remove place card markers from content
    const { placeCardsForMessage } = parsePlaceCards(processedContent);
    const placeCardRegex = new RegExp(`${markers.PLACE_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${markers.PLACE_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    processedContent = processedContent.replace(placeCardRegex, "").trim();

    // Parse content (maps, PDFs, TECA links)
    const { 
      processedContent: finalProcessedContent, 
      mapQueryFromAI, 
      downloadablePdfInfoForMessage, 
      telematicLinkForMessage 
    } = parseContent(processedContent, chatConfig);

    return {
      processedContent: finalProcessedContent,
      finalGroundingMetadata,
      mapQueryFromAI,
      eventsForThisMessage,
      placeCardsForMessage,
      downloadablePdfInfoForMessage,
      telematicLinkForMessage,
      showSeeMoreButtonForThisMessage,
      storedUserQueryForEvents
    };
  };

  const handleSeeMoreEvents = (originalUserQuery?: string, onSendMessage?: (message: string) => void) => {
    eventHandleSeeMoreEvents(originalUserQuery, onSendMessage);
  };

  return {
    parseAIResponse,
    handleSeeMoreEvents,
    clearEventTracking,
    isLoaded  // Export isLoaded so components can wait for markers
  };
};

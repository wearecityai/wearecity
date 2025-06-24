import { ChatMessage, GroundingMetadata } from '../types';
import {
  EVENT_CARD_START_MARKER,
  EVENT_CARD_END_MARKER,
  PLACE_CARD_START_MARKER,
  PLACE_CARD_END_MARKER,
} from '../constants';
import { useEventParser } from './parsers/useEventParser';
import { usePlaceCardParser } from './parsers/usePlaceCardParser';
import { useContentParser } from './parsers/useContentParser';
import { API_KEY_ERROR_MESSAGE } from '../constants';

export const useMessageParser = () => {
  const { parseEvents, handleSeeMoreEvents: eventHandleSeeMoreEvents, clearEventTracking } = useEventParser();
  const { parsePlaceCards } = usePlaceCardParser();
  const { parseContent } = useContentParser();

  const parseAIResponse = (content: string, finalResponse: any, chatConfig: any, inputText: string) => {
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
    const eventRegex = new RegExp(`${EVENT_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${EVENT_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    processedContent = processedContent.replace(eventRegex, "").trim();

    // Parse place cards and remove place card markers from content
    const { placeCardsForMessage } = parsePlaceCards(processedContent);
    const placeCardRegex = new RegExp(`${PLACE_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${PLACE_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
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
    clearEventTracking
  };
};

import { ChatMessage, GroundingMetadata } from '../types';
import {
  EVENT_CARD_START_MARKER,
  EVENT_CARD_END_MARKER,
  PLACE_CARD_START_MARKER,
  PLACE_CARD_END_MARKER,
  FORM_BUTTON_START_MARKER,
  FORM_BUTTON_END_MARKER,
} from '../constants';
import { useEventParser } from './parsers/useEventParser';
import { usePlaceCardParser } from './parsers/usePlaceCardParser';
import { useContentParser } from './parsers/useContentParser';
import { useFormButtonParser } from './parsers/useFormButtonParser';
import { API_KEY_ERROR_MESSAGE } from '../constants';

export const useMessageParser = () => {
  const { parseEvents, handleSeeMoreEvents: eventHandleSeeMoreEvents, clearEventTracking } = useEventParser();
  const { parsePlaceCards } = usePlaceCardParser();
  const { parseContent } = useContentParser();
  const { parseFormButtons } = useFormButtonParser();

  const parseAIResponse = (content: string, finalResponse: any, chatConfig: any, inputText: string) => {
    if (typeof content !== "string") {
      content = content ? String(content) : "";
    }
    let processedContent = content;

    console.log("🔍 DEBUG - Original content received:", content);

    // Parse grounding metadata
    let finalGroundingMetadata: GroundingMetadata | undefined = undefined;
    if (finalResponse?.candidates?.[0]?.groundingMetadata) {
      finalGroundingMetadata = { 
        groundingChunks: finalResponse.candidates[0].groundingMetadata.groundingChunks?.map(c => ({ 
          web: c.web ? { uri: c.web.uri || '', title: c.web.title || '' } : undefined 
        })) 
      };
    }

    // Parse place cards FIRST from original content (before removing markers)
    console.log("🔍 DEBUG - About to parse place cards from content length:", content.length);
    console.log("🔍 DEBUG - Content preview:", content.substring(0, 200) + "...");
    
    const { placeCardsForMessage } = parsePlaceCards(content);
    console.log("🔍 DEBUG - Place cards found:", placeCardsForMessage.length);
    console.log("🔍 DEBUG - Place cards details:", placeCardsForMessage);

    // Parse form buttons from original content
    const formButtonsForMessage = parseFormButtons(content);
    console.log("🔍 DEBUG - Form buttons found:", formButtonsForMessage.length);
    console.log("🔍 DEBUG - Form buttons details:", formButtonsForMessage);

    // Parse events and remove event markers from content
    const { eventsForThisMessage, showSeeMoreButtonForThisMessage, storedUserQueryForEvents, introText } = parseEvents(content, inputText);
    const eventRegex = new RegExp(`${EVENT_CARD_START_MARKER.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}([\\\\s\\\\S]*?)${EVENT_CARD_END_MARKER.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`, 'g');
    processedContent = processedContent.replace(eventRegex, "").trim();

    // Si hay introText, úsalo como processedContent
    if (introText && introText.trim() !== "") {
      processedContent = introText.trim();
    }

    // Remove place card markers from content AFTER parsing them
    const placeCardRegex = new RegExp(`${PLACE_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${PLACE_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    processedContent = processedContent.replace(placeCardRegex, "").trim();
    
    // También eliminar marcadores abreviados [PLT] y [PL] que el AI está usando
    const abbreviatedPlaceCardRegex = /\[PLT\]([\s\S]*?)\[PL\]/g;
    processedContent = processedContent.replace(abbreviatedPlaceCardRegex, "").trim();

    // Remove form button markers from content AFTER parsing them
    const formButtonRegex = new RegExp(`${FORM_BUTTON_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${FORM_BUTTON_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    processedContent = processedContent.replace(formButtonRegex, "").trim();

    console.log("🔍 DEBUG - Processed content after removing markers:", processedContent);

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
      formButtonsForMessage,
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

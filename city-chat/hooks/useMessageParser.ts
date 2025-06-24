
import { useRef } from 'react';
import { ChatMessage, EventInfo, PlaceCardInfo, GroundingMetadata } from '../types';
import {
  SHOW_MAP_MARKER_START,
  SHOW_MAP_MARKER_END,
  EVENT_CARD_START_MARKER,
  EVENT_CARD_END_MARKER,
  PLACE_CARD_START_MARKER,
  PLACE_CARD_END_MARKER,
  MAX_INITIAL_EVENTS,
  TECA_LINK_BUTTON_START_MARKER,
  TECA_LINK_BUTTON_END_MARKER,
} from '../constants';

export const useMessageParser = () => {
  const displayedEventUniqueKeys = useRef(new Set<string>());
  const lastUserQueryThatLedToEvents = useRef<string | null>(null);

  const parseDate = (dateStr: string): Date | null => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return (year && month && day) ? new Date(year, month - 1, day) : null;
  };

  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date); 
    result.setDate(result.getDate() + days); 
    return result;
  };

  const formatDate = (date: Date): string => date.toISOString().split('T')[0];

  const parseAIResponse = (content: string, finalResponse: any, chatConfig: any, inputText: string) => {
    let processedContent = content;
    let mapQueryFromAI: string | undefined = undefined;
    const rawParsedEventsFromAI: EventInfo[] = [];
    const placeCardsForMessage: PlaceCardInfo[] = [];
    let downloadablePdfInfoForMessage: ChatMessage['downloadablePdfInfo'] = undefined;
    let telematicLinkForMessage: ChatMessage['telematicProcedureLink'] = undefined;
    let storedUserQueryForEvents: string | undefined = undefined;

    // Parse grounding metadata
    let finalGroundingMetadata: GroundingMetadata | undefined = undefined;
    if (finalResponse?.candidates?.[0]?.groundingMetadata) {
      finalGroundingMetadata = { 
        groundingChunks: finalResponse.candidates[0].groundingMetadata.groundingChunks?.map(c => ({ 
          web: c.web ? { uri: c.web.uri || '', title: c.web.title || '' } : undefined 
        })) 
      };
    }

    // Parse events
    const eventRegex = new RegExp(`${EVENT_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${EVENT_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    let match;
    let tempContentForProcessing = processedContent;
    while ((match = eventRegex.exec(tempContentForProcessing)) !== null) {
      let jsonStrToParse = match[1].replace(/\[CITE:\s*\d+\][%]?$/, "").trim();
      try {
        const eventData = JSON.parse(jsonStrToParse);
        if (eventData.title && eventData.date) rawParsedEventsFromAI.push({ ...eventData });
      } catch (e) { 
        console.error("Failed to parse event JSON:", jsonStrToParse, e); 
      }
    }

    // Process events
    const currentYear = new Date().getFullYear();
    const currentYearRawEvents = rawParsedEventsFromAI.filter(event => {
      try { return new Date(event.date).getFullYear() === currentYear; }
      catch (e) { return false; }
    });
    
    const sortedEventsFromAI = currentYearRawEvents.sort((a, b) => 
      a.title.toLowerCase().localeCompare(b.title.toLowerCase()) || 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group consecutive events
    const tempGroupedEvents: EventInfo[] = [];
    for (let i = 0; i < sortedEventsFromAI.length; i++) {
      const currentEvent = sortedEventsFromAI[i];
      if (currentEvent.endDate && currentEvent.endDate !== currentEvent.date) { 
        tempGroupedEvents.push(currentEvent); 
        continue; 
      }
      
      let j = i;
      while (j + 1 < sortedEventsFromAI.length && sortedEventsFromAI[j + 1].title.toLowerCase() === currentEvent.title.toLowerCase()) {
        const currentDateObj = parseDate(sortedEventsFromAI[j].date);
        const nextDateObj = parseDate(sortedEventsFromAI[j + 1].date);
        if (currentDateObj && nextDateObj && formatDate(addDays(currentDateObj, 1)) === formatDate(nextDateObj)) {
          j++;
        } else {
          break;
        }
      }
      
      if (j > i) { 
        tempGroupedEvents.push({ ...currentEvent, endDate: sortedEventsFromAI[j].date }); 
        i = j; 
      } else {
        tempGroupedEvents.push(currentEvent);
      }
    }

    // Filter new events
    const eventsForThisMessageCandidate: EventInfo[] = [];
    for (const event of tempGroupedEvents) {
      const startDate = parseDate(event.date); 
      const endDate = event.endDate ? parseDate(event.endDate) : startDate;
      let isNew = false; 
      const eventIndividualDateKeys: string[] = [];
      
      if (startDate && endDate) {
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dayKey = `${event.title.toLowerCase()}+${formatDate(d)}`; 
          eventIndividualDateKeys.push(dayKey);
          if (!displayedEventUniqueKeys.current.has(dayKey)) isNew = true;
        }
      } else {
        const dayKey = `${event.title.toLowerCase()}+${event.date}`; 
        eventIndividualDateKeys.push(dayKey);
        if (!displayedEventUniqueKeys.current.has(dayKey)) isNew = true;
      }
      
      if (isNew) { 
        eventsForThisMessageCandidate.push(event); 
        eventIndividualDateKeys.forEach(key => displayedEventUniqueKeys.current.add(key)); 
      }
    }

    const eventsForThisMessage = eventsForThisMessageCandidate.slice(0, MAX_INITIAL_EVENTS);
    const showSeeMoreButtonForThisMessage = eventsForThisMessageCandidate.length > MAX_INITIAL_EVENTS;
    
    if (eventsForThisMessage.length > 0) { 
      lastUserQueryThatLedToEvents.current = inputText; 
      storedUserQueryForEvents = inputText; 
    }
    
    processedContent = processedContent.replace(eventRegex, "").trim();

    // Parse place cards
    tempContentForProcessing = processedContent;
    const placeCardRegex = new RegExp(`${PLACE_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${PLACE_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
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
    processedContent = processedContent.replace(placeCardRegex, "").trim();

    // Parse map query
    if (chatConfig.allowMapDisplay && processedContent.includes(SHOW_MAP_MARKER_START)) {
      const startIndex = processedContent.indexOf(SHOW_MAP_MARKER_START); 
      const endIndex = processedContent.indexOf(SHOW_MAP_MARKER_END, startIndex);
      if (startIndex !== -1 && endIndex !== -1) {
          mapQueryFromAI = processedContent.substring(startIndex + SHOW_MAP_MARKER_START.length, endIndex).trim();
          processedContent = (processedContent.substring(0, startIndex) + processedContent.substring(endIndex + SHOW_MAP_MARKER_END.length)).trim();
      }
    }

    // Parse PDF download request
    const pdfMarkerRegex = /\[PROVIDE_DOWNLOAD_LINK_FOR_UPLOADED_PDF:(.+?)\]\s*$/m;
    const pdfMarkerMatch = processedContent.match(pdfMarkerRegex);
    if (pdfMarkerMatch && pdfMarkerMatch[1]) {
      const matchedProcedureName = pdfMarkerMatch[1].trim();
      processedContent = processedContent.replace(pdfMarkerRegex, "").trim();
      const pdfDoc = chatConfig.uploadedProcedureDocuments.find(doc => doc.procedureName === matchedProcedureName);
      if (pdfDoc) {
        downloadablePdfInfoForMessage = { ...pdfDoc };
      } else {
        console.warn(`AI requested PDF '${matchedProcedureName}', not found.`);
      }
    }

    // Parse TECA links
    const tecaLinkRegex = new RegExp(`${TECA_LINK_BUTTON_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${TECA_LINK_BUTTON_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    tempContentForProcessing = processedContent;
    let tecaMatch;
    while ((tecaMatch = tecaLinkRegex.exec(tempContentForProcessing)) !== null) {
      const jsonPayload = tecaMatch[1];
      try {
        const linkData = JSON.parse(jsonPayload);
        if (linkData.url && typeof linkData.url === 'string' && linkData.text && typeof linkData.text === 'string') {
          telematicLinkForMessage = { url: linkData.url, text: linkData.text };
        } else {
          console.warn("Invalid TECA link JSON:", jsonPayload);
        }
      } catch (e) { 
        console.error("Failed to parse TECA link JSON:", jsonPayload, e); 
      }
    }
    processedContent = processedContent.replace(tecaLinkRegex, "").trim();

    return {
      processedContent,
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
    const queryToUse = originalUserQuery || lastUserQueryThatLedToEvents.current || "eventos";
    const seenEventTitlesAndDates = Array.from(displayedEventUniqueKeys.current).map(key => {
        const parts = key.split('+'); 
        return `${parts[0]} (fecha: ${parts[1]})`;
    }).join('; ');
    const seeMorePrompt = `Considerando mi pregunta sobre "${queryToUse}", muéstrame más eventos. Ya he visto: ${seenEventTitlesAndDates}. No los repitas.`;
    if (onSendMessage) {
      onSendMessage(seeMorePrompt);
    }
  };

  const clearEventTracking = () => {
    displayedEventUniqueKeys.current.clear();
    lastUserQueryThatLedToEvents.current = null;
  };

  return {
    parseAIResponse,
    handleSeeMoreEvents,
    clearEventTracking
  };
};

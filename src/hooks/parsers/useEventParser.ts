import { useRef } from 'react';
import { EventInfo } from '../../types';
import {
  EVENT_CARD_START_MARKER,
  EVENT_CARD_END_MARKER,
  MAX_INITIAL_EVENTS,
} from '../../constants';

export const useEventParser = () => {
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

  const parseEvents = (content: string, inputText: string) => {
    console.log("🔍 PARSEEVENTS CALLED WITH:", { content: JSON.stringify(content), inputText });
    
    const rawParsedEventsFromAI: EventInfo[] = [];
    let storedUserQueryForEvents: string | undefined = undefined;

    // Encuentra la posición del primer marcador de evento
    const firstEventIndex = content.indexOf(EVENT_CARD_START_MARKER);
    let introText = "";
    if (firstEventIndex > 0) {
      introText = content.slice(0, firstEventIndex).trim();
    }

    console.log("🔍 INTRO TEXT:", JSON.stringify(introText));
    console.log("🔍 FIRST EVENT INDEX:", firstEventIndex);

    // Parse events
    const eventRegex = new RegExp(`${EVENT_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${EVENT_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    let match;
    let tempContentForProcessing = content;
    
    console.log("🔍 REGEX DEBUG - Full content:", JSON.stringify(content));
    console.log("🔍 REGEX DEBUG - Event start marker:", EVENT_CARD_START_MARKER);
    console.log("🔍 REGEX DEBUG - Event end marker:", EVENT_CARD_END_MARKER);
    console.log("🔍 REGEX DEBUG - Regex pattern:", eventRegex.source);
    
    while ((match = eventRegex.exec(tempContentForProcessing)) !== null) {
      console.log("🎯 REGEX MATCH - Full match:", JSON.stringify(match[0]));
      console.log("🎯 REGEX MATCH - Captured group:", JSON.stringify(match[1]));
      
      let jsonStrToParse = match[1]
        .replace(/```json|```/g, "")
        .replace(/^[\s\n]*|[\s\n]*$/g, "")
        .trim();
      
      console.log("🧹 CLEANED JSON:", JSON.stringify(jsonStrToParse));
      
      try {
        const parsedEvent = JSON.parse(jsonStrToParse);
        console.log("✅ PARSED EVENT:", parsedEvent);
        if (parsedEvent.title && parsedEvent.date) {
          rawParsedEventsFromAI.push(parsedEvent);
          console.log("✅ SUCCESS - Added event:", parsedEvent);
        } else {
          console.log("❌ MISSING FIELDS - Event:", parsedEvent);
        }
      } catch (e) {
        console.error("❌ JSON PARSE ERROR:", e.message);
        console.error("❌ FAILED JSON STRING:", JSON.stringify(jsonStrToParse));
        console.error("❌ ORIGINAL MATCH:", JSON.stringify(match[0]));
      }
    }

    console.log("🔍 RAW PARSED EVENTS:", rawParsedEventsFromAI);

    // Process events
    const currentYear = new Date().getFullYear();
    
    // Permitir eventos del año actual y del anterior (para testing y casos edge)
    const allowedYears = [currentYear, currentYear - 1];
    
    const currentYearRawEvents = rawParsedEventsFromAI.filter(event => {
      const eventYear = new Date(event.date).getFullYear();
      const isAllowedYear = allowedYears.includes(eventYear);
      console.log("🗓️ EVENT YEAR CHECK:", { title: event.title, date: event.date, eventYear, currentYear, allowedYears, isAllowedYear });
      return isAllowedYear;
    });
    
    console.log("🔍 CURRENT YEAR EVENTS:", currentYearRawEvents);

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

    console.log("🔍 GROUPED EVENTS:", tempGroupedEvents);

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
    
    console.log("🔍 FINAL EVENTS FOR MESSAGE:", eventsForThisMessage);
    console.log("🔍 SHOW SEE MORE BUTTON:", showSeeMoreButtonForThisMessage);
    console.log("🔍 EVENTS COUNT BREAKDOWN:", {
      rawParsed: rawParsedEventsFromAI.length,
      afterYearFilter: currentYearRawEvents.length,
      afterGrouping: tempGroupedEvents.length,
      afterNewFilter: eventsForThisMessageCandidate.length,
      final: eventsForThisMessage.length
    });
    
    if (eventsForThisMessage.length > 0) { 
      lastUserQueryThatLedToEvents.current = inputText; 
      storedUserQueryForEvents = inputText; 
    }

    return {
      eventsForThisMessage,
      showSeeMoreButtonForThisMessage,
      storedUserQueryForEvents,
      introText
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
    parseEvents,
    handleSeeMoreEvents,
    clearEventTracking
  };
};

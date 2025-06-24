
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
    const rawParsedEventsFromAI: EventInfo[] = [];
    let storedUserQueryForEvents: string | undefined = undefined;

    // Parse events
    const eventRegex = new RegExp(`${EVENT_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${EVENT_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    let match;
    let tempContentForProcessing = content;
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

    return {
      eventsForThisMessage,
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
    parseEvents,
    handleSeeMoreEvents,
    clearEventTracking
  };
};

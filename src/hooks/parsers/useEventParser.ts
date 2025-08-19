import { useRef, useState } from 'react';
import { EventInfo } from '../../types';
import {
  EVENT_CARD_START_MARKER,
  EVENT_CARD_END_MARKER,
  MAX_INITIAL_EVENTS,
} from '../../constants';

export const useEventParser = () => {
  const displayedEventUniqueKeys = useRef(new Set<string>());
  const lastUserQueryThatLedToEvents = useRef<string | null>(null);

  // Agregar opción de ordenamiento configurable
  const [sortPreference, setSortPreference] = useState<'chronological' | 'alphabetical'>('chronological');

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

  const parseEvents = (content: string, inputText: string, sortBy: 'chronological' | 'alphabetical' = 'chronological') => {
    console.log("🔍 PARSEEVENTS CALLED WITH:", { content: JSON.stringify(content), inputText, sortBy });
    
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

    // Parse events - Mejorar el regex para ser más robusto
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
        
        // Validar que el evento tenga los campos mínimos requeridos
        if (parsedEvent.title && parsedEvent.date) {
          // Normalizar y validar el evento
          const normalizedEvent = normalizeEvent(parsedEvent);
          if (normalizedEvent) {
            rawParsedEventsFromAI.push(normalizedEvent);
            console.log("✅ SUCCESS - Added normalized event:", normalizedEvent);
          } else {
            console.log("❌ EVENT NORMALIZATION FAILED - Event:", parsedEvent);
          }
        } else {
          console.log("❌ MISSING FIELDS - Event:", parsedEvent);
        }
      } catch (e) {
        console.error("❌ JSON PARSE ERROR:", e.message);
        console.error("❌ FAILED JSON STRING:", JSON.stringify(jsonStrToParse));
        console.error("❌ ORIGINAL MATCH:", JSON.stringify(match[0]));
        
        // Intentar reparar JSON malformado
        try {
          const repairedEvent = attemptJsonRepair(jsonStrToParse);
          if (repairedEvent && repairedEvent.title && repairedEvent.date) {
            const normalizedEvent = normalizeEvent(repairedEvent);
            if (normalizedEvent) {
              rawParsedEventsFromAI.push(normalizedEvent);
              console.log("🔧 REPAIRED EVENT ADDED:", normalizedEvent);
            }
          }
        } catch (repairError) {
          console.error("❌ JSON REPAIR FAILED:", repairError.message);
        }
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

    // ORDENAMIENTO INTELIGENTE: Cronológico por defecto, alfabético como opción
    let sortedEventsFromAI: EventInfo[];
    
    if (sortBy === 'chronological') {
      // Ordenar eventos cronológicamente por fecha
      sortedEventsFromAI = currentYearRawEvents.sort((a, b) => {
        // Primero ordenar por fecha (cronológicamente)
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        if (dateA !== dateB) {
          return dateA - dateB; // Orden cronológico ascendente (más antiguo primero)
        }
        
        // Si las fechas son iguales, ordenar alfabéticamente por título
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      });
      
      console.log("🕐 EVENTS SORTED CHRONOLOGICALLY:", sortedEventsFromAI.map(e => ({ title: e.title, date: e.date })));
    } else {
      // Ordenar eventos alfabéticamente por título
      sortedEventsFromAI = currentYearRawEvents.sort((a, b) => {
        // Primero ordenar alfabéticamente por título
        const titleComparison = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        
        if (titleComparison !== 0) {
          return titleComparison;
        }
        
        // Si los títulos son iguales, ordenar por fecha
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
      
      console.log("🔤 EVENTS SORTED ALPHABETICALLY:", sortedEventsFromAI.map(e => ({ title: e.title, date: e.date })));
    }

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

    // MODIFICACIÓN: Lógica menos restrictiva para el filtro de eventos "nuevos"
    // Si es una consulta nueva sobre eventos (diferente a la última), mostrar todos los eventos
    const isNewEventQuery = inputText !== lastUserQueryThatLedToEvents.current;
    console.log("🔍 NEW EVENT QUERY CHECK:", { 
      currentInput: inputText, 
      lastQuery: lastUserQueryThatLedToEvents.current, 
      isNewEventQuery 
    });

    const eventsForThisMessageCandidate: EventInfo[] = [];
    
    if (isNewEventQuery) {
      // Para consultas nuevas, mostrar todos los eventos y limpiar el tracking
      console.log("🔍 NEW EVENT QUERY - Showing all events and clearing tracking");
      displayedEventUniqueKeys.current.clear();
      eventsForThisMessageCandidate.push(...tempGroupedEvents);
      
      // Agregar las claves únicas para evitar duplicados en la misma consulta
      for (const event of tempGroupedEvents) {
        const startDate = parseDate(event.date); 
        const endDate = event.endDate ? parseDate(event.endDate) : startDate;
        
        if (startDate && endDate) {
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayKey = `${event.title.toLowerCase()}+${formatDate(d)}`; 
            displayedEventUniqueKeys.current.add(dayKey);
          }
        } else {
          const dayKey = `${event.title.toLowerCase()}+${event.date}`; 
          displayedEventUniqueKeys.current.add(dayKey);
        }
      }
    } else {
      // Para la misma consulta, usar la lógica original de filtrado
      console.log("🔍 SAME EVENT QUERY - Using original filtering logic");
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
      final: eventsForThisMessage.length,
      isNewEventQuery,
      lastQuery: lastUserQueryThatLedToEvents.current
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

  // Función para normalizar eventos y asegurar que tengan el formato correcto
  const normalizeEvent = (event: any): EventInfo | null => {
    try {
      // Validar campos obligatorios
      if (!event.title || !event.date) {
        return null;
      }

      // Normalizar título
      const title = String(event.title).trim();
      if (title.length === 0) {
        return null;
      }

      // Normalizar fecha
      const date = String(event.date).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return null;
      }

      // Crear evento normalizado
      const normalizedEvent: EventInfo = {
        title,
        date,
        sourceUrl: event.sourceUrl || '',
        sourceTitle: event.sourceTitle || 'Fuente oficial'
      };

      // Campos opcionales
      if (event.endDate && /^\d{4}-\d{2}-\d{2}$/.test(event.endDate)) {
        normalizedEvent.endDate = event.endDate;
      }

      if (event.time && typeof event.time === 'string') {
        normalizedEvent.time = event.time.trim();
      }

      if (event.location && typeof event.location === 'string') {
        normalizedEvent.location = event.location.trim();
      }

      // Nota: description no está en el tipo EventInfo, se omite
      // if (event.description && typeof event.description === 'string') {
      //   normalizedEvent.description = event.description.trim();
      // }

      return normalizedEvent;
    } catch (error) {
      console.error('Error normalizando evento:', error);
      return null;
    }
  };

  // Función para intentar reparar JSON malformado
  const attemptJsonRepair = (jsonStr: string): any | null => {
    try {
      // Intentar limpiar caracteres problemáticos
      let cleaned = jsonStr
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Caracteres de control
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Intentar parsear
      return JSON.parse(cleaned);
    } catch (error) {
      try {
        // Intentar extraer campos individuales usando regex
        const titleMatch = cleaned.match(/"title"\s*:\s*"([^"]+)"/);
        const dateMatch = cleaned.match(/"date"\s*:\s*"([^"]+)"/);
        
        if (titleMatch && dateMatch) {
          const event: any = {
            title: titleMatch[1],
            date: dateMatch[1]
          };

          // Extraer otros campos si están disponibles
          const timeMatch = cleaned.match(/"time"\s*:\s*"([^"]+)"/);
          if (timeMatch) event.time = timeMatch[1];

          const locationMatch = cleaned.match(/"location"\s*:\s*"([^"]+)"/);
          if (locationMatch) event.location = locationMatch[1];

          const endDateMatch = cleaned.match(/"endDate"\s*:\s*"([^"]+)"/);
          if (endDateMatch) event.endDate = endDateMatch[1];

          return event;
        }
      } catch (repairError) {
        console.error('JSON repair failed:', repairError);
      }
      
      return null;
    }
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

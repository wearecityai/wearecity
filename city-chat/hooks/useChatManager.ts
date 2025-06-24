import { useState, useCallback, useRef, useEffect } from 'react';
import { Chat as GeminiChat } from '@google/genai';
import { ChatMessage, MessageRole, CustomChatConfig, GroundingMetadata, EventInfo, PlaceCardInfo } from '../types';
import { initChatSession, sendMessageToGeminiStream } from '../services/geminiService';
import {
  API_KEY_ERROR_MESSAGE,
  INITIAL_SYSTEM_INSTRUCTION,
  SHOW_MAP_MARKER_START,
  SHOW_MAP_MARKER_END,
  SHOW_MAP_PROMPT_SYSTEM_INSTRUCTION,
  EVENT_CARD_START_MARKER,
  EVENT_CARD_END_MARKER,
  EVENT_CARD_SYSTEM_INSTRUCTION,
  MAX_INITIAL_EVENTS,
  PLACE_CARD_START_MARKER,
  PLACE_CARD_END_MARKER,
  PLACE_CARD_SYSTEM_INSTRUCTION,
  GEOLOCATION_PROMPT_CLAUSE,
  RESTRICT_TO_CITY_SYSTEM_INSTRUCTION_CLAUSE,
  CITY_PROCEDURES_SYSTEM_INSTRUCTION_CLAUSE,
  PROCEDURE_URLS_PREAMBLE_TEXT_TEMPLATE,
  PROCEDURE_URLS_GUIDANCE_TEXT_TEMPLATE,
  UPLOADED_DOCUMENTS_CONTEXT_CLAUSE,
  UPLOADED_PDF_PROCEDURE_INSTRUCTION_TEMPLATE,
  TECA_LINK_BUTTON_START_MARKER,
  TECA_LINK_BUTTON_END_MARKER,
  RICH_TEXT_FORMATTING_SYSTEM_INSTRUCTION,
  LANGUAGE_PROMPT_CLAUSE,
  DEFAULT_LANGUAGE_CODE,
} from '../constants';

interface UserLocation {
  latitude: number;
  longitude: number;
}

const getFriendlyError = (error: any, defaultMessage: string): string => {
  let message = defaultMessage;
  if (!error) return defaultMessage;

  if (typeof error.message === 'string') {
    if (error.message.toLowerCase().includes('failed to fetch') || error.message.toLowerCase().includes('networkerror')) {
      message = "Error de red. Verifica tu conexión a internet.";
    } else if (error.message.includes("API Key") || error.message.toLowerCase().includes("api_key")) {
      message = API_KEY_ERROR_MESSAGE;
    } else {
      message = error.message;
    }
  }

  if (message === defaultMessage && navigator && !navigator.onLine) {
    message = "Parece que no hay conexión a internet.";
  }
  return message;
};

export const useChatManager = (
  chatConfig: CustomChatConfig,
  userLocation: UserLocation | null,
  isGeminiReady: boolean,
  onError: (error: string) => void,
  onGeminiReadyChange: (ready: boolean) => void
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const geminiChatSessionRef = useRef<GeminiChat | null>(null);
  const displayedEventUniqueKeys = useRef(new Set<string>());
  const lastUserQueryThatLedToEvents = useRef<string | null>(null);

  const buildFullSystemInstruction = useCallback((config: CustomChatConfig, location: UserLocation | null): string => {
    let systemInstructionParts: string[] = [];
    systemInstructionParts.push(LANGUAGE_PROMPT_CLAUSE.replace('{languageCode}', config.currentLanguageCode || DEFAULT_LANGUAGE_CODE));
    systemInstructionParts.push(RICH_TEXT_FORMATTING_SYSTEM_INSTRUCTION);
    const cityContextForProcedures = config.restrictedCity?.name ? `el municipio de ${config.restrictedCity.name}, España` : "la ciudad consultada";
    let procedureUrlsPreambleText = "";
    let procedureUrlsGuidanceText = "";
    if (config.procedureSourceUrls && config.procedureSourceUrls.length > 0) {
        const urlListString = config.procedureSourceUrls.map(url => `- ${url}`).join("\n");
        procedureUrlsPreambleText = PROCEDURE_URLS_PREAMBLE_TEXT_TEMPLATE.replace('{procedureUrlList}', urlListString);
        procedureUrlsGuidanceText = PROCEDURE_URLS_GUIDANCE_TEXT_TEMPLATE;
    }
    let uploadedDocsListString = "No hay documentos PDF de trámites disponibles.";
    if (config.uploadedProcedureDocuments && config.uploadedProcedureDocuments.length > 0) {
        uploadedDocsListString = "Documentos PDF de trámites disponibles:\n" +
            config.uploadedProcedureDocuments.map(doc => `- Trámite: \"${doc.procedureName}\", Archivo: \"${doc.fileName}\"`).join("\n");
        systemInstructionParts.push(UPLOADED_PDF_PROCEDURE_INSTRUCTION_TEMPLATE);
    }
    const finalUploadedDocsContext = UPLOADED_DOCUMENTS_CONTEXT_CLAUSE.replace('{uploadedDocumentsListPlaceholder}', uploadedDocsListString);
    systemInstructionParts.push(finalUploadedDocsContext);
    const finalCityProceduresInstruction = CITY_PROCEDURES_SYSTEM_INSTRUCTION_CLAUSE
        .replace(/{cityContext}/g, cityContextForProcedures)
        .replace(/{procedureUrlsPreamble}/g, procedureUrlsPreambleText)
        .replace(/{procedureUrlsGuidance}/g, procedureUrlsGuidanceText)
        .replace(/{configuredSedeElectronicaUrl}/g, config.sedeElectronicaUrl || '');
    systemInstructionParts.push(finalCityProceduresInstruction);
    if (config.restrictedCity && config.restrictedCity.name) {
      systemInstructionParts.push(RESTRICT_TO_CITY_SYSTEM_INSTRUCTION_CLAUSE.replace(/{cityName}/g, config.restrictedCity.name));
    }
    if (config.serviceTags && config.serviceTags.length > 0) {
      systemInstructionParts.push(`Especialización: ${config.serviceTags.join(", ")} en ${config.restrictedCity ? config.restrictedCity.name : 'la ciudad'}.`);
    }
    if (typeof config.systemInstruction === 'string' && config.systemInstruction.trim()) {
        systemInstructionParts.push(config.systemInstruction.trim());
    } else if (systemInstructionParts.length <=1 || (systemInstructionParts.length <=2 && config.restrictedCity)) {
        const cityContext = config.restrictedCity ? ` sobre ${config.restrictedCity.name}` : "";
        systemInstructionParts.push(INITIAL_SYSTEM_INSTRUCTION.replace("sobre ciudades", cityContext));
    }
    if (config.allowGeolocation && location) {
      const locationClause = GEOLOCATION_PROMPT_CLAUSE
        .replace('{latitude}', location.latitude.toFixed(5))
        .replace('{longitude}', location.longitude.toFixed(5));
      systemInstructionParts.push(locationClause);
    }
    if (config.allowMapDisplay) systemInstructionParts.push(SHOW_MAP_PROMPT_SYSTEM_INSTRUCTION);
    systemInstructionParts.push(EVENT_CARD_SYSTEM_INSTRUCTION);
    systemInstructionParts.push(PLACE_CARD_SYSTEM_INSTRUCTION);
    let fullInstruction = systemInstructionParts.join("\n\n").trim();
    if (!fullInstruction && !config.enableGoogleSearch && !config.allowMapDisplay) {
        fullInstruction = INITIAL_SYSTEM_INSTRUCTION;
    }
    return fullInstruction.trim() || INITIAL_SYSTEM_INSTRUCTION;
  }, []);

  const initializeChatAndGreet = useCallback(async (
    configToUse: CustomChatConfig,
    location: UserLocation | null,
    currentMessages: ChatMessage[]
  ) => {
    if (!isGeminiReady) {
      onError(API_KEY_ERROR_MESSAGE);
      return;
    }
    try {
      const fullSystemInstruction = buildFullSystemInstruction(configToUse, location);
      geminiChatSessionRef.current = initChatSession(fullSystemInstruction, configToUse.enableGoogleSearch);

      if (currentMessages.length === 0) {
          // No automatic greeting for Gemini clone UI, empty state is handled by MessageList/App
      }
    } catch (e: any) {
      console.error("Gemini Initialization error:", e);
      const errorMessage = getFriendlyError(e, "Error al inicializar el chat con Gemini.");
      onError(errorMessage);
      if (errorMessage === API_KEY_ERROR_MESSAGE) onGeminiReadyChange(false);
    }
  }, [isGeminiReady, buildFullSystemInstruction, onError, onGeminiReadyChange]);

  const parseDate = (dateStr: string): Date | null => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return (year && month && day) ? new Date(year, month - 1, day) : null;
  };
  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date); result.setDate(result.getDate() + days); return result;
  };
  const formatDate = (date: Date): string => date.toISOString().split('T')[0];

  const handleSendMessage = async (inputText: string) => {
    if (!geminiChatSessionRef.current || isLoading || !isGeminiReady) {
        if (!isGeminiReady) onError(API_KEY_ERROR_MESSAGE);
        return;
    }
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: MessageRole.User, content: inputText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    const aiClientTempId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: aiClientTempId, role: MessageRole.Model, content: '', timestamp: new Date(), isTyping: true }]);
    let currentAiContent = '';

    try {
      await sendMessageToGeminiStream(
        geminiChatSessionRef.current, inputText,
        (chunkText) => {
          currentAiContent += chunkText;
          setMessages(prev => prev.map(msg => msg.id === aiClientTempId ? { ...msg, content: currentAiContent, isTyping: true } : msg));
        },
        async (finalResponse) => {
          let finalGroundingMetadata: GroundingMetadata | undefined = undefined;
          let processedContent = currentAiContent;
          let mapQueryFromAI: string | undefined = undefined;
          const rawParsedEventsFromAI: EventInfo[] = [];
          const placeCardsForMessage: PlaceCardInfo[] = [];
          let downloadablePdfInfoForMessage: ChatMessage['downloadablePdfInfo'] = undefined;
          let telematicLinkForMessage: ChatMessage['telematicProcedureLink'] = undefined;
          let storedUserQueryForEvents: string | undefined = undefined;

          if (finalResponse?.candidates?.[0]?.groundingMetadata) {
            finalGroundingMetadata = { groundingChunks: finalResponse.candidates[0].groundingMetadata.groundingChunks?.map(c => ({ web: c.web ? { uri: c.web.uri || '', title: c.web.title || '' } : undefined })) };
          }
          const eventRegex = new RegExp(`${EVENT_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${EVENT_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
          let match;
          let tempContentForProcessing = processedContent;
          while ((match = eventRegex.exec(tempContentForProcessing)) !== null) {
            let jsonStrToParse = match[1].replace(/\[CITE:\s*\d+\][%]?$/, "").trim();
            try {
              const eventData = JSON.parse(jsonStrToParse);
              if (eventData.title && eventData.date) rawParsedEventsFromAI.push({ ...eventData });
            } catch (e) { console.error("Failed to parse event JSON:", jsonStrToParse, e); }
          }
          const currentYear = new Date().getFullYear();
          const currentYearRawEvents = rawParsedEventsFromAI.filter(event => {
            try { return new Date(event.date).getFullYear() === currentYear; }
            catch (e) { return false; }
          });
          const sortedEventsFromAI = currentYearRawEvents.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()) || new Date(a.date).getTime() - new Date(b.date).getTime());
          const tempGroupedEvents: EventInfo[] = [];
          for (let i = 0; i < sortedEventsFromAI.length; i++) {
            const currentEvent = sortedEventsFromAI[i];
            if (currentEvent.endDate && currentEvent.endDate !== currentEvent.date) { tempGroupedEvents.push(currentEvent); continue; }
            let j = i;
            while (j + 1 < sortedEventsFromAI.length && sortedEventsFromAI[j + 1].title.toLowerCase() === currentEvent.title.toLowerCase()) {
              const currentDateObj = parseDate(sortedEventsFromAI[j].date);
              const nextDateObj = parseDate(sortedEventsFromAI[j + 1].date);
              if (currentDateObj && nextDateObj && formatDate(addDays(currentDateObj, 1)) === formatDate(nextDateObj)) j++; else break;
            }
            if (j > i) { tempGroupedEvents.push({ ...currentEvent, endDate: sortedEventsFromAI[j].date }); i = j; }
            else tempGroupedEvents.push(currentEvent);
          }
          const eventsForThisMessageCandidate: EventInfo[] = [];
          for (const event of tempGroupedEvents) {
            const startDate = parseDate(event.date); const endDate = event.endDate ? parseDate(event.endDate) : startDate;
            let isNew = false; const eventIndividualDateKeys: string[] = [];
            if (startDate && endDate) {
              for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dayKey = `${event.title.toLowerCase()}+${formatDate(d)}`; eventIndividualDateKeys.push(dayKey);
                if (!displayedEventUniqueKeys.current.has(dayKey)) isNew = true;
              }
            } else {
              const dayKey = `${event.title.toLowerCase()}+${event.date}`; eventIndividualDateKeys.push(dayKey);
              if (!displayedEventUniqueKeys.current.has(dayKey)) isNew = true;
            }
            if (isNew) { eventsForThisMessageCandidate.push(event); eventIndividualDateKeys.forEach(key => displayedEventUniqueKeys.current.add(key)); }
          }
          const eventsForThisMessage = eventsForThisMessageCandidate.slice(0, MAX_INITIAL_EVENTS);
          const showSeeMoreButtonForThisMessage = eventsForThisMessageCandidate.length > MAX_INITIAL_EVENTS;
          if (eventsForThisMessage.length > 0) { lastUserQueryThatLedToEvents.current = inputText; storedUserQueryForEvents = inputText; }
          processedContent = processedContent.replace(eventRegex, "").trim();
          tempContentForProcessing = processedContent;

          const placeCardRegex = new RegExp(`${PLACE_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${PLACE_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
          while ((match = placeCardRegex.exec(tempContentForProcessing)) !== null) {
            let jsonStrToParse = match[1].replace(/\[CITE:\s*\d+\][%]?$/, "").trim();
            try {
              const placeData = JSON.parse(jsonStrToParse);
              if (placeData.name && (placeData.placeId || placeData.searchQuery)) placeCardsForMessage.push({ id: crypto.randomUUID(), name: placeData.name, placeId: placeData.placeId, searchQuery: placeData.searchQuery, isLoadingDetails: true });
            } catch (e) { console.error("Failed to parse place card JSON:", jsonStrToParse, e); }
          }
          processedContent = processedContent.replace(placeCardRegex, "").trim();

          if (chatConfig.allowMapDisplay && processedContent.includes(SHOW_MAP_MARKER_START)) {
            const startIndex = processedContent.indexOf(SHOW_MAP_MARKER_START); const endIndex = processedContent.indexOf(SHOW_MAP_MARKER_END, startIndex);
            if (startIndex !== -1 && endIndex !== -1) {
                mapQueryFromAI = processedContent.substring(startIndex + SHOW_MAP_MARKER_START.length, endIndex).trim();
                processedContent = (processedContent.substring(0, startIndex) + processedContent.substring(endIndex + SHOW_MAP_MARKER_END.length)).trim();
            }
          }
          const pdfMarkerRegex = /\[PROVIDE_DOWNLOAD_LINK_FOR_UPLOADED_PDF:(.+?)\]\s*$/m;
          const pdfMarkerMatch = processedContent.match(pdfMarkerRegex);
          if (pdfMarkerMatch && pdfMarkerMatch[1]) {
            const matchedProcedureName = pdfMarkerMatch[1].trim();
            processedContent = processedContent.replace(pdfMarkerRegex, "").trim();
            const pdfDoc = chatConfig.uploadedProcedureDocuments.find(doc => doc.procedureName === matchedProcedureName);
            if (pdfDoc) downloadablePdfInfoForMessage = { ...pdfDoc };
            else console.warn(`AI requested PDF '${matchedProcedureName}', not found.`);
          }
          const tecaLinkRegex = new RegExp(`${TECA_LINK_BUTTON_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${TECA_LINK_BUTTON_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
          tempContentForProcessing = processedContent;
          let tecaMatch;
          while ((tecaMatch = tecaLinkRegex.exec(tempContentForProcessing)) !== null) {
            const jsonPayload = tecaMatch[1];
            try {
              const linkData = JSON.parse(jsonPayload);
              if (linkData.url && typeof linkData.url === 'string' && linkData.text && typeof linkData.text === 'string') telematicLinkForMessage = { url: linkData.url, text: linkData.text };
              else console.warn("Invalid TECA link JSON:", jsonPayload);
            } catch (e) { console.error("Failed to parse TECA link JSON:", jsonPayload, e); }
          }
          processedContent = processedContent.replace(tecaLinkRegex, "").trim();

          const finalAiMessage: ChatMessage = {
            id: crypto.randomUUID(), role: MessageRole.Model, content: processedContent, timestamp: new Date(),
            groundingMetadata: finalGroundingMetadata, mapQuery: mapQueryFromAI,
            events: eventsForThisMessage.length > 0 ? eventsForThisMessage : undefined,
            placeCards: placeCardsForMessage.length > 0 ? placeCardsForMessage : undefined,
            downloadablePdfInfo: downloadablePdfInfoForMessage, telematicProcedureLink: telematicLinkForMessage,
            showSeeMoreButton: showSeeMoreButtonForThisMessage, originalUserQueryForEvents: storedUserQueryForEvents,
          };
          setMessages(prev => prev.filter(msg => msg.id !== aiClientTempId).concat(finalAiMessage));
          setIsLoading(false);
        },
        async (apiError) => {
          console.error("API Error:", apiError);
          const friendlyApiError = getFriendlyError(apiError, `Error: ${apiError.message}`);
          const errorAiMessage: ChatMessage = { id: crypto.randomUUID(), role: MessageRole.Model, content: '', timestamp: new Date(), error: friendlyApiError };
          setMessages(prev => prev.filter(msg => msg.id !== aiClientTempId).concat(errorAiMessage));
          if (friendlyApiError === API_KEY_ERROR_MESSAGE) { onError(API_KEY_ERROR_MESSAGE); onGeminiReadyChange(false); }
          else onError(friendlyApiError);
          setIsLoading(false);
        }
      );
    } catch (e: any) {
        console.error("Error sending message:", e);
        const errorMsg = getFriendlyError(e, "Error al enviar mensaje.");
        const errorAiMessage: ChatMessage = { id: crypto.randomUUID(), role: MessageRole.Model, content: '', timestamp: new Date(), error: errorMsg };
        setMessages(prev => prev.filter(msg => msg.id !== aiClientTempId).concat(errorAiMessage));
        onError(errorMsg);
        if (errorMsg === API_KEY_ERROR_MESSAGE) onGeminiReadyChange(false);
        setIsLoading(false);
    }
  };

  const handleSeeMoreEvents = (originalUserQuery?: string) => {
    const queryToUse = originalUserQuery || lastUserQueryThatLedToEvents.current || "eventos";
    const seenEventTitlesAndDates = Array.from(displayedEventUniqueKeys.current).map(key => {
        const parts = key.split('+'); return `${parts[0]} (fecha: ${parts[1]})`;
    }).join('; ');
    const seeMorePrompt = `Considerando mi pregunta sobre "${queryToUse}", muéstrame más eventos. Ya he visto: ${seenEventTitlesAndDates}. No los repitas.`;
    handleSendMessage(seeMorePrompt);
  };

  const clearMessages = () => {
    setMessages([]);
    displayedEventUniqueKeys.current.clear();
    lastUserQueryThatLedToEvents.current = null;
  };

  // Initialize chat when ready
  useEffect(() => {
    if (isGeminiReady) {
      initializeChatAndGreet(chatConfig, userLocation, messages);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGeminiReady, chatConfig, userLocation]);

  return {
    messages,
    isLoading,
    handleSendMessage,
    handleSeeMoreEvents,
    clearMessages,
    setMessages
  };
};

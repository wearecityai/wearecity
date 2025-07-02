
import { ChatMessage } from '../../types';

interface SystemMarkers {
  SHOW_MAP_MARKER_START: string;
  SHOW_MAP_MARKER_END: string;
  TECA_LINK_BUTTON_START_MARKER: string;
  TECA_LINK_BUTTON_END_MARKER: string;
}

export const useContentParser = (markers?: SystemMarkers) => {
  const parseContent = (content: string, chatConfig: any) => {
    let processedContent = content;
    let mapQueryFromAI: string | undefined = undefined;
    let downloadablePdfInfoForMessage: ChatMessage['downloadablePdfInfo'] = undefined;
    let telematicLinkForMessage: ChatMessage['telematicProcedureLink'] = undefined;

    // Use markers from parameters or fallback values
    const MAP_START = markers?.SHOW_MAP_MARKER_START || '[SHOW_MAP:';
    const MAP_END = markers?.SHOW_MAP_MARKER_END || ']';
    const TECA_START = markers?.TECA_LINK_BUTTON_START_MARKER || '[TECA_LINK_BUTTON_START]';
    const TECA_END = markers?.TECA_LINK_BUTTON_END_MARKER || '[TECA_LINK_BUTTON_END]';

    // Parse map query
    if (chatConfig.allowMapDisplay && processedContent.includes(MAP_START)) {
      const startIndex = processedContent.indexOf(MAP_START); 
      const endIndex = processedContent.indexOf(MAP_END, startIndex);
      if (startIndex !== -1 && endIndex !== -1) {
          mapQueryFromAI = processedContent.substring(startIndex + MAP_START.length, endIndex).trim();
          processedContent = (processedContent.substring(0, startIndex) + processedContent.substring(endIndex + MAP_END.length)).trim();
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
    const tecaLinkRegex = new RegExp(`${TECA_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${TECA_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    let tempContentForProcessing = processedContent;
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
      mapQueryFromAI,
      downloadablePdfInfoForMessage,
      telematicLinkForMessage
    };
  };

  return { parseContent };
};


import { useCallback } from 'react';
import { CustomChatConfig } from '../types';
import {
  INITIAL_SYSTEM_INSTRUCTION,
  SHOW_MAP_PROMPT_SYSTEM_INSTRUCTION,
  EVENT_CARD_SYSTEM_INSTRUCTION,
  PLACE_CARD_SYSTEM_INSTRUCTION,
  GEOLOCATION_PROMPT_CLAUSE,
  RESTRICT_TO_CITY_SYSTEM_INSTRUCTION_CLAUSE,
  CITY_PROCEDURES_SYSTEM_INSTRUCTION_CLAUSE,
  PROCEDURE_URLS_PREAMBLE_TEXT_TEMPLATE,
  PROCEDURE_URLS_GUIDANCE_TEXT_TEMPLATE,
  UPLOADED_DOCUMENTS_CONTEXT_CLAUSE,
  UPLOADED_PDF_PROCEDURE_INSTRUCTION_TEMPLATE,
  RICH_TEXT_FORMATTING_SYSTEM_INSTRUCTION,
  LANGUAGE_PROMPT_CLAUSE,
  DEFAULT_LANGUAGE_CODE,
} from '../constants';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useSystemInstructionBuilder = () => {
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

  return { buildFullSystemInstruction };
};

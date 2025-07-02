
import { useCallback, useState, useEffect } from 'react';
import { CustomChatConfig } from '../types';
import { supabase } from '@/integrations/supabase/client';
import {
  DEFAULT_LANGUAGE_CODE,
} from '../constants';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useSystemInstructionBuilder = () => {
  const [systemInstructions, setSystemInstructions] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar las instrucciones del sistema desde la base de datos
  useEffect(() => {
    const loadSystemInstructions = async () => {
      try {
        const { data, error } = await supabase.rpc('get_all_system_instructions');
        
        if (error) {
          console.error('Error loading system instructions:', error);
          return;
        }

        const instructionsMap: Record<string, string> = {};
        data?.forEach((instruction: any) => {
          instructionsMap[instruction.instruction_key] = instruction.instruction_value;
        });
        
        setSystemInstructions(instructionsMap);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading system instructions:', error);
        setIsLoaded(true); // Marcar como cargado incluso en caso de error
      }
    };

    loadSystemInstructions();
  }, []);

  const buildFullSystemInstruction = useCallback((config: CustomChatConfig, location: UserLocation | null): string => {
    if (!isLoaded) {
      console.log('⚠️ System instructions not loaded yet, returning empty string');
      return ''; // Retornar cadena vacía si aún no se han cargado las instrucciones
    }

    console.log('🏗️ Building system instruction with config:', {
      allowMapDisplay: config.allowMapDisplay,
      hasEventInstruction: !!systemInstructions['EVENT_CARD_SYSTEM_INSTRUCTION'],
      hasPlaceInstruction: !!systemInstructions['PLACE_CARD_SYSTEM_INSTRUCTION']
    });

    let systemInstructionParts: string[] = [];
    
    // Agregar instrucción de idioma
    const languageClause = systemInstructions['LANGUAGE_PROMPT_CLAUSE']?.replace('{languageCode}', config.currentLanguageCode || DEFAULT_LANGUAGE_CODE);
    if (languageClause) {
      systemInstructionParts.push(languageClause);
    }
    
    // Agregar instrucciones de formato de texto enriquecido
    if (systemInstructions['RICH_TEXT_FORMATTING_SYSTEM_INSTRUCTION']) {
      systemInstructionParts.push(systemInstructions['RICH_TEXT_FORMATTING_SYSTEM_INSTRUCTION']);
    }
    
    const cityContextForProcedures = config.restrictedCity?.name ? `el municipio de ${config.restrictedCity.name}, España` : "la ciudad consultada";
    
    let procedureUrlsPreambleText = "";
    let procedureUrlsGuidanceText = "";
    if (config.procedureSourceUrls && config.procedureSourceUrls.length > 0) {
        const urlListString = config.procedureSourceUrls.map(url => `- ${url}`).join("\n");
        const preambleTemplate = systemInstructions['PROCEDURE_URLS_PREAMBLE_TEXT_TEMPLATE'];
        if (preambleTemplate) {
          procedureUrlsPreambleText = preambleTemplate.replace('{procedureUrlList}', urlListString);
        }
        procedureUrlsGuidanceText = systemInstructions['PROCEDURE_URLS_GUIDANCE_TEXT_TEMPLATE'] || '';
    }
    
    let uploadedDocsListString = "No hay documentos PDF de trámites disponibles.";
    if (config.uploadedProcedureDocuments && config.uploadedProcedureDocuments.length > 0) {
        uploadedDocsListString = "Documentos PDF de trámites disponibles:\n" +
            config.uploadedProcedureDocuments.map(doc => `- Trámite: \"${doc.procedureName}\", Archivo: \"${doc.fileName}\"`).join("\n");
        const pdfInstructionTemplate = systemInstructions['UPLOADED_PDF_PROCEDURE_INSTRUCTION_TEMPLATE'];
        if (pdfInstructionTemplate) {
          systemInstructionParts.push(pdfInstructionTemplate);
        }
    }
    
    const uploadedDocsContextTemplate = systemInstructions['UPLOADED_DOCUMENTS_CONTEXT_CLAUSE'];
    if (uploadedDocsContextTemplate) {
      const finalUploadedDocsContext = uploadedDocsContextTemplate.replace('{uploadedDocumentsListPlaceholder}', uploadedDocsListString);
      systemInstructionParts.push(finalUploadedDocsContext);
    }
    
    // Usar instrucciones de trámites desde la base de datos
    const cityProceduresInstruction = systemInstructions['CITY_PROCEDURES_SYSTEM_INSTRUCTION_CLAUSE'];
    if (cityProceduresInstruction) {
      const finalCityProceduresInstruction = cityProceduresInstruction
          .replace(/{cityContext}/g, cityContextForProcedures)
          .replace(/{procedureUrlsPreamble}/g, procedureUrlsPreambleText)
          .replace(/{procedureUrlsGuidance}/g, procedureUrlsGuidanceText)
          .replace(/{configuredSedeElectronicaUrl}/g, config.sedeElectronicaUrl || '');
      systemInstructionParts.push(finalCityProceduresInstruction);
    }
    
    // Restricción de ciudad desde la base de datos
    if (config.restrictedCity && config.restrictedCity.name && systemInstructions['RESTRICT_TO_CITY_SYSTEM_INSTRUCTION_CLAUSE']) {
      const restrictionClause = systemInstructions['RESTRICT_TO_CITY_SYSTEM_INSTRUCTION_CLAUSE']
        .replace(/{cityName}/g, config.restrictedCity.name);
      systemInstructionParts.push(restrictionClause);
    }
    
    if (config.serviceTags && config.serviceTags.length > 0) {
      systemInstructionParts.push(`Especialización: ${config.serviceTags.join(", ")} en ${config.restrictedCity ? config.restrictedCity.name : 'la ciudad'}.`);
    }
    
    // Usar instrucción inicial desde la base de datos
    if (typeof config.systemInstruction === 'string' && config.systemInstruction.trim()) {
        systemInstructionParts.push(config.systemInstruction.trim());
    } else if (systemInstructionParts.length <=1 || (systemInstructionParts.length <=2 && config.restrictedCity)) {
        const cityContext = config.restrictedCity ? ` sobre ${config.restrictedCity.name}` : "";
        const initialInstruction = systemInstructions['INITIAL_SYSTEM_INSTRUCTION'] || '';
        systemInstructionParts.push(initialInstruction.replace("sobre ciudades", cityContext));
    }
    
    // Geolocalización desde la base de datos
    if (config.allowGeolocation && location && systemInstructions['GEOLOCATION_PROMPT_CLAUSE']) {
      const locationClause = systemInstructions['GEOLOCATION_PROMPT_CLAUSE']
        .replace('{latitude}', location.latitude.toFixed(5))
        .replace('{longitude}', location.longitude.toFixed(5));
      systemInstructionParts.push(locationClause);
    }
    
    // Instrucciones de mapa, eventos y lugares desde la base de datos
    if (config.allowMapDisplay && systemInstructions['SHOW_MAP_PROMPT_SYSTEM_INSTRUCTION']) {
      console.log('➕ Adding map instruction');
      systemInstructionParts.push(systemInstructions['SHOW_MAP_PROMPT_SYSTEM_INSTRUCTION']);
    }
    if (systemInstructions['EVENT_CARD_SYSTEM_INSTRUCTION']) {
      console.log('🎪 Adding event card instruction');
      systemInstructionParts.push(systemInstructions['EVENT_CARD_SYSTEM_INSTRUCTION']);
    }
    if (systemInstructions['PLACE_CARD_SYSTEM_INSTRUCTION']) {
      console.log('🏢 Adding place card instruction');
      systemInstructionParts.push(systemInstructions['PLACE_CARD_SYSTEM_INSTRUCTION']);
    }
    
    let fullInstruction = systemInstructionParts.join("\n\n").trim();
    if (!fullInstruction && !config.enableGoogleSearch && !config.allowMapDisplay) {
        fullInstruction = systemInstructions['INITIAL_SYSTEM_INSTRUCTION'] || '';
    }
    
    console.log('✅ Final system instruction built, length:', fullInstruction.length);
    console.log('📋 System instruction parts:', systemInstructionParts.length);
    
    return fullInstruction.trim() || systemInstructions['INITIAL_SYSTEM_INSTRUCTION'] || '';
  }, [systemInstructions, isLoaded]);

  return { buildFullSystemInstruction, isLoaded };
};

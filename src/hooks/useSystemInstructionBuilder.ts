
import { useMemo } from 'react';
import { CustomChatConfig } from '../types';
import { useWebScraping } from './useWebScraping';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useSystemInstructionBuilder = (
  config: CustomChatConfig,
  userLocation: UserLocation | null
) => {
  const { searchContent } = useWebScraping();

  const buildSystemInstruction = useMemo(() => {
    return async (userQuery?: string) => {
      let instruction = '';

      // Base system instruction from database
      instruction += config.systemInstruction || 'Eres un asistente especializado en información sobre ciudades españolas y sus trámites administrativos.';

      // Add context about available services and procedures
      if (config.serviceTags && config.serviceTags.length > 0) {
        instruction += '\n\nServicios disponibles: ' + config.serviceTags.join(', ');
      }

      // Add procedure sources
      if (config.procedureSourceUrls && config.procedureSourceUrls.length > 0) {
        instruction += '\n\nFuentes de información oficial:';
        config.procedureSourceUrls.forEach(url => {
          instruction += `\n- ${url}`;
        });
      }

      // Add location context if available
      if (userLocation && config.restrictedCity) {
        instruction += `\n\nUbicación del usuario: ${config.restrictedCity.name || 'Ciudad configurada'}`;
        instruction += `\nCoordenadas: ${userLocation.latitude}, ${userLocation.longitude}`;
      }

      // Add electronic office URL if available
      if (config.sedeElectronicaUrl) {
        instruction += `\n\nSede electrónica: ${config.sedeElectronicaUrl}`;
      }

      // Search for relevant content if user query is provided
      if (userQuery) {
        try {
          const searchResults = await searchContent(userQuery, 5);
          
          if (searchResults && searchResults.length > 0) {
            instruction += '\n\n=== INFORMACIÓN ESPECÍFICA ENCONTRADA ===';
            
            searchResults.forEach((result, index) => {
              instruction += `\n\n--- Fuente ${index + 1}: ${result.title} ---`;
              instruction += `\nURL: ${result.url}`;
              instruction += `\nSitio: ${result.website_name}`;
              instruction += `\nTipo: ${result.content_type}`;
              instruction += `\nContenido: ${result.content.substring(0, 1000)}${result.content.length > 1000 ? '...' : ''}`;
            });
            
            instruction += '\n\n=== FIN DE INFORMACIÓN ESPECÍFICA ===';
            instruction += '\n\nUSA ESTA INFORMACIÓN ESPECÍFICA como fuente principal para responder la consulta del usuario. Si la información específica no cubre completamente la pregunta, complementa con tu conocimiento general pero siempre menciona las fuentes específicas encontradas.';
          }
        } catch (error) {
          console.error('Error searching scraped content:', error);
        }
      }

      // Add language instruction
      instruction += `\n\nResponde siempre en español (código de idioma: ${config.currentLanguageCode || 'es'}).`;

      // Add formatting instructions
      instruction += '\n\nFormatea tu respuesta de manera clara y estructurada. Si mencionas procedimientos, incluye los pasos necesarios. Si hay documentos disponibles, menciónalos.';

      return instruction;
    };
  }, [config, userLocation, searchContent]);

  return { buildSystemInstruction };
};

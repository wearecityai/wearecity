
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { CustomChatConfig } from '../types';
import { DEFAULT_CHAT_CONFIG } from '../constants';

export const useAssistantConfig = () => {
  const { user, profile } = useAuth();
  const [config, setConfig] = useState<CustomChatConfig>(DEFAULT_CHAT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to safely parse JSON arrays
  const safeParseJsonArray = (value: any, fallback: string[]): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  // Helper function to safely parse JSON objects
  const safeParseJsonObject = <T>(value: any, fallback: T): T => {
    if (typeof value === 'object' && value !== null) return value as T;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  // Helper function to serialize objects for JSON storage
  const serializeForJson = (obj: any) => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj === 'object') {
      return JSON.parse(JSON.stringify(obj));
    }
    return obj;
  };

  // Cargar configuración desde Supabase
  const loadConfig = async () => {
    if (!user || profile?.role !== 'administrativo') {
      // Para usuarios normales, usar configuración por defecto o localStorage
      const savedConfig = localStorage.getItem('chatConfig');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          setConfig({ ...DEFAULT_CHAT_CONFIG, ...parsedConfig });
        } catch (error) {
          console.error('Error parsing saved config:', error);
          setConfig(DEFAULT_CHAT_CONFIG);
        }
      }
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('assistant_config')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error loading assistant config:', error);
        setConfig(DEFAULT_CHAT_CONFIG);
        return;
      }

      if (data) {
        // Convertir datos de Supabase al formato CustomChatConfig
        const loadedConfig: CustomChatConfig = {
          assistantName: data.assistant_name || DEFAULT_CHAT_CONFIG.assistantName,
          systemInstruction: data.system_instruction || DEFAULT_CHAT_CONFIG.systemInstruction,
          recommendedPrompts: safeParseJsonArray(data.recommended_prompts, DEFAULT_CHAT_CONFIG.recommendedPrompts),
          serviceTags: safeParseJsonArray(data.service_tags, DEFAULT_CHAT_CONFIG.serviceTags),
          enableGoogleSearch: data.enable_google_search ?? DEFAULT_CHAT_CONFIG.enableGoogleSearch,
          allowMapDisplay: data.allow_map_display ?? DEFAULT_CHAT_CONFIG.allowMapDisplay,
          allowGeolocation: data.allow_geolocation ?? DEFAULT_CHAT_CONFIG.allowGeolocation,
          currentLanguageCode: data.current_language_code || DEFAULT_CHAT_CONFIG.currentLanguageCode,
          procedureSourceUrls: safeParseJsonArray(data.procedure_source_urls, DEFAULT_CHAT_CONFIG.procedureSourceUrls),
          uploadedProcedureDocuments: safeParseJsonObject(data.uploaded_procedure_documents, DEFAULT_CHAT_CONFIG.uploadedProcedureDocuments),
          restrictedCity: safeParseJsonObject(data.restricted_city, DEFAULT_CHAT_CONFIG.restrictedCity),
          sedeElectronicaUrl: data.sede_electronica_url || DEFAULT_CHAT_CONFIG.sedeElectronicaUrl,
        };
        setConfig(loadedConfig);
      } else {
        setConfig(DEFAULT_CHAT_CONFIG);
      }
    } catch (error) {
      console.error('Error loading assistant config:', error);
      setConfig(DEFAULT_CHAT_CONFIG);
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar configuración
  const saveConfig = async (newConfig: CustomChatConfig) => {
    // Siempre guardar en localStorage para usuarios normales
    localStorage.setItem('chatConfig', JSON.stringify(newConfig));
    setConfig(newConfig);

    // Solo guardar en Supabase si es administrador
    if (!user || profile?.role !== 'administrativo') {
      return true;
    }

    try {
      console.log('Saving config to Supabase for user:', user.id);
      
      const configRow = {
        user_id: user.id,
        assistant_name: newConfig.assistantName,
        system_instruction: newConfig.systemInstruction,
        recommended_prompts: serializeForJson(newConfig.recommendedPrompts),
        service_tags: serializeForJson(newConfig.serviceTags),
        enable_google_search: newConfig.enableGoogleSearch,
        allow_map_display: newConfig.allowMapDisplay,
        allow_geolocation: newConfig.allowGeolocation,
        current_language_code: newConfig.currentLanguageCode,
        procedure_source_urls: serializeForJson(newConfig.procedureSourceUrls),
        uploaded_procedure_documents: serializeForJson(newConfig.uploadedProcedureDocuments),
        restricted_city: serializeForJson(newConfig.restrictedCity),
        sede_electronica_url: newConfig.sedeElectronicaUrl,
        is_active: true,
        config_name: 'default',
      };

      // First, check if a record exists for this user
      const { data: existingConfig } = await supabase
        .from('assistant_config')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      let result;
      
      if (existingConfig) {
        // Update existing record
        result = await supabase
          .from('assistant_config')
          .update(configRow)
          .eq('id', existingConfig.id)
          .select()
          .single();
      } else {
        // Insert new record
        result = await supabase
          .from('assistant_config')
          .insert(configRow)
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error saving assistant config:', result.error);
        return false;
      }
      
      console.log('Config saved successfully:', result.data);
      return true;
    } catch (error) {
      console.error('Error saving assistant config:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      loadConfig();
    }
  }, [user, profile]);

  return {
    config,
    setConfig,
    saveConfig,
    isLoading,
    loadConfig
  };
};

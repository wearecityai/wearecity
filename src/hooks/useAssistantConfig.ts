
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { CustomChatConfig, RecommendedPrompt, UploadedProcedureDocument } from '../types';
import { DEFAULT_CHAT_CONFIG } from '../constants';

export const useAssistantConfig = () => {
  const { user, profile } = useAuth();
  const [config, setConfig] = useState<CustomChatConfig>(DEFAULT_CHAT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to safely parse JSON arrays (genérico)
  const safeParseJsonArray = <T>(value: any, fallback: T[]): T[] => {
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

  // Helper para recommendedPrompts: asegura array de objetos {text, img}
  const safeParseRecommendedPrompts = (value: any, fallback: any[]): any[] => {
    if (Array.isArray(value) && value.every(v => typeof v === 'object' && v !== null && 'text' in v && 'img' in v)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.every(v => typeof v === 'object' && v !== null && 'text' in v && 'img' in v)) return parsed;
      } catch {}
    }
    return fallback;
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
      // Para admins, cargar desde la ciudad
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select('*')
        .eq('admin_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (cityError) {
        console.error('Error loading city config:', cityError);
        setConfig(DEFAULT_CHAT_CONFIG);
        return;
      }

      const data = cityData;

      if (data) {
        // Convertir datos de Supabase al formato CustomChatConfig
        const loadedConfig: CustomChatConfig = {
          assistantName: data.assistant_name || DEFAULT_CHAT_CONFIG.assistantName,
          systemInstruction: data.system_instruction || DEFAULT_CHAT_CONFIG.systemInstruction,
          recommendedPrompts: safeParseJsonArray<RecommendedPrompt>(data.recommended_prompts, DEFAULT_CHAT_CONFIG.recommendedPrompts),
          serviceTags: safeParseJsonArray<string>(data.service_tags, DEFAULT_CHAT_CONFIG.serviceTags),
          enableGoogleSearch: data.enable_google_search ?? DEFAULT_CHAT_CONFIG.enableGoogleSearch,
          allowMapDisplay: data.allow_map_display ?? DEFAULT_CHAT_CONFIG.allowMapDisplay,
          allowGeolocation: data.allow_geolocation ?? DEFAULT_CHAT_CONFIG.allowGeolocation,
          currentLanguageCode: data.current_language_code || DEFAULT_CHAT_CONFIG.currentLanguageCode,
          procedureSourceUrls: safeParseJsonArray<string>(data.procedure_source_urls, DEFAULT_CHAT_CONFIG.procedureSourceUrls),
          uploadedProcedureDocuments: safeParseJsonArray<UploadedProcedureDocument>(data.uploaded_procedure_documents, DEFAULT_CHAT_CONFIG.uploadedProcedureDocuments),
          restrictedCity: safeParseJsonObject(data.restricted_city, DEFAULT_CHAT_CONFIG.restrictedCity),
          restrictedCountryCode: (data as any).restricted_country_code || undefined,
          sedeElectronicaUrl: data.sede_electronica_url || DEFAULT_CHAT_CONFIG.sedeElectronicaUrl,
          profileImageUrl: (data as any).profile_image_url || DEFAULT_CHAT_CONFIG.profileImageUrl, // Safe access with fallback
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
         restricted_country_code: (newConfig as any).restrictedCountryCode || null,
        sede_electronica_url: newConfig.sedeElectronicaUrl,
        profile_image_url: newConfig.profileImageUrl, // This will be added to the database schema later
        is_active: true,
        config_name: 'default',
      };

      // Generar slug automáticamente basado en assistant_name
      const generateSlug = (name: string): string => {
        return name
          .toLowerCase()
          .normalize('NFD') // Decompose unicode
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
          .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
          .trim()
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-'); // Replace multiple hyphens with single
      };

      const newSlug = generateSlug(newConfig.assistantName);

      // Actualizar ciudad del usuario admin
      const result = await supabase
        .from('cities')
        .update({
          name: newConfig.assistantName,
          slug: newSlug,
          assistant_name: newConfig.assistantName,
          system_instruction: newConfig.systemInstruction,
          recommended_prompts: JSON.stringify(newConfig.recommendedPrompts || []),
          service_tags: JSON.stringify(newConfig.serviceTags || []),
          enable_google_search: newConfig.enableGoogleSearch,
          allow_map_display: newConfig.allowMapDisplay,
          allow_geolocation: newConfig.allowGeolocation,
          current_language_code: newConfig.currentLanguageCode,
          procedure_source_urls: JSON.stringify(newConfig.procedureSourceUrls || []),
          uploaded_procedure_documents: JSON.stringify(newConfig.uploadedProcedureDocuments || []),
          restricted_city: newConfig.restrictedCity ? JSON.stringify(newConfig.restrictedCity) : null,
          restricted_country_code: (newConfig as any).restrictedCountryCode || null,
          sede_electronica_url: newConfig.sedeElectronicaUrl,
          profile_image_url: newConfig.profileImageUrl,
          is_public: true, // Por defecto las ciudades son públicas
          updated_at: new Date().toISOString()
        })
        .eq('admin_user_id', user.id)
        .select()
        .single();

      if (result.error) {
        console.error('Error saving assistant config:', result.error);
        return false;
      }
      
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


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
      // Cargar desde la ciudad
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

      if (cityData) {
        const loadedConfig: CustomChatConfig = {
          assistantName: cityData.assistant_name || DEFAULT_CHAT_CONFIG.assistantName,
          systemInstruction: cityData.system_instruction || DEFAULT_CHAT_CONFIG.systemInstruction,
          recommendedPrompts: safeParseJsonArray<RecommendedPrompt>(cityData.recommended_prompts, DEFAULT_CHAT_CONFIG.recommendedPrompts),
          serviceTags: safeParseJsonArray<string>(cityData.service_tags, DEFAULT_CHAT_CONFIG.serviceTags),
          enableGoogleSearch: cityData.enable_google_search ?? DEFAULT_CHAT_CONFIG.enableGoogleSearch,
          allowMapDisplay: cityData.allow_map_display ?? DEFAULT_CHAT_CONFIG.allowMapDisplay,
          allowGeolocation: cityData.allow_geolocation ?? DEFAULT_CHAT_CONFIG.allowGeolocation,
          currentLanguageCode: cityData.current_language_code || DEFAULT_CHAT_CONFIG.currentLanguageCode,
          procedureSourceUrls: safeParseJsonArray<string>(cityData.procedure_source_urls, DEFAULT_CHAT_CONFIG.procedureSourceUrls),
          uploadedProcedureDocuments: safeParseJsonArray<UploadedProcedureDocument>(cityData.uploaded_procedure_documents, DEFAULT_CHAT_CONFIG.uploadedProcedureDocuments),
          restrictedCity: safeParseJsonObject(cityData.restricted_city, DEFAULT_CHAT_CONFIG.restrictedCity),
          restrictedCountryCode: undefined,
          sedeElectronicaUrl: cityData.sede_electronica_url || DEFAULT_CHAT_CONFIG.sedeElectronicaUrl,
          profileImageUrl: cityData.profile_image_url || DEFAULT_CHAT_CONFIG.profileImageUrl,
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
    console.log('🚀 saveConfig iniciado con:', newConfig);
    
    // Siempre guardar en localStorage para usuarios normales
    localStorage.setItem('chatConfig', JSON.stringify(newConfig));
    setConfig(newConfig);

    // Solo guardar en Supabase si es administrador
    if (!user || profile?.role !== 'administrativo') {
      return true;
    }

    try {
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

      // Comprobar si existe ciudad activa del admin
      const { data: existingCity, error: loadCityErr } = await supabase
        .from('cities')
        .select('id')
        .eq('admin_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (loadCityErr) {
        console.warn('Warning loading admin city (seguimos intentando sincronizar):', loadCityErr);
      }

      if (!existingCity) {
        // Crear nueva ciudad
        const { error: insertErr } = await supabase
          .from('cities')
          .insert({
            name: newConfig.assistantName,
            slug: newSlug,
            admin_user_id: user.id,
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
            restricted_city: newConfig.restrictedCity as any,
            sede_electronica_url: newConfig.sedeElectronicaUrl,
            profile_image_url: newConfig.profileImageUrl,
            is_public: true,
            is_active: true,
            updated_at: new Date().toISOString()
          });
        if (insertErr) {
          console.error('Error inserting city:', insertErr);
          return false;
        }
        console.log('✅ Nueva ciudad creada con restricted_city');
      } else {
        // Actualizar ciudad existente
        console.log('🔍 Actualizando ciudad existente con ID:', existingCity.id);
        console.log('🔍 newConfig.restrictedCity:', newConfig.restrictedCity);
        console.log('🔍 JSON.stringify(newConfig.restrictedCity):', JSON.stringify(newConfig.restrictedCity));
        
        const updateData = {
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
          restricted_city: newConfig.restrictedCity as any,
          sede_electronica_url: newConfig.sedeElectronicaUrl,
          profile_image_url: newConfig.profileImageUrl,
          updated_at: new Date().toISOString()
        };
        
        console.log('🔍 Datos de actualización:', updateData);
        
        console.log('🔍 Enviando UPDATE a Supabase con datos:', updateData);
        console.log('🔍 Campo restricted_city específico:', updateData.restricted_city);
        console.log('🔍 Tipo de restricted_city:', typeof updateData.restricted_city);
        
        // Primero intentar actualizar solo restricted_city mediante UPDATE directo
        console.log('🔍 Intentando UPDATE solo de restricted_city (directo)...');
        const { data: restrictedCityUpdate, error: restrictedCityError } = await supabase
          .from('cities')
          .update({ 
            restricted_city: newConfig.restrictedCity as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCity.id)
          .select('restricted_city');
        
        if (restrictedCityError) {
          console.error('❌ Error actualizando solo restricted_city:', restrictedCityError);
        } else {
          console.log('✅ restricted_city actualizado por separado:', restrictedCityUpdate);
        }

        // Verificar si se actualizó correctamente
        const { data: verifyRestrictedCity, error: verifyRestrictedCityError } = await supabase
          .from('cities')
          .select('restricted_city')
          .eq('id', existingCity.id)
          .single();
          
        if (verifyRestrictedCityError) {
          console.error('❌ Error verificando restricted_city:', verifyRestrictedCityError);
        } else {
          console.log('🔍 restricted_city después del UPDATE separado:', verifyRestrictedCity.restricted_city);
        }
        
        // Luego actualizar el resto
        const { data: updateResult, error: updateErr } = await supabase
          .from('cities')
          .update(updateData)
          .eq('id', existingCity.id);
          
        if (updateErr) {
          console.error('❌ Error updating city:', updateErr);
          return false;
        }
        
        console.log('🔍 UPDATE completado, resultado:', updateResult);
        
        // Verificar que la actualización fue exitosa consultando el registro actualizado
        const { data: verifyResult, error: verifyErr } = await supabase
          .from('cities')
          .select('id, restricted_city, name')
          .eq('id', existingCity.id)
          .single();
          
        if (verifyErr) {
          console.error('❌ Error verificando actualización:', verifyErr);
        } else {
          console.log('✅ Ciudad actualizada y verificada:', verifyResult);
          
          // Verificar si restricted_city se actualizó correctamente
          if (verifyResult.restricted_city && typeof verifyResult.restricted_city === 'string') {
            try {
              const parsedRestrictedCity = JSON.parse(verifyResult.restricted_city);
              console.log('🔍 restricted_city parseado:', parsedRestrictedCity);
              console.log('🔍 ¿Coincide con lo enviado?', parsedRestrictedCity.name === newConfig.restrictedCity.name);
            } catch (e) {
              console.error('❌ Error parseando restricted_city:', e);
            }
          }
        }
      }
      
      console.log('🎉 saveConfig completado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error saving assistant config:', error);
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

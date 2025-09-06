import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';
import { useAuth } from './useAuth';
import { CustomChatConfig } from '../types';
import { DEFAULT_CHAT_CONFIG } from '../constants';

export const useAssistantConfigFirebase = () => {
  const { user, profile } = useAuth();
  const [config, setConfig] = useState<CustomChatConfig>(DEFAULT_CHAT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);

  // Cargar configuración
  const loadConfig = async () => {
    console.log('🔍 loadConfig iniciado - user:', user?.id, 'profile.role:', profile?.role);
    
    if (!user || profile?.role !== 'administrativo') {
      console.log('📝 Usuario no admin, usando localStorage');
      // Para usuarios normales, usar localStorage
      const stored = localStorage.getItem('chatConfig');
      if (stored) {
        try {
          setConfig(JSON.parse(stored));
        } catch {
          setConfig(DEFAULT_CHAT_CONFIG);
        }
      }
      setHasLoadedInitially(true);
      return;
    }

    setIsLoading(true);
    try {
      // Cargar configuración de la ciudad del admin desde Firebase
      const cityId = `city_${user.id}`;
      console.log('🔍 Buscando ciudad en Firebase con ID:', cityId);
      
      const cityRef = doc(db, 'cities', cityId);
      const cityDoc = await getDoc(cityRef);
      
      console.log('🔍 Documento de ciudad existe?', cityDoc.exists());
      
      if (cityDoc.exists()) {
        const cityData = cityDoc.data();
        console.log('🔍 Datos de ciudad encontrados:', cityData);
        
        const firestoreConfig: CustomChatConfig = {
          assistantName: cityData.assistantName || DEFAULT_CHAT_CONFIG.assistantName,
          systemInstruction: cityData.systemInstruction || DEFAULT_CHAT_CONFIG.systemInstruction,
          recommendedPrompts: cityData.recommendedPrompts || DEFAULT_CHAT_CONFIG.recommendedPrompts,
          serviceTags: cityData.serviceTags || DEFAULT_CHAT_CONFIG.serviceTags,
          enableGoogleSearch: cityData.enableGoogleSearch !== undefined ? cityData.enableGoogleSearch : DEFAULT_CHAT_CONFIG.enableGoogleSearch,
          allowMapDisplay: cityData.allowMapDisplay !== undefined ? cityData.allowMapDisplay : DEFAULT_CHAT_CONFIG.allowMapDisplay,
          allowGeolocation: cityData.allowGeolocation !== undefined ? cityData.allowGeolocation : DEFAULT_CHAT_CONFIG.allowGeolocation,
          currentLanguageCode: cityData.currentLanguageCode || DEFAULT_CHAT_CONFIG.currentLanguageCode,
          procedureSourceUrls: cityData.procedureSourceUrls || DEFAULT_CHAT_CONFIG.procedureSourceUrls,
          uploadedProcedureDocuments: cityData.uploadedProcedureDocuments || DEFAULT_CHAT_CONFIG.uploadedProcedureDocuments,
          restrictedCity: cityData.restrictedCity || DEFAULT_CHAT_CONFIG.restrictedCity,
          sedeElectronicaUrl: cityData.sedeElectronicaUrl || DEFAULT_CHAT_CONFIG.sedeElectronicaUrl,
          agendaEventosUrls: cityData.agendaEventosUrls || DEFAULT_CHAT_CONFIG.agendaEventosUrls,
          profileImageUrl: cityData.profileImageUrl || DEFAULT_CHAT_CONFIG.profileImageUrl,
        };
        
        console.log('✅ Config final cargado:', firestoreConfig);
        console.log('🔍 restrictedCity específicamente:', firestoreConfig.restrictedCity);
        
        setConfig(firestoreConfig);
        console.log('✅ Configuración cargada desde Firebase:', firestoreConfig);
      } else {
        console.log('❌ No se encontró documento de ciudad, usando configuración por defecto');
        setConfig(DEFAULT_CHAT_CONFIG);
      }
    } catch (error) {
      console.error('❌ Error loading config from Firebase:', error);
      setConfig(DEFAULT_CHAT_CONFIG);
    } finally {
      setIsLoading(false);
      setHasLoadedInitially(true);
    }
  };

  // Guardar configuración
  const saveConfig = async (newConfig: CustomChatConfig) => {
    console.log('🚀 saveConfig iniciado con Firebase:', newConfig);
    
    // Siempre guardar en localStorage para usuarios normales
    localStorage.setItem('chatConfig', JSON.stringify(newConfig));
    setConfig(newConfig);

    // Solo guardar en Firebase si es administrador
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

      // Buscar la ciudad del admin (debería existir porque se crea automáticamente)
      const cityId = `city_${user.id}`;
      const cityRef = doc(db, 'cities', cityId);
      const cityDoc = await getDoc(cityRef);

      if (!cityDoc.exists()) {
        // Crear nueva ciudad en Firebase
        const cityData = {
          name: newConfig.assistantName,
          slug: newSlug,
          adminUserId: user.id,
          assistantName: newConfig.assistantName,
          systemInstruction: newConfig.systemInstruction,
          recommendedPrompts: newConfig.recommendedPrompts || [],
          serviceTags: newConfig.serviceTags || [],
          enableGoogleSearch: newConfig.enableGoogleSearch,
          allowMapDisplay: newConfig.allowMapDisplay,
          allowGeolocation: newConfig.allowGeolocation,
          currentLanguageCode: newConfig.currentLanguageCode,
          procedureSourceUrls: newConfig.procedureSourceUrls || [],
          uploadedProcedureDocuments: newConfig.uploadedProcedureDocuments || [],
          restrictedCity: newConfig.restrictedCity || null,
          sedeElectronicaUrl: newConfig.sedeElectronicaUrl || null,
          agendaEventosUrls: newConfig.agendaEventosUrls || null,
          profileImageUrl: newConfig.profileImageUrl || null,
          isPublic: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(cityRef, cityData);
        console.log('✅ Nueva ciudad creada en Firebase');
      } else {
        // Actualizar ciudad existente en Firebase
        console.log('🔍 Actualizando ciudad existente con ID:', cityId);
        console.log('🔍 newConfig.restrictedCity:', newConfig.restrictedCity);
        
        const updateData = {
          name: newConfig.assistantName,
          slug: newSlug,
          assistantName: newConfig.assistantName,
          systemInstruction: newConfig.systemInstruction,
          recommendedPrompts: newConfig.recommendedPrompts || [],
          serviceTags: newConfig.serviceTags || [],
          enableGoogleSearch: newConfig.enableGoogleSearch,
          allowMapDisplay: newConfig.allowMapDisplay,
          allowGeolocation: newConfig.allowGeolocation,
          currentLanguageCode: newConfig.currentLanguageCode,
          procedureSourceUrls: newConfig.procedureSourceUrls || [],
          uploadedProcedureDocuments: newConfig.uploadedProcedureDocuments || [],
          restrictedCity: newConfig.restrictedCity || null,
          sedeElectronicaUrl: newConfig.sedeElectronicaUrl || null,
          agendaEventosUrls: newConfig.agendaEventosUrls || null,
          profileImageUrl: newConfig.profileImageUrl || null,
          updatedAt: new Date()
        };
        
        console.log('🔍 Actualizando en Firebase:', updateData);
        
        await updateDoc(cityRef, updateData);
        console.log('✅ Ciudad actualizada en Firebase');
      }
      
      console.log('🎉 saveConfig completado exitosamente con Firebase');
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
  }, [user?.id, profile?.role]);

  return {
    config,
    setConfig,
    saveConfig,
    isLoading,
    hasLoadedInitially,
    loadConfig
  };
};
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Upload, Save, AlertTriangle, RotateCcw, User, MapPin
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Separator } from './ui/separator';

import { CustomChatConfig, RestrictedCityInfo, SupportedLanguage } from '../types';
import {
  DEFAULT_ASSISTANT_NAME,
  DEFAULT_CHAT_CONFIG,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE_CODE,
} from '../constants';
import { CityLinkManager } from './CityLinkManager';
import CityCombobox from './CityCombobox';

// Modern card component
const ModernCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = React.memo(({ icon, title, children }) => {
  return (
    <Card className="border-border hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3 bg-muted/50 border-b border-border">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <div className="text-primary flex items-center">
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
});

interface FinetuningPageProps {
  currentConfig: CustomChatConfig;
  onSave: (newConfig: CustomChatConfig) => void;
  onCancel: () => void;
  googleMapsScriptLoaded: boolean;
  apiKeyForMaps: string;
  profileImagePreview?: string;
  setProfileImagePreview?: React.Dispatch<React.SetStateAction<string | undefined>>;
  activeTab?: number;
  onTabChange?: (tab: number) => void;
  user?: any;
  citySlug?: string;
}

const FinetuningPage: React.FC<FinetuningPageProps> = ({ 
  currentConfig, 
  onSave, 
  onCancel, 
  googleMapsScriptLoaded, 
  apiKeyForMaps, 
  profileImagePreview, 
  setProfileImagePreview, 
  activeTab: externalActiveTab, 
  onTabChange,
  user,
  citySlug
}) => {
  const [assistantName, setAssistantName] = useState(currentConfig.assistantName);
  // REMOVED: systemInstruction, recommendedPrompts, selectedServiceTags, enableGoogleSearch, allowMapDisplay, allowGeolocation, newPrompt, newPromptIcon
  const [currentLanguageCode, setCurrentLanguageCode] = useState<string>(currentConfig.currentLanguageCode || DEFAULT_LANGUAGE_CODE);
  // REMOVED: RAG-related state
  const [municipalityInputName, setMunicipalityInputName] = useState<string>(currentConfig.restrictedCity?.name || '');
  const [restrictedCity, setRestrictedCity] = useState<RestrictedCityInfo | null>(currentConfig.restrictedCity);
  // REMOVED: All procedure and event URL fields
  const [profileImageUrl, setProfileImageUrl] = useState<string>(profileImagePreview !== undefined ? profileImagePreview : (currentConfig.profileImageUrl || ''));
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const [profileImageError, setProfileImageError] = useState<string | null>(null);
  const [internalActiveTab, setInternalActiveTab] = useState('customize');
  const activeTab = externalActiveTab !== undefined ? 
    (externalActiveTab === 0 ? 'customize' : 'share') : 
    internalActiveTab;
  
  console.log('🔍 FinetuningPage - Tab state:', { 
    externalActiveTab, 
    internalActiveTab, 
    activeTab, 
    hasOnTabChange: !!onTabChange 
  });
  const setActiveTab = onTabChange ? 
    (tab: string) => {
      console.log('🔄 FinetuningPage - Tab change:', { tab, externalActiveTab });
      onTabChange(tab === 'customize' ? 0 : 1);
    } : 
    (tab: string) => {
      console.log('🔄 FinetuningPage - Internal tab change:', { tab, internalActiveTab });
      setInternalActiveTab(tab);
    };

  // Sync local state when config changes
  const lastCityRef = useRef<string | undefined>(currentConfig.restrictedCity?.name);
  console.log('🔍 FinetuningPage - currentConfig.restrictedCity:', currentConfig.restrictedCity);
  console.log('🔍 FinetuningPage - municipalityInputName initial:', municipalityInputName);
  
  useEffect(() => {
    if (lastCityRef.current !== currentConfig.restrictedCity?.name) {
      setAssistantName(currentConfig.assistantName || DEFAULT_CHAT_CONFIG.assistantName);
      setCurrentLanguageCode(currentConfig.currentLanguageCode || DEFAULT_CHAT_CONFIG.currentLanguageCode);
      setMunicipalityInputName(currentConfig.restrictedCity?.name || '');
      setRestrictedCity(currentConfig.restrictedCity);
      setProfileImageUrl(profileImagePreview !== undefined ? profileImagePreview : (currentConfig.profileImageUrl || ''));
      lastCityRef.current = currentConfig.restrictedCity?.name;
    }
  }, [currentConfig.restrictedCity?.name, profileImagePreview]);

  // REMOVED: Auto-assign icon when prompt changes

  // REMOVED: Icon component mapping, auto-assign icon, and prompt/service tag handlers

  const isValidUrl = (url: string): boolean => { 
    try { 
      new URL(url); 
      return url.startsWith('http://') || url.startsWith('https://'); 
    } catch (_) { 
      return false; 
    } 
  };

  // REMOVED: All procedure and event URL handlers

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfileImageError(null);
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type.startsWith('image/')) {
        if (file.size > 2 * 1024 * 1024) {
          setProfileImageError("Imagen demasiado grande (máx 2MB).");
          return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          setProfileImageUrl(reader.result as string);
          if (setProfileImagePreview) setProfileImagePreview(reader.result as string);
        };
        reader.onerror = () => {
          setProfileImageError("Error al leer la imagen.");
        };
      } else {
        setProfileImageError("Selecciona un archivo de imagen válido.");
      }
    }
  };

  const handleRemoveProfileImage = () => {
    setProfileImageUrl('');
    if (setProfileImagePreview) setProfileImagePreview('');
    if (profileImageInputRef.current) {
      profileImageInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    const configToSend = {
      assistantName: assistantName.trim() || DEFAULT_ASSISTANT_NAME,
      restrictedCity: restrictedCity,
      currentLanguageCode, 
      profileImageUrl: profileImageUrl.trim() || undefined,
    };
    
    console.log('🎛️ FinetuningPage sending config:', configToSend);
    onSave(configToSend);
    if (setProfileImagePreview) setProfileImagePreview(undefined);
  };

  const handleSaveAndClose = () => {
    handleSave();
    onCancel();
  };

  // REMOVED: handleClearCityRAG function

  const handleResetToAppDefaults = () => {
    setAssistantName(DEFAULT_CHAT_CONFIG.assistantName);
    setMunicipalityInputName(DEFAULT_CHAT_CONFIG.restrictedCity?.name || '');
    setRestrictedCity(DEFAULT_CHAT_CONFIG.restrictedCity);
    setCurrentLanguageCode(DEFAULT_CHAT_CONFIG.currentLanguageCode);
    setProfileImageUrl(DEFAULT_CHAT_CONFIG.profileImageUrl || '');
    if (profileImageInputRef.current) profileImageInputRef.current.value = "";
  };

  // REMOVED: Memoized handlers for prompts

  // REMOVED: Memoized handlers for procedure and event URLs

  // (activeTab handling is declared earlier via internalActiveTab/externalActiveTab)

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background">
        <div className="flex-1 overflow-y-auto">
          <div className={`max-w-4xl mx-auto p-6 pb-28`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="customize" className="flex-1">Personalizar</TabsTrigger>
                <TabsTrigger value="share" className="flex-1">Compartir</TabsTrigger>
              </TabsList>
              
              <TabsContent value="customize" className="space-y-6">
                <ModernCard icon={<User className="h-5 w-5" />} title="Información General">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="assistant-name">Nombre del Asistente</Label>
                      <Input
                        id="assistant-name"
                        value={assistantName}
                        onChange={(e) => setAssistantName(e.target.value)}
                        placeholder={DEFAULT_ASSISTANT_NAME}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Foto de Perfil del Chat</Label>
                      <div className="flex items-center gap-4">
                        {profileImageUrl && (
                          <div className="relative">
                            <Avatar className="h-16 w-16 border-2 border-border dark:border-input">
                              <AvatarImage src={profileImageUrl} alt="Profile preview" />
                              <AvatarFallback>IMG</AvatarFallback>
                            </Avatar>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                              onClick={handleRemoveProfileImage}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        <Button className="rounded-full" variant="outline" asChild>
                          <label>
                            <Upload className="h-4 w-4 mr-2" />
                            {profileImageUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              ref={profileImageInputRef}
                              onChange={handleProfileImageChange}
                            />
                          </label>
                        </Button>
                      </div>
                      {profileImageError && (
                        <Alert variant="destructive" className="py-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{profileImageError}</AlertDescription>
                        </Alert>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Imagen que aparecerá en el mensaje de bienvenida. Formatos: JPG, PNG, GIF. Máximo 2MB.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language-select">Idioma</Label>
                      <Select value={currentLanguageCode} onValueChange={setCurrentLanguageCode}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar idioma" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_LANGUAGES.map(lang => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.flagEmoji} {lang.name} ({lang.abbr})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">El asistente responderá en este idioma.</p>
                    </div>
                  </div>
                </ModernCard>

                <ModernCard icon={<MapPin className="h-5 w-5" />} title="Contexto y Restricciones">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Restringir a Municipio</Label>
                      <div className="space-y-1">
                        <CityCombobox
                          value={restrictedCity}
                          onChange={(city) => {
                            setMunicipalityInputName(city?.name || '');
                            setRestrictedCity(city);
                          }}
                          countryCode={undefined}
                          placeholder={restrictedCity?.name || 'Selecciona ciudad'}
                          disabled={false}
                        />
                      </div>
                    </div>
                  </div>
                </ModernCard>

                {/* REMOVED: Funcionalidades section */}

                {/* REMOVED: Personalización Avanzada section */}

                {/* REMOVED: Prompts Recomendados section */}

                {/* REMOVED: Fuentes de Trámites and Documentos de Trámites sections */}

              </TabsContent>

              {/* REMOVED: Library tab content */}

              {/* REMOVED: Notebook LM functionality */}

              <TabsContent value="share" className="space-y-6">
                <CityLinkManager assistantNameOverride={assistantName} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {activeTab === 'customize' && (
          <div className="sticky bottom-0 z-10 bg-background border-t border-border p-4">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-2 justify-end">
              <Button className="rounded-full" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="rounded-full" variant="outline" onClick={handleResetToAppDefaults}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restablecer
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Restablecer a los valores por defecto del Asistente</p>
                </TooltipContent>
              </Tooltip>
              <Button className="rounded-full" onClick={handleSaveAndClose}>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
        )}

        {/* REMOVED: RAG Clear Modal */}
      </div>
    </TooltipProvider>
  );
};

export default FinetuningPage;

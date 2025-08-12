import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Trash2, X, Upload, Save, AlertTriangle, RotateCcw, User, Settings, 
  Shield, Sliders, Globe, MapPin, Search, Map, Navigation, FileText, 
  Folder, HelpCircle, Calendar, UtensilsCrossed, Bus, Clock, Library, 
  Building2, Hospital, Pill, AlertCircle, Eye, ParkingCircle, Car, Train, 
  Plane, Building, ShoppingCart, GraduationCap, Landmark, DollarSign,
  Info, Palette, Music, Trophy
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Separator } from './ui/separator';

import { CustomChatConfig, RestrictedCityInfo, SupportedLanguage, UploadedProcedureDocument, RecommendedPrompt } from '../types';
import {
  DEFAULT_ASSISTANT_NAME,
  AVAILABLE_SERVICE_TAGS,
  DEFAULT_CHAT_CONFIG,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE_CODE,
} from '../constants';
import { CityLinkManager } from './CityLinkManager';
import CityGoogleAutocomplete from './CityGoogleAutocomplete';
import CityCombobox from './CityCombobox';
import CountryCombobox from './CountryCombobox';
const LazyAyuntamientoCrawlerInline = React.lazy(() => import('./AyuntamientoCrawlerInline'));

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
  onTabChange 
}) => {
  const [assistantName, setAssistantName] = useState(currentConfig.assistantName);
  const [systemInstruction, setSystemInstruction] = useState(currentConfig.systemInstruction);
  const [recommendedPrompts, setRecommendedPrompts] = useState<RecommendedPrompt[]>(() => {
    const prompts = currentConfig.recommendedPrompts;
    return Array.isArray(prompts) ? prompts : [];
  });
  const [selectedServiceTags, setSelectedServiceTags] = useState<string[]>(() => {
    const tags = currentConfig.serviceTags;
    return Array.isArray(tags) ? tags : [];
  });
  const [enableGoogleSearch, setEnableGoogleSearch] = useState<boolean>(currentConfig.enableGoogleSearch);
  const [allowMapDisplay, setAllowMapDisplay] = useState<boolean>(currentConfig.allowMapDisplay);
  const [allowGeolocation, setAllowGeolocation] = useState<boolean>(currentConfig.allowGeolocation);
  const [newPrompt, setNewPrompt] = useState('');
  const [newPromptIcon, setNewPromptIcon] = useState('help');
  const [currentLanguageCode, setCurrentLanguageCode] = useState<string>(currentConfig.currentLanguageCode || DEFAULT_LANGUAGE_CODE);
  const [municipalityInputName, setMunicipalityInputName] = useState<string>(currentConfig.restrictedCity?.name || '');
  const [restrictedCity, setRestrictedCity] = useState<RestrictedCityInfo | null>(currentConfig.restrictedCity);
  const [procedureSourceUrls, setProcedureSourceUrls] = useState<string[]>(Array.isArray(currentConfig.procedureSourceUrls) ? currentConfig.procedureSourceUrls : []);
  const [newProcedureUrl, setNewProcedureUrl] = useState<string>('');
  const [uploadedProcedureDocuments, setUploadedProcedureDocuments] = useState<UploadedProcedureDocument[]>(Array.isArray(currentConfig.uploadedProcedureDocuments) ? currentConfig.uploadedProcedureDocuments : []);
  const [currentPdfFile, setCurrentPdfFile] = useState<File | null>(null);
  const [currentProcedureNameToUpload, setCurrentProcedureNameToUpload] = useState<string>('');
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sedeElectronicaUrl, setSedeElectronicaUrl] = useState<string>(currentConfig.sedeElectronicaUrl || '');
  const [profileImageUrl, setProfileImageUrl] = useState<string>(profileImagePreview !== undefined ? profileImagePreview : (currentConfig.profileImageUrl || ''));
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const [profileImageError, setProfileImageError] = useState<string | null>(null);
  const [internalActiveTab, setInternalActiveTab] = useState('customize');
  const activeTab = externalActiveTab !== undefined ? (externalActiveTab === 0 ? 'customize' : 'share') : internalActiveTab;
  const setActiveTab = onTabChange ? (tab: string) => onTabChange(tab === 'customize' ? 0 : 1) : setInternalActiveTab;

  // Sync local state when config changes
  const lastCityRef = useRef<string | undefined>(currentConfig.restrictedCity?.name);
  console.log('🔍 FinetuningPage - currentConfig.restrictedCity:', currentConfig.restrictedCity);
  console.log('🔍 FinetuningPage - municipalityInputName initial:', municipalityInputName);
  
  useEffect(() => {
    if (lastCityRef.current !== currentConfig.restrictedCity?.name) {
      setAssistantName(currentConfig.assistantName || DEFAULT_CHAT_CONFIG.assistantName);
      setSystemInstruction(typeof currentConfig.systemInstruction === 'string' ? currentConfig.systemInstruction : DEFAULT_CHAT_CONFIG.systemInstruction);
      setRecommendedPrompts(Array.isArray(currentConfig.recommendedPrompts) ? currentConfig.recommendedPrompts : DEFAULT_CHAT_CONFIG.recommendedPrompts);
      setSelectedServiceTags(Array.isArray(currentConfig.serviceTags) ? currentConfig.serviceTags : DEFAULT_CHAT_CONFIG.serviceTags);
      setEnableGoogleSearch(currentConfig.enableGoogleSearch === undefined ? DEFAULT_CHAT_CONFIG.enableGoogleSearch : currentConfig.enableGoogleSearch);
      setAllowMapDisplay(currentConfig.allowMapDisplay === undefined ? DEFAULT_CHAT_CONFIG.allowMapDisplay : currentConfig.allowMapDisplay);
      setAllowGeolocation(currentConfig.allowGeolocation === undefined ? DEFAULT_CHAT_CONFIG.allowGeolocation : currentConfig.allowGeolocation);
      setCurrentLanguageCode(currentConfig.currentLanguageCode || DEFAULT_CHAT_CONFIG.currentLanguageCode);
      setProcedureSourceUrls(Array.isArray(currentConfig.procedureSourceUrls) ? currentConfig.procedureSourceUrls : DEFAULT_CHAT_CONFIG.procedureSourceUrls);
      setUploadedProcedureDocuments(Array.isArray(currentConfig.uploadedProcedureDocuments) ? currentConfig.uploadedProcedureDocuments : DEFAULT_CHAT_CONFIG.uploadedProcedureDocuments);
      setSedeElectronicaUrl(currentConfig.sedeElectronicaUrl || DEFAULT_CHAT_CONFIG.sedeElectronicaUrl || '');
      setMunicipalityInputName(currentConfig.restrictedCity?.name || '');
      setRestrictedCity(currentConfig.restrictedCity);
      setProfileImageUrl(profileImagePreview !== undefined ? profileImagePreview : (currentConfig.profileImageUrl || ''));
      lastCityRef.current = currentConfig.restrictedCity?.name;
    }
  }, [currentConfig.restrictedCity?.name, profileImagePreview]);

  // Auto-assign icon when prompt changes
  useEffect(() => {
    if (newPrompt.trim()) {
      const autoIcon = getAutomaticIcon(newPrompt.trim());
      setNewPromptIcon(autoIcon);
    } else {
      setNewPromptIcon('help');
    }
  }, [newPrompt]);

  // Icon component mapping
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'event': Calendar, 'restaurant': UtensilsCrossed, 'directions_bus': Bus,
      'schedule': Clock, 'library': Library, 'museum': Building2,
      'hospital': Hospital, 'pharmacy': Pill, 'police': Shield,
      'emergency': AlertTriangle, 'weather': Eye, 'tourism': MapPin,
      'help': HelpCircle, 'info': Info, 'location': MapPin, 'map': Map,
      'parking': ParkingCircle, 'taxi': Car, 'train': Train,
      'airport': Plane, 'hotel': Building, 'shopping': ShoppingCart,
      'school': GraduationCap, 'government': Landmark, 'nature': Globe,
      'wifi': Settings, 'attach_money': DollarSign, 'music': Music,
      'sports': Trophy, 'palette': Palette, 'warning': AlertTriangle,
      'place': MapPin, 'local_gas_station': Car,
    };
    
    return iconMap[iconName.toLowerCase()] || HelpCircle;
  };

  // Auto-assign icon based on prompt text
  const getAutomaticIcon = (promptText: string): string => {
    const text = promptText.toLowerCase();
    
    if (text.includes('evento') || text.includes('actividad') || text.includes('fin de semana') || 
        text.includes('festival') || text.includes('concierto') || text.includes('fiesta') ||
        text.includes('celebración') || text.includes('espectáculo')) {
      return 'event';
    }
    
    if (text.includes('restaurante') || text.includes('comida') || text.includes('comer') ||
        text.includes('cenar') || text.includes('almorzar') || text.includes('desayunar') ||
        text.includes('bar') || text.includes('cafetería') || text.includes('italiano') ||
        text.includes('chino') || text.includes('pizza') || text.includes('tapas') ||
        text.includes('menú') || text.includes('plato')) {
      return 'restaurant';
    }
    
    if (text.includes('llegar') || text.includes('ir a') || text.includes('cómo llego') ||
        text.includes('transporte') || text.includes('autobús') || text.includes('bus') ||
        text.includes('metro') || text.includes('tren') || text.includes('taxi') ||
        text.includes('público') || text.includes('dirección') || text.includes('ruta')) {
      return 'directions_bus';
    }

    if (text.includes('horario') || text.includes('hora') || text.includes('tiempo')) {
      return 'schedule';
    }

    if (text.includes('biblioteca') || text.includes('libro') || text.includes('lectura')) {
      return 'library';
    }

    if (text.includes('hospital') || text.includes('salud') || text.includes('médico')) {
      return 'hospital';
    }

    if (text.includes('farmacia') || text.includes('medicina') || text.includes('medicamento')) {
      return 'pharmacy';
    }

    if (text.includes('policía') || text.includes('seguridad') || text.includes('emergencia')) {
      return 'police';
    }

    if (text.includes('clima') || text.includes('tiempo') || text.includes('meteorología')) {
      return 'weather';
    }

    if (text.includes('turismo') || text.includes('viaje') || text.includes('vacaciones')) {
      return 'tourism';
    }

    if (text.includes('ayuda') || text.includes('información') || text.includes('soporte')) {
      return 'help';
    }

    if (text.includes('dinero') || text.includes('precio') || text.includes('costo')) {
      return 'attach_money';
    }

    if (text.includes('música') || text.includes('concierto') || text.includes('instrumento')) {
      return 'music';
    }

    if (text.includes('deporte') || text.includes('partido') || text.includes('competición')) {
      return 'sports';
    }

    if (text.includes('arte') || text.includes('pintura') || text.includes('color')) {
      return 'palette';
    }

    if (text.includes('advertencia') || text.includes('peligro') || text.includes('alerta')) {
      return 'warning';
    }

    return 'help';
  };

  const handleAddPrompt = () => {
    if (newPrompt.trim() && !recommendedPrompts.some(p => p.text === newPrompt.trim())) {
      const automaticIcon = getAutomaticIcon(newPrompt.trim());
      setRecommendedPrompts([...recommendedPrompts, { text: newPrompt.trim(), img: automaticIcon }]);
      setNewPrompt('');
      setNewPromptIcon(automaticIcon);
    }
  };

  const handleRemovePrompt = (index: number) => setRecommendedPrompts(recommendedPrompts.filter((_, i) => i !== index));
  
  const handlePromptIconChange = (index: number, icon: string) => {
    setRecommendedPrompts(prompts => prompts.map((p, i) => i === index ? { ...p, img: icon } : p));
  };

  const handleToggleServiceTag = (tag: string) => {
    setSelectedServiceTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const isValidUrl = (url: string): boolean => { 
    try { 
      new URL(url); 
      return url.startsWith('http://') || url.startsWith('https://'); 
    } catch (_) { 
      return false; 
    } 
  };

  const handleAddProcedureUrl = () => {
    const trimmedUrl = newProcedureUrl.trim();
    if (trimmedUrl && isValidUrl(trimmedUrl) && !procedureSourceUrls.includes(trimmedUrl)) {
      setProcedureSourceUrls([...procedureSourceUrls, trimmedUrl]);
      setNewProcedureUrl('');
    }
  };

  const handleRemoveProcedureUrl = (index: number) => setProcedureSourceUrls(procedureSourceUrls.filter((_, i) => i !== index));

  const handlePdfFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPdfUploadError(null);
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === "application/pdf") {
        if (file.size > 5 * 1024 * 1024) { 
          setPdfUploadError("PDF demasiado grande (máx 5MB)."); 
          setCurrentPdfFile(null); 
        } else {
          setCurrentPdfFile(file);
        }
      } else { 
        setPdfUploadError("Selecciona un archivo PDF."); 
        setCurrentPdfFile(null); 
      }
    } else {
      setCurrentPdfFile(null);
    }
  };

  const handleAddProcedureDocument = () => {
    if (!currentProcedureNameToUpload.trim()) { 
      setPdfUploadError("Introduce un nombre para el trámite."); 
      return; 
    }
    if (!currentPdfFile) { 
      setPdfUploadError("Selecciona un archivo PDF."); 
      return; 
    }
    if (uploadedProcedureDocuments.find(doc => doc.procedureName.toLowerCase() === currentProcedureNameToUpload.trim().toLowerCase())) {
      setPdfUploadError("Ya existe un documento con este nombre de trámite."); 
      return;
    }
    setPdfUploadError(null);
    
    const reader = new FileReader();
    reader.readAsDataURL(currentPdfFile);
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      const newDocument: UploadedProcedureDocument = { 
        procedureName: currentProcedureNameToUpload.trim(), 
        fileName: currentPdfFile.name, 
        mimeType: currentPdfFile.type, 
        base64Data 
      };
      setUploadedProcedureDocuments([...uploadedProcedureDocuments, newDocument]);
      setCurrentProcedureNameToUpload(''); 
      setCurrentPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = (error) => { 
      console.error("Error reading PDF:", error); 
      setPdfUploadError("Error al leer el PDF."); 
    };
  };

  const handleRemoveProcedureDocument = (name: string) => {
    setUploadedProcedureDocuments(uploadedProcedureDocuments.filter(doc => doc.procedureName !== name));
  };

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
      systemInstruction: systemInstruction.trim(), 
      recommendedPrompts, 
      serviceTags: selectedServiceTags,
      enableGoogleSearch, 
      allowMapDisplay, 
      allowGeolocation, 
      restrictedCity: restrictedCity,
      currentLanguageCode, 
      procedureSourceUrls,
      uploadedProcedureDocuments,
      sedeElectronicaUrl: sedeElectronicaUrl.trim() || undefined,
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

  const handleResetToAppDefaults = () => {
    setAssistantName(DEFAULT_CHAT_CONFIG.assistantName);
    setSystemInstruction(DEFAULT_CHAT_CONFIG.systemInstruction);
    setRecommendedPrompts([...DEFAULT_CHAT_CONFIG.recommendedPrompts]);
    setSelectedServiceTags([...DEFAULT_CHAT_CONFIG.serviceTags]);
    setEnableGoogleSearch(DEFAULT_CHAT_CONFIG.enableGoogleSearch);
    setAllowMapDisplay(DEFAULT_CHAT_CONFIG.allowMapDisplay);
    setAllowGeolocation(DEFAULT_CHAT_CONFIG.allowGeolocation);
    setMunicipalityInputName(DEFAULT_CHAT_CONFIG.restrictedCity?.name || '');
    setRestrictedCity(DEFAULT_CHAT_CONFIG.restrictedCity);
    setCurrentLanguageCode(DEFAULT_CHAT_CONFIG.currentLanguageCode);
    setProcedureSourceUrls([...DEFAULT_CHAT_CONFIG.procedureSourceUrls]); 
    setNewProcedureUrl('');
    setUploadedProcedureDocuments([...DEFAULT_CHAT_CONFIG.uploadedProcedureDocuments]);
    setCurrentPdfFile(null); 
    setCurrentProcedureNameToUpload(''); 
    setPdfUploadError(null);
    setSedeElectronicaUrl(DEFAULT_CHAT_CONFIG.sedeElectronicaUrl || '');
    setProfileImageUrl(DEFAULT_CHAT_CONFIG.profileImageUrl || '');
    if (profileImageInputRef.current) profileImageInputRef.current.value = "";
  };

  // Memoized handlers
  const memoizedHandleAddPrompt = useMemo(() => () => {
    if (newPrompt.trim() && !recommendedPrompts.some(p => p.text === newPrompt.trim())) {
      const automaticIcon = getAutomaticIcon(newPrompt.trim());
      setRecommendedPrompts([...recommendedPrompts, { text: newPrompt.trim(), img: automaticIcon }]);
      setNewPrompt('');
      setNewPromptIcon(automaticIcon);
    }
  }, [newPrompt, recommendedPrompts]);

  const memoizedHandleAddProcedureUrl = useMemo(() => () => {
    const trimmedUrl = newProcedureUrl.trim();
    if (trimmedUrl && isValidUrl(trimmedUrl) && !procedureSourceUrls.includes(trimmedUrl)) {
      setProcedureSourceUrls([...procedureSourceUrls, trimmedUrl]);
      setNewProcedureUrl('');
    }
  }, [newProcedureUrl, procedureSourceUrls]);

  const memoizedHandleAddProcedureDocument = useMemo(() => () => {
    if (!currentProcedureNameToUpload.trim()) { 
      setPdfUploadError("Introduce un nombre para el trámite."); 
      return; 
    }
    if (!currentPdfFile) { 
      setPdfUploadError("Selecciona un archivo PDF."); 
      return; 
    }
    if (uploadedProcedureDocuments.find(doc => doc.procedureName.toLowerCase() === currentProcedureNameToUpload.trim().toLowerCase())) {
      setPdfUploadError("Ya existe un documento con este nombre de trámite."); 
      return;
    }
    setPdfUploadError(null);
    const reader = new FileReader();
    reader.readAsDataURL(currentPdfFile);
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      const newDocument: UploadedProcedureDocument = { 
        procedureName: currentProcedureNameToUpload.trim(), 
        fileName: currentPdfFile.name, 
        mimeType: currentPdfFile.type, 
        base64Data 
      };
      setUploadedProcedureDocuments([...uploadedProcedureDocuments, newDocument]);
      setCurrentProcedureNameToUpload(''); 
      setCurrentPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = (error) => { 
      console.error("Error reading PDF:", error); 
      setPdfUploadError("Error al leer el PDF."); 
    };
  }, [currentProcedureNameToUpload, currentPdfFile, uploadedProcedureDocuments]);

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
                            <Avatar className="h-16 w-16 border-2 border-border">
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
                        <Button variant="outline" asChild>
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="web-ayuntamiento">Web Oficial del Ayuntamiento</Label>
                      <Input
                        id="web-ayuntamiento"
                        type="url"
                        value={procedureSourceUrls[0] || ''}
                        onChange={(e) => {
                          const newUrls = [...procedureSourceUrls];
                          newUrls[0] = e.target.value;
                          setProcedureSourceUrls(newUrls);
                        }}
                        placeholder="https://www.ayuntamiento.ejemplo.es"
                      />
                      <p className="text-sm text-muted-foreground">
                        Enlace principal a la web oficial del ayuntamiento para información general.
                      </p>
                      <div className="mt-2">
                        {/* Inline Crawler */}
                        <div className="text-sm font-medium mb-1">Indexación automática</div>
                        <React.Suspense fallback={null}>
                          {procedureSourceUrls[0] && (
                            // Carga perezosa para evitar coste si no se usa
                            <LazyAyuntamientoCrawlerInline startUrl={procedureSourceUrls[0]} />
                          )}
                        </React.Suspense>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sede-url">URL Sede Electrónica</Label>
                      <Input
                        id="sede-url"
                        type="url"
                        value={sedeElectronicaUrl}
                        onChange={(e) => setSedeElectronicaUrl(e.target.value)}
                        placeholder="https://sede.ejemplo.es"
                      />
                      <p className="text-sm text-muted-foreground">
                        Enlace principal a la Sede Electrónica para trámites.
                      </p>
                    </div>
                  </div>
                </ModernCard>

                <ModernCard icon={<Settings className="h-5 w-5" />} title="Funcionalidades">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Habilitar Búsqueda de Google</Label>
                        <p className="text-sm text-muted-foreground">
                          Permite buscar en la web (restringido al municipio si está configurado).
                        </p>
                      </div>
                      <Switch
                        checked={enableGoogleSearch}
                        onCheckedChange={setEnableGoogleSearch}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Permitir Mostrar Mapas</Label>
                        <p className="text-sm text-muted-foreground">
                          Muestra mapas de Google. {!apiKeyForMaps && "(API Key de Mapas no disponible)"}
                        </p>
                      </div>
                      <Switch
                        checked={allowMapDisplay}
                        onCheckedChange={setAllowMapDisplay}
                        disabled={!apiKeyForMaps}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Habilitar Geolocalización</Label>
                        <p className="text-sm text-muted-foreground">
                          Usa tu ubicación (con permiso) para contexto.
                        </p>
                      </div>
                      <Switch
                        checked={allowGeolocation}
                        onCheckedChange={setAllowGeolocation}
                      />
                    </div>
                  </div>
                </ModernCard>

                <Card>
                  <CardHeader>
                    <CardTitle>Personalización Avanzada</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="system-instruction">Instrucciones Adicionales del Sistema</Label>
                      <Textarea
                        id="system-instruction"
                        value={systemInstruction}
                        onChange={(e) => setSystemInstruction(e.target.value)}
                        placeholder="Ej: Prioriza opciones de bajo costo. Sé amigable."
                        rows={4}
                      />
                      <p className="text-sm text-muted-foreground">
                        Directrices específicas. Se combinarán con otras configuraciones.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Áreas de Especialización</Label>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_SERVICE_TAGS.map(tag => (
                          <Badge
                            key={tag}
                            variant={selectedServiceTags.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => handleToggleServiceTag(tag)}
                          >
                            {tag}
                            {selectedServiceTags.includes(tag) && (
                              <X className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Prompts Recomendados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newPrompt}
                        onChange={(e) => setNewPrompt(e.target.value)}
                        placeholder="Ej: ¿Dónde está la biblioteca municipal?"
                        className="flex-1"
                      />
                      <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
                        {React.createElement(getIconComponent(newPromptIcon), { className: "h-4 w-4" })}
                      </Avatar>
                      <Button 
                        onClick={memoizedHandleAddPrompt} 
                        disabled={!newPrompt.trim()}
                      >
                        Añadir
                      </Button>
                    </div>
                    
                    {recommendedPrompts.length > 0 && (
                      <div className="space-y-2">
                        {recommendedPrompts.map((prompt, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                              {React.createElement(getIconComponent(prompt.img), { className: "h-4 w-4" })}
                            </Avatar>
                            <Input
                              value={prompt.text}
                              readOnly
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemovePrompt(index)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Fuentes de Trámites (URLs)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        value={newProcedureUrl}
                        onChange={(e) => setNewProcedureUrl(e.target.value)}
                        placeholder="Nueva URL de Trámite"
                        className="flex-1"
                      />
                      <Button
                        onClick={memoizedHandleAddProcedureUrl}
                        disabled={!newProcedureUrl.trim() || !isValidUrl(newProcedureUrl.trim())}
                      >
                        Añadir URL
                      </Button>
                    </div>
                    
                    {procedureSourceUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {procedureSourceUrls.map((url, index) => (
                          <Badge key={index} variant="secondary" className="max-w-full">
                            <span className="truncate">{url}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleRemoveProcedureUrl(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Documentos de Trámites (PDF)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="procedure-name">Nombre del Trámite para PDF</Label>
                      <Input
                        id="procedure-name"
                        value={currentProcedureNameToUpload}
                        onChange={(e) => setCurrentProcedureNameToUpload(e.target.value)}
                      />
                    </div>
                    
                    <Button variant="outline" asChild className="w-full">
                      <label>
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar PDF
                        <input
                          type="file"
                          hidden
                          accept=".pdf"
                          ref={fileInputRef}
                          onChange={handlePdfFileChange}
                        />
                      </label>
                    </Button>
                    
                    {currentPdfFile && (
                      <p className="text-sm text-muted-foreground">
                        Archivo seleccionado: {currentPdfFile.name}
                      </p>
                    )}
                    
                    {pdfUploadError && (
                      <Alert variant="destructive" className="py-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{pdfUploadError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button
                      onClick={memoizedHandleAddProcedureDocument}
                      disabled={!currentProcedureNameToUpload.trim() || !currentPdfFile}
                      className="w-full"
                    >
                      Adjuntar PDF al Trámite
                    </Button>
                    
                    {uploadedProcedureDocuments.length > 0 && (
                      <div className="space-y-2">
                        <Label>PDFs adjuntados:</Label>
                        <div className="flex flex-wrap gap-2">
                          {uploadedProcedureDocuments.map((doc) => (
                            <Badge key={doc.procedureName} variant="secondary" className="max-w-full">
                              <span className="truncate">{doc.procedureName} ({doc.fileName})</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleRemoveProcedureDocument(doc.procedureName)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-center text-sm text-muted-foreground italic">
                      Límite de 5MB por PDF. Los PDFs se guardan en el navegador.
                    </p>
                  </CardContent>
                </Card>

              </TabsContent>

              <TabsContent value="share" className="space-y-6">
                <CityLinkManager assistantNameOverride={assistantName} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {activeTab === 'customize' && (
          <div className="sticky bottom-0 z-10 bg-background border-t border-border p-4">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-2 justify-end">
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleResetToAppDefaults}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restablecer
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Restablecer a los valores por defecto del Asistente</p>
                </TooltipContent>
              </Tooltip>
              <Button onClick={handleSaveAndClose}>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default FinetuningPage;

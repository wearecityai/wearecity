import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Box, Container, Typography, TextField, Button, Switch, FormControlLabel, FormGroup, Grid, Paper, Stack,
    IconButton, Chip, Select, MenuItem, InputLabel, FormControl, Alert, FormHelperText, Tooltip, useTheme, useMediaQuery,
    Tabs, Tab
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import TuneIcon from '@mui/icons-material/Tune';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import MapIcon from '@mui/icons-material/Map';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import FolderIcon from '@mui/icons-material/Folder';
import * as Icons from '@mui/icons-material';
import Avatar from '@mui/material/Avatar';

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

// Componente de tarjeta moderna fuera del componente principal para evitar re-renders
const ModernCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = React.memo(({ icon, title, children, ...props }) => {
  const theme = useTheme();
  
  return (
    <Paper elevation={0} sx={{ 
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 2,
      overflow: 'hidden',
      bgcolor: 'background.paper',
      '&:hover': {
        boxShadow: theme.shadows[2]
      }
    }} {...props}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        p: 2.5, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
      }}>
        <Box sx={{ 
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center'
        }}>
          {icon}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.primary' }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2.5 }}>
        {children}
      </Box>
    </Paper>
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

const FinetuningPage: React.FC<FinetuningPageProps> = ({ currentConfig, onSave, onCancel, googleMapsScriptLoaded, apiKeyForMaps, profileImagePreview, setProfileImagePreview, activeTab: externalActiveTab, onTabChange }) => {
  const [assistantName, setAssistantName] = useState(currentConfig.assistantName);
  const [systemInstruction, setSystemInstruction] = useState(currentConfig.systemInstruction);
  const [recommendedPrompts, setRecommendedPrompts] = useState<RecommendedPrompt[]>(() => {
    // Asegurar que recommendedPrompts sea siempre un array
    const prompts = currentConfig.recommendedPrompts;
    return Array.isArray(prompts) ? prompts : [];
  });
  const [selectedServiceTags, setSelectedServiceTags] = useState<string[]>(() => {
    // Asegurar que serviceTags sea siempre un array
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
  const [internalActiveTab, setInternalActiveTab] = useState(0);
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setActiveTab = onTabChange || setInternalActiveTab;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Incluir tablet como mobile

  // Solo sincronizar el estado local si cambia la ciudad base (o un id único de config)
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
      setProfileImageUrl(profileImagePreview !== undefined ? profileImagePreview : (currentConfig.profileImageUrl || ''));
      lastCityRef.current = currentConfig.restrictedCity?.name;
    }
  }, [currentConfig.restrictedCity?.name, profileImagePreview]);

  // Actualizar automáticamente el icono cuando cambia el prompt
  useEffect(() => {
    if (newPrompt.trim()) {
      const autoIcon = getAutomaticIcon(newPrompt.trim());
      setNewPromptIcon(autoIcon);
    } else {
      setNewPromptIcon('help');
    }
  }, [newPrompt]);

  // Helper function to get Material UI icon component by name (copiado de ChatContainer)
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'event': Icons.Event, 'restaurant': Icons.Restaurant, 'directions_bus': Icons.DirectionsBus,
      'schedule': Icons.Schedule, 'library': Icons.LocalLibrary, 'museum': Icons.Museum,
      'hospital': Icons.LocalHospital, 'pharmacy': Icons.LocalPharmacy, 'police': Icons.LocalPolice,
      'emergency': Icons.Warning, 'weather': Icons.WbSunny, 'tourism': Icons.Place,
      'help': Icons.Help, 'info': Icons.Info, 'location': Icons.LocationOn, 'map': Icons.Map,
      'parking': Icons.LocalParking, 'taxi': Icons.LocalTaxi, 'train': Icons.Train,
      'airport': Icons.Flight, 'hotel': Icons.Hotel, 'shopping': Icons.ShoppingCart,
      'school': Icons.School, 'government': Icons.AccountBalance, 'nature': Icons.Nature,
      'wifi': Icons.Wifi, 'attach_money': Icons.AttachMoney, 'music': Icons.MusicNote,
      'sports': Icons.SportsScore, 'palette': Icons.Palette, 'warning': Icons.Warning,
      'place': Icons.Place, 'local_gas_station': Icons.LocalGasStation,
    };
    
    return iconMap[iconName.toLowerCase()] || Icons.Help;
  };

  // Función para asignar automáticamente un icono basado en el texto del prompt
  const getAutomaticIcon = (promptText: string): string => {
    const text = promptText.toLowerCase();
    
    // Palabras clave para eventos y tiempo
    if (text.includes('evento') || text.includes('actividad') || text.includes('fin de semana') || 
        text.includes('festival') || text.includes('concierto') || text.includes('fiesta') ||
        text.includes('celebración') || text.includes('espectáculo')) {
      return 'event';
    }
    
    // Palabras clave para restaurantes y comida
    if (text.includes('restaurante') || text.includes('comida') || text.includes('comer') ||
        text.includes('cenar') || text.includes('almorzar') || text.includes('desayunar') ||
        text.includes('bar') || text.includes('cafetería') || text.includes('italiano') ||
        text.includes('chino') || text.includes('pizza') || text.includes('tapas') ||
        text.includes('menú') || text.includes('plato')) {
      return 'restaurant';
    }
    
    // Palabras clave para transporte
    if (text.includes('llegar') || text.includes('ir a') || text.includes('cómo llego') ||
        text.includes('transporte') || text.includes('autobús') || text.includes('bus') ||
        text.includes('metro') || text.includes('tren') || text.includes('taxi') ||
        text.includes('público') || text.includes('dirección') || text.includes('ruta')) {
      return 'directions_bus';
    }
    
    // Palabras clave para horarios y tiempo
    if (text.includes('horario') || text.includes('hora') || text.includes('abierto') ||
        text.includes('cerrado') || text.includes('abre') || text.includes('cierra') ||
        text.includes('cuándo') || text.includes('tiempo') || text.includes('schedule')) {
      return 'schedule';
    }
    
    // Palabras clave para biblioteca
    if (text.includes('biblioteca') || text.includes('libro') || text.includes('leer') ||
        text.includes('estudio') || text.includes('préstamo')) {
      return 'library';
    }
    
    // Palabras clave para museos y cultura
    if (text.includes('museo') || text.includes('arte') || text.includes('cultura') ||
        text.includes('exposición') || text.includes('galería') || text.includes('historia')) {
      return 'museum';
    }
    
    // Palabras clave para salud
    if (text.includes('hospital') || text.includes('médico') || text.includes('doctor') ||
        text.includes('urgencias') || text.includes('emergencia') || text.includes('salud')) {
      return 'hospital';
    }
    
    // Palabras clave para farmacia
    if (text.includes('farmacia') || text.includes('medicamento') || text.includes('medicina') ||
        text.includes('receta')) {
      return 'pharmacy';
    }
    
    // Palabras clave para policía y seguridad
    if (text.includes('policía') || text.includes('seguridad') || text.includes('denuncia') ||
        text.includes('comisaría')) {
      return 'police';
    }
    
    // Palabras clave para tiempo/meteorología
    if (text.includes('tiempo') || text.includes('clima') || text.includes('lluvia') ||
        text.includes('sol') || text.includes('temperatura') || text.includes('meteorológico')) {
      return 'weather';
    }
    
    // Palabras clave para ubicación y mapas
    if (text.includes('dónde está') || text.includes('ubicación') || text.includes('dirección') ||
        text.includes('mapa') || text.includes('cerca') || text.includes('lejos')) {
      return 'location';
    }
    
    // Palabras clave para parking
    if (text.includes('parking') || text.includes('aparcamiento') || text.includes('aparcar') ||
        text.includes('estacionar')) {
      return 'parking';
    }
    
    // Palabras clave para hoteles
    if (text.includes('hotel') || text.includes('alojamiento') || text.includes('dormir') ||
        text.includes('hospedaje') || text.includes('pension')) {
      return 'hotel';
    }
    
    // Palabras clave para compras
    if (text.includes('comprar') || text.includes('tienda') || text.includes('shopping') ||
        text.includes('centro comercial') || text.includes('mercado')) {
      return 'shopping';
    }
    
    // Palabras clave para educación
    if (text.includes('escuela') || text.includes('colegio') || text.includes('universidad') ||
        text.includes('educación') || text.includes('estudiar')) {
      return 'school';
    }
    
    // Palabras clave para gobierno/administración
    if (text.includes('ayuntamiento') || text.includes('trámite') || text.includes('gobierno') ||
        text.includes('municipal') || text.includes('oficina') || text.includes('gestión') ||
        text.includes('documento') || text.includes('certificado')) {
      return 'government';
    }
    
    // Palabras clave para dinero/pagos
    if (text.includes('pagar') || text.includes('precio') || text.includes('coste') ||
        text.includes('dinero') || text.includes('euro') || text.includes('tarjeta') ||
        text.includes('cajero')) {
      return 'attach_money';
    }
    
    // Palabras clave para información y ayuda
    if (text.includes('información') || text.includes('info') || text.includes('ayuda') ||
        text.includes('cómo') || text.includes('qué es') || text.includes('explicar')) {
      return 'info';
    }
    
    // Por defecto, si no coincide con ninguna categoría
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
  const handleToggleServiceTag = (tag: string) => setSelectedServiceTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  const handleClearRestrictedCity = () => setMunicipalityInputName('');
  const isValidUrl = (url: string): boolean => { try { new URL(url); return url.startsWith('http://') || url.startsWith('https://'); } catch (_) { return false; } };
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
        if (file.size > 5 * 1024 * 1024) { setPdfUploadError("PDF demasiado grande (máx 5MB)."); setCurrentPdfFile(null); }
        else setCurrentPdfFile(file);
      } else { setPdfUploadError("Selecciona un archivo PDF."); setCurrentPdfFile(null); }
    } else setCurrentPdfFile(null);
  };

  const handleAddProcedureDocument = () => {
    if (!currentProcedureNameToUpload.trim()) { setPdfUploadError("Introduce un nombre para el trámite."); return; }
    if (!currentPdfFile) { setPdfUploadError("Selecciona un archivo PDF."); return; }
    if (uploadedProcedureDocuments.find(doc => doc.procedureName.toLowerCase() === currentProcedureNameToUpload.trim().toLowerCase())) {
      setPdfUploadError("Ya existe un documento con este nombre de trámite."); return;
    }
    setPdfUploadError(null);
    const reader = new FileReader();
    reader.readAsDataURL(currentPdfFile);
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      const newDocument: UploadedProcedureDocument = { procedureName: currentProcedureNameToUpload.trim(), fileName: currentPdfFile.name, mimeType: currentPdfFile.type, base64Data };
      setUploadedProcedureDocuments([...uploadedProcedureDocuments, newDocument]);
      setCurrentProcedureNameToUpload(''); setCurrentPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = (error) => { console.error("Error reading PDF:", error); setPdfUploadError("Error al leer el PDF."); };
  };
  const handleRemoveProcedureDocument = (name: string) => setUploadedProcedureDocuments(uploadedProcedureDocuments.filter(doc => doc.procedureName !== name));

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfileImageError(null);
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type.startsWith('image/')) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleShareClick = () => {
    setActiveTab(1); // Cambiar a la pestaña "Compartir"
  };

  const handleSave = () => {
    const finalRestrictedCity: RestrictedCityInfo | null = municipalityInputName.trim() ? { name: municipalityInputName.trim() } : null;
    
    const configToSend = {
      assistantName: assistantName.trim() || DEFAULT_ASSISTANT_NAME,
      systemInstruction: systemInstruction.trim(), 
      recommendedPrompts, 
      serviceTags: selectedServiceTags,
      enableGoogleSearch, 
      allowMapDisplay, 
      allowGeolocation, 
      restrictedCity: finalRestrictedCity,
      currentLanguageCode, 
      procedureSourceUrls, 
      uploadedProcedureDocuments,
      sedeElectronicaUrl: sedeElectronicaUrl.trim() || undefined,
      profileImageUrl: profileImageUrl.trim() || undefined,
    };
    
    console.log('🎛️ FinetuningPage sending config:', configToSend);
    onSave(configToSend);
    if (setProfileImagePreview) setProfileImagePreview(undefined); // Limpiar preview tras guardar
  };

  const handleSaveAndClose = () => {
    handleSave();
    // Cerrar el panel inmediatamente
    if (isMobile) onCancel();
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
    setCurrentLanguageCode(DEFAULT_CHAT_CONFIG.currentLanguageCode);
    setProcedureSourceUrls([...DEFAULT_CHAT_CONFIG.procedureSourceUrls]); setNewProcedureUrl('');
    setUploadedProcedureDocuments([...DEFAULT_CHAT_CONFIG.uploadedProcedureDocuments]);
    setCurrentPdfFile(null); setCurrentProcedureNameToUpload(''); setPdfUploadError(null);
    setSedeElectronicaUrl(DEFAULT_CHAT_CONFIG.sedeElectronicaUrl || '');
    setProfileImageUrl(DEFAULT_CHAT_CONFIG.profileImageUrl || '');
    if (profileImageInputRef.current) profileImageInputRef.current.value = "";
  };

  // Memoizar funciones para evitar recreaciones innecesarias
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
    if (!currentProcedureNameToUpload.trim()) { setPdfUploadError("Introduce un nombre para el trámite."); return; }
    if (!currentPdfFile) { setPdfUploadError("Selecciona un archivo PDF."); return; }
    if (uploadedProcedureDocuments.find(doc => doc.procedureName.toLowerCase() === currentProcedureNameToUpload.trim().toLowerCase())) {
      setPdfUploadError("Ya existe un documento con este nombre de trámite."); return;
    }
    setPdfUploadError(null);
    const reader = new FileReader();
    reader.readAsDataURL(currentPdfFile);
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      const newDocument: UploadedProcedureDocument = { procedureName: currentProcedureNameToUpload.trim(), fileName: currentPdfFile.name, mimeType: currentPdfFile.type, base64Data };
      setUploadedProcedureDocuments([...uploadedProcedureDocuments, newDocument]);
      setCurrentProcedureNameToUpload(''); setCurrentPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = (error) => { console.error("Error reading PDF:", error); setPdfUploadError("Error al leer el PDF."); };
  }, [currentProcedureNameToUpload, currentPdfFile, uploadedProcedureDocuments]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="md" sx={{ flexGrow: 1, overflowY: 'auto', py: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="Configuración del asistente">
            <Tab label="Personalizar" />
            <Tab label="Compartir" />
          </Tabs>
        </Box>
        
        {activeTab === 0 && (
          <Stack spacing={3}>
            <ModernCard icon={<PersonIcon />} title="Información General">
              <Stack spacing={2}>
                <TextField
                  fullWidth label="Nombre del Asistente" value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)} placeholder={DEFAULT_ASSISTANT_NAME}
                  variant="outlined"
                />
                
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Foto de Perfil del Chat</Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {profileImageUrl && (
                      <Box sx={{ position: 'relative' }}>
                        <img 
                          src={profileImageUrl} 
                          alt="Profile preview" 
                          style={{ 
                            width: 64, 
                            height: 64, 
                            borderRadius: '50%', 
                            objectFit: 'cover',
                            border: `2px solid ${theme.palette.divider}`
                          }} 
                        />
                        <IconButton
                          onClick={handleRemoveProfileImage}
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'error.main',
                            color: 'white',
                            width: 24,
                            height: 24,
                            '&:hover': { bgcolor: 'error.dark' }
                          }}
                          size="small"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<UploadFileIcon />}
                    >
                      {profileImageUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        ref={profileImageInputRef}
                        onChange={handleProfileImageChange}
                      />
                    </Button>
                  </Stack>
                  {profileImageError && (
                    <Alert severity="error" variant="standard" sx={{ py: 0.5, mt: 1 }}>
                      {profileImageError}
                    </Alert>
                  )}
                  <FormHelperText sx={{ mt: 1 }}>
                    Imagen que aparecerá en el mensaje de bienvenida. Formatos: JPG, PNG, GIF. Máximo 2MB.
                  </FormHelperText>
                </Box>

                <FormControl fullWidth variant="outlined">
                  <InputLabel id="language-select-label">Idioma</InputLabel>
                  <Select
                    labelId="language-select-label" label="Idioma" value={currentLanguageCode}
                    onChange={(e) => setCurrentLanguageCode(e.target.value as string)}
                  >
                    {SUPPORTED_LANGUAGES.map(lang => <MenuItem key={lang.code} value={lang.code}>{lang.flagEmoji} {lang.name} ({lang.abbr})</MenuItem>)}
                  </Select>
                  <FormHelperText>El asistente responderá en este idioma.</FormHelperText>
                </FormControl>
              </Stack>
            </ModernCard>

            <ModernCard icon={<LocationOnIcon />} title="Contexto y Restricciones">
              <Stack spacing={2}>
                {/* Reemplazo del TextField manual por CityGoogleAutocomplete */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Restringir a Municipio (Opcional)</Typography>
                  {currentConfig.restrictedCity ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body1">
                        {currentConfig.restrictedCity.name}
                      </Typography>
                      <Button size="small" variant="outlined" color="secondary" onClick={() => {
                        setMunicipalityInputName('');
                        // Limpiar el objeto restringido
                        onSave({ ...currentConfig, restrictedCity: null });
                      }}>
                        Cambiar ciudad
                      </Button>
                    </Box>
                  ) : (
                    <CityGoogleAutocomplete
                      onSelect={(cityObj) => {
                        setMunicipalityInputName(cityObj.name);
                        // Guardar el objeto completo en el config temporal
                        onSave({ ...currentConfig, restrictedCity: cityObj });
                      }}
                      disabled={false}
                    />
                  )}
                </Box>
                <TextField
                  fullWidth label="URL Sede Electrónica (Opcional)" value={sedeElectronicaUrl} type="url"
                  onChange={(e) => setSedeElectronicaUrl(e.target.value)} placeholder="https://sede.ejemplo.es"
                  variant="outlined" helperText="Enlace principal a la Sede Electrónica para trámites."
                />
              </Stack>
            </ModernCard>

            <ModernCard icon={<SettingsIcon />} title="Funcionalidades">
              <FormGroup>
                <FormControlLabel control={<Switch checked={enableGoogleSearch} onChange={(e) => setEnableGoogleSearch(e.target.checked)} />}
                  label="Habilitar Búsqueda de Google"
                />
                <FormHelperText sx={{ml:4, mt:-0.5}}>Permite buscar en la web (restringido al municipio si está configurado).</FormHelperText>

                <FormControlLabel control={<Switch checked={allowMapDisplay} onChange={(e) => setAllowMapDisplay(e.target.checked)} disabled={!apiKeyForMaps} />}
                  label="Permitir Mostrar Mapas"
                />
                <FormHelperText sx={{ml:4, mt:-0.5}}>Muestra mapas de Google. {!apiKeyForMaps && "(API Key de Mapas no disponible)"}</FormHelperText>
                
                <FormControlLabel control={<Switch checked={allowGeolocation} onChange={(e) => setAllowGeolocation(e.target.checked)} />}
                  label="Habilitar Geolocalización"
                />
                <FormHelperText sx={{ml:4, mt:-0.5}}>Usa tu ubicación (con permiso) para contexto.</FormHelperText>
              </FormGroup>
            </ModernCard>

            <Paper elevation={0} variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="h6" gutterBottom>Personalización Avanzada</Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth multiline rows={4} label="Instrucciones Adicionales del Sistema"
                  value={systemInstruction} onChange={(e) => setSystemInstruction(e.target.value)}
                  placeholder="Ej: Prioriza opciones de bajo costo. Sé amigable." variant="outlined"
                  helperText="Directrices específicas. Se combinarán con otras configuraciones."
                />
                <Typography variant="subtitle1" sx={{mb:-1}}>Áreas de Especialización</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {AVAILABLE_SERVICE_TAGS.map(tag => (
                    <Chip key={tag} label={tag} clickable
                      color={selectedServiceTags.includes(tag) ? "primary" : "default"}
                      onClick={() => handleToggleServiceTag(tag)}
                      onDelete={selectedServiceTags.includes(tag) ? () => handleToggleServiceTag(tag) : undefined}
                      deleteIcon={selectedServiceTags.includes(tag) ? <ClearIcon /> : undefined}
                    />
                  ))}
                </Box>
              </Stack>
            </Paper>
            
            <Paper elevation={0} variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="h6" gutterBottom>
                Prompts Recomendados
              </Typography>
              <Stack direction="row" spacing={1} mb={2}>
                <TextField 
                  fullWidth 
                  label="Nuevo Prompt" 
                  value={newPrompt} 
                  onChange={(e) => setNewPrompt(e.target.value)} 
                  size="small" 
                  variant="outlined"
                  placeholder="Ej: ¿Dónde está la biblioteca municipal?"
                />
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', transition: 'all 0.3s', flexShrink: 0 }}>
                  {React.createElement(getIconComponent(newPromptIcon), { sx: { fontSize: 18 } })}
                </Avatar>
                <Button variant="contained" onClick={memoizedHandleAddPrompt} disabled={!newPrompt.trim()} sx={{flexShrink:0}}>Añadir</Button>
              </Stack>
              {recommendedPrompts.length > 0 && (
                <Stack spacing={1}>
                  {recommendedPrompts.map((prompt, index) => (
                    <Stack key={index} direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {React.createElement(getIconComponent(prompt.img), { sx: { fontSize: 18 } })}
                      </Avatar>
                      <TextField
                        value={prompt.text}
                        size="small"
                        variant="outlined"
                        InputProps={{ readOnly: true }}
                        sx={{ flex: 1 }}
                      />
                      <Button color="error" onClick={() => handleRemovePrompt(index)}>Eliminar</Button>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Paper>

            <Paper elevation={0} variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="h6" gutterBottom>Fuentes de Trámites (URLs)</Typography>
              <Stack direction="row" spacing={1} mb={procedureSourceUrls.length > 0 ? 2 : 0}>
                <TextField fullWidth label="Nueva URL de Trámite" value={newProcedureUrl} onChange={(e) => setNewProcedureUrl(e.target.value)} type="url" size="small" variant="outlined"/>
                <Button variant="contained" onClick={memoizedHandleAddProcedureUrl} disabled={!newProcedureUrl.trim() || !isValidUrl(newProcedureUrl.trim())} sx={{flexShrink:0}}>Añadir URL</Button>
              </Stack>
              {procedureSourceUrls.length > 0 && (
                <Stack spacing={1}>
                  {procedureSourceUrls.map((url, index) => (
                    <Chip key={index} label={url} onDelete={() => handleRemoveProcedureUrl(index)} sx={{maxWidth: '100%', '& .MuiChip-label': {overflow: 'hidden', textOverflow: 'ellipsis'}}}/>
                  ))}
                </Stack>
              )}
            </Paper>

            <Paper elevation={0} variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="h6" gutterBottom>Documentos de Trámites (PDF)</Typography>
              <Stack spacing={2}>
                <TextField fullWidth label="Nombre del Trámite para PDF" value={currentProcedureNameToUpload} onChange={(e) => setCurrentProcedureNameToUpload(e.target.value)} size="small" variant="outlined"/>
                <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} fullWidth>
                  Seleccionar PDF
                  <input type="file" hidden accept=".pdf" ref={fileInputRef} onChange={handlePdfFileChange} />
                </Button>
                {currentPdfFile && <Typography variant="caption" color="text.secondary">Archivo seleccionado: {currentPdfFile.name}</Typography>}
                {pdfUploadError && <Alert severity="error" variant="standard" sx={{py:0.5}}>{pdfUploadError}</Alert>}
                <Button variant="contained" onClick={memoizedHandleAddProcedureDocument} disabled={!currentProcedureNameToUpload.trim() || !currentPdfFile}>Adjuntar PDF al Trámite</Button>
                {uploadedProcedureDocuments.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{mt:1}}>PDFs adjuntados:</Typography>
                    <Stack spacing={1} mt={1}>
                      {uploadedProcedureDocuments.map((doc) => (
                        <Chip key={doc.procedureName} label={`${doc.procedureName} (${doc.fileName})`} onDelete={() => handleRemoveProcedureDocument(doc.procedureName)} />
                      ))}
                    </Stack>
                  </Box>
                )}
                <FormHelperText sx={{textAlign:'center', fontStyle:'italic'}}>Límite de 5MB por PDF. Los PDFs se guardan en el navegador.</FormHelperText>
              </Stack>
            </Paper>
          </Stack>
        )}

        {activeTab === 1 && (
          <Stack spacing={3}>
            <CityLinkManager />
          </Stack>
        )}
      </Container>
      
      {activeTab === 0 && (
        <Paper square elevation={0} sx={{ p: 2, position: 'sticky', bottom: 0, zIndex: 10, bgcolor: 'background.default', borderTop: `1px solid ${theme.palette.divider}` }}>
          <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} justifyContent="flex-end">
            <Button variant="outlined" color="inherit" onClick={onCancel} startIcon={<CancelIcon />}>Cancelar</Button>
            <Tooltip title="Restablecer a los valores por defecto del Asistente">
              <Button variant="outlined" color="warning" onClick={handleResetToAppDefaults} startIcon={<RestartAltIcon />}>Restablecer</Button>
            </Tooltip>
            <Button variant="contained" color="primary" onClick={handleSaveAndClose} startIcon={<SaveIcon />}>Guardar</Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default FinetuningPage;

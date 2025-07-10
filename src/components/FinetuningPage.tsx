import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Container, Typography, TextField, Button, Switch, FormControlLabel, FormGroup, Grid, Paper, Stack,
    IconButton, Chip, Select, MenuItem, InputLabel, FormControl, Alert, FormHelperText, Tooltip, useTheme, useMediaQuery
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear'; // Replaces XCircleIcon
import UploadFileIcon from '@mui/icons-material/UploadFile'; // Replaces UploadIcon
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';

import { CustomChatConfig, RestrictedCityInfo, SupportedLanguage, UploadedProcedureDocument } from '../types';
import {
  DEFAULT_ASSISTANT_NAME,
  AVAILABLE_SERVICE_TAGS,
  DEFAULT_CHAT_CONFIG,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE_CODE,
} from '../constants';


interface FinetuningPageProps {
  currentConfig: CustomChatConfig;
  onSave: (newConfig: CustomChatConfig) => void;
  onCancel: () => void;
  googleMapsScriptLoaded: boolean;
  apiKeyForMaps: string;
}

const FinetuningPage: React.FC<FinetuningPageProps> = ({ currentConfig, onSave, onCancel, googleMapsScriptLoaded, apiKeyForMaps }) => {
  const [assistantName, setAssistantName] = useState(currentConfig.assistantName);
  const [systemInstruction, setSystemInstruction] = useState(currentConfig.systemInstruction);
  const [recommendedPrompts, setRecommendedPrompts] = useState<string[]>(currentConfig.recommendedPrompts || []);
  const [selectedServiceTags, setSelectedServiceTags] = useState<string[]>(currentConfig.serviceTags || []);
  const [enableGoogleSearch, setEnableGoogleSearch] = useState<boolean>(currentConfig.enableGoogleSearch);
  const [allowMapDisplay, setAllowMapDisplay] = useState<boolean>(currentConfig.allowMapDisplay);
  const [allowGeolocation, setAllowGeolocation] = useState<boolean>(currentConfig.allowGeolocation);
  const [newPrompt, setNewPrompt] = useState('');
  const [currentLanguageCode, setCurrentLanguageCode] = useState<string>(currentConfig.currentLanguageCode || DEFAULT_LANGUAGE_CODE);
  const [municipalityInputName, setMunicipalityInputName] = useState<string>('');
  const [procedureSourceUrls, setProcedureSourceUrls] = useState<string[]>([]);
  const [newProcedureUrl, setNewProcedureUrl] = useState<string>('');
  const [uploadedProcedureDocuments, setUploadedProcedureDocuments] = useState<UploadedProcedureDocument[]>([]);
  const [currentPdfFile, setCurrentPdfFile] = useState<File | null>(null);
  const [currentProcedureNameToUpload, setCurrentProcedureNameToUpload] = useState<string>('');
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sedeElectronicaUrl, setSedeElectronicaUrl] = useState<string>('');
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const [profileImageError, setProfileImageError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setAssistantName(currentConfig.assistantName || DEFAULT_CHAT_CONFIG.assistantName);
    setSystemInstruction(typeof currentConfig.systemInstruction === 'string' ? currentConfig.systemInstruction : DEFAULT_CHAT_CONFIG.systemInstruction);
    setRecommendedPrompts(currentConfig.recommendedPrompts || DEFAULT_CHAT_CONFIG.recommendedPrompts);
    setSelectedServiceTags(currentConfig.serviceTags || DEFAULT_CHAT_CONFIG.serviceTags);
    setEnableGoogleSearch(currentConfig.enableGoogleSearch === undefined ? DEFAULT_CHAT_CONFIG.enableGoogleSearch : currentConfig.enableGoogleSearch);
    setAllowMapDisplay(currentConfig.allowMapDisplay === undefined ? DEFAULT_CHAT_CONFIG.allowMapDisplay : currentConfig.allowMapDisplay);
    setAllowGeolocation(currentConfig.allowGeolocation === undefined ? DEFAULT_CHAT_CONFIG.allowGeolocation : currentConfig.allowGeolocation);
    setCurrentLanguageCode(currentConfig.currentLanguageCode || DEFAULT_CHAT_CONFIG.currentLanguageCode);
    setProcedureSourceUrls(currentConfig.procedureSourceUrls || DEFAULT_CHAT_CONFIG.procedureSourceUrls);
    setUploadedProcedureDocuments(currentConfig.uploadedProcedureDocuments || DEFAULT_CHAT_CONFIG.uploadedProcedureDocuments);
    setSedeElectronicaUrl(currentConfig.sedeElectronicaUrl || DEFAULT_CHAT_CONFIG.sedeElectronicaUrl || '');
    setMunicipalityInputName(currentConfig.restrictedCity?.name || '');
    setProfileImageUrl(currentConfig.profileImageUrl || '');
  }, [currentConfig]);

  const handleAddPrompt = () => {
    if (newPrompt.trim() && !recommendedPrompts.includes(newPrompt.trim())) {
      setRecommendedPrompts([...recommendedPrompts, newPrompt.trim()]);
      setNewPrompt('');
    }
  };
  const handleRemovePrompt = (index: number) => setRecommendedPrompts(recommendedPrompts.filter((_, i) => i !== index));
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
    if (profileImageInputRef.current) {
      profileImageInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    const finalRestrictedCity: RestrictedCityInfo | null = municipalityInputName.trim() ? { name: municipalityInputName.trim() } : null;
    onSave({
      assistantName: assistantName.trim() || DEFAULT_ASSISTANT_NAME,
      systemInstruction: systemInstruction.trim(), recommendedPrompts, serviceTags: selectedServiceTags,
      enableGoogleSearch, allowMapDisplay, allowGeolocation, restrictedCity: finalRestrictedCity,
      currentLanguageCode, procedureSourceUrls, uploadedProcedureDocuments,
      sedeElectronicaUrl: sedeElectronicaUrl.trim() || undefined,
      profileImageUrl: profileImageUrl.trim() || undefined,
    });
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      <Paper square elevation={0} sx={{ p: 2, position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" component="h1" fontWeight="medium">Personalizar Asistente</Typography>
        </Box>
        <IconButton aria-label="Cerrar" onClick={onCancel} size="large" sx={{ ml: 2 }}>
          <CloseIcon />
        </IconButton>
      </Paper>
      <Container maxWidth="md" sx={{ flexGrow: 1, overflowY: 'auto', py: 3 }}>
        <Stack spacing={3}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="h6" gutterBottom>Información General</Typography>
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
          </Paper>

          <Paper elevation={0} variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="h6" gutterBottom>Contexto y Restricciones</Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth label="Restringir a Municipio (Opcional)" value={municipalityInputName}
                onChange={(e) => setMunicipalityInputName(e.target.value)}
                placeholder="Ej: Madrid, Barcelona" variant="outlined"
                InputProps={{
                  endAdornment: municipalityInputName.trim() && (
                    <IconButton onClick={handleClearRestrictedCity} edge="end" size="small" title="Limpiar municipio">
                      <ClearIcon />
                    </IconButton>
                  )
                }}
              />
              <TextField
                fullWidth label="URL Sede Electrónica (Opcional)" value={sedeElectronicaUrl} type="url"
                onChange={(e) => setSedeElectronicaUrl(e.target.value)} placeholder="https://sede.ejemplo.es"
                variant="outlined" helperText="Enlace principal a la Sede Electrónica para trámites."
              />
            </Stack>
          </Paper>

          <Paper elevation={0} variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="h6" gutterBottom>Funcionalidades</Typography>
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
          </Paper>

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
            <Typography variant="h6" gutterBottom>Prompts Recomendados</Typography>
            <Stack direction="row" spacing={1} mb={2}>
              <TextField fullWidth label="Nuevo Prompt" value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} size="small" variant="outlined"/>
              <Button variant="contained" onClick={handleAddPrompt} disabled={!newPrompt.trim()} sx={{flexShrink:0}}>Añadir</Button>
            </Stack>
            {recommendedPrompts.length > 0 && (
              <Stack spacing={1}>
                {recommendedPrompts.map((prompt, index) => (
                  <Chip key={index} label={prompt} onDelete={() => handleRemovePrompt(index)} />
                ))}
              </Stack>
            )}
          </Paper>

          <Paper elevation={0} variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="h6" gutterBottom>Fuentes de Trámites (URLs)</Typography>
            <Stack direction="row" spacing={1} mb={procedureSourceUrls.length > 0 ? 2 : 0}>
              <TextField fullWidth label="Nueva URL de Trámite" value={newProcedureUrl} onChange={(e) => setNewProcedureUrl(e.target.value)} type="url" size="small" variant="outlined"/>
              <Button variant="contained" onClick={handleAddProcedureUrl} disabled={!newProcedureUrl.trim() || !isValidUrl(newProcedureUrl.trim())} sx={{flexShrink:0}}>Añadir URL</Button>
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
              <Button variant="contained" onClick={handleAddProcedureDocument} disabled={!currentProcedureNameToUpload.trim() || !currentPdfFile}>Adjuntar PDF al Trámite</Button>
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
      </Container>
      <Paper square elevation={2} sx={{ p: 2, position: 'sticky', bottom: 0, zIndex: 10, bgcolor: 'background.paper' }}>
        <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} justifyContent="flex-end">
          <Button variant="outlined" color="inherit" onClick={onCancel} startIcon={<CancelIcon />}>Cancelar</Button>
          <Tooltip title="Restablecer a los valores por defecto del Asistente">
            <Button variant="outlined" color="warning" onClick={handleResetToAppDefaults} startIcon={<RestartAltIcon />}>Restablecer</Button>
          </Tooltip>
          <Button variant="contained" color="primary" onClick={() => { handleSave(); if (isMobile) onCancel(); }} startIcon={<SaveIcon />}>Guardar</Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default FinetuningPage;

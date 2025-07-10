import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Chip,
  Box,
  Alert,
  IconButton,
  Divider,
  Stack,
  Paper
} from '@mui/material';
import {
  ContentCopy,
  OpenInNew,
  Language,
  Visibility,
  VisibilityOff,
  Settings,
  QrCode,
  Download,
  Image,
  Code
} from '@mui/icons-material';
import QRCode from 'qrcode';
import { useAssistantConfig } from '@/hooks/useAssistantConfig';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CityDebug } from './CityDebug';

export const CityLinkManager: React.FC = () => {
  const { user } = useAuth();
  const { config, saveConfig } = useAssistantConfig();
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [isLoadingPrivacy, setIsLoadingPrivacy] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Generar slug basado en el nombre del asistente
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const currentSlug = generateSlug(config.assistantName);
  const publicUrl = `${window.location.origin}/chat/${currentSlug}`;

  // Generar código QR
  const generateQRCode = async () => {
    if (!isPublic) return;
    
    setIsGeneratingQR(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(publicUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Descargar QR como JPG
  const downloadQRAsJPG = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `qr-${currentSlug}.jpg`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  // Descargar QR como SVG
  const downloadQRAsSVG = async () => {
    if (!isPublic) return;
    
    try {
      const svgString = await QRCode.toString(publicUrl, {
        type: 'svg',
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qr-${currentSlug}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading SVG:', error);
    }
  };

  // Cargar el estado actual de privacidad desde la base de datos
  const loadPrivacyState = async () => {
    if (!user) return;
    
    setIsLoadingPrivacy(true);
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('is_public')
        .eq('admin_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error loading privacy state:', error);
      } else if (data) {
        setIsPublic(data.is_public ?? true);
      }
    } catch (error) {
      console.error('Error loading privacy state:', error);
    } finally {
      setIsLoadingPrivacy(false);
    }
  };

  // Cargar estado inicial y generar QR si es público
  useEffect(() => {
    if (user) {
      loadPrivacyState();
    }
  }, [user]);

  // Generar QR cuando cambia la URL o el estado público
  useEffect(() => {
    if (isPublic && !isLoadingPrivacy) {
      generateQRCode();
    } else {
      setQrCodeDataUrl('');
    }
  }, [publicUrl, isPublic, isLoadingPrivacy]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const togglePrivacy = async () => {
    if (!user) return;
    
    setIsUpdatingPrivacy(true);
    try {
      const newPrivacyState = !isPublic;
      
      // Actualizar el estado público/privado en la base de datos
      const { error } = await supabase
        .from('cities')
        .update({ 
          is_public: newPrivacyState,
          updated_at: new Date().toISOString()
        })
        .eq('admin_user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error updating privacy:', error);
        // Mostrar error al usuario
        return;
      } else {
        // Actualizar el estado local
        setIsPublic(newPrivacyState);
        console.log('Privacy updated successfully:', newPrivacyState);
      }
    } catch (error) {
      console.error('Error updating privacy:', error);
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Debug component - solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <CityDebug />
      )}
      
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Language sx={{ fontSize: 20 }} />
              <Typography variant="h5" component="h3">
                Link Público de tu Ciudad
              </Typography>
            </Box>
          }
        />
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                URL Pública
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  value={publicUrl}
                  InputProps={{ readOnly: true }}
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }
                  }}
                />
                <IconButton
                  onClick={() => copyToClipboard(publicUrl)}
                  size="small"
                  sx={{ border: 1, borderColor: 'divider' }}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => window.open(publicUrl, '_blank')}
                  disabled={!isPublic}
                  size="small"
                  sx={{ border: 1, borderColor: 'divider' }}
                >
                  <OpenInNew fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                El slug se actualiza automáticamente cuando cambias el nombre del asistente.
              </Typography>
            </Box>

            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isLoadingPrivacy ? (
                      <Typography variant="body2" color="text.secondary">
                        Cargando...
                      </Typography>
                    ) : isPublic ? (
                      <>
                        <Visibility sx={{ color: 'success.main', fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                          Público
                        </Typography>
                        <Chip
                          label="Accesible para todos"
                          size="small"
                          icon={<Language sx={{ fontSize: 16 }} />}
                          color="primary"
                        />
                      </>
                    ) : (
                      <>
                        <VisibilityOff sx={{ color: 'warning.main', fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                          Privado
                        </Typography>
                        <Chip
                          label="Solo para ti"
                          size="small"
                          variant="outlined"
                        />
                      </>
                    )}
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={togglePrivacy}
                    disabled={isUpdatingPrivacy || isLoadingPrivacy}
                  >
                    {isUpdatingPrivacy ? 'Actualizando...' : (isPublic ? 'Hacer Privado' : 'Hacer Público')}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Código QR */}
            {isPublic && !isLoadingPrivacy && (
              <Card variant="outlined">
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <QrCode sx={{ fontSize: 20 }} />
                      <Typography variant="h6" component="h4">
                        Código QR
                      </Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      {isGeneratingQR ? (
                        <Box sx={{ 
                          width: 256, 
                          height: 256, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            Generando QR...
                          </Typography>
                        </Box>
                      ) : qrCodeDataUrl ? (
                        <Box sx={{ textAlign: 'center' }}>
                          <img 
                            src={qrCodeDataUrl} 
                            alt="QR Code" 
                            style={{ 
                              width: 256, 
                              height: 256,
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px'
                            }} 
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Escanea para acceder al chat
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ 
                          width: 256, 
                          height: 256, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            Error generando QR
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Image />}
                        onClick={downloadQRAsJPG}
                        disabled={!qrCodeDataUrl}
                      >
                        Descargar JPG
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Code />}
                        onClick={downloadQRAsSVG}
                        disabled={!isPublic}
                      >
                        Descargar SVG
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {isPublic && !isLoadingPrivacy && (
              <Alert severity="success" icon={<Language />}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'medium', mb: 1 }}>
                    Chat Público Activo
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    Tu ciudad es accesible públicamente. Cualquier usuario puede chatear con tu asistente
                    usando el link de arriba, pero no podrán modificar la configuración.
                  </Typography>
                </Box>
              </Alert>
            )}

            {!isPublic && !isLoadingPrivacy && (
              <Alert severity="warning" icon={<VisibilityOff />}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'medium', mb: 1 }}>
                    Chat Privado
                  </Typography>
                  <Typography variant="body2" color="warning.main">
                    Tu ciudad es privada. Solo usuarios autenticados con tu cuenta pueden acceder al chat.
                  </Typography>
                </Box>
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';
import {
  Copy,
  ExternalLink,
  Globe,
  Eye,
  EyeOff,
  Settings,
  QrCode,
  Download,
  ImageIcon,
  FileCode
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAssistantConfig } from '@/hooks/useAssistantConfig';
// Supabase removed - privacy toggle disabled
import { useAuth } from '@/hooks/useAuthFirebase';

export const CityLinkManager: React.FC<{ assistantNameOverride?: string }> = ({ assistantNameOverride }) => {
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

  const currentSlug = generateSlug(assistantNameOverride || config.assistantName);
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

  // Privacy state loading disabled (Supabase removed)
  const loadPrivacyState = async () => {
    if (!user) return;
    
    setIsLoadingPrivacy(true);
    try {
      console.log('loadPrivacyState: Function disabled (Supabase removed)');
      // Default to public
      setIsPublic(true);
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
      
      // Privacy toggle disabled (Supabase removed)
      console.log('togglePrivacy: Function disabled (Supabase removed)');
      
      // Update local state only
      setIsPublic(newPrivacyState);
      console.log('Privacy updated locally only:', newPrivacyState);
    } catch (error) {
      console.error('Error updating privacy:', error);
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Debug component removed per request */}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Link Público de tu Ciudad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL Pública</label>
            <div className="flex gap-2 items-center">
              <Input
                value={publicUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(publicUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(publicUrl, '_blank')}
                disabled={!isPublic}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              El slug se actualiza automáticamente cuando cambias el nombre del asistente.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isLoadingPrivacy ? (
                    <Skeleton className="h-4 w-20" />
                  ) : isPublic ? (
                    <>
                       <Eye className="h-5 w-5 text-success" />
                       <span className="font-medium">Público</span>
                       <Badge className="flex items-center gap-1">
                         <Globe className="h-3 w-3" />
                         Accesible para todos
                       </Badge>
                     </>
                   ) : (
                     <>
                       <EyeOff className="h-5 w-5 text-warning-foreground" />
                      <span className="font-medium">Privado</span>
                      <Badge variant="outline">Solo para ti</Badge>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePrivacy}
                  disabled={isUpdatingPrivacy || isLoadingPrivacy}
                >
                  {isUpdatingPrivacy ? 'Actualizando...' : (isPublic ? 'Hacer Privado' : 'Hacer Público')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Código QR */}
          {isPublic && !isLoadingPrivacy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Código QR
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  {isGeneratingQR ? (
                    <div className="w-64 h-64 flex items-center justify-center border border-border rounded">
                      <span className="text-sm text-muted-foreground">Generando QR...</span>
                    </div>
                  ) : qrCodeDataUrl ? (
                    <div className="text-center">
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Code" 
                        className="w-64 h-64 border border-border rounded"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Escanea para acceder al chat
                      </p>
                    </div>
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center border border-border rounded">
                      <span className="text-sm text-muted-foreground">Error generando QR</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadQRAsJPG}
                    disabled={!qrCodeDataUrl}
                    className="flex items-center gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Descargar JPG
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadQRAsSVG}
                    disabled={!isPublic}
                    className="flex items-center gap-2"
                  >
                    <FileCode className="h-4 w-4" />
                    Descargar SVG
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isPublic && !isLoadingPrivacy && (
            <Alert>
              <Globe className="h-4 w-4" />
              <AlertTitle>Chat Público Activo</AlertTitle>
              <AlertDescription>
                Tu ciudad es accesible públicamente. Cualquier usuario puede chatear con tu asistente
                usando el link de arriba, pero no podrán modificar la configuración.
              </AlertDescription>
            </Alert>
          )}

          {!isPublic && !isLoadingPrivacy && (
            <Alert variant="destructive">
              <EyeOff className="h-4 w-4" />
              <AlertTitle>Chat Privado</AlertTitle>
              <AlertDescription>
                Tu ciudad es privada. Solo usuarios autenticados con tu cuenta pueden acceder al chat.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
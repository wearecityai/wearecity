import React, { useState, useEffect } from 'react';
import { firebaseAIService } from '../services/firebaseAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Zap } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface ServiceStatus {
  isAvailable: boolean;
  isLoading: boolean;
  lastChecked: Date | null;
  error: string | null;
  serviceInfo: any;
}

export const FirebaseAIStatus: React.FC = () => {
  const [status, setStatus] = useState<ServiceStatus>({
    isAvailable: false,
    isLoading: true,
    lastChecked: null,
    error: null,
    serviceInfo: null
  });

  const checkServiceStatus = async () => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const isAvailable = await firebaseAIService.checkAvailability();
      const serviceInfo = firebaseAIService.getServiceInfo();
      
      setStatus({
        isAvailable,
        isLoading: false,
        lastChecked: new Date(),
        error: null,
        serviceInfo
      });
    } catch (error) {
      setStatus({
        isAvailable: false,
        isLoading: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Error desconocido',
        serviceInfo: null
      });
    }
  };

  useEffect(() => {
    checkServiceStatus();
  }, []);

  const getStatusIcon = () => {
    if (status.isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    return status.isAvailable ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = () => {
    if (status.isLoading) {
      return <Badge variant="secondary">Verificando...</Badge>;
    }
    return status.isAvailable ? (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        <CheckCircle className="h-3 w-3 mr-1" />
        Disponible
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        No disponible
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Estado del Servicio IA</CardTitle>
          </div>
          {getStatusIcon()}
        </div>
        <CardDescription>
          Verifica la conectividad con Firebase AI Functions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estado:</span>
          {getStatusBadge()}
        </div>

        {status.lastChecked && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Última verificación:</span>
            <span className="text-sm text-muted-foreground">
              {status.lastChecked.toLocaleTimeString()}
            </span>
          </div>
        )}

        {status.serviceInfo && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Información del servicio:</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div><strong>Proveedor:</strong> {status.serviceInfo.provider}</div>
              <div><strong>Modelos:</strong> {status.serviceInfo.models.join(', ')}</div>
            </div>
          </div>
        )}

        {status.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {status.error}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-2">
          <Button
            onClick={checkServiceStatus}
            disabled={status.isLoading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {status.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verificar
          </Button>
          
          <Button
            onClick={() => window.open('https://console.firebase.google.com', '_blank')}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Consola Firebase
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          El servicio utiliza Google AI (Gemini) a través de Firebase AI Logic
        </div>
      </CardContent>
    </Card>
  );
};

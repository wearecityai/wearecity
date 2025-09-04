import React from 'react';
import { useVertexAI } from '../hooks/useVertexAI';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Zap } from 'lucide-react';

export const VertexAIStatus: React.FC = () => {
  const { 
    isAvailable, 
    isInitializing, 
    lastChecked, 
    error, 
    serviceInfo, 
    checkAvailability,
    isReady 
  } = useVertexAI();

  const getStatusIcon = () => {
    if (isInitializing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (isAvailable) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = () => {
    if (isInitializing) {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Inicializando
      </Badge>;
    }
    
    if (isAvailable) {
      return <Badge variant="default" className="flex items-center gap-1 bg-green-500">
        <CheckCircle className="h-3 w-3" />
        Disponible
      </Badge>;
    }
    
    return <Badge variant="destructive" className="flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      No disponible
    </Badge>;
  };

  const formatLastChecked = () => {
    if (!lastChecked) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - lastChecked.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Hace un momento';
    if (minutes === 1) return 'Hace 1 minuto';
    if (minutes < 60) return `Hace ${minutes} minutos`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Hace 1 hora';
    if (hours < 24) return `Hace ${hours} horas`;
    
    return lastChecked.toLocaleString();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Vertex AI</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Servicio de IA con instrucciones dinámicas y búsqueda en tiempo real
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Estado del servicio */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estado del servicio:</span>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm">
              {isAvailable ? 'Operativo' : isInitializing ? 'Verificando...' : 'No disponible'}
            </span>
          </div>
        </div>

        {/* Última verificación */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Última verificación:</span>
          <span className="text-sm text-muted-foreground">{formatLastChecked()}</span>
        </div>

        {/* Información del servicio */}
        {serviceInfo && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Proveedor:</span>
              <span className="text-sm text-muted-foreground">{serviceInfo.provider}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Modelo:</span>
              <span className="text-sm text-muted-foreground">{serviceInfo.models?.join(', ')}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-800">Error:</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Características */}
        {serviceInfo?.features && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Características:</span>
            <div className="grid grid-cols-1 gap-1">
              {serviceInfo.features.slice(0, 5).map((feature: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">{feature}</span>
                </div>
              ))}
              {serviceInfo.features.length > 5 && (
                <span className="text-xs text-muted-foreground">
                  +{serviceInfo.features.length - 5} características más
                </span>
              )}
            </div>
          </div>
        )}

        {/* Botón de verificación */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={checkAvailability}
            disabled={isInitializing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-3 w-3 ${isInitializing ? 'animate-spin' : ''}`} />
            Verificar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

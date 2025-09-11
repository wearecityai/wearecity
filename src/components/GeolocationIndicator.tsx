import React from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { RefreshCw, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface GeolocationIndicatorProps {
  status: 'idle' | 'pending' | 'success' | 'error';
  userLocation: UserLocation | null;
  onRetry?: () => void;
  compact?: boolean;
}

export const GeolocationIndicator: React.FC<GeolocationIndicatorProps> = ({
  status,
  userLocation,
  onRetry,
  compact = false
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <MapPin className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <MapPin className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success':
        return 'Ubicación activa';
      case 'pending':
        return 'Obteniendo ubicación...';
      case 'error':
        return 'Error de ubicación';
      default:
        return 'Ubicación no disponible';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-center p-2">
        {getStatusIcon()}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        {onRetry && status === 'error' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-6 px-2 text-xs rounded-full"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reintentar
          </Button>
        )}
      </div>
      
      {userLocation && status === 'success' && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center space-x-2">
            <span>📍 Coordenadas:</span>
            <Badge variant="outline" className="text-xs font-mono">
              {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
            </Badge>
          </div>
          {userLocation.accuracy && (
            <div className="flex items-center space-x-2">
              <span>🎯 Precisión:</span>
              <Badge variant="outline" className="text-xs">
                ±{Math.round(userLocation.accuracy)}m
              </Badge>
            </div>
          )}
          {userLocation.timestamp && (
            <div className="text-xs text-muted-foreground">
              Última actualización: {new Date(userLocation.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
      
      {status === 'error' && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          <div className="font-medium mb-1">Problema de geolocalización:</div>
          <div>• Verifica que tengas permisos de ubicación habilitados</div>
          <div>• Asegúrate de que el GPS esté activo</div>
          <div>• Intenta recargar la página</div>
        </div>
      )}
      
      {status === 'idle' && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
          <div className="font-medium mb-1">Geolocalización pendiente:</div>
          <div>• La aplicación está solicitando acceso a tu ubicación</div>
          <div>• Acepta el permiso cuando aparezca la notificación</div>
        </div>
      )}
    </div>
  );
};
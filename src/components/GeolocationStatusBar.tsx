import React from 'react';
import { Badge } from './ui/badge';
import { MapPin, Wifi, WifiOff } from 'lucide-react';
import { usePersistentGeolocation } from '../hooks/usePersistentGeolocation';

export const GeolocationStatusBar: React.FC = () => {
  const { geolocationStatus, isHealthy, userLocation } = usePersistentGeolocation();

  if (!isHealthy) {
    return null; // Solo mostrar cuando esté saludable
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg shadow-lg p-3 space-y-2">
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-green-700">Ubicación activa</span>
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            <Wifi className="h-3 w-3 mr-1" />
            En tiempo real
          </Badge>
        </div>
        
        {userLocation && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center space-x-2">
              <span>📍 Coordenadas:</span>
              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
              </code>
            </div>
            {userLocation.accuracy && (
              <div className="flex items-center space-x-2">
                <span>🎯 Precisión:</span>
                <Badge variant="outline" className="text-xs">
                  ±{Math.round(userLocation.accuracy)}m
                </Badge>
              </div>
            )}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          La IA siempre conoce tu ubicación para calcular distancias y ofrecerte información local
        </div>
      </div>
    </div>
  );
};

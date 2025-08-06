import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAppState } from '../hooks/useAppState';

export const GeolocationDebug: React.FC = () => {
  const { chatConfig } = useAppState();
  const { userLocation, geolocationStatus, geolocationError, refreshLocation, isWatching } = useGeolocation();
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Debug: Mostrar información de geolocalización en consola
  useEffect(() => {
    if (userLocation) {
      console.log('🌍 Geolocalización actualizada:', {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        accuracy: userLocation.accuracy,
        timestamp: userLocation.timestamp ? new Date(userLocation.timestamp).toLocaleString() : 'N/A',
        status: geolocationStatus,
        isWatching: isWatching
      });
    }
  }, [userLocation, geolocationStatus, isWatching]);

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="fixed top-2 right-2 z-[1000] min-w-[300px] m-2">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <span className="text-xs font-bold">
          🌍 Debug Geolocalización
        </span>
        <Collapsible open={showDebugPanel} onOpenChange={setShowDebugPanel}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {showDebugPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-2">
              <div className="flex gap-1 mb-2 flex-wrap">
                <Badge 
                  variant={geolocationStatus === 'success' ? 'default' : geolocationStatus === 'error' ? 'destructive' : 'secondary'}
                >
                  Estado: {geolocationStatus}
                </Badge>
                <Badge variant={chatConfig.allowGeolocation ? 'default' : 'secondary'}>
                  Habilitado: {chatConfig.allowGeolocation ? 'Sí' : 'No'}
                </Badge>
                <Badge variant={isWatching ? 'default' : 'secondary'}>
                  Seguimiento: {isWatching ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              
              {userLocation && (
                <div className="bg-muted p-2 rounded mb-2">
                  <div className="text-xs">
                    <div><strong>Coordenadas:</strong> {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}</div>
                    {userLocation.accuracy && (
                      <div><strong>Precisión:</strong> ±{Math.round(userLocation.accuracy)} metros</div>
                    )}
                    {userLocation.timestamp && (
                      <div><strong>Última actualización:</strong> {new Date(userLocation.timestamp).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              )}
              
              {geolocationError && (
                <div className="text-xs text-destructive mb-2">
                  <strong>Error:</strong> {geolocationError}
                </div>
              )}
              
              <div className="text-xs space-y-1">
                <div><strong>Navegador soporta geolocalización:</strong> {navigator.geolocation ? 'Sí' : 'No'}</div>
                <div><strong>Protocolo:</strong> {window.location.protocol}</div>
                <div><strong>Permisos:</strong> {navigator.permissions ? 'API disponible' : 'API no disponible'}</div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
};
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { MapPin, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

interface GeolocationNotificationProps {
  className?: string;
}

export const GeolocationNotification: React.FC<GeolocationNotificationProps> = ({ className }) => {
  const { userLocation, geolocationStatus, geolocationError, startLocationTracking } = useGeolocation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasShownPermissionRequest, setHasShownPermissionRequest] = useState(false);

  useEffect(() => {
    // Mostrar notificación si no hay ubicación y no se ha mostrado la solicitud de permisos
    if (geolocationStatus === 'idle' && !hasShownPermissionRequest) {
      setIsVisible(true);
      setHasShownPermissionRequest(true);
    } else if (geolocationStatus === 'success') {
      // Ocultar cuando se obtiene la ubicación exitosamente
      setIsVisible(false);
    } else if (geolocationStatus === 'error') {
      // Mostrar error si hay problemas
      setIsVisible(true);
    }
  }, [geolocationStatus, hasShownPermissionRequest]);

  const handleEnableLocation = () => {
    setIsVisible(false);
    startLocationTracking();
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  const getNotificationContent = () => {
    switch (geolocationStatus) {
      case 'idle':
        return {
          icon: <Info className="h-4 w-4" />,
          title: 'Geolocalización requerida',
          description: 'Esta aplicación necesita acceso a tu ubicación para ofrecerte información personalizada de tu ciudad.',
          action: (
            <Button onClick={handleEnableLocation} size="sm" className="rounded-full">
              <MapPin className="h-4 w-4 mr-2" />
              Habilitar ubicación
            </Button>
          )
        };
      
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          title: 'Error de geolocalización',
          description: geolocationError || 'No se pudo obtener tu ubicación. Verifica los permisos en tu navegador.',
          action: (
            <div className="space-y-2">
              <Button onClick={handleEnableLocation} size="sm" variant="outline" className="rounded-full">
                <MapPin className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
              <Button onClick={handleDismiss} size="sm" variant="ghost" className="rounded-full">
                Cerrar
              </Button>
            </div>
          )
        };
      
      case 'success':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          title: 'Ubicación activa',
          description: `Tu ubicación está siendo rastreada: ${userLocation?.latitude.toFixed(6)}, ${userLocation?.longitude.toFixed(6)}`,
          action: (
            <Button onClick={handleDismiss} size="sm" variant="ghost" className="rounded-full">
              Cerrar
            </Button>
          )
        };
      
      default:
        return null;
    }
  };

  const content = getNotificationContent();
  if (!content) return null;

  return (
    <Alert className={`${className} border-l-4 border-l-blue-500 bg-blue-50`}>
      <div className="flex items-start space-x-3">
        <div className="text-blue-600 mt-0.5">
          {content.icon}
        </div>
        <div className="flex-1">
          <AlertTitle className="text-blue-800 font-medium">
            {content.title}
          </AlertTitle>
          <AlertDescription className="text-blue-700 mt-1">
            {content.description}
          </AlertDescription>
          <div className="mt-3">
            {content.action}
          </div>
        </div>
      </div>
    </Alert>
  );
};

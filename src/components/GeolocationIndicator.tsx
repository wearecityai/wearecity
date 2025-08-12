import React from 'react';
import { useTranslation } from 'react-i18next';
import { Navigation, MapPin, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface GeolocationIndicatorProps {
  status: 'idle' | 'pending' | 'success' | 'error';
  userLocation?: { latitude: number; longitude: number } | null;
  className?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export const GeolocationIndicator: React.FC<GeolocationIndicatorProps> = ({
  status,
  userLocation,
  className,
  onRetry,
  compact = false
}) => {
  const { t } = useTranslation();

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Navigation className="h-3 w-3 animate-pulse" />;
      case 'success':
        return <MapPin className="h-3 w-3" />;
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Navigation className="h-3 w-3" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return t('geolocation.getting', { defaultValue: 'Obteniendo ubicación...' });
      case 'success':
        return userLocation 
          ? t('geolocation.located', { defaultValue: 'Ubicación obtenida' })
          : t('geolocation.ready', { defaultValue: 'Ubicación lista' });
      case 'error':
        return t('geolocation.error', { defaultValue: 'Error de ubicación' });
      default:
        return t('geolocation.idle', { defaultValue: 'Ubicación inactiva' });
    }
  };

  const getStatusVariant = () => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {getStatusIcon()}
        {status === 'success' && userLocation && (
          <span className="text-xs text-muted-foreground">
            {userLocation.latitude.toFixed(3)}, {userLocation.longitude.toFixed(3)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant={getStatusVariant() as any} className="text-xs">
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </Badge>
      
      {status === 'error' && onRetry && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRetry}
          className="h-6 px-2 text-xs"
        >
          {t('geolocation.retry', { defaultValue: 'Reintentar' })}
        </Button>
      )}
      
      {status === 'success' && userLocation && (
        <span className="text-xs text-muted-foreground font-mono">
          {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
        </span>
      )}
    </div>
  );
};
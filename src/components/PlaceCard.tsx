import React from 'react';
import { MapPin, ExternalLink, Globe, Navigation, Star, Loader2, RefreshCw, Clock, Phone, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { PlaceCardInfo } from '../types';

interface PlaceCardProps {
  place: PlaceCardInfo;
  onRetry?: (placeId: string) => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onRetry }) => {
  console.log('🔍 PlaceCard rendered with:', {
    name: place.name,
    placeId: place.placeId,
    searchQuery: place.searchQuery,
    isLoadingDetails: place.isLoadingDetails,
    errorDetails: place.errorDetails,
    rating: place.rating,
    address: place.address
  });

  if (place.isLoadingDetails) {
    console.log('🔍 Showing loading state for place:', place.name);
    return (
      <Card className="w-full max-w-sm">
        <div className="h-40 bg-muted flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <CardContent className="p-4">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-1" />
          <Skeleton className="h-4 w-1/3" />
        </CardContent>
      </Card>
    );
  }

  if (place.errorDetails) {
    console.log('🔍 Showing error state for place:', place.name, 'Error:', place.errorDetails);
    return (
      <Card className="w-full max-w-sm border-red-200">
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-base leading-tight line-clamp-2 text-red-800">
              {place.name}
            </h3>
            <div className="text-sm text-red-600">
              {place.errorDetails}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50 rounded-full"
              onClick={() => onRetry?.(place.id)}
              disabled={!onRetry}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatRating = (rating?: number): string => {
    if (typeof rating !== 'number') return 'Sin valoración';
    return `${rating.toFixed(1)} ⭐`;
  };

  const formatDistance = (distance?: string): string => {
    if (!distance) return '';
    // Convert "1.2 km" format to more readable format
    return distance.replace('km', ' km').replace('m', ' m');
  };

  const formatPriceLevel = (priceLevel?: number): string => {
    if (!priceLevel) return '';
    // Convertir nivel de precio a rango de euros como en la captura
    const priceRanges = ['Gratis', '€', '€€', '€€€', '€€€€'];
    return priceRanges[priceLevel] || '';
  };

  const formatPriceRange = (priceLevel?: number): string => {
    if (!priceLevel) return '';
    // Convertir a rangos específicos como en la captura
    const priceRanges = ['Gratis', '10-20 €', '20-30 €', '30-40 €', '40+ €'];
    return priceRanges[priceLevel] || '';
  };

  const formatUserRatingsTotal = (total?: number): string => {
    if (!total) return '';
    if (total >= 1000) {
      return `${(total / 1000).toFixed(1)}k`;
    }
    return total.toString();
  };

  const getPlaceType = (types?: string[]): string => {
    if (!types || types.length === 0) return '';
    
    // Mapeo de tipos comunes
    const typeMap: { [key: string]: string } = {
      'restaurant': 'Restaurante',
      'food': 'Comida',
      'establishment': 'Establecimiento',
      'bar': 'Bar',
      'cafe': 'Café',
      'meal_takeaway': 'Comida para llevar',
      'meal_delivery': 'Delivery',
      'bakery': 'Panadería',
      'pizza': 'Pizzería',
      'fast_food': 'Comida rápida',
      'seafood': 'Mariscos',
      'steak_house': 'Parrilla',
      'sushi': 'Sushi',
      'italian': 'Italiano',
      'mexican': 'Mexicano',
      'chinese': 'Chino',
      'japanese': 'Japonés',
      'indian': 'Indio',
      'thai': 'Tailandés',
      'mediterranean': 'Mediterráneo',
      'spanish': 'Español',
      'french': 'Francés'
    };

    // Buscar el primer tipo que tengamos mapeado
    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type];
      }
    }
    
    // Si no encontramos nada, devolver el primer tipo
    return types[0];
  };

  const getAvailableServices = (types?: string[]): string[] => {
    if (!types) return [];
    
    const services: string[] = [];
    
    // Detectar servicios basados en tipos
    if (types.includes('meal_takeaway') || types.includes('fast_food')) {
      services.push('Para llevar');
    }
    if (types.includes('meal_delivery')) {
      services.push('Delivery');
    }
    if (types.includes('restaurant') || types.includes('food')) {
      services.push('Comer allí');
    }
    
    // Si no hay servicios específicos, asumir que es restaurante
    if (services.length === 0 && types.includes('restaurant')) {
      services.push('Comer allí');
    }
    
    return services;
  };

  const getPlaceStatus = (openingHours?: string[], businessStatus?: string): { status: string; nextOpening?: string } => {
    // Priorizar businessStatus si está disponible
    if (businessStatus) {
      switch (businessStatus) {
        case 'OPERATIONAL':
          return { status: 'Abierto' };
        case 'CLOSED_TEMPORARILY':
          return { status: 'Cerrado temporalmente' };
        case 'CLOSED_PERMANENTLY':
          return { status: 'Cerrado permanentemente' };
        default:
          return { status: 'Estado desconocido' };
      }
    }
    
    if (!openingHours || openingHours.length === 0) {
      return { status: 'Horarios no disponibles' };
    }
    
    // Buscar indicadores de estado en los horarios
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay(); // 0 = Domingo, 1 = Lunes, etc.
    
    // Buscar si está cerrado hoy
    const todayHours = openingHours.find(hour => 
      hour.toLowerCase().includes('cerrado') || 
      hour.toLowerCase().includes('closed')
    );
    
    if (todayHours) {
      return { status: 'Cerrado', nextOpening: todayHours };
    }
    
    // Buscar horarios de apertura
    const openingMatch = openingHours.find(hour => 
      hour.toLowerCase().includes('apertura') || 
      hour.toLowerCase().includes('opening')
    );
    
    if (openingMatch) {
      return { status: 'Abierto', nextOpening: openingMatch };
    }
    
    return { status: 'Abierto' };
  };

  const generateMapsUrl = (): string => {
    if (place.placeId) {
      return `https://www.google.com/maps/place/?q=place_id:${place.placeId}`;
    }
    
    const query = encodeURIComponent(place.name + (place.address ? ` ${place.address}` : ''));
    return `https://www.google.com/maps/search/${query}`;
  };

  const generateWebsiteSearchUrl = (): string => {
    const query = encodeURIComponent(place.name + (place.address ? ` ${place.address}` : ''));
    return `https://www.google.com/search?q=${query}`;
  };

  const services = getAvailableServices(place.types);
  const placeStatus = getPlaceStatus(place.openingHours, place.businessStatus);

  return (
    <Card className="w-full border-t border-border flex flex-col overflow-hidden rounded-none border-0 p-0">
      {/* Sección principal con imagen y información básica */}
      <div className="flex-shrink-0 flex items-start relative p-4">
        {/* Imagen del lugar */}
        <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden mr-4">
          {place.photoUrl ? (
            <img
              src={place.photoUrl}
              alt={place.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        
        {/* Información principal del lugar */}
        <div className="flex-1 min-w-0">
          {/* Nombre del lugar */}
          <h3 className="font-semibold text-lg leading-tight text-foreground mb-2 line-clamp-2">
            {place.name}
          </h3>
          
          {/* Rating y número de reseñas */}
          {place.rating && (
            <div className="flex items-center space-x-1 mb-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-foreground">
                {place.rating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({place.userRatingsTotal ? formatUserRatingsTotal(place.userRatingsTotal) : '0'} reseñas)
              </span>
            </div>
          )}
          
          {/* Rango de precios */}
          {place.priceLevel && (
            <div className="text-sm text-muted-foreground mb-1">
              {formatPriceRange(place.priceLevel)}
            </div>
          )}
          
          {/* Tipo de lugar */}
          {place.types && (
            <div className="text-sm text-muted-foreground mb-1">
              {getPlaceType(place.types)}
            </div>
          )}
          
          {/* Dirección */}
          {place.address && (
            <div className="text-sm text-muted-foreground mb-2 line-clamp-1">
              {place.address}
            </div>
          )}
          
          {/* Servicios disponibles */}
          {services.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {services.map((service, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                  {service}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Estado y horarios */}
          <div className="flex items-center space-x-2 text-sm">
            <span className={`font-medium ${
              placeStatus.status === 'Cerrado' ? 'text-red-600' : 
              placeStatus.status === 'Abierto' ? 'text-green-600' : 
              'text-muted-foreground'
            }`}>
              {placeStatus.status}
            </span>
            {placeStatus.nextOpening && (
              <span className="text-muted-foreground">
                • {placeStatus.nextOpening}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Descripción del lugar (si existe) */}
      {place.description && (
        <div className="px-4 pb-2">
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {place.description}
          </p>
        </div>
      )}

      {/* Horarios detallados (si existen y no se mostraron arriba) */}
      {place.openingHours && place.openingHours.length > 0 && !placeStatus.nextOpening && (
        <div className="px-4 pb-2">
          <div className="flex items-start space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <div className="font-medium mb-1">Horarios:</div>
              <div className="space-y-1">
                {place.openingHours.slice(0, 3).map((hour, index) => (
                  <div key={index} className="text-sm">
                    {hour}
                  </div>
                ))}
                {place.openingHours.length > 3 && (
                  <div className="text-sm text-muted-foreground/70">
                    +{place.openingHours.length - 3} más...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-full"
            asChild
          >
            <a
              href={generateMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2"
            >
              <MapPin className="h-4 w-4" />
              <span className="text-sm">Mapas</span>
            </a>
          </Button>

          {place.website ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-full"
              asChild
            >
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2"
              >
                <Globe className="h-4 w-4" />
                <span className="text-sm">Sitio web</span>
              </a>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-full"
              asChild
            >
              <a
                href={generateWebsiteSearchUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm">Buscar</span>
              </a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PlaceCard;
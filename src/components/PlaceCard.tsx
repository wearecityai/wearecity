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
    return '$'.repeat(priceLevel);
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

  return (
    <Card className="w-full border-t border-border flex flex-col overflow-hidden rounded-none border-0 p-0">
      {/* Sección con imagen grande a la izquierda */}
      <div className="flex-shrink-0 flex items-start relative">
        {/* Caja de imagen grande a la izquierda */}
        <div className="flex-shrink-0 w-20 sm:w-24 h-20 sm:h-24 rounded-lg flex flex-col items-center justify-center ml-3 sm:ml-4 mt-3 sm:mt-4 overflow-hidden">
          {place.photoUrl ? (
            <img
              src={place.photoUrl}
              alt={place.name}
              className="w-full h-full object-cover rounded-lg"
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
        
        {/* Contenido del título y detalles centrado verticalmente con la imagen */}
        <div className="flex-1 px-3 sm:px-4 flex flex-col justify-center mt-3 sm:mt-4">
          <h3 className="font-semibold text-xl sm:text-2xl leading-tight line-clamp-2 text-foreground pr-12 sm:pr-16 mb-2">
            {place.name}
          </h3>
          
          {/* Información del lugar a la derecha de la imagen */}
          <div className="space-y-1">
            {/* Rating del lugar */}
            {place.rating && (
              <div className="flex items-center space-x-2">
                <Star className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0 fill-current" />
                <span className="text-xs sm:text-sm text-muted-foreground truncate">
                  {formatRating(place.rating)}
                  {place.userRatingsTotal && (
                    <span className="ml-1">({formatUserRatingsTotal(place.userRatingsTotal)})</span>
                  )}
                </span>
              </div>
            )}
            
            {/* Distancia del lugar */}
            {place.distance && (
              <div className="flex items-center space-x-2">
                <Navigation className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground truncate">
                  {formatDistance(place.distance)}
                </span>
              </div>
            )}

            {/* Tipo de lugar */}
            {place.types && (
              <div className="flex items-center space-x-2">
                <Users className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground truncate">
                  {getPlaceType(place.types)}
                </span>
              </div>
            )}

            {/* Nivel de precio */}
            {place.priceLevel && (
              <div className="flex items-center space-x-2">
                <DollarSign className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground truncate">
                  {formatPriceLevel(place.priceLevel)}
                </span>
              </div>
            )}

            {/* Teléfono */}
            {place.phoneNumber && (
              <div className="flex items-center space-x-2">
                <Phone className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground truncate">
                  {place.phoneNumber}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Icono de categoría */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
          <div className="w-4 sm:w-6 h-4 sm:h-6 flex items-center justify-center text-white">
            <MapPin className="h-5 w-5" />
          </div>
        </div>
      </div>
      
      {/* Dirección del lugar (si existe) */}
      {place.address && (
        <div className="flex-shrink-0 px-3 sm:px-4 py-2">
          <div className="flex items-start space-x-2">
            <MapPin className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {place.address}
            </span>
          </div>
        </div>
      )}

      {/* Descripción del lugar (si existe) */}
      {place.description && (
        <div className="flex-shrink-0 px-3 sm:px-4 py-2">
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {place.description}
          </p>
        </div>
      )}

      {/* Horarios de apertura (si existen) */}
      {place.openingHours && place.openingHours.length > 0 && (
        <div className="flex-shrink-0 px-3 sm:px-4 py-2">
          <div className="flex items-start space-x-2">
            <Clock className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-muted-foreground">
              <div className="font-medium mb-1">Horarios:</div>
              <div className="space-y-1">
                {place.openingHours.slice(0, 3).map((hour, index) => (
                  <div key={index} className="text-xs">
                    {hour}
                  </div>
                ))}
                {place.openingHours.length > 3 && (
                  <div className="text-xs text-muted-foreground/70">
                    +{place.openingHours.length - 3} más...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción - Separados de la imagen */}
      <div className="flex-shrink-0 h-12 flex items-center px-3 sm:px-4 mt-4">
        <div className="flex gap-1 sm:gap-2 w-full">
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
              className="flex items-center justify-center space-x-1 sm:space-x-2"
            >
              <MapPin className="h-3 sm:h-4 w-3 sm:w-4" />
              <span className="text-xs sm:text-sm">Mapas</span>
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
                className="flex items-center justify-center space-x-1 sm:space-x-2"
              >
                <Globe className="h-3 sm:h-4 w-3 sm:w-4" />
                <span className="text-xs sm:text-sm">Web</span>
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
                className="flex items-center justify-center space-x-1 sm:space-x-2"
              >
                <ExternalLink className="h-3 sm:h-4 w-3 sm:w-4" />
                <span className="text-xs sm:text-sm">Buscar</span>
              </a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PlaceCard;
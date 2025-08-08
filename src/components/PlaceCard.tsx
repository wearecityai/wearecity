import React from 'react';
import { MapPin, ExternalLink, Globe, Navigation, Star, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { PlaceCardInfo } from '../types';

interface PlaceCardProps {
  place: PlaceCardInfo;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place }) => {
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
      <Alert variant="destructive" className="w-full max-w-sm">
        <AlertDescription>
          <div className="font-medium">{place.name}</div>
          <div className="text-sm">Error: {place.errorDetails}</div>
        </AlertDescription>
      </Alert>
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
            <Card className="w-full max-w-sm border-border md:hover:shadow-md transition-shadow">

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-2">
            {place.name}
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {place.rating && (
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1 fill-current" />
                {formatRating(place.rating)}
              </Badge>
            )}
            
            {place.distance && (
              <Badge variant="outline" className="text-xs">
                <Navigation className="h-3 w-3 mr-1" />
                {formatDistance(place.distance)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {place.address && (
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground line-clamp-2">
                {place.address}
              </span>
            </div>
          )}


          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              asChild
            >
              <a
                href={generateMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2"
              >
                <MapPin className="h-4 w-4" />
                <span>Ver en Mapas</span>
              </a>
            </Button>

            {place.website ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                asChild
              >
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2"
                >
                  <Globe className="h-4 w-4" />
                  <span>Web</span>
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                asChild
              >
                <a
                  href={generateWebsiteSearchUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Buscar</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlaceCard;
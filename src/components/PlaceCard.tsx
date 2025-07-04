import React, { useEffect, useRef } from 'react';
import { Card, CardMedia, CardContent, CardActions, Typography, Button, Box, Chip, Rating, CircularProgress, Alert, Stack, Link, Tooltip } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LanguageIcon from '@mui/icons-material/Language'; // For website
import NearMeIcon from '@mui/icons-material/NearMe'; // For distance

import { PlaceCardInfo } from '../types';

const GOOGLE_PLACES_UIKIT_URL = "https://www.gstatic.com/maps/embed/place_component/v1/place_component.js";

function loadPlacesUiKit() {
  if (!document.getElementById('google-places-uikit')) {
    const script = document.createElement('script');
    script.id = 'google-places-uikit';
    script.src = GOOGLE_PLACES_UIKIT_URL;
    script.async = true;
    document.body.appendChild(script);
  }
}

interface PlaceCardProps {
  place: PlaceCardInfo;
}

// Declarar el Web Component para TypeScript/JSX
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-place-overview': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { 'place-id': string, language?: string };
    }
  }
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place }) => {
  const ref = useRef<HTMLDivElement>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  console.log('🔍 PlaceCard rendered with:', {
    name: place.name,
    placeId: place.placeId,
    searchQuery: place.searchQuery,
    isLoadingDetails: place.isLoadingDetails,
    errorDetails: place.errorDetails,
    apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'NO API KEY'
  });

  useEffect(() => {
    console.log('🔍 PlaceCard useEffect - Loading Places UI Kit');
    loadPlacesUiKit();
    // Set the API key globally for the Web Component
    if (apiKey && (window as any).gmpxApiKey !== apiKey) {
      console.log('🔍 Setting global API key for Web Component');
      (window as any).gmpxApiKey = apiKey;
    } else if (!apiKey) {
      console.error('❌ No API key available for Google Places Web Component');
    }
  }, [apiKey]);

  if (place.isLoadingDetails) {
    console.log('🔍 Showing loading state for place:', place.name);
    return (
      <Card variant="outlined" sx={{ width: '100%', maxWidth: 360, borderRadius: 2 }}>
        <Box sx={{ height: 160, bgcolor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
        </Box>
        <CardContent>
          <Box sx={{ height: 20, bgcolor: 'grey.300', borderRadius: 1, mb: 1, width: '75%' }} />
          <Box sx={{ height: 16, bgcolor: 'grey.300', borderRadius: 1, mb: 0.5, width: '50%' }} />
          <Box sx={{ height: 16, bgcolor: 'grey.300', borderRadius: 1, width: '33%' }} />
        </CardContent>
      </Card>
    );
  }

  if (place.errorDetails) {
    console.log('🔍 Showing error state for place:', place.name, 'Error:', place.errorDetails);
    return (
      <Alert severity="error" variant="outlined" sx={{ width: '100%', maxWidth: 360, borderRadius: 2 }}>
        <Typography variant="subtitle2" component="h3" fontWeight="medium">{place.name}</Typography>
        <Typography variant="body2">Error: {place.errorDetails}</Typography>
      </Alert>
    );
  }

  if (!place.placeId) {
    console.log('🔍 No placeId available for place:', place.name);
    // Si no hay placeId pero hay searchQuery, mostrar una tarjeta básica con enlace a Google Maps
    if (place.searchQuery) {
      const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(place.searchQuery)}`;
      return (
        <Card variant="outlined" sx={{ width: '100%', maxWidth: 360, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" component="h3" gutterBottom>
              {place.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Información detallada no disponible
            </Typography>
            <Button
              variant="outlined"
              startIcon={<LocationOnIcon />}
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
            >
              Ver en Google Maps
            </Button>
          </CardContent>
        </Card>
      );
    }
    
    // Si no hay ni placeId ni searchQuery
    return (
      <Alert severity="warning" variant="outlined" sx={{ width: '100%', maxWidth: 360, borderRadius: 2 }}>
        <Typography variant="subtitle2" component="h3" fontWeight="medium">{place.name}</Typography>
        <Typography variant="body2">No se pudo obtener información detallada de este lugar.</Typography>
      </Alert>
    );
  }

  console.log('🔍 Rendering Web Component for place:', place.name, 'with placeId:', place.placeId);
  
  // TEMPORARY: Use our own card system instead of Web Component for debugging
  return (
    <Card variant="outlined" sx={{ width: '100%', maxWidth: 360, borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
      {place.photoUrl && (
        <CardMedia
          component="img"
          height="160"
          image={place.photoUrl}
          alt={`Foto de ${place.name}`}
          sx={{ objectFit: 'cover' }}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h3" fontWeight="medium" noWrap title={place.name} gutterBottom>
          {place.name}
        </Typography>

        {typeof place.rating === 'number' && (
          <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
            <Rating name="read-only" value={place.rating} precision={0.1} readOnly size="small" />
            <Typography variant="body2" color="text.secondary">
              ({place.rating.toFixed(1)})
            </Typography>
            {place.userRatingsTotal !== undefined && (
              <Typography variant="caption" color="text.secondary">
                {place.userRatingsTotal} reseñas
              </Typography>
            )}
          </Stack>
        )}

        {place.address && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
            {place.address}
          </Typography>
        )}

        {place.distance && (
          <Chip
            icon={<NearMeIcon />}
            label={place.distance}
            size="small"
            variant="outlined"
            sx={{ mb: 1 }}
          />
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt:0, justifyContent: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
        {place.mapsUrl && (
            <Tooltip title="Ver en Google Maps">
                <Button
                    component={Link}
                    href={place.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    sx={{ borderRadius: '16px', textTransform: 'none' }}
                >
                    Mapa
                </Button>
            </Tooltip>
        )}
        {place.website && (
            <Tooltip title="Visitar sitio web">
                <Button
                    component={Link}
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    variant="outlined"
                    startIcon={<LanguageIcon />}
                    sx={{ borderRadius: '16px', textTransform: 'none' }}
                >
                    Web
                </Button>
            </Tooltip>
        )}
        {place.placeId && (
            <Tooltip title="Ver en Google Maps (placeId)">
                <Button
                    component={Link}
                    href={`https://www.google.com/maps/place/?q=place_id:${place.placeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    variant="outlined"
                    startIcon={<LocationOnIcon />}
                    sx={{ borderRadius: '16px', textTransform: 'none' }}
                >
                    PlaceID
                </Button>
            </Tooltip>
        )}
      </CardActions>
      {place.photoAttributions && place.photoAttributions.length > 0 && (
        <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 2, pb: 1, fontSize: '0.6rem', textAlign: 'right' }}
            dangerouslySetInnerHTML={{ __html: place.photoAttributions.join(', ') }}
        />
      )}
    </Card>
  );
};

export default PlaceCard;

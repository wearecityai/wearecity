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

  useEffect(() => {
    loadPlacesUiKit();
    // Set the API key globally for the Web Component
    if (apiKey && (window as any).gmpxApiKey !== apiKey) {
      (window as any).gmpxApiKey = apiKey;
    }
  }, [apiKey]);

  if (place.isLoadingDetails) {
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
    return (
      <Alert severity="error" variant="outlined" sx={{ width: '100%', maxWidth: 360, borderRadius: 2 }}>
        <Typography variant="subtitle2" component="h3" fontWeight="medium">{place.name}</Typography>
        <Typography variant="body2">Error: {place.errorDetails}</Typography>
      </Alert>
    );
  }

  if (!place.placeId) {
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

  return (
    <div ref={ref} style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
      {/* Web Component oficial de Google Places */}
      <gmpx-place-overview place-id={place.placeId} language="es"></gmpx-place-overview>
    </div>
  );
};

export default PlaceCard;

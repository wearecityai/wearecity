import React, { useEffect, useRef } from 'react';
import { Card, CardMedia, CardContent, CardActions, Typography, Button, Box, Chip, Rating, CircularProgress, Alert, Stack, Link, Tooltip } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LanguageIcon from '@mui/icons-material/Language'; // For website
import NearMeIcon from '@mui/icons-material/NearMe'; // For distance

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

  // Si no hay datos cargados pero tampoco hay error, mostrar estado de "no disponible"
  if (!place.rating && !place.address && !place.photoUrl) {
    console.log('🔍 No data available for place:', place.name);
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

  console.log('🔍 Rendering card with data for place:', place.name);
  
  // Renderizar tarjeta con datos cargados
  return (
    <Card variant="outlined" sx={{ 
      width: '100%', 
      maxWidth: { xs: '100%', sm: 360 }, 
      borderRadius: 2, 
      display: 'flex', 
      flexDirection: 'column',
      minWidth: 0, // Prevenir overflow
      overflow: 'hidden', // Prevenir overflow
    }}>
      {place.photoUrl && (
        <CardMedia
          component="img"
          height="160"
          image={place.photoUrl}
          alt={`Foto de ${place.name}`}
          sx={{ objectFit: 'cover' }}
        />
      )}
      <CardContent sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography 
          variant="h6" 
          component="h3" 
          fontWeight="medium" 
          noWrap 
          title={place.name} 
          gutterBottom
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' },
            minWidth: 0,
          }}
        >
          {place.name}
        </Typography>

        {typeof place.rating === 'number' && (
          <Stack direction="row" alignItems="center" spacing={0.5} mb={1} sx={{ minWidth: 0 }}>
            <Rating name="read-only" value={place.rating} precision={0.1} readOnly size="small" />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              ({place.rating.toFixed(1)})
            </Typography>
            {place.userRatingsTotal !== undefined && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                {place.userRatingsTotal} reseñas
              </Typography>
            )}
          </Stack>
        )}

        {place.address && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 1, 
              display: 'flex', 
              alignItems: 'center',
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              minWidth: 0,
            }}
          >
            <LocationOnIcon fontSize="small" sx={{ mr: 0.5, flexShrink: 0 }} />
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}>
              {place.address}
            </span>
          </Typography>
        )}

        {place.distance && (
          <Chip
            icon={<NearMeIcon />}
            label={place.distance}
            size="small"
            variant="outlined"
            sx={{ 
              mb: 1,
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
            }}
          />
        )}
      </CardContent>

      <CardActions sx={{ 
        px: { xs: 1, sm: 2 }, 
        pb: { xs: 1, sm: 2 }, 
        pt: 0, 
        justifyContent: 'flex-start', 
        flexWrap: 'wrap', 
        gap: { xs: 0.5, sm: 1 },
        minWidth: 0,
      }}>
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
                    sx={{ 
                      borderRadius: '16px', 
                      textTransform: 'none',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    }}
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
                    sx={{ 
                      borderRadius: '16px', 
                      textTransform: 'none',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    }}
                >
                    Web
                </Button>
            </Tooltip>
        )}
        {!place.mapsUrl && place.searchQuery && (
            <Tooltip title="Buscar en Google Maps">
                <Button
                    component={Link}
                    href={`https://www.google.com/maps/search/${encodeURIComponent(place.searchQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    variant="outlined"
                    startIcon={<LocationOnIcon />}
                    sx={{ 
                      borderRadius: '16px', 
                      textTransform: 'none',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    }}
                >
                    Buscar
                </Button>
            </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

export default PlaceCard;

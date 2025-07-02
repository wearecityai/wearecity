
import React from 'react';
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

        <Stack spacing={0.5}>
            {place.address && (
            <Chip 
                icon={<LocationOnIcon fontSize="small"/>} 
                label={place.address} 
                size="small" 
                variant="outlined" 
                title={place.address}
                sx={{ justifyContent: 'flex-start', p:0, height: 'auto', '& .MuiChip-label': {p:'4px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', textAlign: 'left'} }}
            />
            )}
            {place.distance && (
            <Chip 
                icon={<NearMeIcon fontSize="small"/>} 
                label={place.distance} 
                size="small" 
                variant="outlined"
                sx={{ justifyContent: 'flex-start', p:0, height: 'auto', '& .MuiChip-label': {p:'4px 8px'} }}
            />
            )}
        </Stack>
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

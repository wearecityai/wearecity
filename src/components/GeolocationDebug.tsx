import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Chip, IconButton, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
    <Paper sx={{ m: 1, p: 1, bgcolor: 'background.paper', position: 'fixed', top: 10, right: 10, zIndex: 1000, minWidth: 300 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          🌍 Debug Geolocalización
        </Typography>
        <IconButton size="small" onClick={() => setShowDebugPanel(!showDebugPanel)}>
          {showDebugPanel ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      <Collapse in={showDebugPanel}>
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`Estado: ${geolocationStatus}`} 
              size="small" 
              color={geolocationStatus === 'success' ? 'success' : geolocationStatus === 'error' ? 'error' : 'primary'}
            />
            <Chip 
              label={`Habilitado: ${chatConfig.allowGeolocation ? 'Sí' : 'No'}`} 
              size="small" 
              color={chatConfig.allowGeolocation ? 'success' : 'default'}
            />
            <Chip 
              label={`Seguimiento: ${isWatching ? 'Activo' : 'Inactivo'}`} 
              size="small" 
              color={isWatching ? 'success' : 'default'}
            />
          </Box>
          
          {userLocation && (
            <Box sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 1, mb: 1 }}>
              <Typography variant="caption" component="div">
                <strong>Coordenadas:</strong> {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
              </Typography>
              {userLocation.accuracy && (
                <Typography variant="caption" component="div">
                  <strong>Precisión:</strong> ±{Math.round(userLocation.accuracy)} metros
                </Typography>
              )}
              {userLocation.timestamp && (
                <Typography variant="caption" component="div">
                  <strong>Última actualización:</strong> {new Date(userLocation.timestamp).toLocaleString()}
                </Typography>
              )}
            </Box>
          )}
          
          {geolocationError && (
            <Typography variant="caption" color="error" component="div">
              <strong>Error:</strong> {geolocationError}
            </Typography>
          )}
          
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" component="div">
              <strong>Navegador soporta geolocalización:</strong> {navigator.geolocation ? 'Sí' : 'No'}
            </Typography>
            <Typography variant="caption" component="div">
              <strong>Protocolo:</strong> {window.location.protocol}
            </Typography>
            <Typography variant="caption" component="div">
              <strong>Permisos:</strong> {navigator.permissions ? 'API disponible' : 'API no disponible'}
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}; 
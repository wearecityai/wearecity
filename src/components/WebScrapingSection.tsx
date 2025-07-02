
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Stack, IconButton, Grid, FormHelperText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import PublicIcon from '@mui/icons-material/Public';
import { useWebScraping } from '../hooks/useWebScraping';
import { useAuth } from '../hooks/useAuth';

interface WebsiteFormData {
  name: string;
  base_url: string;
  description: string;
  max_pages: number;
  allowed_domains: string;
  scraping_frequency_hours: number;
}

const WebScrapingSection: React.FC = () => {
  const { user, profile } = useAuth();
  const {
    websites,
    isLoading,
    error,
    loadWebsites,
    createWebsite,
    deleteWebsite,
    startScraping
  } = useWebScraping();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<WebsiteFormData>({
    name: '',
    base_url: '',
    description: '',
    max_pages: 50,
    allowed_domains: '',
    scraping_frequency_hours: 24
  });

  useEffect(() => {
    if (user && profile?.role === 'administrativo') {
      loadWebsites();
    }
  }, [user, profile]);

  // Check if user has admin access
  if (!user || !profile || profile.role !== 'administrativo') {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Esta funcionalidad está disponible solo para usuarios administrativos.
      </Alert>
    );
  }

  const handleSubmit = async () => {
    const websiteData = {
      name: formData.name,
      base_url: formData.base_url,
      description: formData.description || undefined,
      max_pages: formData.max_pages,
      allowed_domains: formData.allowed_domains 
        ? formData.allowed_domains.split(',').map(d => d.trim()).filter(d => d)
        : [],
      scraping_frequency_hours: formData.scraping_frequency_hours
    };

    const result = await createWebsite(websiteData);
    
    if (result) {
      setIsDialogOpen(false);
      setFormData({
        name: '',
        base_url: '',
        description: '',
        max_pages: 50,
        allowed_domains: '',
        scraping_frequency_hours: 24
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar "${name}"?`)) {
      await deleteWebsite(id);
    }
  };

  const handleStartScraping = async (id: string, name: string) => {
    if (confirm(`¿Iniciar scraping de "${name}"? Esto puede tardar varios minutos.`)) {
      await startScraping(id);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getStatusColor = (website: any) => {
    if (!website.is_active) return 'default';
    if (!website.last_scraped_at) return 'warning';
    
    const lastScraped = new Date(website.last_scraped_at);
    const now = new Date();
    const hoursSinceLastScrape = (now.getTime() - lastScraped.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastScrape > website.scraping_frequency_hours * 2) return 'error';
    if (hoursSinceLastScrape > website.scraping_frequency_hours) return 'warning';
    return 'success';
  };

  const getStatusText = (website: any) => {
    if (!website.is_active) return 'Inactivo';
    if (!website.last_scraped_at) return 'Pendiente';
    
    const lastScraped = new Date(website.last_scraped_at);
    const now = new Date();
    const hoursSinceLastScrape = (now.getTime() - lastScraped.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastScrape > website.scraping_frequency_hours * 2) return 'Atrasado';
    if (hoursSinceLastScrape > website.scraping_frequency_hours) return 'Pendiente';
    return 'Actualizado';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Fuentes de Información Web</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsDialogOpen(true)}
          size="small"
        >
          Agregar Sitio
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        {websites.length === 0 && !isLoading ? (
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <PublicIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No hay sitios web configurados
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Agrega sitios web municipales para extraer información automáticamente
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsDialogOpen(true)}
              >
                Agregar primer sitio
              </Button>
            </CardContent>
          </Card>
        ) : (
          websites.map((website) => (
            <Card key={website.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {website.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {website.base_url}
                    </Typography>
                    {website.description && (
                      <Typography variant="body2" color="text.secondary">
                        {website.description}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={getStatusText(website)}
                    color={getStatusColor(website)}
                    size="small"
                  />
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" display="block">
                      Máx. páginas
                    </Typography>
                    <Typography variant="body2">
                      {website.max_pages}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" display="block">
                      Frecuencia
                    </Typography>
                    <Typography variant="body2">
                      {website.scraping_frequency_hours}h
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" display="block">
                      Último scraping
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(website.last_scraped_at)}
                    </Typography>
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => handleStartScraping(website.id, website.name)}
                    disabled={isLoading}
                  >
                    Iniciar Scraping
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(website.id, website.name)}
                    disabled={isLoading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Sitio Web</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nombre del sitio"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Ayuntamiento de Madrid"
              required
            />

            <TextField
              fullWidth
              label="URL base"
              type="url"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              placeholder="https://ejemplo.es"
              required
            />

            <TextField
              fullWidth
              label="Descripción (opcional)"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Información sobre el sitio web"
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Máx. páginas"
                  type="number"
                  inputProps={{ min: 1, max: 500 }}
                  value={formData.max_pages}
                  onChange={(e) => setFormData({ ...formData, max_pages: parseInt(e.target.value) || 50 })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Frecuencia (horas)"
                  type="number"
                  inputProps={{ min: 1, max: 168 }}
                  value={formData.scraping_frequency_hours}
                  onChange={(e) => setFormData({ ...formData, scraping_frequency_hours: parseInt(e.target.value) || 24 })}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Dominios permitidos (separados por comas)"
              value={formData.allowed_domains}
              onChange={(e) => setFormData({ ...formData, allowed_domains: e.target.value })}
              placeholder="ejemplo.es, subdomain.ejemplo.es"
            />
            <FormHelperText>
              Deja vacío para permitir todos los dominios del sitio base
            </FormHelperText>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isLoading || !formData.name || !formData.base_url}
          >
            {isLoading ? 'Creando...' : 'Crear Sitio'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WebScrapingSection;

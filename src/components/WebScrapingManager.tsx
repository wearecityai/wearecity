
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWebScraping } from '@/hooks/useWebScraping';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Globe, 
  Calendar, 
  FileText, 
  Play, 
  Trash2, 
  Edit, 
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

interface WebsiteFormData {
  name: string;
  base_url: string;
  description: string;
  max_pages: number;
  allowed_domains: string;
  scraping_frequency_hours: number;
}

const WebScrapingManager = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
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
    max_pages: 25, // Reduced default
    allowed_domains: '',
    scraping_frequency_hours: 24
  });

  useEffect(() => {
    if (user && profile?.role === 'administrativo') {
      loadWebsites();
    }
  }, [user, profile]);

  // Auto-refresh websites every 60 seconds when scraping might be in progress
  useEffect(() => {
    if (!websites.length) return;
    
    const hasRecentActivity = websites.some(w => {
      if (!w.updated_at) return false;
      const updatedAt = new Date(w.updated_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);
      return diffMinutes < 10; // Consider recent if updated in last 10 minutes
    });

    if (hasRecentActivity) {
      const interval = setInterval(() => {
        console.log('Auto-refreshing websites...');
        loadWebsites();
      }, 60000); // Refresh every 60 seconds

      return () => clearInterval(interval);
    }
  }, [websites]);

  // Check if user has admin access
  if (!user || !profile || profile.role !== 'administrativo') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Solo los administradores pueden acceder a la gestión de scraping.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const websiteData = {
      name: formData.name,
      base_url: formData.base_url,
      description: formData.description || undefined,
      max_pages: Math.min(formData.max_pages, 50), // Cap at 50 pages
      allowed_domains: formData.allowed_domains 
        ? formData.allowed_domains.split(',').map(d => d.trim()).filter(d => d)
        : [],
      scraping_frequency_hours: formData.scraping_frequency_hours
    };

    const result = await createWebsite(websiteData);
    
    if (result) {
      toast({
        title: "Sitio web creado",
        description: `"${result.name}" ha sido agregado correctamente.`,
      });
      
      setIsDialogOpen(false);
      setFormData({
        name: '',
        base_url: '',
        description: '',
        max_pages: 25,
        allowed_domains: '',
        scraping_frequency_hours: 24
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar "${name}"?`)) {
      const success = await deleteWebsite(id);
      if (success) {
        toast({
          title: "Sitio web eliminado",
          description: `"${name}" ha sido eliminado correctamente.`,
        });
      }
    }
  };

  const handleStartScraping = async (id: string, name: string) => {
    if (confirm(`¿Iniciar scraping de "${name}"? El proceso se ejecutará en segundo plano.`)) {
      const result = await startScraping(id);
      if (result) {
        toast({
          title: "Scraping iniciado",
          description: result.message || `El scraping de "${name}" se está ejecutando en segundo plano.`,
          duration: 5000,
        });
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getStatusBadge = (website: any) => {
    if (!website.is_active) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    
    if (!website.last_scraped_at) {
      return <Badge variant="outline">Pendiente</Badge>;
    }
    
    const lastScraped = new Date(website.last_scraped_at);
    const now = new Date();
    const hoursSinceLastScrape = (now.getTime() - lastScraped.getTime()) / (1000 * 60 * 60);
    
    // Check if recently updated (might be currently scraping)
    const lastUpdated = new Date(website.updated_at);
    const minutesSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate < 10 && !website.last_scraped_at) {
      return <Badge variant="secondary">Procesando...</Badge>;
    }
    
    if (hoursSinceLastScrape > website.scraping_frequency_hours * 2) {
      return <Badge variant="destructive">Atrasado</Badge>;
    } else if (hoursSinceLastScrape > website.scraping_frequency_hours) {
      return <Badge variant="secondary">Pendiente</Badge>;
    } else {
      return <Badge variant="default">Actualizado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Scraping Web</h2>
          <p className="text-muted-foreground">
            Configura sitios web para extraer información municipal automáticamente en segundo plano
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadWebsites}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Sitio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Agregar Sitio Web</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre del sitio</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Ayuntamiento de Madrid"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="base_url">URL base</Label>
                  <Input
                    id="base_url"
                    type="url"
                    value={formData.base_url}
                    onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                    placeholder="https://ejemplo.es"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Información sobre el sitio web"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_pages">Máx. páginas</Label>
                    <Input
                      id="max_pages"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.max_pages}
                      onChange={(e) => setFormData({ ...formData, max_pages: parseInt(e.target.value) || 25 })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recomendado: 10-25 páginas
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="frequency">Frecuencia (horas)</Label>
                    <Input
                      id="frequency"
                      type="number"
                      min="1"
                      max="168"
                      value={formData.scraping_frequency_hours}
                      onChange={(e) => setFormData({ ...formData, scraping_frequency_hours: parseInt(e.target.value) || 24 })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="domains">Dominios permitidos (separados por comas)</Label>
                  <Input
                    id="domains"
                    value={formData.allowed_domains}
                    onChange={(e) => setFormData({ ...formData, allowed_domains: e.target.value })}
                    placeholder="ejemplo.es, subdomain.ejemplo.es"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creando...' : 'Crear Sitio'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {websites.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Globe className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay sitios web configurados</h3>
              <p className="text-muted-foreground text-center mb-4">
                Agrega sitios web municipales para extraer información automáticamente
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar primer sitio
              </Button>
            </CardContent>
          </Card>
        ) : (
          websites.map((website) => (
            <Card key={website.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{website.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      <a
                        href={website.base_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {website.base_url}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(website)}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {website.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {website.description}
                  </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Máx. páginas</div>
                    <div className="text-sm text-muted-foreground">{website.max_pages}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Frecuencia</div>
                    <div className="text-sm text-muted-foreground">{website.scraping_frequency_hours}h</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Último scraping</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(website.last_scraped_at)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Dominios permitidos</div>
                    <div className="text-sm text-muted-foreground">
                      {website.allowed_domains.length || 'Todos'}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleStartScraping(website.id, website.name)}
                    disabled={isLoading}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Scraping
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(website.id, website.name)}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Procesando...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebScrapingManager;

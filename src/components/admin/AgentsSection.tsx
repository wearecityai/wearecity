import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/integrations/firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Play, 
  Trash2, 
  BarChart3, 
  Settings, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Database,
  Brain,
  Globe,
  Link,
  Plus,
  Minus,
  Save,
  Eye,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuthFirebase';

interface CityConfig {
  name: string;
  slug: string;
  displayName: string;
  officialWebsite: string;
  agendaEventosUrls: string[];
  tramitesUrls: string[];
  noticiasUrls: string[];
  turismoUrls: string[];
  contactUrls: string[];
  serviciosUrls: string[];
  scrapingConfig: {
    enabled: boolean;
    selectors: {
      eventContainer: string;
      title: string;
      description: string;
      date: string;
      location: string;
    };
  };
}

interface AgentStats {
  totalEvents: number;
  totalRAGSources: number;
  eventsBySource: { [key: string]: number };
  averageConfidence: number;
  citySlug: string;
  activeCities: number;
}

const AgentsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCity, setSelectedCity] = useState('la-vila-joiosa');
  const [cities, setCities] = useState<string[]>(['valencia', 'la-vila-joiosa', 'alicante']);
  const [cityConfig, setCityConfig] = useState<CityConfig | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Cargar configuración de ciudad
  const loadCityConfig = async (citySlug: string) => {
    try {
      setLoading(true);
      console.log(`📍 Cargando configuración para ${citySlug}...`);
      
      const cityDoc = await getDoc(doc(db, 'cities', citySlug));
      
      if (cityDoc.exists()) {
        const data = cityDoc.data() as CityConfig;
        setCityConfig(data);
        console.log(`✅ Configuración cargada:`, data);
      } else {
        // Crear configuración por defecto
        const defaultConfig: CityConfig = {
          name: citySlug,
          slug: citySlug,
          displayName: citySlug.charAt(0).toUpperCase() + citySlug.slice(1),
          officialWebsite: '',
          agendaEventosUrls: [],
          tramitesUrls: [],
          noticiasUrls: [],
          turismoUrls: [],
          contactUrls: [],
          serviciosUrls: [],
          scrapingConfig: {
            enabled: false,
            selectors: {
              eventContainer: 'article, .post, .event-item',
              title: 'h1, h2, h3, .entry-title, .event-title',
              description: '.entry-content, .event-description, .content',
              date: '.event-date, .entry-date, .published, time',
              location: '.event-location, .venue, .location'
            }
          }
        };
        setCityConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración de la ciudad",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Guardar configuración de ciudad
  const saveCityConfig = async () => {
    if (!cityConfig) return;
    
    try {
      setSaving(true);
      console.log(`💾 Guardando configuración para ${selectedCity}...`);
      
      await setDoc(doc(db, 'cities', selectedCity), {
        ...cityConfig,
        updatedAt: new Date(),
        updatedBy: user?.uid || 'system'
      });
      
      toast({
        title: "✅ Configuración Guardada",
        description: `La configuración de ${cityConfig.name} se ha guardado correctamente`,
        variant: "default"
      });
      
      console.log(`✅ Configuración guardada exitosamente`);
      
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Obtener estadísticas del agente
  const getAgentStats = async () => {
    try {
      setLoading(true);
      console.log(`📊 Obteniendo estadísticas para ${selectedCity}...`);
      
      const { auth } = await import('../../integrations/firebase/config');
      const user = auth.currentUser;
      
      if (!user) {
        toast({
          title: "❌ Error de Autenticación",
          description: "Debes estar autenticado para obtener estadísticas",
          variant: "destructive"
        });
        return;
      }
      
      const token = await user.getIdToken();
      
      const response = await fetch('https://us-central1-wearecity-2ab89.cloudfunctions.net/hybridIntelligentProxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `Obtener estadísticas completas del sistema RAG para ${selectedCity}`,
          citySlug: selectedCity,
          userId: user.uid,
          isAdmin: true
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Parsear estadísticas de la respuesta
        const statsData: AgentStats = {
          totalEvents: 0,
          totalRAGSources: 0,
          eventsBySource: {},
          averageConfidence: 0,
          citySlug: selectedCity,
          activeCities: 0
        };
        
        // Extraer números de la respuesta
        const responseText = result.response;
        const eventMatch = responseText.match(/(\d+)\s*eventos?/i);
        const sourceMatch = responseText.match(/(\d+)\s*fuentes?/i);
        const cityMatch = responseText.match(/(\d+)\s*ciudades?/i);
        
        if (eventMatch) statsData.totalEvents = parseInt(eventMatch[1]);
        if (sourceMatch) statsData.totalRAGSources = parseInt(sourceMatch[1]);
        if (cityMatch) statsData.activeCities = parseInt(cityMatch[1]);
        
        setStats(statsData);
        
        toast({
          title: "✅ Estadísticas Obtenidas",
          description: `${statsData.totalEvents} eventos, ${statsData.totalRAGSources} fuentes RAG`,
          variant: "default"
        });
        
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
      
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      toast({
        title: "Error",
        description: "No se pudieron obtener las estadísticas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar scraping manual
  const runManualScraping = async () => {
    try {
      setScraping(true);
      console.log(`🕷️ Iniciando scraping manual para ${selectedCity}...`);
      
      const { auth } = await import('../../integrations/firebase/config');
      const user = auth.currentUser;
      
      if (!user) {
        toast({
          title: "❌ Error de Autenticación",
          description: "Debes estar autenticado para ejecutar scraping",
          variant: "destructive"
        });
        return;
      }
      
      const token = await user.getIdToken();
      
      const response = await fetch('https://us-central1-wearecity-2ab89.cloudfunctions.net/hybridIntelligentProxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `Obtener URLs configuradas para ${selectedCity}, luego scrapear eventos de todas las URLs encontradas e insertarlos en el sistema RAG`,
          citySlug: selectedCity,
          userId: user.uid,
          isAdmin: true
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "✅ Scraping Completado",
          description: `Scraping ejecutado exitosamente para ${selectedCity}`,
          variant: "default"
        });
        
        // Actualizar estadísticas
        await getAgentStats();
        
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
      
    } catch (error) {
      console.error('Error en scraping:', error);
      toast({
        title: "Error",
        description: "No se pudo ejecutar el scraping",
        variant: "destructive"
      });
    } finally {
      setScraping(false);
    }
  };

  // Limpiar datos de ciudad
  const clearCityData = async () => {
    if (!confirm(`¿Estás seguro de que quieres limpiar TODOS los datos de ${selectedCity}? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      setLoading(true);
      console.log(`🧹 Limpiando datos para ${selectedCity}...`);
      
      const { auth } = await import('../../integrations/firebase/config');
      const user = auth.currentUser;
      
      if (!user) {
        toast({
          title: "❌ Error de Autenticación",
          description: "Debes estar autenticado para limpiar datos",
          variant: "destructive"
        });
        return;
      }
      
      const token = await user.getIdToken();
      
      const response = await fetch('https://us-central1-wearecity-2ab89.cloudfunctions.net/hybridIntelligentProxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `Limpiar todos los eventos y datos RAG de ${selectedCity}`,
          citySlug: selectedCity,
          userId: user.uid,
          isAdmin: true
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "✅ Datos Limpiados",
          description: `Todos los datos de ${selectedCity} han sido eliminados`,
          variant: "default"
        });
        
        // Actualizar estadísticas
        await getAgentStats();
        
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
      
    } catch (error) {
      console.error('Error limpiando datos:', error);
      toast({
        title: "Error",
        description: "No se pudieron limpiar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Agregar nueva URL
  const addUrl = (category: keyof Pick<CityConfig, 'agendaEventosUrls' | 'tramitesUrls' | 'noticiasUrls' | 'turismoUrls' | 'contactUrls' | 'serviciosUrls'>) => {
    if (!cityConfig) return;
    
    setCityConfig({
      ...cityConfig,
      [category]: [...cityConfig[category], '']
    });
  };

  // Eliminar URL
  const removeUrl = (category: keyof Pick<CityConfig, 'agendaEventosUrls' | 'tramitesUrls' | 'noticiasUrls' | 'turismoUrls' | 'contactUrls' | 'serviciosUrls'>, index: number) => {
    if (!cityConfig) return;
    
    const newUrls = [...cityConfig[category]];
    newUrls.splice(index, 1);
    
    setCityConfig({
      ...cityConfig,
      [category]: newUrls
    });
  };

  // Actualizar URL
  const updateUrl = (category: keyof Pick<CityConfig, 'agendaEventosUrls' | 'tramitesUrls' | 'noticiasUrls' | 'turismoUrls' | 'contactUrls' | 'serviciosUrls'>, index: number, value: string) => {
    if (!cityConfig) return;
    
    const newUrls = [...cityConfig[category]];
    newUrls[index] = value;
    
    setCityConfig({
      ...cityConfig,
      [category]: newUrls
    });
  };

  // Efectos
  useEffect(() => {
    loadCityConfig(selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    getAgentStats();
  }, [selectedCity]);

  if (loading && !cityConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agentes Inteligentes</h2>
          <p className="text-muted-foreground">
            Gestión completa del sistema de scraping y RAG dinámico
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Seleccionar ciudad" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city === 'la-vila-joiosa' ? 'La Vila Joiosa' : 
                   city.charAt(0).toUpperCase() + city.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="scraping">
            <Bot className="h-4 w-4 mr-2" />
            Scraping
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="h-4 w-4 mr-2" />
            Monitoreo
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.totalEvents || 0}
                </div>
                <p className="text-muted-foreground">
                  eventos almacenados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Fuentes RAG
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.totalRAGSources || 0}
                </div>
                <p className="text-muted-foreground">
                  documentos indexados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Ciudades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.activeCities || 0}
                </div>
                <p className="text-muted-foreground">
                  ciudades activas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={runManualScraping}
                  disabled={scraping}
                  className="flex items-center"
                >
                  {scraping ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Ejecutar Scraping
                </Button>

                <Button 
                  onClick={getAgentStats}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Actualizar Stats
                </Button>

                <Button 
                  onClick={clearCityData}
                  disabled={loading}
                  variant="destructive"
                  className="flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar Datos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Estado del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Estado del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Bot className="h-4 w-4 mr-2" />
                    Agent Engine
                  </span>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operativo
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Puppeteer Service
                  </span>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operativo
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    Firestore
                  </span>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operativo
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configuración */}
        <TabsContent value="config" className="space-y-6">
          {cityConfig && (
            <>
              {/* Información Básica */}
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nombre de la Ciudad</Label>
                      <Input
                        id="name"
                        value={cityConfig.name}
                        onChange={(e) => setCityConfig({
                          ...cityConfig,
                          name: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="displayName">Nombre para Mostrar</Label>
                      <Input
                        id="displayName"
                        value={cityConfig.displayName}
                        onChange={(e) => setCityConfig({
                          ...cityConfig,
                          displayName: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="officialWebsite">Sitio Web Oficial</Label>
                    <Input
                      id="officialWebsite"
                      value={cityConfig.officialWebsite}
                      onChange={(e) => setCityConfig({
                        ...cityConfig,
                        officialWebsite: e.target.value
                      })}
                      placeholder="https://www.ciudad.com"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* URLs por Categoría */}
              {[
                { key: 'agendaEventosUrls' as const, label: 'URLs de Eventos', icon: <Bot className="h-4 w-4" /> },
                { key: 'tramitesUrls' as const, label: 'URLs de Trámites', icon: <Settings className="h-4 w-4" /> },
                { key: 'noticiasUrls' as const, label: 'URLs de Noticias', icon: <Activity className="h-4 w-4" /> },
                { key: 'turismoUrls' as const, label: 'URLs de Turismo', icon: <Globe className="h-4 w-4" /> },
                { key: 'contactUrls' as const, label: 'URLs de Contacto', icon: <Link className="h-4 w-4" /> },
                { key: 'serviciosUrls' as const, label: 'URLs de Servicios', icon: <Database className="h-4 w-4" /> }
              ].map(({ key, label, icon }) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        {icon}
                        <span className="ml-2">{label}</span>
                      </span>
                      <Button
                        onClick={() => addUrl(key)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cityConfig[key].map((url, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={url}
                            onChange={(e) => updateUrl(key, index, e.target.value)}
                            placeholder="https://..."
                            className="flex-1"
                          />
                          <Button
                            onClick={() => removeUrl(key, index)}
                            size="sm"
                            variant="outline"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {cityConfig[key].length === 0 && (
                        <p className="text-muted-foreground text-sm">
                          No hay URLs configuradas para esta categoría
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Configuración de Scraping */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Scraping</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="scraping-enabled">Scraping Habilitado</Label>
                    <input
                      id="scraping-enabled"
                      type="checkbox"
                      checked={cityConfig.scrapingConfig.enabled}
                      onChange={(e) => setCityConfig({
                        ...cityConfig,
                        scrapingConfig: {
                          ...cityConfig.scrapingConfig,
                          enabled: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(cityConfig.scrapingConfig.selectors).map(([key, value]) => (
                      <div key={key}>
                        <Label htmlFor={`selector-${key}`}>
                          {key === 'eventContainer' ? 'Contenedor de Eventos' :
                           key === 'title' ? 'Título' :
                           key === 'description' ? 'Descripción' :
                           key === 'date' ? 'Fecha' :
                           key === 'location' ? 'Ubicación' : key}
                        </Label>
                        <Input
                          id={`selector-${key}`}
                          value={value}
                          onChange={(e) => setCityConfig({
                            ...cityConfig,
                            scrapingConfig: {
                              ...cityConfig.scrapingConfig,
                              selectors: {
                                ...cityConfig.scrapingConfig.selectors,
                                [key]: e.target.value
                              }
                            }
                          })}
                          placeholder="Selector CSS"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Botón Guardar */}
              <div className="flex justify-end">
                <Button
                  onClick={saveCityConfig}
                  disabled={saving}
                  size="lg"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar Configuración
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab: Scraping */}
        <TabsContent value="scraping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Control de Scraping Manual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Ejecuta scraping manual usando las URLs configuradas dinámicamente para {selectedCity}
              </p>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={runManualScraping}
                  disabled={scraping}
                  size="lg"
                >
                  {scraping ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Ejecutar Scraping Completo
                </Button>

                <Button 
                  onClick={() => {
                    // Probar URLs configuradas
                    if (cityConfig?.agendaEventosUrls.length) {
                      window.open(cityConfig.agendaEventosUrls[0], '_blank');
                    }
                  }}
                  variant="outline"
                  disabled={!cityConfig?.agendaEventosUrls.length}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Sitio Web
                </Button>
              </div>

              {cityConfig && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">URLs Configuradas para Scraping:</h4>
                  <div className="space-y-1 text-sm">
                    {cityConfig.agendaEventosUrls.length > 0 ? (
                      cityConfig.agendaEventosUrls.map((url, index) => (
                        <div key={index} className="flex items-center">
                          <Link className="h-3 w-3 mr-2" />
                          <span className="font-mono text-xs">{url}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">
                        No hay URLs de eventos configuradas
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scraping Programado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="font-medium">Diario</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      6:00 AM - Agenda principal
                    </p>
                    <Badge variant="default" className="mt-2 bg-green-500">
                      Activo
                    </Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="font-medium">Semanal</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Lunes 3:00 AM - Fuentes adicionales
                    </p>
                    <Badge variant="default" className="mt-2 bg-green-500">
                      Activo
                    </Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="font-medium">Mensual</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Día 1, 2:00 AM - Limpieza completa
                    </p>
                    <Badge variant="default" className="mt-2 bg-green-500">
                      Activo
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Monitoreo */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Servicios</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Agent Engine</span>
                      <Badge className="bg-green-500">Operativo</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Puppeteer Service</span>
                      <Badge className="bg-green-500">Operativo</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Vector Search</span>
                      <Badge className="bg-green-500">Configurado</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Métricas</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Eventos Totales</span>
                      <span className="font-mono">{stats?.totalEvents || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Fuentes RAG</span>
                      <span className="font-mono">{stats?.totalRAGSources || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Ciudades Activas</span>
                      <span className="font-mono">{stats?.activeCities || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones de Mantenimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  onClick={getAgentStats}
                  disabled={loading}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar Estadísticas
                </Button>

                <Button 
                  onClick={clearCityData}
                  disabled={loading}
                  variant="destructive"
                  className="w-full justify-start"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar Datos de {selectedCity}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentsSection;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  RefreshCw,
  TrendingUp,
  Server,
  Bot,
  Globe,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemHealth {
  timestamp: string;
  services: {
    agentEngine: 'healthy' | 'degraded' | 'down';
    puppeteerService: 'healthy' | 'degraded' | 'down';
    vectorSearch: 'healthy' | 'degraded' | 'down';
    firestore: 'healthy' | 'degraded' | 'down';
    cloudScheduler: 'healthy' | 'degraded' | 'down';
  };
  metrics: {
    totalEvents: number;
    totalRAGSources: number;
    activeCities: number;
    lastScrapingTime: string | null;
    averageResponseTime: number;
    errorRate: number;
  };
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    service: string;
    timestamp: string;
  }>;
}

const MonitoringSection: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  // Cargar estado de salud al montar el componente
  useEffect(() => {
    loadSystemHealth();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(loadSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemHealth = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('https://us-central1-wearecity-2ab89.cloudfunctions.net/getSystemHealth');
      
      if (response.ok) {
        const healthData = await response.json();
        setHealth(healthData);
        setLastUpdate(new Date());
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
      
    } catch (error) {
      console.error('Error cargando estado del sistema:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el estado del sistema",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'agentEngine': return <Bot className="h-4 w-4" />;
      case 'puppeteerService': return <Globe className="h-4 w-4" />;
      case 'vectorSearch': return <Database className="h-4 w-4" />;
      case 'firestore': return <Server className="h-4 w-4" />;
      case 'cloudScheduler': return <Clock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getServiceName = (service: string) => {
    switch (service) {
      case 'agentEngine': return 'Agent Engine';
      case 'puppeteerService': return 'Puppeteer Service';
      case 'vectorSearch': return 'Vector Search';
      case 'firestore': return 'Firestore';
      case 'cloudScheduler': return 'Cloud Scheduler';
      default: return service;
    }
  };

  const getStatusBadge = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Operativo</Badge>;
      case 'degraded':
        return <Badge variant="secondary" className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" />Degradado</Badge>;
      case 'down':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Inactivo</Badge>;
    }
  };

  const getAlertIcon = (type: 'warning' | 'error' | 'info') => {
    switch (type) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  if (!health) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando estado del sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Monitoreo del Sistema</h2>
          <p className="text-muted-foreground">
            Estado en tiempo real del Vertex AI Agent Engine
          </p>
        </div>
        <Button 
          onClick={loadSystemHealth}
          disabled={loading}
          variant="outline"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Actualizar
        </Button>
      </div>

      {/* Estado de Servicios */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(health.services).map(([service, status]) => (
          <Card key={service}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                {getServiceIcon(service)}
                <span className="font-medium text-sm">{getServiceName(service)}</span>
              </div>
              {getStatusBadge(status)}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.metrics.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              En {health.metrics.activeCities} ciudades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuentes RAG</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.metrics.totalRAGSources}</div>
            <p className="text-xs text-muted-foreground">
              Documentos indexados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ciudades Activas</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.metrics.activeCities}</div>
            <p className="text-xs text-muted-foreground">
              Con datos disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Error</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.metrics.errorRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {health.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Alertas del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health.alerts.map((alert, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-muted">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.service} • {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">🤖 Agent Engine</h4>
              <p className="text-muted-foreground">ID: 3094997688840617984</p>
              <p className="text-muted-foreground">Modelo: Gemini 2.5 Flash</p>
              <p className="text-muted-foreground">Región: us-central1</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">🕷️ Puppeteer Service</h4>
              <p className="text-muted-foreground">Cloud Run desplegado</p>
              <p className="text-muted-foreground">Región: us-central1</p>
              <p className="text-muted-foreground">Estado: {health.services.puppeteerService}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">🔍 Vector Search</h4>
              <p className="text-muted-foreground">Index: wearecity-agent-vector-search</p>
              <p className="text-muted-foreground">Endpoint: wearecity-agent-vector-search-endpoint</p>
              <p className="text-muted-foreground">Estado: {health.services.vectorSearch}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">⏰ Cloud Scheduler</h4>
              <p className="text-muted-foreground">Jobs: 3 configurados</p>
              <p className="text-muted-foreground">Diario: 6:00 AM</p>
              <p className="text-muted-foreground">Semanal: Lunes 3:00 AM</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-xs text-muted-foreground">
            <p>Última actualización: {lastUpdate?.toLocaleString()}</p>
            <p>Timestamp del sistema: {new Date(health.timestamp).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringSection;

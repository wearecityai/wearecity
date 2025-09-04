import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Settings, Sparkles, Zap, Info } from 'lucide-react';
import { AIProviderSelector, AIProvider } from './AIProviderSelector';
import { VertexAIStatus } from './VertexAIStatus';
import { useAIProvider } from '../hooks/useAIProvider';
import { useVertexAI } from '../hooks/useVertexAI';

export const AIProviderConfig: React.FC = () => {
  const { selectedProvider, setSelectedProvider, getCurrentProviderInfo } = useAIProvider();
  const { isAvailable: isVertexAvailable, isReady: isVertexReady } = useVertexAI();
  const [isExpanded, setIsExpanded] = useState(false);

  const currentProviderInfo = getCurrentProviderInfo();

  const getProviderIcon = (provider: AIProvider) => {
    return provider === 'vertex' ? Zap : Sparkles;
  };

  const getProviderStatus = (provider: AIProvider) => {
    if (provider === 'vertex') {
      return isVertexAvailable ? 'available' : 'unavailable';
    }
    return 'available'; // Firebase AI is always available
  };

  const getStatusBadge = (provider: AIProvider) => {
    const status = getProviderStatus(provider);
    if (status === 'available') {
      return <Badge variant="default" className="bg-green-500">Disponible</Badge>;
    }
    return <Badge variant="destructive">No disponible</Badge>;
  };

  if (!isExpanded) {
    const Icon = getProviderIcon(selectedProvider);
    const statusBadge = getStatusBadge(selectedProvider);

    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Proveedor de IA</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="h-6 px-2 text-xs"
            >
              Configurar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{currentProviderInfo.name}</span>
            </div>
            {statusBadge}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {currentProviderInfo.description}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Configuración de IA</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            Minimizar
          </Button>
        </div>
        <CardDescription>
          Configura el proveedor de IA y monitorea su estado
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="selector" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="selector">Selector</TabsTrigger>
            <TabsTrigger value="status">Estado</TabsTrigger>
          </TabsList>
          
          <TabsContent value="selector" className="mt-4">
            <AIProviderSelector
              selectedProvider={selectedProvider}
              onProviderChange={setSelectedProvider}
            />
          </TabsContent>
          
          <TabsContent value="status" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Firebase AI Status */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-sm">Firebase AI</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estado:</span>
                    <Badge variant="default" className="bg-green-500">Disponible</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Proveedor:</span>
                    <span className="text-sm text-muted-foreground">Google AI (Gemini)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Modelo:</span>
                    <span className="text-sm text-muted-foreground">gemini-2.5-flash</span>
                  </div>
                </CardContent>
              </Card>

              {/* Vertex AI Status */}
              <VertexAIStatus />
            </div>

            {/* Información adicional */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-sm">Información</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Firebase AI:</strong> Servicio estable con características básicas de chat y búsqueda en tiempo real.
                  </p>
                  <p>
                    <strong>Vertex AI:</strong> Servicio avanzado con instrucciones dinámicas, detección de intenciones y características anti-alucinación.
                  </p>
                  <p>
                    Puedes cambiar entre proveedores en cualquier momento. El sistema automáticamente usará Firebase AI como fallback si Vertex AI no está disponible.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

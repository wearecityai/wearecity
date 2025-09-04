import React, { useState } from 'react';
import { useMCPs } from '../hooks/useMCPs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Loader2, 
  Zap, 
  Globe, 
  Cloud, 
  Play, 
  Square, 
  RefreshCw, 
  ExternalLink,
  Database,
  Code,
  Users,
  MapPin
} from 'lucide-react';

export const MCPManager: React.FC = () => {
  const { 
    state, 
    connectFirebase, 
    connectBrowser, 
    connectGoogleCloud,
    disconnectMCP, 
    getFirebaseData, 
    navigateToURL,
    getGoogleCloudData,
    refreshConnections 
  } = useMCPs();

  const [url, setUrl] = useState('https://firebase.google.com');
  const [firebaseData, setFirebaseData] = useState<any>(null);
  const [browserData, setBrowserData] = useState<any>(null);
  const [googleCloudData, setGoogleCloudData] = useState<any>(null);

  const handleConnectFirebase = async () => {
    const success = await connectFirebase();
    if (success) {
      const data = await getFirebaseData();
      setFirebaseData(data);
    }
  };

  const handleConnectBrowser = async () => {
    const success = await connectBrowser();
    if (success) {
      const data = await navigateToURL(url);
      setBrowserData(data);
    }
  };

  const handleConnectGoogleCloud = async () => {
    const success = await connectGoogleCloud();
    if (success) {
      const data = await getGoogleCloudData();
      setGoogleCloudData(data);
    }
  };

  const handleNavigate = async () => {
    if (url.trim()) {
      const data = await navigateToURL(url);
      setBrowserData(data);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <div className="w-3 h-3 bg-green-500 rounded-full" />;
      case 'connecting':
        return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />;
      case 'error':
        return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Conectado</Badge>;
      case 'connecting':
        return <Badge variant="secondary">Conectando...</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Desconectado</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-blue-500" />
              <CardTitle>Gestor de MCPs</CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Herramientas IA
              </Badge>
            </div>
            <Button onClick={refreshConnections} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
          <CardDescription>
            Herramientas MCP para que la IA acceda a servicios de terceros (Google Cloud, Firebase, etc.)
          </CardDescription>
          <Alert className="mt-4">
            <AlertDescription className="text-sm">
              🤖 <strong>Herramientas para IA:</strong> Los MCPs permiten que el asistente de IA acceda y modifique 
              servicios de terceros como Google Cloud, Firebase, etc. Solo para uso del asistente, no para usuarios finales.
            </AlertDescription>
          </Alert>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Estado de Conexiones */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Estado de Conexiones</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {state.connections.map((connection) => (
                <Card key={connection.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {connection.id === 'firebase' && <Database className="h-5 w-5 text-blue-500" />}
                      {connection.id === 'browser' && <Globe className="h-5 w-5 text-green-500" />}
                      {connection.id === 'google-cloud' && <Cloud className="h-5 w-5 text-purple-500" />}
                      <span className="font-medium">{connection.name}</span>
                    </div>
                    {getStatusIcon(connection.status)}
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    {getStatusBadge(connection.status)}
                    {connection.lastConnected && (
                      <span className="text-xs text-muted-foreground">
                        {connection.lastConnected.toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  {connection.error && (
                    <Alert variant="destructive" className="mb-3">
                      <AlertDescription className="text-xs">{connection.error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex space-x-2">
                    {connection.status === 'disconnected' && (
                      <Button
                        onClick={() => {
                          if (connection.id === 'firebase') handleConnectFirebase();
                          else if (connection.id === 'browser') handleConnectBrowser();
                          else if (connection.id === 'google-cloud') handleConnectGoogleCloud();
                        }}
                        size="sm"
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Conectar
                      </Button>
                    )}
                    
                    {connection.status === 'connected' && (
                      <Button
                        onClick={() => disconnectMCP(connection.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Desconectar
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Firebase MCP */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-500" />
              <span>Firebase MCP</span>
            </h3>
            
            {firebaseData && (
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Project ID</Label>
                    <p className="text-sm text-muted-foreground">{firebaseData.projectId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Collections</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {firebaseData.collections.map((collection: string) => (
                        <Badge key={collection} variant="outline" className="text-xs">
                          {collection}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Functions</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {firebaseData.functions.map((func: string) => (
                        <Badge key={func} variant="outline" className="text-xs">
                          <Code className="h-3 w-3 mr-1" />
                          {func}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Browser MCP */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Globe className="h-5 w-5 text-green-500" />
              <span>Browser MCP</span>
            </h3>
            
            <div className="flex space-x-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://ejemplo.com"
                className="flex-1"
              />
              <Button onClick={handleNavigate} disabled={!url.trim()}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Navegar
              </Button>
            </div>

            {browserData && (
              <Card className="p-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">URL</Label>
                    <p className="text-sm text-muted-foreground">{browserData.url}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Título</Label>
                    <p className="text-sm text-muted-foreground">{browserData.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Contenido</Label>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {browserData.content}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Google Cloud MCP */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Cloud className="h-5 w-5 text-purple-500" />
              <span>Google Cloud MCP</span>
            </h3>
            
            {googleCloudData && (
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Project ID</Label>
                    <p className="text-sm text-muted-foreground">{googleCloudData.projectId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Services</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {googleCloudData.services.map((service: string) => (
                        <Badge key={service} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Resources</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                      {googleCloudData.resources.map((resource: any, index: number) => (
                        <div key={index} className="p-2 border rounded text-xs">
                          <div className="font-medium">{resource.name}</div>
                          <div className="text-muted-foreground">{resource.type}</div>
                          <Badge variant={resource.status === 'active' ? 'default' : 'secondary'} className="text-xs mt-1">
                            {resource.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Errores */}
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

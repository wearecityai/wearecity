import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sparkles, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useVertexAI } from '../hooks/useVertexAI';

export type AIProvider = 'firebase' | 'vertex';

interface AIProviderSelectorProps {
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  className?: string;
}

export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  className = ''
}) => {
  const { isAvailable: isVertexAvailable, isReady: isVertexReady } = useVertexAI();

  const providers = [
    {
      id: 'firebase' as AIProvider,
      name: 'Firebase AI',
      description: 'Google AI (Gemini) con Firebase AI Logic',
      icon: Sparkles,
      features: [
        'Chat en tiempo real',
        'Contexto de ciudad',
        'Búsqueda en tiempo real',
        'SDK oficial de Firebase'
      ],
      status: 'available' as const,
      badge: 'Estable'
    },
    {
      id: 'vertex' as AIProvider,
      name: 'Vertex AI',
      description: 'Google Cloud AI Platform con instrucciones dinámicas',
      icon: Zap,
      features: [
        'Instrucciones dinámicas',
        'Detección automática de intenciones',
        'Geolocalización inteligente',
        'Anti-alucinación para trámites',
        'Formateo automático de cards'
      ],
      status: isVertexAvailable ? 'available' : 'unavailable' as const,
      badge: isVertexAvailable ? 'Disponible' : 'No disponible'
    }
  ];

  const getStatusIcon = (provider: typeof providers[0]) => {
    if (provider.status === 'available') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (provider: typeof providers[0]) => {
    if (provider.status === 'available') {
      return <Badge variant="default" className="bg-green-500">{provider.badge}</Badge>;
    }
    return <Badge variant="destructive">{provider.badge}</Badge>;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold">Seleccionar Proveedor de IA</h3>
        <p className="text-sm text-muted-foreground">
          Elige entre Firebase AI (estable) o Vertex AI (avanzado)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider) => {
          const Icon = provider.icon;
          const isSelected = selectedProvider === provider.id;
          const isDisabled = provider.status === 'unavailable';

          return (
            <Card 
              key={provider.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              } ${
                isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
              onClick={() => !isDisabled && onProviderChange(provider.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-base">{provider.name}</CardTitle>
                  </div>
                  {getStatusBadge(provider)}
                </div>
                <CardDescription className="text-sm">
                  {provider.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Estado del servicio */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estado:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(provider)}
                    <span className="text-sm">
                      {provider.status === 'available' ? 'Operativo' : 'No disponible'}
                    </span>
                  </div>
                </div>

                {/* Características */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Características:</span>
                  <div className="space-y-1">
                    {provider.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                    {provider.features.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{provider.features.length - 3} características más
                      </span>
                    )}
                  </div>
                </div>

                {/* Botón de selección */}
                <div className="flex justify-end">
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    disabled={isDisabled}
                    className="w-full"
                  >
                    {isSelected ? 'Seleccionado' : 'Seleccionar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Información adicional */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Puedes cambiar el proveedor en cualquier momento. Vertex AI ofrece características más avanzadas
          pero requiere que el servicio esté disponible.
        </p>
      </div>
    </div>
  );
};

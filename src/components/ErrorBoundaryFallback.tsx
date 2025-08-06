import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryFallbackProps {
  error?: Error;
  resetError?: () => void;
}

const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({ 
  error, 
  resetError 
}) => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            
            <h1 className="text-2xl font-bold mb-4">
              ¡Ups! Algo salió mal
            </h1>
            
            <p className="text-muted-foreground mb-6">
              La aplicación encontró un error inesperado. 
              Esto puede deberse a un problema temporal.
            </p>

            {error && (
              <Alert className="mb-6 text-left">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs font-mono whitespace-pre-wrap break-words">
                  {error.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-center mt-6">
              {resetError && (
                <Button onClick={resetError}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Intentar de nuevo
                </Button>
              )}
              
              <Button variant="outline" onClick={handleReload}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar página
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              Si el problema persiste, intenta refrescar la página o contacta con soporte.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ErrorBoundaryFallback;
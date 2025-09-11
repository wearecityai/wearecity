
import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';
import { API_KEY_ERROR_MESSAGE } from '../constants';

interface ErrorBoundaryProps {
  isGeminiReady: boolean;
  appError: string | null;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ isGeminiReady, appError }) => {
  if (!isGeminiReady && appError === API_KEY_ERROR_MESSAGE) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-4">Error de Configuración</h2>
              <p className="text-muted-foreground mb-4">{API_KEY_ERROR_MESSAGE}</p>
              <div className="text-sm text-muted-foreground">
                Consulta la documentación para configurar la API_KEY.
                <br />
                <Button 
                  size="sm" 
                  variant="link" 
                  asChild
                  className="p-0 h-auto mt-2 rounded-full"
                >
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Obtén una API Key
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default ErrorBoundary;

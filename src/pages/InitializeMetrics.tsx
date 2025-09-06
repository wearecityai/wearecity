import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuthFirebase';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMetricsInitialization } from '@/utils/initializeMetrics';
import { Loader2, CheckCircle, AlertCircle, Play } from 'lucide-react';

const InitializeMetrics: React.FC = () => {
  const { user, profile, isLoading } = useAuth();
  const { initializeCategories, verifySetup } = useMetricsInitialization();
  const [initializing, setInitializing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (isLoading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (profile?.role !== 'administrativo') return <Navigate to="/" replace />;

  const handleInitializeCategories = async () => {
    setInitializing(true);
    setError(null);
    setSuccess(null);
    
    try {
      await initializeCategories();
      setSuccess('✅ Categorías inicializadas correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al inicializar categorías');
    }
    
    setInitializing(false);
  };

  const handleVerifySetup = async () => {
    setVerifying(true);
    setError(null);
    
    try {
      const isComplete = await verifySetup();
      setSetupComplete(isComplete);
      if (isComplete) {
        setSuccess('✅ Sistema de métricas configurado correctamente');
      } else {
        setError('⚠️ Configuración incompleta. Inicializa las categorías primero.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar configuración');
    }
    
    setVerifying(false);
  };

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Configuración de Métricas</h1>
          <p className="text-muted-foreground">
            Inicializa el sistema de métricas para tu ciudad
          </p>
        </div>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          
          {/* Paso 1: Inicializar Categorías */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </span>
                  Inicializar Categorías de Chat
                </CardTitle>
                <Badge variant="outline">
                  Requerido
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Crea las categorías por defecto para clasificar automáticamente las consultas:
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>🏛️</span>
                  <span>Trámites</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🎉</span>
                  <span>Eventos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>Lugares</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>Información General</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🏖️</span>
                  <span>Turismo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🚰</span>
                  <span>Servicios Públicos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🚌</span>
                  <span>Transporte</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🎭</span>
                  <span>Cultura</span>
                </div>
              </div>

              <Button 
                onClick={handleInitializeCategories}
                disabled={initializing}
                className="w-full"
              >
                {initializing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inicializando...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Inicializar Categorías
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Paso 2: Verificar Configuración */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground text-sm font-bold">
                    2
                  </span>
                  Verificar Configuración
                </CardTitle>
                <Badge variant={setupComplete ? "default" : "secondary"}>
                  {setupComplete ? "Completado" : "Pendiente"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Verifica que el sistema de métricas esté configurado correctamente.
              </p>

              <Button 
                onClick={handleVerifySetup}
                disabled={verifying}
                variant="outline"
                className="w-full"
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verificar Sistema
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle>ℹ️ Información Importante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  • Las métricas se registrarán automáticamente cuando los usuarios interactúen con el chat
                </p>
                <p>
                  • La clasificación de temáticas se hace mediante IA (Vertex AI)
                </p>
                <p>
                  • Los datos se almacenan de forma segura en Firebase Firestore
                </p>
                <p>
                  • Solo los administradores pueden ver las métricas de su ciudad
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default InitializeMetrics;
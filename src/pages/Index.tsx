
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageCircle, User, Shield, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import UserButton from '@/components/auth/UserButton';
import CityChat from '../../city-chat/App';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading } = useAuth();
  const [showCityChat, setShowCityChat] = useState(false);
  const [currentThemeMode, setCurrentThemeMode] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setCurrentThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Auto-redirect authenticated users to chat
    if (user && !isLoading) {
      setShowCityChat(true);
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (showCityChat) {
    return (
      <div className="relative">
        {user && (
          <div className="absolute top-4 right-4 z-50">
            <UserButton />
          </div>
        )}
        <CityChat 
          toggleTheme={toggleTheme} 
          currentThemeMode={currentThemeMode} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold mb-4">Asistente Municipal IA</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tu asistente inteligente para consultas municipales. Obtén información sobre trámites, 
            servicios y procedimientos de manera rápida y eficiente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <MessageCircle className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Chat Sin Registro</CardTitle>
              <CardDescription>
                Haz consultas inmediatas sin necesidad de crear una cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowCityChat(true)} 
                className="w-full"
              >
                Comenzar Chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <User className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Cuenta Ciudadano</CardTitle>
              <CardDescription>
                Guarda tus conversaciones y accede a funciones personalizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth')} 
                className="w-full"
              >
                Registrarse / Acceder
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Panel Administrativo</CardTitle>
              <CardDescription>
                Personaliza el asistente y gestiona configuraciones avanzadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/auth')} 
                className="w-full"
              >
                Acceso Administrativo
              </Button>
            </CardContent>
          </Card>
        </div>

        {!user && (
          <Alert>
            <AlertDescription className="text-center">
              <strong>¿Eres administrador?</strong> Al registrarte, selecciona "Administrativo" 
              para acceder al panel de configuración del asistente.
            </AlertDescription>
          </Alert>
        )}

        {user && (
          <Card>
            <CardHeader>
              <Settings className="w-8 h-8 text-primary mb-2" />
              <CardTitle>¡Bienvenido de vuelta!</CardTitle>
              <CardDescription>
                Has iniciado sesión como {profile?.role === 'administrativo' ? 'Administrador' : 'Ciudadano'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setShowCityChat(true)} 
                className="w-full"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Continuar al Chat
              </Button>
              {profile?.role === 'administrativo' && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/admin')} 
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Panel Administrativo
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;

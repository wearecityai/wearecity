import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserButton from '@/components/auth/UserButton';
import { UserProfile } from '@/components/UserProfile';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading } = useAuth();

  const handleLogin = () => {
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">City Chat</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <UserButton />
            ) : (
              <Button onClick={handleLogin}>
                Iniciar Sesión
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {user ? (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                ¡Bienvenido, {profile?.first_name || user.email}!
              </h2>
              <p className="text-muted-foreground">
                Tu sistema de chat municipal está listo para usar
              </p>
            </div>
            
            <UserProfile />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                Sistema de Chat Municipal
              </h2>
              <p className="text-muted-foreground mb-8">
                Conecta con los servicios de tu ciudad de manera fácil y rápida
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Para Ciudadanos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Accede a información municipal, consulta trámites y obtén respuestas rápidas sobre servicios de tu ciudad.
                  </p>
                  <Button onClick={handleLogin} variant="outline" className="w-full">
                    Acceder como Ciudadano
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Para Administradores</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Gestiona tu chat público, configura respuestas automáticas y administra la información de tu municipio.
                  </p>
                  <Button onClick={handleLogin} className="w-full">
                    Panel Administrativo
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
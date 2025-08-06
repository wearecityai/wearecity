import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold">CityCore</h1>
          {user && (
            <Button variant="outline" onClick={() => navigate('/auth')}>
              Perfil
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Tu asistente de ciudad inteligente
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Conecta con tu ciudad como nunca antes. Obtén información local, 
              descubre servicios y gestiona trámites con inteligencia artificial.
            </p>
          </div>

          {/* Search Section */}
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Buscar tu ciudad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Escribe el nombre de tu ciudad..." 
                    className="flex-1"
                  />
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Chat Inteligente</h3>
                <p className="text-muted-foreground">
                  Conversa naturalmente con el asistente de tu ciudad
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Información Local</h3>
                <p className="text-muted-foreground">
                  Datos actualizados sobre servicios y eventos locales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Search className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Búsqueda Avanzada</h3>
                <p className="text-muted-foreground">
                  Encuentra rápidamente lo que necesitas en tu ciudad
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="mt-12">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="mr-4"
            >
              Comenzar ahora
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/chat/demo')}
            >
              Ver demo
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
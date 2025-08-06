import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, MessageCircle, Sparkles, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout, LayoutHeader, LayoutMain, LayoutContainer } from '@/components/ui/layout';
import { FeatureCard } from '@/components/ui/feature-card';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = () => {
    if (searchValue.trim()) {
      // TODO: Implement city search logic
      console.log('Searching for:', searchValue);
    }
  };

  return (
    <Layout>
      <LayoutHeader>
        <LayoutContainer className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                CityCore
              </h1>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Beta
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="outline" onClick={() => navigate('/auth')}>
                <Users className="h-4 w-4 mr-2" />
                Perfil
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Iniciar Sesión
              </Button>
            )}
          </div>
        </LayoutContainer>
      </LayoutHeader>

      <LayoutMain>
        <LayoutContainer className="py-8">
          {/* Hero Section */}
          <div className="text-center space-y-8 py-12">
            <div className="space-y-6">
              <div className="space-y-4">
                <Badge variant="outline" className="mb-4">
                  🚀 Potenciado por IA
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Tu asistente de ciudad
                  <span className="block text-primary">inteligente</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Conecta con tu ciudad como nunca antes. Obtén información local, 
                  descubre servicios y gestiona trámites con inteligencia artificial.
                </p>
              </div>
            </div>

            {/* Search Section */}
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-lg border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-left">
                    <Search className="h-5 w-5 text-primary" />
                    Buscar tu ciudad
                  </CardTitle>
                  <CardDescription className="text-left">
                    Encuentra el asistente virtual de tu municipio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Escribe el nombre de tu ciudad..." 
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1 text-base"
                    />
                    <Button onClick={handleSearch} className="px-6">
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
              <FeatureCard
                icon={<MessageCircle className="h-8 w-8 text-primary" />}
                title="Chat Inteligente"
                description="Conversa naturalmente con el asistente de tu ciudad para resolver dudas y obtener información"
              />
              
              <FeatureCard
                icon={<MapPin className="h-8 w-8 text-primary" />}
                title="Información Local"
                description="Accede a datos actualizados sobre servicios municipales, eventos y puntos de interés"
              />
              
              <FeatureCard
                icon={<Shield className="h-8 w-8 text-primary" />}
                title="Gestión Segura"
                description="Realiza trámites y consultas oficiales de forma segura y confidencial"
              />
            </div>

            {/* CTA Section */}
            <div className="mt-16 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
                  className="px-8 py-3 text-lg"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Comenzar ahora
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/chat/demo')}
                  className="px-8 py-3 text-lg"
                >
                  Ver demo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Gratis para ciudadanos • Seguro y privado
              </p>
            </div>
          </div>
        </LayoutContainer>
      </LayoutMain>
    </Layout>
  );
};

export default Index;
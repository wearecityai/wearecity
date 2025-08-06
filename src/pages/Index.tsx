import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, MessageCircle, Sparkles, Users, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout, LayoutHeader, LayoutMain, LayoutContainer } from '@/components/ui/layout';
import { Hero, HeroContent, HeroTitle, HeroSubtitle, HeroActions } from '@/components/ui/hero';
import { FeaturesGrid, Feature } from '@/components/ui/features-grid';
import { Navigation, NavigationItem } from '@/components/ui/navigation';
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
        <LayoutContainer>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-xl font-bold">CityCore</span>
              </div>
              <Badge variant="secondary" className="ml-2">
                Beta
              </Badge>
            </div>
            
            <Navigation className="hidden md:flex">
              <NavigationItem href="#features">Características</NavigationItem>
              <NavigationItem href="#about">Acerca de</NavigationItem>
            </Navigation>
            
            <div className="flex items-center gap-2">
              {user ? (
                <Button variant="outline" onClick={() => navigate('/admin')}>
                  <Users className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              ) : (
                <Button onClick={() => navigate('/auth')}>
                  Iniciar Sesión
                </Button>
              )}
            </div>
          </div>
        </LayoutContainer>
      </LayoutHeader>

      <LayoutMain>
        {/* Hero Section */}
        <Hero className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
          <HeroContent>
            <div className="space-y-6">
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                <Sparkles className="h-3 w-3 mr-1" />
                Potenciado por IA
              </Badge>
              
              <HeroTitle className="bg-gradient-to-br from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">
                Tu asistente de ciudad
                <span className="block bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  inteligente
                </span>
              </HeroTitle>
              
              <HeroSubtitle>
                Conecta con tu ciudad como nunca antes. Obtén información local, 
                descubre servicios y gestiona trámites con inteligencia artificial.
              </HeroSubtitle>
            </div>

            {/* Search Card */}
            <div className="mx-auto max-w-2xl">
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Buscar tu ciudad
                  </CardTitle>
                  <CardDescription>
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
                      className="text-base"
                    />
                    <Button onClick={handleSearch} className="shrink-0">
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <HeroActions>
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Comenzar ahora
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/chat/demo')}
              >
                Ver demo
              </Button>
            </HeroActions>
          </HeroContent>
        </Hero>

        {/* Features Section */}
        <section id="features" className="py-20">
          <LayoutContainer>
            <div className="text-center space-y-4 mb-16">
              <Badge variant="outline">Características</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Todo lo que necesitas para conectar con tu ciudad
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Una plataforma completa para la interacción ciudadana moderna
              </p>
            </div>
            
            <FeaturesGrid>
              <Feature
                icon={<MessageCircle className="h-8 w-8" />}
                title="Chat Inteligente"
                description="Conversa naturalmente con el asistente de tu ciudad para resolver dudas y obtener información actualizada"
              />
              
              <Feature
                icon={<MapPin className="h-8 w-8" />}
                title="Información Local"
                description="Accede a datos en tiempo real sobre servicios municipales, eventos y puntos de interés de tu ciudad"
              />
              
              <Feature
                icon={<Shield className="h-8 w-8" />}
                title="Gestión Segura"
                description="Realiza trámites y consultas oficiales de forma segura, privada y con validación gubernamental"
              />
            </FeaturesGrid>
          </LayoutContainer>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-muted/30 py-16">
          <LayoutContainer>
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">
                ¿Listo para empezar?
              </h2>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                Únete a miles de ciudadanos que ya están usando CityCore para conectar con su ciudad
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
                >
                  Crear cuenta gratis
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/auth')}
                >
                  Saber más
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Gratis para ciudadanos • Seguro y privado • Sin spam
              </p>
            </div>
          </LayoutContainer>
        </section>
      </LayoutMain>
    </Layout>
  );
};

export default Index;
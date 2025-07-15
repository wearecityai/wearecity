import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, MessageSquare, Bot, Globe, Shield, Zap, ArrowRight, Clock, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface City {
  id: string;
  name: string;
  slug: string;
  assistant_name: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [cities, setCities] = useState<City[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Cargar ciudades disponibles
  useEffect(() => {
    const loadCities = async () => {
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('id, name, slug, assistant_name')
          .eq('is_active', true)
          .eq('is_public', true)
          .order('name');

        if (error) {
          console.error('Error loading cities:', error);
          return;
        }

        setCities(data || []);
      } catch (error) {
        console.error('Error loading cities:', error);
      }
    };

    loadCities();
  }, []);

  // Filtrar ciudades basado en búsqueda
  useEffect(() => {
    if (searchValue.trim()) {
      const filtered = cities.filter(city =>
        city.name.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredCities([]);
      setShowSuggestions(false);
    }
  }, [searchValue, cities]);

  const handleCitySelect = (city: City) => {
    navigate(`/chat/${city.slug}`);
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const features = [
    {
      icon: <Bot className="w-6 h-6" />,
      title: 'IA Especializada',
      description: 'Cada ciudad tiene su asistente IA personalizado, entrenado con información local específica y actualizada.',
      color: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Información Local',
      description: 'Accede a servicios municipales, eventos, procedimientos administrativos y datos actualizados de tu ciudad.',
      color: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Conversación Natural',
      description: 'Pregunta como le harías a un vecino. Nuestro asistente entiende el lenguaje natural y el contexto local.',
      color: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Privacidad Garantizada',
      description: 'Tus conversaciones están protegidas. No almacenamos datos personales sin tu consentimiento.',
      color: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Respuestas Instantáneas',
      description: 'Obtén información precisa al instante, sin esperas ni formularios complicados.',
      color: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Acceso Libre',
      description: 'Disponible para todos los ciudadanos, sin registro obligatorio. Democratizando el acceso a la información.',
      color: 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800'
    }
  ];

  const useCases = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Horarios y Servicios',
      example: '"¿A qué hora abre el ayuntamiento?"'
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Trámites y Procedimientos',
      example: '"¿Cómo solicito el empadronamiento?"'
    },
    {
      icon: <Star className="w-5 h-5" />,
      title: 'Eventos y Actividades',
      example: '"¿Qué eventos hay este fin de semana?"'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">CityChat</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              profile?.role === 'administrativo' ? (
                <Button variant="outline" onClick={() => navigate('/admin')}>
                  Panel Admin
                </Button>
              ) : (
                <Button variant="outline" onClick={() => navigate('/chat/finestrat')}>
                  Ir al Chat
                </Button>
              )
            ) : (
              <Button variant="outline" onClick={handleLogin}>
                Iniciar sesión
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6">
            🚀 Revolucionando la comunicación ciudadana
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            ¿En qué puedo ayudarte?
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Tu asistente de ciudad inteligente. Obtén información local, servicios municipales 
            y respuestas instantáneas a través de conversaciones naturales con IA.
          </p>

          {/* Search Input */}
          <div className="relative max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Busca tu ciudad para comenzar..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-12 pr-12 h-14 text-lg rounded-full border-2 focus:border-primary"
              />
              <ArrowRight className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            </div>
            
            {/* City Suggestions */}
            {showSuggestions && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-60 overflow-y-auto">
                <CardContent className="p-0">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => handleCitySelect(city)}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center space-x-3 border-b last:border-b-0"
                      >
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{city.name}</div>
                          <div className="text-sm text-muted-foreground">{city.assistant_name}</div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-muted-foreground">
                      No se encontraron ciudades
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Use Cases */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-16">
            {useCases.map((useCase, index) => (
              <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary/20">
                <CardContent className="p-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {useCase.icon}
                    <span className="font-medium text-sm">{useCase.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground italic">{useCase.example}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Por qué elegir CityChat?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Una nueva forma de interactuar con tu ciudad, diseñada para ser intuitiva, 
              segura y accesible para todos los ciudadanos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className={`p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${feature.color}`}>
                <CardContent className="p-0">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Así de simple funciona
            </h2>
            <p className="text-xl text-muted-foreground">
              Tres pasos para obtener la información que necesitas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Selecciona tu ciudad</h3>
              <p className="text-muted-foreground">Busca y selecciona tu ciudad en el campo de búsqueda</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Haz tu pregunta</h3>
              <p className="text-muted-foreground">Escribe tu consulta de forma natural, como le preguntarías a un amigo</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Obtén respuestas</h3>
              <p className="text-muted-foreground">Recibe información precisa y actualizada sobre tu ciudad al instante</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Únete a miles de ciudadanos que ya están usando CityChat para obtener información local
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-8 py-3 text-lg"
          >
            Buscar mi Ciudad
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold">CityChat</span>
              </div>
              <p className="text-muted-foreground">
                Democratizando el acceso a la información municipal a través de 
                inteligencia artificial conversacional.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Enlaces Útiles</h3>
              <div className="space-y-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="justify-start p-0 h-auto">
                  Iniciar Sesión
                </Button>
                <br />
                <Button variant="ghost" size="sm" onClick={() => navigate('/chat/finestrat')} className="justify-start p-0 h-auto">
                  Chat de Ejemplo
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Sobre el Proyecto</h3>
              <p className="text-sm text-muted-foreground">
                CityChat es una iniciativa para mejorar la comunicación entre 
                ciudadanos y administraciones locales usando tecnología de IA.
              </p>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 CityChat. Construyendo ciudades más conectadas.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAdminChats } from '@/hooks/usePublicChats';
import { useCities } from '@/hooks/useCities';
import { useAuth } from '@/hooks/useAuth';
import { ChatContainer } from './ChatContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link, Settings } from 'lucide-react';

interface AdminChat {
  id: string;
  chat_name: string;
  chat_slug: string;
  is_public: boolean;
  admin_user_id: string;
  assistant_name?: string;
  config_name?: string;
  system_instruction?: string;
  created_at: string;
  updated_at: string;
}

export const PublicChatInterface = () => {
  const { citySlug } = useParams<{ citySlug: string }>();
  const { user, profile } = useAuth();
  const { loadChatBySlug } = useAdminChats();
  const { loadCityBySlug } = useCities();
  
  const [chat, setChat] = useState<AdminChat | null>(null);
  const [city, setCity] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCityData = async () => {
      if (!citySlug) return;

      setIsLoading(true);
      setError(null);

      try {
        // Cargar datos de la ciudad
        const cityData = await loadCityBySlug(citySlug);
        if (!cityData) {
          setError('Ciudad no encontrada');
          return;
        }

        setCity(cityData);

        // Si la ciudad tiene un chat_id, cargar el chat
        if (cityData.chat_id) {
          const chatData = await loadChatBySlug(cityData.slug);
          if (chatData) {
            setChat({
              ...chatData,
              assistant_name: cityData.assistant_name || 'Asistente de Ciudad',
              system_instruction: cityData.system_instruction || 'Soy un asistente que ayuda con información de la ciudad.'
            });
          }
        }
      } catch (error) {
        console.error('Error loading city data:', error);
        setError('Error al cargar la ciudad');
      } finally {
        setIsLoading(false);
      }
    };

    loadCityData();
  }, [citySlug, loadCityBySlug, loadChatBySlug]);

  const isAdminOfThisCity = user && city && user.id === city.admin_user_id;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Cargando ciudad...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !city) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Ciudad no encontrada</CardTitle>
            <CardDescription>
              La ciudad que buscas no existe o no está disponible.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header de la ciudad */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {city.name}
              </h1>
              <p className="text-muted-foreground">
                Chat público con {chat?.assistant_name || 'el asistente de la ciudad'}
              </p>
            </div>
            
            {isAdminOfThisCity && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open('/admin', '_blank')}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Panel Admin
                </Button>
              </div>
            )}
          </div>

          {/* Información para visitantes */}
          {!isAdminOfThisCity && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link className="w-4 h-4" />
                  <span>
                    Estás visitando el chat público de {city.name}. 
                    Puedes hacer preguntas y recibir información sobre la ciudad.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contenedor del chat */}
        <div className="bg-card rounded-lg shadow-lg border">
          <ChatContainer
            chatConfig={{
              assistantName: chat?.assistant_name || 'Asistente de Ciudad',
              systemInstruction: chat?.system_instruction || 'Soy un asistente que ayuda con información de la ciudad.',
              recommendedPrompts: [],
              serviceTags: [],
              enableGoogleSearch: city.enable_google_search ?? true,
              allowMapDisplay: city.allow_map_display ?? true,
              allowGeolocation: city.allow_geolocation ?? true,
              currentLanguageCode: city.current_language_code || 'es',
              procedureSourceUrls: city.procedure_source_urls || [],
              uploadedProcedureDocuments: city.uploaded_procedure_documents || {},
              restrictedCity: city.restricted_city || null,
              sedeElectronicaUrl: city.sede_electronica_url || '',
              profileImageUrl: ''
            }}
            onConfigChange={() => {}}
            isPublicChat={true}
            citySlug={citySlug}
          />
        </div>
      </div>
    </div>
  );
};
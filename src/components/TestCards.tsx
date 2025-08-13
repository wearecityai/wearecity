import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import EventCard from './EventCard';
import PlaceCard from './PlaceCard';
import { EventInfo, PlaceCardInfo } from '../types';

// Componente temporal para probar las cards sin depender de la IA
const TestCards: React.FC = () => {
  const testEvent: EventInfo = {
    title: "Festival de Primavera",
    date: "2025-08-20",
    location: "Plaza Mayor",
    time: "19:00"
  };

  const testPlace: PlaceCardInfo = {
    id: "test-place-1",
    name: "Restaurante La Plaza",
    searchQuery: "Restaurante La Plaza, Finestrat",
    isLoadingDetails: false
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>🔧 Test Cards (Desarrollo)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Estas son cards de prueba para verificar que el sistema de renderizado funciona correctamente.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Event Card Test:</h4>
          <EventCard event={testEvent} />
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Place Card Test:</h4>
          <PlaceCard place={testPlace} />
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Marcadores esperados por la IA:</h4>
          <div className="bg-muted p-3 rounded text-sm font-mono">
            <div>[EVENT_CARD_START]{`{"title": "Festival de Primavera", "date": "2025-08-20", "location": "Plaza Mayor"}`}[EVENT_CARD_END]</div>
            <div className="mt-2">[PLACE_CARD_START]{`{"name": "Restaurante La Plaza", "searchQuery": "Restaurante La Plaza, Finestrat"}`}[PLACE_CARD_END]</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestCards;
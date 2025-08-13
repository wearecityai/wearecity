import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface DebuggingInfoProps {
  userMessage: string;
  response?: string;
  intents?: string[];
}

const DebuggingInfo: React.FC<DebuggingInfoProps> = ({ userMessage, response, intents = [] }) => {
  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const hasEventMarkers = response?.includes('[EVENT_CARD_START]') && response?.includes('[EVENT_CARD_END]');
  const hasPlaceMarkers = response?.includes('[PLACE_CARD_START]') && response?.includes('[PLACE_CARD_END]');

  return (
    <Card className="border-yellow-200 bg-yellow-50 mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          Debugging Info (Solo Desarrollo)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div>
          <div className="font-semibold mb-1">Mensaje del Usuario:</div>
          <div className="bg-white p-2 rounded border">{userMessage}</div>
        </div>

        <div>
          <div className="font-semibold mb-1">Intents Detectados:</div>
          <div className="flex gap-1 flex-wrap">
            {intents.map(intent => (
              <Badge key={intent} variant="outline" className="text-xs">
                {intent}
              </Badge>
            ))}
            {intents.length === 0 && <span className="text-muted-foreground">Ninguno</span>}
          </div>
        </div>

        <div>
          <div className="font-semibold mb-1">Marcadores en Respuesta:</div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              {hasEventMarkers ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <XCircle className="h-3 w-3 text-red-600" />
              )}
              <span className={hasEventMarkers ? 'text-green-600' : 'text-red-600'}>
                Event Cards
              </span>
            </div>
            <div className="flex items-center gap-1">
              {hasPlaceMarkers ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <XCircle className="h-3 w-3 text-red-600" />
              )}
              <span className={hasPlaceMarkers ? 'text-green-600' : 'text-red-600'}>
                Place Cards
              </span>
            </div>
          </div>
        </div>

        {response && (
          <div>
            <div className="font-semibold mb-1">Respuesta (primeros 200 chars):</div>
            <div className="bg-white p-2 rounded border text-xs font-mono">
              {response.substring(0, 200)}...
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-2 rounded">
          <div className="font-semibold text-blue-800 mb-1">Diagnóstico:</div>
          {intents.includes('events') && !hasEventMarkers && (
            <div className="text-red-600">❌ Se detectó intent de eventos pero no hay marcadores de eventos</div>
          )}
          {intents.includes('places') && !hasPlaceMarkers && (
            <div className="text-red-600">❌ Se detectó intent de lugares pero no hay marcadores de lugares</div>
          )}
          {(!intents.includes('events') && !intents.includes('places')) && (
            <div className="text-yellow-600">⚠️ No se detectaron intents de eventos o lugares</div>
          )}
          {hasEventMarkers && (
            <div className="text-green-600">✅ Marcadores de eventos encontrados</div>
          )}
          {hasPlaceMarkers && (
            <div className="text-green-600">✅ Marcadores de lugares encontrados</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DebuggingInfo;
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const PublicChatInterface = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Chat de la Ciudad</CardTitle>
            <CardDescription>
              El sistema de chat está siendo configurado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>El chat de la ciudad estará disponible próximamente.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
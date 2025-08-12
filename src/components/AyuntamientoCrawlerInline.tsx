import React from 'react';
import { Alert, AlertDescription } from './ui/alert';

interface Props {
  startUrl?: string;
}

// Componente temporal que muestra que la funcionalidad no está disponible
const AyuntamientoCrawlerInline: React.FC<Props> = ({ startUrl = '' }) => {
  return (
    <div className="space-y-2">
      <Alert>
        <AlertDescription>
          La funcionalidad de crawling no está disponible actualmente.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AyuntamientoCrawlerInline;
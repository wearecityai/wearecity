import React from 'react';
import { EnhancedAIResponseRenderer } from './EnhancedAIResponseRenderer';

export const FinalAlignmentTest: React.FC = () => {
  const testContent = `
## Prueba Final de Alineación

### Lista simple
- **Evento:** Festival de Cine de Benidorm
- **Evento:** Concierto de Jazz
- **Evento:** Mercado Medieval

### Lista con sub-elementos
- **Deportes y Actividades al Aire Libre**
  - **Actividades Deportivas en Playas**
  - **Rutas de Senderismo Guiadas**
- **Eventos Culturales y Teatrales**
  - **Conciertos de Verano**
  - **Exposiciones de Arte**

### Lista con texto multilínea
- **Evento:** Festival de Cine de Benidorm
  **Descripción:** Una cita imprescindible para los amantes del séptimo arte, con proyecciones, charlas y encuentros con directores y actores.
  **Fecha:** Del 18 al 24 de septiembre de 2025
  **Ubicación:** Varios cines y centros culturales de Benidorm
  **Nota:** Consulta la programación detallada en la web oficial del festival para horarios específicos.

- **Evento:** Concierto de Jazz
  **Descripción:** Disfruta de una velada relajante con música jazz en vivo al aire libre en el auditorio principal.
  **Fecha:** Sábado, 20 de septiembre de 2025
  **Hora:** 21:00
  **Ubicación:** Auditorio Julio Iglesias
  **Nota:** Entrada gratuita hasta completar aforo.
`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Prueba Final de Alineación</h1>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border">
        <EnhancedAIResponseRenderer content={testContent} />
      </div>
    </div>
  );
};

export default FinalAlignmentTest;

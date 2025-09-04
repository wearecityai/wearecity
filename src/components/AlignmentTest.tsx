import React from 'react';
import { EnhancedAIResponseRenderer } from './EnhancedAIResponseRenderer';

export const AlignmentTest: React.FC = () => {
  const testContent = `
## Prueba de Alineación de Texto

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

### Lista con sub-elementos
- **Deportes y Actividades al Aire Libre**
  - **Actividades Deportivas en Playas**
    - **Descripción:** Free or low-cost yoga, pilates, and physical maintenance classes on Levante and Poniente beaches, taking advantage of good weather.
    - **Fecha:** Monday to Friday mornings throughout September.
    - **Ubicación:** Specific points on Levante Beach and Poniente Beach.
  - **Rutas de Senderismo Guiadas por el Parque Natural de Serra Helada**
    - **Descripción:** Exploration of local nature with expert guides. Prior registration is recommended.
    - **Fecha:** Some Saturdays and Sundays in September.
    - **Ubicación:** Usual meeting point at the Serra Gelada Interpretation Center.
`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Prueba de Alineación de Texto</h1>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border">
        <EnhancedAIResponseRenderer content={testContent} />
      </div>
    </div>
  );
};

export default AlignmentTest;

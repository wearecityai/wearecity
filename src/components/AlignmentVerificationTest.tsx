import React from 'react';
import { EnhancedAIResponseRenderer } from './EnhancedAIResponseRenderer';

export const AlignmentVerificationTest: React.FC = () => {
  const testContent = `
## Prueba de Alineación de Texto Multilínea

- **Atardecer (19:30 - 20:30):** Visita al **Balcón del Mediterráneo**.
  **Ubicación:** Centro histórico de Benidorm.
  Un lugar icónico para disfrutar de un atardecer espectacular sobre el mar, con vistas panorámicas de ambas playas. ¡Perfecto para fotos románticas!

- **Evento:** Festival de Cine de Benidorm
  **Descripción:** Una cita imprescindible para los amantes del séptimo arte, con proyecciones, charlas y encuentros con directores y actores.
  **Fecha:** Del 18 al 24 de septiembre de 2025
  **Ubicación:** Varios cines y centros culturales de Benidorm
  **Nota:** Consulta la programación detallada en la web oficial del festival para horarios específicos.

- **Lugar:** Restaurante "El Faro"
  **Dirección:** Paseo de la Carretera, 12
  **Especialidad:** Cocina mediterránea con vistas al mar.
  **Horario:** Abierto todos los días de 13:00 a 16:00 y de 20:00 a 23:00.
  **Contacto:** Teléfono: 965 85 00 00, Web: [elfarobenidorm.com](https://www.elfarobenidorm.com)
`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Verificación de Alineación de Texto</h1>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border">
        <EnhancedAIResponseRenderer content={testContent} />
      </div>
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Verificación:</strong> Las líneas de continuación deben alinearse con el inicio del texto de la primera línea, no con el bullet.
        </p>
      </div>
    </div>
  );
};

export default AlignmentVerificationTest;

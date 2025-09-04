import React from 'react';
import { EnhancedAIResponseRenderer } from './EnhancedAIResponseRenderer';

export const MarkdownListTest: React.FC = () => {
  const testContent = `
## Eventos Destacados en Benidorm - Septiembre 2025

### Actividades Culturales y Festivas:

- **Exposición "Colores de Benidorm"**
  - **Descripción:** Una vibrante exposición de fotografía y pintura local que celebra la esencia de la ciudad.
  - **Ubicación:** Centro Cultural y Social de Benidorm (Salas de Exposición).
  - **Fechas:** Todo el mes de septiembre.
  - **Horario:** Lunes a viernes de 10:00 a 14:00 y de 17:00 a 20:00. Sábados de 10:00 a 14:00.
  - **Entrada:** Gratuita.

- **Jornadas Gastronómicas "Sabores del Mediterráneo"**
  - **Descripción:** Restaurantes locales ofrecen menús especiales basados en productos de proximidad y recetas tradicionales.
  - **Ubicación:** Restaurantes participantes en el centro y el Rincón de Loix. (Se proporcionará una lista detallada en la web municipal).
  - **Fechas:** Del 12 al 22 de septiembre.
  - **Horario:** Durante los servicios de almuerzo y cena de los restaurantes.
  - **Nota:** Reserva recomendada debido a la alta demanda.

- **Concierto "Noches de Jazz en la Playa"**
  - **Descripción:** Un espectáculo al aire libre con bandas de jazz locales e internacionales, disfrutando de la brisa marina.
  - **Ubicación:** Escenario junto al Paseo de Poniente (frente al Parque de Elche).
  - **Fecha:** Sábado, 21 de septiembre de 2025.
  - **Hora:** A partir de las 21:00.
  - **Entrada:** Gratuita.

- **Mercado Artesanal y de Productos Locales**
  - **Descripción:** Descubre artesanía única, productos gourmet y artículos hechos a mano por creadores de la región.
  - **Ubicación:** Parque de Elche.
  - **Fechas:** Domingos del mes de septiembre.
  - **Horario:** De 10:00 a 15:00.
  - **Entrada:** Gratuita.
`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Prueba de Markdown con Sublistas</h1>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border">
        <EnhancedAIResponseRenderer content={testContent} />
      </div>
    </div>
  );
};

export default MarkdownListTest;

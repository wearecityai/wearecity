import React from 'react';
import { EnhancedAIResponseRenderer } from './EnhancedAIResponseRenderer';
import { DirectIndentationTest } from './DirectIndentationTest';
import { AlignmentTest } from './AlignmentTest';
import { FinalAlignmentTest } from './FinalAlignmentTest';
import { MarkdownListTest } from './MarkdownListTest';
import { AlignmentVerificationTest } from './AlignmentVerificationTest';

export const MultilineTest: React.FC = () => {
  const testContent = `
## Eventos destacados en septiembre 2025

### Benidorm Pride Festival (1-7 de septiembre)
Una semana llena de actividades para celebrar la diversidad y el orgullo LGTBIQ+:

- **Miércoles 3:** Pink Party en KU Lounge Café a partir de las 19:00 h. Entrada 10 €.
- **Jueves 4:** Pride Pool Party en Marakka Club (Finca Les Palmeres) de 12:00 a 19:00 h. Entrada 25 €.
- **Viernes 5:** White Party en el Auditorio Julio Iglesias a partir de las 19:00 h. Entrada 15 €.
- **Sábado 6:** Desfile del Orgullo desde el Rincón de Loix hasta la Pride Arena en el Auditorio Julio Iglesias.
- **Sábado 6:** Kluster 10º Aniversario en Penélope Discoteca a partir de las 23:00 h. Entrada gratuita.
- **Domingo 7:** Bingo Boom + Glitter Ball en Benidorm Palace a las 20:30 h. Entrada 25 €.

---

### Eventos culturales y teatrales
- **7 de septiembre:** Campeones 2 en el Auditorio Centro Cultural a las 19:00 h. Entrada gratuita.
- **11 de septiembre:** Presentación del libro "Bajo el cielo de Isis" en el Centro Municipal El Torrejó a las 19:00 h. Entrada libre.
- **12 de septiembre:** Monólogo "Padre de Familia - Cosas de Casa" de Miki Dkai en el Centro Cultural a las 20:30 h. Entrada 10 €.
- **13 de septiembre:** Brasil Independiente Fest en el Auditorio Julio Iglesias a partir de las 20:00 h. Entrada gratuita.
- **15-18 de septiembre:** Taller de Guion de Cine y TV en el Centro Municipal El Torrejó de 18:00 a 20:00 h. Inscripciones abiertas.

---

### Espectáculos y festivales
- **11-21 de septiembre:** El Circo Encantado en el Recinto Ferial. Funciones diarias a las 18:00 h. Entrada 12 €.
- **20 de septiembre:** Meaodika en Penélope Beach a partir de las 20:00 h. Entrada gratuita.

---

### Ejemplo de indentación simple (estilo ChatGPT)
- **Evento principal**
  - **Sub-evento 1**
  - **Sub-evento 2**
- **Otro evento principal**
  - **Sub-evento 3**
  - **Sub-evento 4**
`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Prueba de Texto Multilínea en Listas</h1>
      
      {/* Verificación de alineación */}
      <AlignmentVerificationTest />
      
      <hr className="my-8 border-t border-gray-200 dark:border-gray-700" />
      
      {/* Prueba de markdown con sublistas */}
      <MarkdownListTest />
      
      <hr className="my-8 border-t border-gray-200 dark:border-gray-700" />
      
      {/* Prueba final de alineación */}
      <FinalAlignmentTest />
      
      <hr className="my-8 border-t border-gray-200 dark:border-gray-700" />
      
      {/* Prueba de alineación */}
      <AlignmentTest />
      
      <hr className="my-8 border-t border-gray-200 dark:border-gray-700" />
      
      {/* Prueba directa de indentación */}
      <DirectIndentationTest />
      
      <hr className="my-8 border-t border-gray-200 dark:border-gray-700" />
      
      {/* Prueba con renderizador */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border">
        <EnhancedAIResponseRenderer content={testContent} />
      </div>
    </div>
  );
};

export default MultilineTest;

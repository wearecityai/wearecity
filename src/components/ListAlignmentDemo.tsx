import React from 'react';
import { AIResponseRenderer } from './AIResponseRenderer';
import { Card, CardContent } from './ui/card';

const ListAlignmentDemo: React.FC = () => {
  const exampleWithCorrectAlignment = `
## Ejemplo de Alineación Correcta

### **Actividades del Día**

- **Desayuno (08:00):** Comenzamos el día con un desayuno completo en el hotel, incluyendo opciones locales y internacionales para todos los gustos.

- **Visita al Mercado (10:00):** Exploramos el mercado local donde podrás encontrar productos frescos, artesanías tradicionales y souvenirs auténticos de la región.

- **Almuerzo (13:30):** Picnic con vistas si lo desean, o un almuerzo ligero en un chiringuito cerca de la Playa de l'Albir si se acercaron al faro.

- **Tarde Libre (15:00):** Tiempo para relajarse en la playa, hacer compras o explorar la ciudad a tu ritmo.

### **Información Importante**

1. **Transporte:** Todos los desplazamientos están incluidos en el precio del tour.

2. **Comidas:** El desayuno está incluido, pero el almuerzo y la cena son por cuenta propia.

3. **Recomendaciones:** Lleva ropa cómoda, protector solar y una cámara para capturar los mejores momentos.

---

## Documentación Requerida

- [x] **DNI o pasaporte** (original y copia)
- [x] **Reserva del hotel** (confirmación de la reserva)
- [x] **Seguro de viaje** (recomendado pero no obligatorio)
- [ ] **Certificado de vacunación** (si es requerido por el destino)

---

## Contacto y Soporte

**Teléfono:** +34 123 456 789
**Email:** info@ejemplo.com
**Horario:** L-V: 9:00-18:00

> **Tip:** Para cualquier consulta, no dudes en contactarnos durante el horario de atención.
`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🎯 Demo de Alineación de Listas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Ejemplo de cómo se ven las listas con alineación correcta
        </p>
      </div>

      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            ✅ Alineación Correcta (list-outside)
          </h2>
          <AIResponseRenderer content={exampleWithCorrectAlignment} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ListAlignmentDemo;

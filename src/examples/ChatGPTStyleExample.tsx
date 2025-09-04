import React, { useState } from 'react';
import { AIResponseRenderer } from '../components/AIResponseRenderer';
import { AlertBox } from '../components/AlertBox';
import { PlaceCard, EventCard } from '../components/InfoCard';
import { useAIResponse } from '../hooks/useAIResponse';

// Ejemplo de respuesta con el nuevo formato
const EXAMPLE_RESPONSE = `
## 🏛️ Ayuntamiento de Valencia

### 📋 **Información General**
| Campo | Valor |
|-------|-------|
| **📍 Dirección** | Plaza del Ayuntamiento, 1, 46002 Valencia |
| **🕐 Horarios** | L-V: 8:00-15:00, S: 9:00-13:00 |
| **📞 Teléfono** | +34 963 525 478 |
| **💻 Web** | [www.valencia.es](https://www.valencia.es) |

### 🔹 **Servicios Disponibles**
- [x] **📋 Trámites administrativos**
- [x] **🏠 Empadronamiento**
- [x] **📄 Certificados**
- [ ] **💰 Tasas municipales** (solo online)

### 🔹 **Cómo Llegar**
**🚌 Transporte público:** Líneas 1, 3, 5, 7
**🚗 En coche:** Aparcamiento público en Plaza del Ayuntamiento
**🅿️ Aparcamiento:** Zona azul y parking municipal

> **💡 Tip:** Puedes hacer la mayoría de trámites online para ahorrar tiempo

### 📝 **Código de ejemplo para verificar estado:**
\`\`\`bash
curl -X GET "https://api.valencia.es/status"
\`\`\`

---

## 🎉 Eventos Próximos

### 📅 **Festival de las Fallas 2024**
| Campo | Valor |
|-------|-------|
| **📅 Fecha** | 15-19 de marzo, 2024 |
| **🕐 Hora** | Todo el día |
| **📍 Ubicación** | Toda la ciudad de Valencia |
| **👥 Organizador** | Junta Central Fallera |

### 🔹 **Descripción**
Las Fallas de Valencia son una fiesta tradicional que se celebra en honor a San José. Durante estos días, la ciudad se llena de monumentos falleros, fuegos artificiales y actividades culturales.

### 🔹 **Información Adicional**
- **💰 Precio:** Gratuito (algunas actividades de pago)
- **🎫 Entradas:** No necesarias para la mayoría de eventos
- **📱 Contacto:** [www.fallas.com](https://www.fallas.com)

> **ℹ️ Info:** Es recomendable reservar alojamiento con antelación

---

## 🍽️ Restaurantes Recomendados

### 📋 **Opciones Principales**
| Restaurante | Tipo | Precio | Valoración |
|-------------|------|--------|------------|
| **La Pepica** | Paella tradicional | €€€ | ⭐⭐⭐⭐⭐ |
| **Casa Montaña** | Tapas y vinos | €€ | ⭐⭐⭐⭐ |
| **Ricard Camarena** | Cocina creativa | €€€€ | ⭐⭐⭐⭐⭐ |

### 🔹 **Recomendaciones Especiales**
- [x] **🍽️ La Pepica** - Paella auténtica junto al mar
- [x] **🍷 Casa Montaña** - Ambiente tradicional valenciano
- [ ] **🌟 Ricard Camarena** - Experiencia gastronómica premium

> **⚠️ Advertencia:** Algunos restaurantes requieren reserva previa

---

## 📋 Trámites Municipales

### 📋 **Documentación Requerida para Empadronamiento**
- [x] **DNI o pasaporte** (original y copia)
- [x] **Contrato de alquiler** o escritura de propiedad
- [x] **Justificante de ingresos** (últimos 3 meses)
- [ ] **Certificado de empadronamiento anterior** (si procede)

### 🔹 **Pasos a Seguir**
1. **Solicitar cita previa** en la web municipal
2. **Preparar documentación** requerida
3. **Acudir a la cita** con toda la documentación
4. **Recibir confirmación** del empadronamiento

### 📊 **Información Importante**
| Campo | Valor |
|-------|-------|
| **🕐 Horarios** | L-V: 8:00-15:00 |
| **📍 Ubicación** | Oficina de Atención al Ciudadano |
| **💰 Coste** | Gratuito |
| **⏱️ Plazo** | 15 días hábiles |

> **⚠️ Advertencia:** El empadronamiento es obligatorio para acceder a servicios públicos

---
`;

export const ChatGPTStyleExample: React.FC = () => {
  const [showExample, setShowExample] = useState(false);
  const { sendMessage, renderResponse, isLoading, error } = useAIResponse();

  const handleSendMessage = async () => {
    try {
      await sendMessage("¿Qué información tienes sobre Valencia?");
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🎨 Ejemplo de Formato ChatGPT
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Demostración del nuevo sistema de formateo profesional
        </p>
      </div>

      {/* Botones de control */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setShowExample(!showExample)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showExample ? 'Ocultar' : 'Mostrar'} Ejemplo
        </button>
        
        <button
          onClick={handleSendMessage}
          disabled={isLoading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Enviando...' : 'Probar API'}
        </button>
      </div>

      {/* Alertas de ejemplo */}
      <div className="space-y-4">
        <AlertBox type="info" title="Información">
          Este es un ejemplo de cómo se verán las respuestas con el nuevo formato profesional.
        </AlertBox>
        
        <AlertBox type="warning" title="Advertencia">
          Algunos servicios pueden requerir cita previa o documentación específica.
        </AlertBox>
        
        <AlertBox type="success" title="Éxito">
          El nuevo sistema de formateo está funcionando correctamente.
        </AlertBox>
      </div>

      {/* Tarjetas de ejemplo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlaceCard
          name="Restaurante La Pepica"
          address="Paseo Neptuno, 6, 46011 Valencia"
          hours="L-D: 13:00-16:00, 20:00-23:00"
          phone="+34 963 710 366"
          website="https://www.lapepica.com"
          rating={4.8}
          distance="500 m"
        />
        
        <EventCard
          title="Festival de las Fallas 2024"
          date="15-19 de marzo, 2024"
          time="Todo el día"
          location="Toda la ciudad de Valencia"
          description="Fiesta tradicional en honor a San José con monumentos falleros y fuegos artificiales."
          sourceUrl="https://www.fallas.com"
        />
      </div>

      {/* Ejemplo de respuesta completa */}
      {showExample && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📝 Ejemplo de Respuesta Completa
          </h2>
          <AIResponseRenderer content={EXAMPLE_RESPONSE} />
        </div>
      )}

      {/* Estado de carga y errores */}
      {isLoading && (
        <AlertBox type="info" title="Procesando">
          Enviando mensaje a la IA...
        </AlertBox>
      )}

      {error && (
        <AlertBox type="error" title="Error">
          {error}
        </AlertBox>
      )}
    </div>
  );
};

export default ChatGPTStyleExample;

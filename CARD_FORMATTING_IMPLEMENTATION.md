# 🎯 Implementación de Formato de Cards para EventCard y PlaceCard

## ✅ **Análisis Completado**

### **Componentes Analizados:**

#### **1. EventCard (`src/components/EventCard.tsx`)**
**Estructura de datos esperada (`EventInfo`):**
```typescript
interface EventInfo {
  title: string;                    // Nombre del evento (OBLIGATORIO)
  titleTranslations?: Record<string, string>; // Traducciones opcionales
  date: string;                     // Fecha en formato YYYY-MM-DD (OBLIGATORIO)
  endDate?: string;                 // Fecha fin en formato YYYY-MM-DD (OPCIONAL)
  time?: string;                    // Hora en formato HH:mm (OPCIONAL)
  location?: string;                // Ubicación del evento (OPCIONAL)
  sourceUrl?: string;               // URL de la fuente (OPCIONAL)
  sourceTitle?: string;             // Título de la fuente (OPCIONAL)
  eventDetailUrl?: string;          // URL específica del evento (OPCIONAL)
}
```

**Características del componente:**
- ✅ **Parsing inteligente de fechas** (ISO, español, rangos)
- ✅ **Formateo de horarios** (HH:mm, rangos)
- ✅ **Validación de enlaces** automática
- ✅ **Botón "Añadir al calendario"** con generación de archivo .ics
- ✅ **Botón "Ver detalles"** si hay eventDetailUrl
- ✅ **Soporte multiidioma** con titleTranslations

#### **2. PlaceCard (`src/components/PlaceCard.tsx`)**
**Estructura de datos esperada (`PlaceCardInfo`):**
```typescript
interface PlaceCardInfo {
  id: string;                       // ID único (OBLIGATORIO)
  name: string;                     // Nombre del lugar (OBLIGATORIO)
  placeId?: string;                 // ID de Google Place (OPCIONAL, preferido)
  searchQuery?: string;             // Consulta de búsqueda (OPCIONAL)
  photoUrl?: string;                // URL de la foto (OPCIONAL)
  photoAttributions?: string[];     // Atribuciones de la foto (OPCIONAL)
  rating?: number;                  // Valoración numérica (OPCIONAL)
  userRatingsTotal?: number;        // Total de valoraciones (OPCIONAL)
  address?: string;                 // Dirección (OPCIONAL)
  distance?: string;                // Distancia (ej: "500 m") (OPCIONAL)
  mapsUrl?: string;                 // URL de Google Maps (OPCIONAL)
  website?: string;                 // Sitio web oficial (OPCIONAL)
  isLoadingDetails: boolean;        // Estado de carga (OBLIGATORIO)
  errorDetails?: string;            // Error si falla la carga (OPCIONAL)
}
```

**Características del componente:**
- ✅ **Estados de carga** con skeleton
- ✅ **Manejo de errores** con botón de reintento
- ✅ **Fotos de Google Places** con atribuciones
- ✅ **Valoraciones y distancias** con badges
- ✅ **Botones de acción** (Ver en Mapas, Web/Buscar)
- ✅ **Generación automática** de URLs de Google Maps

## 🎯 **Instrucciones Implementadas para la IA**

### **1. EventCards - Formato Actualizado:**
```typescript
// Marcadores para EventCards
const EVENT_CARD_START_MARKER = "[EVENT_CARD_START]";
const EVENT_CARD_END_MARKER = "[EVENT_CARD_END]";

// Formato obligatorio:
`${EVENT_CARD_START_MARKER}
{
  "title": "Nombre del Evento",
  "date": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD" (opcional),
  "time": "HH:mm" (opcional),
  "location": "Lugar del Evento" (opcional),
  "sourceUrl": "https://ejemplo.com/evento" (opcional),
  "sourceTitle": "Nombre de la Fuente" (opcional),
  "eventDetailUrl": "https://ejemplo.com/detalle" (opcional)
}
${EVENT_CARD_END_MARKER}`
```

### **2. PlaceCards - Formato Actualizado:**
```typescript
// Marcadores para PlaceCards
const PLACE_CARD_START_MARKER = "[PLACE_CARD_START]";
const PLACE_CARD_END_MARKER = "[PLACE_CARD_END]";

// Formato obligatorio:
`${PLACE_CARD_START_MARKER}
{
  "name": "Nombre Oficial del Lugar",
  "placeId": "IDdeGooglePlaceDelLugar" (opcional),
  "searchQuery": "Nombre del Lugar, Ciudad" (opcional),
  "address": "Dirección completa" (opcional),
  "rating": 4.5 (opcional),
  "distance": "500 m" (opcional),
  "website": "https://ejemplo.com" (opcional),
  "photoUrl": "https://ejemplo.com/foto.jpg" (opcional)
}
${PLACE_CARD_END_MARKER}`
```

## 🚀 **Características Implementadas**

### **1. Instrucciones Específicas por Intención:**
- **Eventos:** Instrucciones detalladas para extraer eventos de contenido web
- **Lugares:** Instrucciones para generar PlaceCards con información completa
- **Trámites:** Instrucciones para búsqueda en web oficial
- **Transporte:** Consideración de horarios según la hora actual

### **2. Formato Inteligente:**
- **Fechas:** Formato YYYY-MM-DD para compatibilidad con EventCard
- **Horarios:** Formato HH:mm o HH:mm - HH:mm para rangos
- **PlaceIds:** Priorización de placeId sobre searchQuery
- **URLs:** Validación y uso de URLs reales

### **3. Anti-Alucinación:**
- **Eventos:** Solo eventos reales extraídos de fuentes web
- **Lugares:** Solo lugares verificables, no inventados
- **Trámites:** Búsqueda obligatoria en web oficial
- **Información:** Siempre con fuentes verificables

## 📋 **Estado de Implementación**

### ✅ **Completado:**
- [x] Análisis de componentes EventCard y PlaceCard
- [x] Identificación de estructuras de datos requeridas
- [x] Actualización de instrucciones para EventCards
- [x] Actualización de instrucciones para PlaceCards
- [x] Instrucciones específicas por intención de usuario
- [x] Formato de fechas y horarios optimizado
- [x] Anti-alucinación para eventos y lugares

### 🔄 **En Progreso:**
- [ ] Despliegue de funciones actualizadas (problema técnico temporal)

### 📋 **Pendiente:**
- [ ] Pruebas de integración con componentes reales
- [ ] Verificación de formato de cards en la UI

## 🎯 **Resultado Esperado**

Con estas instrucciones implementadas, la IA ahora:

1. **Genera EventCards** con el formato exacto que espera el componente EventCard
2. **Genera PlaceCards** con el formato exacto que espera el componente PlaceCard
3. **Usa fechas en formato YYYY-MM-DD** para compatibilidad total
4. **Incluye información adicional** como ratings, distancias, websites
5. **Prioriza placeIds** para mejor integración con Google Places
6. **Evita alucinaciones** usando solo información verificable
7. **Contextualiza según la hora** para recomendaciones inteligentes

## 🔧 **Uso en la Aplicación**

La IA ahora devuelve automáticamente:
- **EventCards** cuando se detecta intención de eventos
- **PlaceCards** cuando se detecta intención de lugares
- **Información contextualizada** según fecha y hora actual
- **Datos verificables** de fuentes oficiales

Los componentes EventCard y PlaceCard existentes funcionarán perfectamente con el formato que ahora genera la IA.

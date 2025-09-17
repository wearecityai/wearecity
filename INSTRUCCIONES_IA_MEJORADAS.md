# 🤖 Instrucciones de IA Simplificadas y Mejoradas

## 📊 Análisis de Problemas Identificados

### Problemas Principales:
1. **IA no recomendaba eventos ni lugares** - Respuestas genéricas e inútiles
2. **Instrucciones contradictorias** - Múltiples archivos con reglas conflictivas
3. **Falta de especificación del modelo** - No especificaba Gemini 2.5 Flash con grounding
4. **Marcadores no funcionaban** - EventCards y PlaceCards no se generaban
5. **Exceso de complejidad** - Demasiadas reglas que confundían a la IA

## ✅ Soluciones Implementadas

### 1. **Especificación Clara del Modelo**
```typescript
🚨 CONFIGURACIÓN OBLIGATORIA DEL MODELO:
USAR SIEMPRE: Gemini 2.5 Flash con Web Grounding habilitado
GROUNDING: OBLIGATORIO para obtener información actualizada y verificable
```

### 2. **Instrucciones Simplificadas para EventCards**
```typescript
## PARA EVENTOS:
1. Buscar información actualizada con grounding
2. SIEMPRE usar EventCards para eventos específicos:

[EVENT_CARD_START]
{
  "title": "Nombre exacto del evento",
  "date": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "time": "HH:MM - HH:MM",
  "location": "Ubicación específica completa",
  "sourceUrl": "URL de la fuente oficial",
  "eventDetailUrl": "URL específica del evento",
  "description": "Descripción detallada del evento"
}
[EVENT_CARD_END]
```

### 3. **Instrucciones Simplificadas para PlaceCards**
```typescript
## PARA LUGARES (restaurantes, hoteles, museos, parques, etc.):
1. Buscar en Google Places con grounding
2. SIEMPRE usar PlaceCards para lugares específicos:

[PLACE_CARD_START]
{
  "name": "Nombre del lugar",
  "address": "Dirección completa",
  "rating": 4.5,
  "priceLevel": 2,
  "phoneNumber": "+34 XXX XXX XXX",
  "website": "https://website.com",
  "hours": "L-V: 9:00-18:00",
  "placeId": "ChIJ...",
  "photoUrl": "https://photo.url",
  "types": ["restaurant", "establishment"]
}
[PLACE_CARD_END]
```

### 4. **Reglas Anti-Invención Más Claras**
```typescript
🚨 REGLAS CRÍTICAS:
✅ OBLIGATORIO usar EventCards para eventos específicos
✅ OBLIGATORIO usar PlaceCards para lugares específicos  
✅ OBLIGATORIO usar Web Grounding para información actualizada
✅ Proporcionar información específica y verificable
❌ NUNCA inventar lugares, eventos o información
❌ NUNCA dar respuestas genéricas sin datos específicos
❌ NUNCA mostrar enlaces como texto plano
```

## 📁 Archivos Modificados

### 1. **ragRetrieval.ts** (Archivo principal usado por el sistema)
- Agregada configuración obligatoria de Gemini 2.5 Flash con grounding
- Instrucciones claras para EventCards y PlaceCards
- Eliminadas reglas contradictorias
- Añadidas reglas anti-invención específicas

### 2. **vertexAIInstructions.ts** (Archivo de respaldo)
- Especificación del modelo obligatorio en la parte superior
- Instrucciones detalladas para el uso correcto de marcadores
- Eliminación de complejidad innecesaria

### 3. **Archivos Nuevos Creados**
- `vertexAIInstructionsSimplified.ts` - Versión completamente simplificada
- `formattingInstructionsSimplified.ts` - Formato básico sin complejidad

## 🎯 Resultados Esperados

### Para Eventos:
- **Antes**: "Hay varios eventos en la ciudad"
- **Después**: EventCard específico con fecha, hora, lugar, descripción y enlaces oficiales

### Para Lugares:
- **Antes**: "Puedes encontrar restaurantes en el centro"
- **Después**: PlaceCard específico con nombre, dirección, horarios, teléfono, rating y foto

### Para Trámites:
- **Antes**: "Contacta con el ayuntamiento"
- **Después**: Información específica con dirección, horarios, documentos necesarios y enlaces oficiales

## 🔧 Implementación

El sistema ahora usa las instrucciones mejoradas de `ragRetrieval.ts` que:

1. **Especifica siempre usar Gemini 2.5 Flash con grounding**
2. **Fuerza el uso de EventCards para eventos**
3. **Fuerza el uso de PlaceCards para lugares**
4. **Prohibe respuestas genéricas o inventadas**
5. **Requiere información específica y verificable**

## 📈 Mejoras de Calidad

### Antes:
- Respuestas vagas e inútiles
- Sin información específica
- Sin recomendaciones concretas
- Enlaces como texto plano

### Después:
- Información específica y actualizada
- EventCards con eventos reales
- PlaceCards con lugares verificados
- Botones para enlaces
- Datos prácticos completos (direcciones, horarios, teléfonos)

## 🚨 Instrucciones de Uso

1. **La IA DEBE usar Gemini 2.5 Flash con Web Grounding siempre**
2. **Para eventos: OBLIGATORIO usar EventCards**
3. **Para lugares: OBLIGATORIO usar PlaceCards**
4. **Para trámites: Información específica con documentos y pasos**
5. **Enlaces SIEMPRE como botones usando FormButton**

Estas mejoras resuelven el problema principal de respuestas indiferentes y poco útiles, proporcionando información específica y accionable para los ciudadanos.
# 🚨 Implementación de Política Anti-Alucinación

## ✅ **Problema Resuelto**

La IA estaba inventando eventos y lugares en lugar de usar información real de la ciudad restringida. Se han implementado restricciones estrictas para evitar la invención de datos.

## 🔧 **Cambios Implementados**

### **1. Instrucciones Críticas para EventCards**

**ANTES:**
- La IA podía inventar eventos genéricos
- Generaba eventos "típicos" como "Mercado local"
- No verificaba la existencia real de eventos

**DESPUÉS:**
```typescript
🚨🚨🚨 INSTRUCCIONES CRÍTICAS PARA EVENTOS - PROHIBICIÓN ABSOLUTA DE INVENCIÓN:

**PROHIBICIÓN ABSOLUTA:**
- ❌ NUNCA INVENTES EVENTOS
- ❌ NUNCA CREES eventos ficticios o genéricos
- ❌ NUNCA GENERES eventos "típicos" como "Mercado local" o "Fiesta del pueblo"
- ❌ NUNCA INVENTES nombres, fechas, lugares o horarios de eventos

**SOLO CREA EVENTCARDS SI:**
- ✅ Tienes información REAL de fuentes verificables
- ✅ Los eventos aparecen en contenido web proporcionado
- ✅ Los eventos están específicamente en [CIUDAD_RESTRINGIDA]
- ✅ Puedes verificar que los eventos realmente existen

**SI NO TIENES INFORMACIÓN REAL:**
- Di claramente: "No tengo información verificable sobre eventos en [CIUDAD]"
- NO generes eventos inventados
- NO uses eventos genéricos o típicos
```

### **2. Instrucciones Críticas para PlaceCards**

**ANTES:**
- La IA inventaba lugares como "Restaurante del Puerto"
- Generaba lugares "típicos" sin verificar existencia
- No restringía a la ciudad configurada

**DESPUÉS:**
```typescript
🚨🚨🚨 INSTRUCCIONES CRÍTICAS PARA LUGARES - PROHIBICIÓN ABSOLUTA DE INVENCIÓN:

**PROHIBICIÓN ABSOLUTA:**
- ❌ NUNCA INVENTES LUGARES
- ❌ NUNCA CREES lugares ficticios o genéricos
- ❌ NUNCA GENERES lugares "típicos" como "Restaurante del Puerto" o "Café Central"
- ❌ NUNCA INVENTES nombres de restaurantes, hoteles, museos o negocios

**SOLO CREA PLACECARDS SI:**
- ✅ Tienes información REAL de Google Places API
- ✅ Los lugares aparecen en resultados de búsqueda verificables
- ✅ Los lugares están específicamente en [CIUDAD_RESTRINGIDA]
- ✅ Puedes verificar que los lugares realmente existen
```

### **3. Restricciones de Ciudad Reforzadas**

**ANTES:**
- Restricciones básicas de ciudad
- Permitía información genérica

**DESPUÉS:**
```typescript
🚨🚨🚨 REGLAS INQUEBRANTABLES - PROHIBICIÓN ABSOLUTA DE INVENCIÓN:

1. ❌ NUNCA INVENTES lugares, restaurantes, eventos, monumentos, museos, hoteles, tiendas
2. ❌ NUNCA CREES lugares ficticios o genéricos como "Restaurante del Puerto" o "Café Central"
3. ❌ NUNCA GENERES eventos "típicos" como "Mercado local" o "Fiesta del pueblo"
4. ❌ NUNCA USES información genérica o de otras ciudades para "rellenar" respuestas
5. ❌ NUNCA RECOMIENDES lugares que no puedas verificar que existen específicamente en [CIUDAD]

✅ SOLO USA INFORMACIÓN REAL Y VERIFICABLE:
- Solo recomienda lugares que aparezcan en resultados reales de Google Places
- Solo menciona eventos que aparezcan en fuentes web verificables
- Solo proporciona información que puedas verificar como específicamente relacionada con [CIUDAD]
```

### **4. Política Anti-Alucinación Estricta**

**Nuevas reglas implementadas:**
- **Verificación obligatoria:** Solo datos que se puedan verificar
- **Rechazo de información genérica:** No usar "lo típico" de una ciudad
- **Respuestas honestas:** Decir claramente cuando no hay información
- **Restricción geográfica absoluta:** Solo información de la ciudad configurada

## 🎯 **Comportamiento Esperado Ahora**

### **Para Eventos:**
- ✅ **Con información real:** Genera EventCards con datos verificables
- ❌ **Sin información real:** Dice "No tengo información verificable sobre eventos en [CIUDAD]"
- ❌ **No inventa:** No genera eventos genéricos o típicos

### **Para Lugares:**
- ✅ **Con información real:** Genera PlaceCards con datos de Google Places
- ❌ **Sin información real:** Dice "No tengo información verificable sobre lugares específicos en [CIUDAD]"
- ❌ **No inventa:** No genera lugares genéricos o típicos

### **Para Ciudad Restringida:**
- ✅ **Solo información local:** Toda la información limitada a la ciudad configurada
- ❌ **No información genérica:** No usa datos de otras ciudades
- ❌ **No relleno:** No inventa información para completar respuestas

## 🚀 **Funciones Actualizadas**

- ✅ **`chatIA`** - Chat principal con Firebase AI Logic
- ✅ **`chatIAVertex`** - Chat con Vertex AI (Gemini)

## 📋 **Próximos Pasos**

1. **Probar las restricciones** con consultas sobre eventos y lugares
2. **Verificar** que no se generen datos inventados
3. **Confirmar** que solo se use información real y verificable
4. **Validar** que las respuestas estén limitadas a la ciudad configurada

## 💡 **Resultado Esperado**

La IA ahora debería:
- **Ser honesta** cuando no tiene información verificable
- **No inventar** eventos o lugares
- **Solo usar** datos reales de fuentes verificables
- **Limitarse** estrictamente a la ciudad configurada
- **Generar cards** solo con información real y verificable

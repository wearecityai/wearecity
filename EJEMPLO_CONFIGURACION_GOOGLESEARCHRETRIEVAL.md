# Ejemplo Práctico: Google Search Retrieval con agenda_eventos_urls

## ✅ Configuración Simplificada

Ya que el campo `agenda_eventos_urls` existe en la tabla `cities`, he adaptado el código para usar este campo directamente. **No necesitas crear campos nuevos**.

## 🚀 Cómo Funciona Ahora

### 1. **Sistema Inteligente de Prioridades**

```
┌─────────────────────────────────────────┐
│           Usuario pregunta              │
│        "¿Qué eventos hay?"              │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│     ¿Hay agenda_eventos_urls?           │
│                                         │
│  SÍ → GoogleSearchRetrieval             │
│       (solo sitios específicos)        │
│                                         │
│  NO → Búsqueda manual tradicional      │
└─────────────────────────────────────────┘
```

### 2. **Extracción Automática de Dominios**

Si tienes en `agenda_eventos_urls`:
```json
[
  "https://www.villajoyosa.com/agenda-municipal/",
  "https://www.turismolavilajoiosa.com/es/Agenda",
  "https://cultura.villajoyosa.es/eventos/"
]
```

El sistema **automáticamente extrae**:
- `villajoyosa.com`
- `turismolavilajoiosa.com` 
- `cultura.villajoyosa.es`

### 3. **GoogleSearchRetrieval Configurado**

Genera automáticamente la búsqueda:
```
eventos agosto 2025 (site:villajoyosa.com OR site:turismolavilajoiosa.com OR site:cultura.villajoyosa.es)
```

## 📋 Ejemplo Práctico de Configuración

### Para Vila Joiosa (Actual)
```sql
UPDATE cities 
SET agenda_eventos_urls = '[
  "https://www.villajoyosa.com/agenda-municipal/",
  "https://www.turismolavilajoiosa.com/es/Agenda",
  "https://villajoyosa.es/eventos/",
  "https://cultura.villajoyosa.com/programacion/"
]'
WHERE slug = 'villajoyosa';
```

### Para Otra Ciudad
```sql
UPDATE cities 
SET agenda_eventos_urls = '[
  "https://www.ayuntamiento-ciudad.com/agenda/",
  "https://turismo.ciudad.es/eventos/",
  "https://cultura.ciudad.es/programacion/",
  "https://agenda.ciudad.com/"
]'
WHERE slug = 'ciudad-ejemplo';
```

## 🔍 Logs de Debugging

Cuando funciona correctamente, verás estos logs:

```
🔍 DEBUG - GoogleSearchRetrieval está configurado con agenda_eventos_urls
🔍 DEBUG - Se usará GoogleSearchRetrieval en lugar de búsqueda manual
🔍 DEBUG - URLs de agenda configuradas: ["https://www.villajoyosa.com/agenda-municipal/", ...]
🔍 DEBUG - Dominios que se usarán en GoogleSearchRetrieval: ["villajoyosa.com", "turismolavilajoiosa.com"]
🔍 DEBUG - Query con restricción de sitios: (site:villajoyosa.com OR site:turismolavilajoiosa.com)
🔍 DEBUG - GoogleSearchRetrieval activado para eventos con sitios específicos desde agenda_eventos_urls
```

## ⚡ Ventajas del Sistema Actual

### ✅ **Sin Cambios en Base de Datos**
- Usa el campo `agenda_eventos_urls` existente
- No necesitas crear nuevas columnas
- Compatibilidad total con el sistema actual

### ✅ **Inteligencia Automática**
- Extrae dominios automáticamente de las URLs
- Elimina duplicados
- Maneja URLs malformadas

### ✅ **Fallback Inteligente**
- Si no hay `agenda_eventos_urls` → Usa búsqueda manual tradicional
- Si las URLs están vacías → Usa URLs por defecto de la ciudad
- Mantiene toda la funcionalidad existente

## 🧪 Cómo Probar

### 1. **Verificar Configuración Actual**
```sql
SELECT slug, agenda_eventos_urls 
FROM cities 
WHERE agenda_eventos_urls IS NOT NULL;
```

### 2. **Probar con Consulta de Eventos**
Pregunta en tu app:
- "¿Qué eventos hay este fin de semana?"
- "Eventos de agosto en la ciudad"
- "Conciertos y festivales próximos"

### 3. **Verificar en Logs**
Busca en los logs del Edge Function:
- `GoogleSearchRetrieval está configurado con agenda_eventos_urls`
- `Dominios que se usarán en GoogleSearchRetrieval`
- `GoogleSearchRetrieval activado para eventos`

## 🔧 Configuración Recomendada por Tipo de Ciudad

### **Ayuntamiento Pequeño**
```json
[
  "https://www.ayuntamiento.com/",
  "https://turismo.ciudad.es/"
]
```

### **Ciudad Media**
```json
[
  "https://www.ayuntamiento.com/agenda/",
  "https://turismo.ciudad.es/eventos/",
  "https://cultura.ciudad.es/"
]
```

### **Ciudad Grande**
```json
[
  "https://www.ayuntamiento.com/agenda/",
  "https://turismo.ciudad.es/eventos/",
  "https://cultura.ciudad.es/programacion/",
  "https://deportes.ciudad.es/actividades/",
  "https://agenda.ciudad.com/"
]
```

## 📊 Comparación: Antes vs Ahora

| Aspecto | Búsqueda Manual (Antes) | GoogleSearchRetrieval (Ahora) |
|---------|-------------------------|-------------------------------|
| **Velocidad** | 🐌 Lenta (scraping) | ⚡ Rápida (Google API) |
| **Frescura** | 📄 Contenido estático | 🔄 Contenido actualizado |
| **Precisión** | 🎯 Solo URLs específicas | 🎯 Solo dominios específicos |
| **Configuración** | ✅ `agenda_eventos_urls` | ✅ `agenda_eventos_urls` (mismo campo) |
| **Fallback** | ❌ No hay fallback | ✅ Búsqueda manual si falla |

## ⚠️ Consideraciones

### **Límites de API**
- GoogleSearchRetrieval usa la cuota de Gemini
- Más eficiente que múltiples llamadas de scraping

### **Calidad de Resultados**
- Depende de que los sitios estén bien indexados por Google
- Los sitios deben tener contenido estructurado sobre eventos

### **Monitoreo**
- Revisa los logs regularmente para verificar funcionamiento
- Ajusta URLs si no se encuentran eventos

## 🎯 Estado Actual

✅ **Completado**: Código adaptado para usar `agenda_eventos_urls`  
✅ **Completado**: Extracción automática de dominios  
✅ **Completado**: Instrucciones actualizadas para la IA  
✅ **Completado**: Sistema de fallback inteligente  

**🚀 Listo para usar**: Solo necesitas que el campo `agenda_eventos_urls` tenga URLs válidas en tu ciudad.

## 🔮 Próximos Pasos

1. **Verifica** que tu ciudad tenga URLs en `agenda_eventos_urls`
2. **Prueba** con consultas de eventos
3. **Revisa** los logs para confirmar que GoogleSearchRetrieval se activa
4. **Ajusta** URLs si es necesario para mejor cobertura

¿Todo funciona? ¡Perfecto! Ahora tienes búsqueda de eventos más rápida y precisa usando solo las fuentes que confías. 🎉

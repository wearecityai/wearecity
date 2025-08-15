# Configuración de Google Search Retrieval para Sitios Específicos

## Descripción

Esta funcionalidad permite configurar el Google Search Retrieval para que cuando el usuario solicite eventos, la IA busque únicamente en las páginas web específicas que definas en la configuración.

## Cómo Funciona

1. **Detección de Intent**: El sistema detecta automáticamente cuando el usuario pregunta sobre eventos
2. **Verificación de Configuración**: Comprueba si hay sitios específicos configurados en `event_search_sites`
3. **Google Search Retrieval con Restricción**: Si hay sitios configurados, usa `googleSearchRetrieval` con operadores `site:` para buscar solo en esos dominios
4. **Fallback**: Si no hay sitios específicos, usa el sistema manual de `agenda_eventos_urls`

## Configuración en la Base de Datos

### Campo `event_search_sites`

Agrega un nuevo campo JSON en tu tabla de configuración (`assistant_config` o `cities`) llamado `event_search_sites` que contenga un array de URLs o dominios:

```sql
-- Ejemplo para la tabla cities
UPDATE cities 
SET event_search_sites = '[
  "https://www.villajoyosa.com",
  "https://www.turismolavilajoiosa.com",
  "villajoyosa.es",
  "ayto-villajoyosa.com"
]'
WHERE slug = 'villajoyosa';

-- Ejemplo para la tabla assistant_config
UPDATE assistant_config 
SET event_search_sites = '[
  "https://ejemplo-ayuntamiento.com",
  "https://turismo-ciudad.es",
  "agenda.ciudad.com"
]'
WHERE user_id = 'tu-user-id';
```

### Formato del Array JSON

El campo `event_search_sites` debe ser un array JSON con las siguientes opciones:

```json
[
  "https://www.ejemplo.com",           // URL completa
  "ejemplo.com",                       // Solo dominio
  "subdomain.ejemplo.com",             // Subdominio específico
  "https://otro-sitio.es/eventos/"     // URL con path específico
]
```

## Ejemplos de Configuración

### Para Vila Joiosa
```json
[
  "https://www.villajoyosa.com",
  "https://www.turismolavilajoiosa.com", 
  "https://villajoyosa.es",
  "https://cultura.villajoyosa.com"
]
```

### Para una Ciudad Genérica
```json
[
  "https://www.ayuntamiento-ciudad.com",
  "https://turismo.ciudad.es",
  "https://cultura.ciudad.es",
  "https://agenda.ciudad.com"
]
```

### Para Múltiples Fuentes
```json
[
  "https://ayuntamiento.ciudad.com",
  "https://turismo.ciudad.com", 
  "https://diario-local.com",
  "https://eventos.ciudad.es",
  "https://cultura.ciudad.es"
]
```

## Funcionamiento Técnico

### 1. Detección de Intent de Eventos
El sistema detecta automáticamente preguntas sobre eventos con patrones como:
- "eventos"
- "festival"
- "concierto"
- "agenda"
- "planes"
- "cosas que hacer"
- "actividades"

### 2. Construcción de Query con Operadores `site:`
Cuando hay sitios configurados, el sistema construye un query de búsqueda como:
```
eventos agosto 2025 (site:villajoyosa.com OR site:turismolavilajoiosa.com OR site:cultura.villajoyosa.com)
```

### 3. GoogleSearchRetrieval Configurado
```javascript
{
  tools: [
    {
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: "MODE_DYNAMIC",
          dynamicThreshold: 0.3
        }
      }
    }
  ]
}
```

## Ventajas

1. **Precisión**: Solo busca en fuentes autorizadas y confiables
2. **Velocidad**: GoogleSearchRetrieval es más rápido que el scraping manual
3. **Frescura**: Obtiene contenido actualizado automáticamente
4. **Configurabilidad**: Cada ciudad puede tener sus propias fuentes
5. **Fallback**: Si no hay sitios configurados, usa el sistema manual existente

## Instrucciones para la IA

Cuando hay sitios específicos configurados, la IA recibe estas instrucciones:

```
✅ USA GoogleSearchRetrieval que está configurado para buscar SOLO en estos sitios autorizados:
- https://www.villajoyosa.com
- https://www.turismolavilajoiosa.com
- villajoyosa.es

✅ ANALIZA los resultados de la búsqueda web restringida
❌ NO busques en sitios web que no estén en la lista autorizada
```

## Debugging y Logs

El sistema incluye logs detallados para debugging:

```
🔍 DEBUG - GoogleSearchRetrieval está configurado con sitios específicos
🔍 DEBUG - No se realizará búsqueda manual, se usará GoogleSearchRetrieval
🔍 DEBUG - Sitios configurados: ["villajoyosa.com", "turismolavilajoiosa.com"]
🔍 DEBUG - Query con restricción de sitios: (site:villajoyosa.com OR site:turismolavilajoiosa.com)
🔍 DEBUG - GoogleSearchRetrieval activado para eventos con sitios específicos
```

## Migración desde el Sistema Actual

### Paso 1: Agregar el Campo
```sql
ALTER TABLE cities ADD COLUMN event_search_sites JSON;
-- o
ALTER TABLE assistant_config ADD COLUMN event_search_sites JSON;
```

### Paso 2: Configurar Sitios
Convierte tus `agenda_eventos_urls` actuales en `event_search_sites`:

```sql
-- Si tienes agenda_eventos_urls como:
-- ["https://www.villajoyosa.com/agenda-municipal/", "https://www.turismolavilajoiosa.com/es/Agenda"]

-- Convierte a event_search_sites como:
UPDATE cities 
SET event_search_sites = '["https://www.villajoyosa.com", "https://www.turismolavilajoiosa.com"]'
WHERE agenda_eventos_urls IS NOT NULL;
```

### Paso 3: Mantener Compatibilidad
El sistema mantiene compatibilidad total con `agenda_eventos_urls` como fallback, por lo que puedes migrar gradualmente.

## Testing

### Consultas de Prueba
```
- "¿Qué eventos hay este fin de semana?"
- "Eventos de agosto en la ciudad"
- "Conciertos y festivales próximos"
- "Agenda cultural del mes"
```

### Verificar en Logs
Busca estos indicadores en los logs:
- `✅ GoogleSearchRetrieval activado para eventos con sitios específicos`
- `Query con restricción de sitios: (site:...)`
- `No se realizará búsqueda manual, se usará GoogleSearchRetrieval`

## Consideraciones

1. **Límites de API**: GoogleSearchRetrieval tiene límites de uso de Google
2. **Calidad de Sitios**: Los sitios deben tener contenido estructurado sobre eventos
3. **SEO de los Sitios**: Los sitios deben estar bien indexados por Google
4. **Actualización**: Los sitios deben mantener contenido actualizado

## Solución de Problemas

### No encuentra eventos
1. Verifica que los sitios estén en `event_search_sites`
2. Comprueba que los sitios tengan eventos publicados
3. Revisa que los sitios estén indexados por Google
4. Verifica los logs de debugging

### Usa búsqueda manual en lugar de GoogleSearchRetrieval
1. Verifica que `event_search_sites` no esté vacío
2. Comprueba que el intent de eventos se detecte correctamente
3. Revisa la configuración de la API de Gemini

### Errores de API
1. Verifica que `GOOGLE_GEMINI_API_KEY` esté configurada
2. Comprueba los límites de uso de la API
3. Revisa los logs de la respuesta de Gemini

# 🔍 Guía de Debugging: Google Search Retrieval

## 🚨 **Problema Identificado**

GoogleSearchRetrieval no está buscando en los sitios específicos configurados en el campo `agenda_eventos_urls` del Finetuning Page.

## 📋 **Pasos de Debugging (Orden de Ejecución)**

### **1. Verificar Configuración en Base de Datos**

Ejecuta el script que he creado para verificar dónde está la configuración:

```sql
-- Ejecutar cada consulta por separado para ver los resultados
\i VERIFICAR_CONFIGURACION_COMPLETA.sql
```

O ejecuta estas consultas individuales:

```sql
-- Verificar assistant_config (Finetuning Page)
SELECT 
    id, user_id, is_active, agenda_eventos_urls,
    CASE WHEN agenda_eventos_urls IS NOT NULL THEN json_array_length(agenda_eventos_urls) ELSE 0 END as num_urls
FROM assistant_config 
WHERE is_active = true;

-- Verificar cities
SELECT 
    id, name, slug, agenda_eventos_urls,
    CASE WHEN agenda_eventos_urls IS NOT NULL THEN json_array_length(agenda_eventos_urls) ELSE 0 END as num_urls
FROM cities 
WHERE is_active = true AND (agenda_eventos_urls IS NOT NULL OR name ILIKE '%vila%');
```

### **2. Verificar Logs Mejorados**

Ahora cuando preguntes sobre eventos, verás logs detallados como:

```
🔍 DEBUG - CONFIGURACION - Intentando cargar assistant_config para userId: [tu-user-id]
🔍 DEBUG - CONFIGURACION - assistant_config cargado: true/false
🔍 DEBUG - CONFIGURACION - assistant_config tiene agenda_eventos_urls: true/false

🔍 DEBUG - GOOGLESEACHRETRIEVAL - Verificando condiciones:
🔍 DEBUG - GOOGLESEACHRETRIEVAL - Es consulta de eventos: true
🔍 DEBUG - GOOGLESEACHRETRIEVAL - Config existe: true
🔍 DEBUG - GOOGLESEACHRETRIEVAL - agenda_eventos_urls raw: [URLs aquí]
🔍 DEBUG - GOOGLESEACHRETRIEVAL - URLs parseadas: [URLs parseadas]
```

### **3. Identificar el Problema**

Basándote en los logs, identifica cuál es el caso:

#### **Caso A: No hay userId**
```
🔍 DEBUG - CONFIGURACION - Intentando cargar assistant_config para userId: null
🔍 DEBUG - CONFIGURACION - assistant_config cargado: false
```
**Solución**: Asegúrate de pasar el `userId` en la petición al chat.

#### **Caso B: No hay assistant_config**
```
🔍 DEBUG - CONFIGURACION - assistant_config cargado: false
🔍 DEBUG - CONFIGURACION - Intentando cargar city config para: {...}
```
**Solución**: Configura las URLs en `assistant_config` o en `cities`.

#### **Caso C: URLs no configuradas**
```
🔍 DEBUG - GOOGLESEACHRETRIEVAL - agenda_eventos_urls raw: null
🔍 DEBUG - GOOGLESEACHRETRIEVAL - ❌ No hay agenda_eventos_urls configurada
```
**Solución**: Configurar las URLs en la tabla correspondiente.

### **4. Configurar URLs (Según el Caso)**

#### **Para Finetuning Page (assistant_config)**
```sql
INSERT INTO assistant_config (user_id, is_active, agenda_eventos_urls, created_at, updated_at)
VALUES (
    'TU_USER_ID_AQUI',  -- Reemplazar con tu user ID real
    true,
    '[
        "https://www.villajoyosa.com/agenda-municipal/",
        "https://www.turismolavilajoiosa.com/es/Agenda",
        "https://villajoyosa.es/eventos/",
        "https://cultura.villajoyosa.com/programacion/"
    ]',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    agenda_eventos_urls = EXCLUDED.agenda_eventos_urls,
    updated_at = NOW();
```

#### **Para Configuración de Ciudad (cities)**
```sql
UPDATE cities 
SET agenda_eventos_urls = '[
    "https://www.villajoyosa.com/agenda-municipal/",
    "https://www.turismolavilajoiosa.com/es/Agenda",
    "https://villajoyosa.es/eventos/",
    "https://cultura.villajoyosa.com/programacion/"
]'
WHERE (name ILIKE '%vila%' OR name ILIKE '%joiosa%' OR slug ILIKE '%vila%' OR slug ILIKE '%joiosa%');
```

### **5. Probar GoogleSearchRetrieval**

Después de configurar, pregunta: **"¿Qué eventos hay este fin de semana?"**

**Logs Esperados (Éxito):**
```
🔍 DEBUG - GOOGLESEACHRETRIEVAL - Es consulta de eventos: true
🔍 DEBUG - GOOGLESEACHRETRIEVAL - agenda_eventos_urls raw: ["https://www.villajoyosa.com/..."]
🔍 DEBUG - GOOGLESEACHRETRIEVAL - URLs parseadas: ["https://www.villajoyosa.com/..."]
🔍 DEBUG - Configurando googleSearchRetrieval con sitios específicos desde agenda_eventos_urls
🔍 DEBUG - Dominios extraídos: ["villajoyosa.com", "turismolavilajoiosa.com"]
🔍 DEBUG - Query con restricción de sitios: (site:villajoyosa.com OR site:turismolavilajoiosa.com)
🔍 DEBUG - GoogleSearchRetrieval activado para eventos con sitios específicos desde agenda_eventos_urls
```

**Logs de Problema:**
```
🔍 DEBUG - GOOGLESEACHRETRIEVAL - NO ACTIVADO porque:
🔍 DEBUG - GOOGLESEACHRETRIEVAL - ❌ No hay agenda_eventos_urls configurada
```

## 🎯 **Casos Comunes y Soluciones**

### **Problema 1: userId es null**
- **Causa**: No se está pasando el `userId` en la petición
- **Solución**: Verificar que el frontend envíe el `userId` del usuario logueado

### **Problema 2: assistant_config vacío**
- **Causa**: El usuario no tiene configuración en el Finetuning Page
- **Solución**: Configurar URLs en `assistant_config` o usar fallback de `cities`

### **Problema 3: URLs mal formateadas**
- **Causa**: Las URLs no están en formato JSON array válido
- **Solución**: Verificar que sea un array JSON válido: `["url1", "url2"]`

### **Problema 4: Ciudad no encontrada**
- **Causa**: No se pasa `citySlug` o la ciudad no existe en la BD
- **Solución**: Verificar que se pase el `citySlug` correcto

## 🔄 **Flujo de Configuración Recomendado**

1. **Desarrollo/Testing**: Configurar en `cities` para testing rápido
2. **Producción**: Usar `assistant_config` para configuración por usuario en Finetuning Page

## 📊 **Orden de Prioridad de Configuración**

1. **assistant_config** (Finetuning Page) - Prioridad 1
2. **cities** por citySlug - Prioridad 2  
3. **cities** por cityId - Prioridad 3
4. **cities** por adminUserId - Prioridad 4

## ✅ **Verificación Final**

Una vez configurado correctamente, deberías ver:

1. ✅ `GoogleSearchRetrieval activado para eventos con sitios específicos`
2. ✅ Dominios extraídos correctamente
3. ✅ La IA encuentra eventos en los sitios especificados
4. ✅ No más errores de Google CSE o búsqueda manual

## 🚀 **Próximos Pasos**

1. Ejecuta las consultas de verificación
2. Identifica dónde está (o falta) la configuración
3. Configura las URLs en la tabla apropiada
4. Prueba con una consulta de eventos
5. Verifica los logs para confirmar que GoogleSearchRetrieval se activa

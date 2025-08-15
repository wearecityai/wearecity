# 🧪 Test de GoogleSearchRetrieval

## 🔍 **Verificación Paso a Paso**

### **1. Test de Detección de Intents**

Pregunta: **"eventos"** (solo esta palabra)

**Logs esperados:**
```
🔍 DEBUG - detectIntents - Texto normalizado: eventos
🔍 DEBUG - Intent "events" detectado
🔍 DEBUG - Intents finales detectados: ["events"]
```

### **2. Test de Configuración**

**Logs esperados:**
```
🔍 DEBUG - CONFIGURACION - Intentando cargar assistant_config para userId: [tu-user-id]
🔍 DEBUG - CONFIGURACION - assistant_config cargado: true
🔍 DEBUG - CONFIGURACION - assistant_config tiene agenda_eventos_urls: true
🔍 DEBUG - Configuración final: agenda_eventos_urls_length: [número]
```

### **3. Test de GoogleSearchRetrieval**

**Logs esperados:**
```
🔍 DEBUG - GOOGLESEACHRETRIEVAL - Verificando condiciones:
🔍 DEBUG - GOOGLESEACHRETRIEVAL - Es consulta de eventos: true
🔍 DEBUG - GOOGLESEACHRETRIEVAL - Config existe: true
🔍 DEBUG - GOOGLESEACHRETRIEVAL - agenda_eventos_urls raw: ["https://..."]
🔍 DEBUG - GOOGLESEACHRETRIEVAL - URLs parseadas: ["https://..."]
🔍 DEBUG - GOOGLESEACHRETRIEVAL - Longitud de URLs: [número]
🔍 DEBUG - Configurando googleSearchRetrieval con sitios específicos desde agenda_eventos_urls
🔍 DEBUG - Dominios extraídos: ["dominio.com"]
🔍 DEBUG - Query con restricción de sitios: (site:dominio.com OR site:otro.com)
🔍 DEBUG - GoogleSearchRetrieval activado para eventos con sitios específicos desde agenda_eventos_urls
```

### **4. Test de Configuración de Gemini**

**Logs esperados:**
```
🔍 DEBUG - Configuración de búsqueda:
🔍 DEBUG - Es consulta de eventos: true
🔍 DEBUG - Tiene googleSearchRetrieval: true
🔍 DEBUG - URL de la petición: https://generativelanguage.googleapis.com/...
🔍 DEBUG - Modelo usado: gemini-1.5-pro-latest
```

## 🚨 **Si NO ves estos logs**

### **Problema 1: No se detecta intent de eventos**
- Verifica que la palabra "eventos" esté en el patrón regex
- Revisa que `detectIntents` se esté llamando

### **Problema 2: No se carga la configuración**
- Verifica que `userId` se esté pasando
- Verifica que `assistant_config` tenga `agenda_eventos_urls`
- Verifica que `cities` tenga `agenda_eventos_urls`

### **Problema 3: GoogleSearchRetrieval no se activa**
- Verifica que `config?.agenda_eventos_urls` exista
- Verifica que las URLs se parseen correctamente
- Verifica que se extraigan dominios válidos

## 📋 **Comandos de Test**

### **Test Simple**
```
"eventos"
```

### **Test con Contexto**
```
"¿Qué eventos hay este fin de semana en La Vila Joiosa?"
```

### **Test de URLs**
```
"Eventos de agosto 2025"
```

## 🔧 **Debugging Rápido**

Si no funciona, ejecuta estas consultas SQL:

```sql
-- Verificar assistant_config
SELECT user_id, agenda_eventos_urls FROM assistant_config WHERE is_active = true;

-- Verificar cities
SELECT name, agenda_eventos_urls FROM cities WHERE name ILIKE '%vila%';
```

## ✅ **Resultado Esperado**

Al final deberías ver:
1. ✅ Intent de eventos detectado
2. ✅ Configuración cargada con URLs
3. ✅ GoogleSearchRetrieval activado
4. ✅ Dominios extraídos correctamente
5. ✅ Gemini configurado con tools de GoogleSearchRetrieval

# 🎯 Test de Inconsistencia de EVENT CARDS

## 🚨 **Problema Identificado**

Las EVENT CARDS se muestran **a veces sí, a veces no**, lo que indica que GoogleSearchRetrieval se activa **intermitentemente**.

## 🔍 **Diagnóstico de Inconsistencia**

### **1. Test de Consistencia**

Haz **3 consultas idénticas** seguidas:

```
Consulta 1: "eventos"
Consulta 2: "eventos"  
Consulta 3: "eventos"
```

**Compara los logs** de cada una para identificar diferencias.

### **2. Logs Críticos a Buscar**

#### **✅ Cuando SÍ funciona (aparecen EVENT CARDS):**
```
🔍 DEBUG - GOOGLESEACHRETRIEVAL - ✅ CONDICIÓN CUMPLIDA: isEventQuery=true Y agenda_eventos_urls existe
🔍 DEBUG - GOOGLESEACHRETRIEVAL - URLs parseadas: ["https://..."]
🔍 DEBUG - GOOGLESEACHRETRIEVAL - Longitud de URLs: [número]
🔍 DEBUG - Configurando googleSearchRetrieval con sitios específicos desde agenda_eventos_urls
🔍 DEBUG - GoogleSearchRetrieval activado para eventos con sitios específicos desde agenda_eventos_urls
```

#### **❌ Cuando NO funciona (no aparecen EVENT CARDS):**
```
🔍 DEBUG - GOOGLESEACHRETRIEVAL - ❌ CONDICIÓN NO CUMPLIDA:
🔍 DEBUG - GOOGLESEACHRETRIEVAL - isEventQuery: true/false
🔍 DEBUG - GOOGLESEACHRETRIEVAL - config?.agenda_eventos_urls: true/false
🔍 DEBUG - GOOGLESEACHRETRIEVAL - config?.agenda_eventos_urls valor: [valor o null]
```

### **3. Variables a Verificar**

#### **A. Intent de Eventos**
- **✅ Consistente**: `isEventQuery: true` siempre
- **❌ Inconsistente**: `isEventQuery: false` a veces

#### **B. Configuración**
- **✅ Consistente**: `config?.agenda_eventos_urls` siempre tiene valor
- **❌ Inconsistente**: `config?.agenda_eventos_urls` a veces es null/undefined

#### **C. URLs Parseadas**
- **✅ Consistente**: `Longitud de URLs: [número > 0]` siempre
- **❌ Inconsistente**: `Longitud de URLs: 0` a veces

## 🧪 **Test de Reproducción**

### **Test 1: Consulta Simple**
```
"eventos"
```

### **Test 2: Consulta con Contexto**
```
"¿Qué eventos hay este fin de semana?"
```

### **Test 3: Consulta Específica**
```
"Eventos de agosto en La Vila Joiosa"
```

### **Test 4: Consulta Repetida**
```
"eventos"
```

## 🔧 **Posibles Causas de Inconsistencia**

### **1. Configuración Variable**
- **assistant_config** cambia entre llamadas
- **cities** cambia entre llamadas
- **userId** no se pasa consistentemente

### **2. Caché o Estado**
- **Supabase** tiene caché que expira
- **Configuración** se recarga de manera inconsistente
- **Sesión** del usuario cambia

### **3. Condiciones de Carrera**
- **Múltiples llamadas** simultáneas
- **Configuración** se actualiza durante la ejecución
- **Base de datos** tiene latencia variable

## 📊 **Análisis de Logs**

### **Comparar estas líneas entre llamadas exitosas y fallidas:**

```
🔍 DEBUG - GOOGLESEACHRETRIEVAL - Es consulta de eventos: [true/false]
🔍 DEBUG - GOOGLESEACHRETRIEVAL - Config existe: [true/false]
🔍 DEBUG - GOOGLESEACHRETRIEVAL - Config keys: [array o null]
🔍 DEBUG - GOOGLESEACHRETRIEVAL - agenda_eventos_urls raw: [valor o null]
🔍 DEBUG - GOOGLESEACHRETRIEVAL - userId recibido: [valor o 'no user_id']
🔍 DEBUG - GOOGLESEACHRETRIEVAL - Timestamp: [timestamp]
```

## 🎯 **Solución Esperada**

Después de identificar la inconsistencia, deberías ver:

1. **✅ Intent de eventos**: Siempre `true`
2. **✅ Configuración**: Siempre cargada
3. **✅ URLs**: Siempre parseadas correctamente
4. **✅ GoogleSearchRetrieval**: Siempre activado
5. **✅ EVENT CARDS**: Siempre generadas

## 🚀 **Próximos Pasos**

1. **Ejecuta los 4 tests** de manera secuencial
2. **Compara los logs** entre llamadas exitosas y fallidas
3. **Identifica la variable** que cambia
4. **Reporta los resultados** para implementar la solución

**¿Puedes ejecutar estos tests y decirme exactamente qué logs aparecen en cada uno?**

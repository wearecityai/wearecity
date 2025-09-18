# 🎛️ Guía de Interfaz SuperAdmin - Agentes Inteligentes

## 📋 Resumen

La sección **Agentes Inteligentes** del SuperAdmin te permite gestionar completamente el sistema dinámico de scraping y RAG sin tocar código. Todo se maneja desde la interfaz web con configuración en tiempo real.

---

## 🏗️ Arquitectura Implementada

```
┌─────────────────────────────────────────────────────────────┐
│                   SUPERADMIN INTERFACE                      │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Config    │  │  Scraping   │  │ Monitoring  │        │
│  │  Manager    │  │  Control    │  │ Dashboard   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DYNAMIC SYSTEM                           │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Firestore  │  │ Agent Engine│  │  Puppeteer  │        │
│  │ Config DB   │  │  (Vertex)   │  │  Service    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Funcionalidades Principales

### **✅ 1. Gestión Dinámica de URLs**
- **Configurar URLs por categoría**: Eventos, Trámites, Turismo, etc.
- **Validación automática**: Verificación de URLs en tiempo real
- **Vista previa**: Abrir sitios web directamente desde la interfaz
- **Sin hardcoding**: Todas las URLs se almacenan en Firestore

### **✅ 2. Scraping Inteligente**
- **Scraping manual**: Ejecutar bajo demanda para cualquier ciudad
- **URLs dinámicas**: El agente consulta automáticamente las URLs configuradas
- **Scraping programado**: Diario, semanal y mensual automático
- **Monitoreo**: Ver estado y resultados en tiempo real

### **✅ 3. Configuración Centralizada**
- **Por ciudad**: Configuración independiente para cada ciudad
- **Selectores CSS**: Personalizar cómo extraer datos de cada sitio
- **Habilitación/Deshabilitación**: Control granular del scraping
- **Información básica**: Nombre, población, provincia, etc.

### **✅ 4. Monitoreo y Estadísticas**
- **Estado de servicios**: Ver si todos los componentes funcionan
- **Métricas en tiempo real**: Eventos, fuentes RAG, ciudades activas
- **Alertas**: Notificaciones automáticas de problemas
- **Histórico**: Métricas de las últimas 24h, 7d, 30d

---

## 🖥️ Interfaz de Usuario

### **📊 Tab: Resumen**
- **Estadísticas principales**: Eventos, fuentes RAG, ciudades
- **Acciones rápidas**: Scraping, actualizar stats, limpiar datos
- **Estado del sistema**: Agent Engine, Puppeteer, Firestore

### **⚙️ Tab: Configuración**
- **Información básica**: Nombre, sitio web oficial
- **URLs por categoría**:
  - 📅 **Eventos**: URLs de agendas municipales
  - 📋 **Trámites**: URLs de servicios municipales
  - 📰 **Noticias**: URLs de noticias locales
  - 🌍 **Turismo**: URLs de información turística
  - 📞 **Contacto**: URLs de contacto municipal
  - 🔧 **Servicios**: URLs de servicios públicos
- **Configuración de scraping**: Selectores CSS personalizados

### **🤖 Tab: Scraping**
- **Scraping manual**: Ejecutar inmediatamente
- **URLs configuradas**: Ver qué URLs se van a scrapear
- **Scraping programado**: Estado de jobs automáticos
- **Vista previa**: Abrir sitios web para verificar

### **📈 Tab: Monitoreo**
- **Estado de servicios**: Salud de todos los componentes
- **Métricas**: Números actuales del sistema
- **Acciones de mantenimiento**: Limpiar datos, estadísticas

---

## 🚀 Cómo Usar la Interfaz

### **🏁 Paso 1: Acceder a la Sección**
1. Iniciar sesión como SuperAdmin
2. Ir al Dashboard SuperAdmin
3. Hacer clic en "Agentes Inteligentes" en el sidebar

### **🏙️ Paso 2: Seleccionar Ciudad**
1. Usar el selector de ciudad en la esquina superior derecha
2. Elegir entre Valencia, La Vila Joiosa, Alicante
3. La configuración se carga automáticamente

### **⚙️ Paso 3: Configurar URLs**
1. Ir al tab "Configuración"
2. Completar información básica de la ciudad
3. Agregar URLs por categoría:
   ```
   📅 Eventos: https://www.ciudad.es/agenda
   📋 Trámites: https://www.ciudad.es/tramites
   🌍 Turismo: https://www.ciudad.es/turismo
   ```
4. Configurar selectores CSS si es necesario
5. Hacer clic en "Guardar Configuración"

### **🕷️ Paso 4: Ejecutar Scraping**
1. Ir al tab "Scraping"
2. Hacer clic en "Ejecutar Scraping Completo"
3. El agente:
   - Consulta las URLs configuradas
   - Scrapea cada URL automáticamente
   - Inserta los eventos en el sistema RAG
4. Ver resultados en tiempo real

### **📊 Paso 5: Monitorear Resultados**
1. Ir al tab "Resumen" o "Monitoreo"
2. Ver estadísticas actualizadas
3. Verificar que no hay alertas
4. Comprobar que los servicios están operativos

---

## 🔧 Configuración Avanzada

### **🎯 Selectores CSS Personalizados**
```css
/* Ejemplos de selectores comunes */
Contenedor de eventos: article, .post, .event-item
Título: h1, h2, h3, .entry-title, .event-title
Descripción: .entry-content, .event-description, .content
Fecha: .event-date, .entry-date, time
Ubicación: .event-location, .venue, .location
```

### **🔗 Tipos de URLs Soportadas**
- ✅ **HTTPS**: Requerido para seguridad
- ✅ **Sitios municipales**: Ayuntamientos oficiales
- ✅ **Agendas culturales**: Eventos y actividades
- ✅ **Portales de trámites**: Servicios municipales
- ✅ **Sitios turísticos**: Información para visitantes

### **⏰ Scraping Programado**
- **Diario (6:00 AM)**: Agenda principal de cada ciudad
- **Semanal (Lunes 3:00 AM)**: Fuentes adicionales
- **Mensual (Día 1, 2:00 AM)**: Limpieza y actualización completa

---

## 🚨 Resolución de Problemas

### **❌ Error: "No hay URLs configuradas"**
**Solución**: Ir a Configuración → Agregar URLs de eventos

### **❌ Error: "URL inválida"**
**Solución**: Verificar que la URL empieza con https://

### **❌ Error: "Scraping falló"**
**Soluciones**:
1. Verificar que el sitio web esté accesible
2. Comprobar selectores CSS
3. Ver si el sitio requiere JavaScript

### **❌ Error: "Sin eventos extraídos"**
**Soluciones**:
1. Ajustar selectores CSS
2. Verificar que la página tenga eventos
3. Comprobar estructura HTML del sitio

---

## 🎯 Mejores Prácticas

### **✅ Configuración de URLs**
- Usar URLs oficiales del ayuntamiento
- Verificar que las páginas tengan eventos regulares
- Probar URLs antes de guardar
- Mantener URLs actualizadas

### **✅ Selectores CSS**
- Usar selectores específicos pero flexibles
- Probar con múltiples páginas del sitio
- Actualizar si el sitio cambia estructura
- Documentar cambios importantes

### **✅ Monitoreo Regular**
- Revisar estadísticas semanalmente
- Verificar alertas del sistema
- Comprobar que el scraping programado funciona
- Limpiar datos obsoletos mensualmente

---

## 📈 Métricas Importantes

### **🎯 Indicadores de Éxito**
- **Eventos extraídos**: > 10 eventos por ciudad por semana
- **Tasa de éxito**: > 90% de URLs scrapeadas exitosamente
- **Tiempo de respuesta**: < 30 segundos por scraping
- **Disponibilidad**: > 99% de uptime de servicios

### **⚠️ Señales de Alerta**
- Cero eventos extraídos por varios días
- Errores frecuentes en scraping
- URLs que devuelven errores 404/500
- Servicios marcados como "degraded" o "down"

---

## 🔒 Seguridad y Permisos

### **👑 Solo SuperAdmin**
- **Configuración**: Solo SuperAdmins pueden cambiar URLs
- **Scraping manual**: Solo SuperAdmins pueden ejecutar
- **Limpieza de datos**: Operación destructiva protegida
- **Monitoreo**: Acceso completo a métricas sensibles

### **👤 Usuarios Públicos**
- **Consultas**: Solo pueden hacer preguntas al agente
- **Sin modificación**: No pueden cambiar configuración
- **Sin scraping**: No pueden ejecutar operaciones de scraping
- **RAG de solo lectura**: Solo consultan información existente

---

## 🎊 ¡Sistema Completamente Operativo!

### **✅ Lo que has conseguido:**
1. **🎛️ Interfaz completa**: Gestión total desde el frontend
2. **🔄 Sistema dinámico**: URLs configurables sin tocar código
3. **🤖 Agente inteligente**: Scraping automático e inteligente
4. **📊 Monitoreo completo**: Visibilidad total del sistema
5. **🔒 Seguridad robusta**: Separación admin/público
6. **⚡ Tiempo real**: Cambios inmediatos sin redespliegue

### **🚀 Próximos pasos:**
- Los SuperAdmins ya pueden gestionar todo desde la interfaz
- El sistema se actualiza automáticamente con scraping programado
- Los usuarios finales obtienen información actualizada
- El agente consulta siempre las URLs más recientes

**¡El sistema de agentes inteligentes está listo para producción!** 🎉

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFormattingInstructions = exports.RICH_TEXT_FORMATTING_INSTRUCTIONS = void 0;
// Instrucciones de formato de texto enriquecido simplificadas
exports.RICH_TEXT_FORMATTING_INSTRUCTIONS = `
GUÍA COMPLETA DE FORMATO PROFESIONAL - ESTILO CHATGPT:

ESTRUCTURA Y ORGANIZACIÓN:

1. TÍTULOS Y ENCABEZADOS:
- Títulos principales: ## Título Principal
- Subtítulos: ### Subtítulo
- Secciones: #### Sección
- Elementos: **Elemento:**

2. LISTAS Y ELEMENTOS:
- Lista principal: • Elemento principal
- Sub-elementos:   ◦ Sub-elemento
- Elementos numerados: 1. Primer elemento
- Elementos con iconos: 📍 Lugar, 🕐 Hora, 📞 Teléfono

3. ICONOS Y SÍMBOLOS TEMÁTICOS:
- Lugares: 🏛️ 🏪 🍽️ 🏥 🚌 🏨 🎭 🏖️ 🏞️
- Servicios: 📋 📞 💻 🚪 🕐 📍 🗺️ 📊
- Eventos: 🎉 🎪 🎭 🎨 🏃‍♂️ 🎵 🎬 🎪
- Información: ℹ️ ✅ ❌ ⚠️ 🔍 📝 💡
- Acciones: ▶️ 🔄 📤 📥 🎯 🚀

4. FORMATO DE TEXTO:
- Negrita: **Texto importante**
- Cursiva: *Texto en cursiva*
- Código: \`código o comando\`
- Enlaces: [Texto del enlace](URL)

5. LÍNEAS DIVISORIAS Y SEPARADORES:
- Separador simple: ---
- Separador con iconos: 🔸 🔸 🔸
- Separador temático: 📍 ──────────── 📍

6. ESTRUCTURA DE RESPUESTAS:

Para Lugares:
## 🏪 [Nombre del Lugar]

**📍 Dirección:** [Dirección completa]
**🕐 Horario:** [Horarios de apertura]
**📞 Teléfono:** [Número de contacto]
**⭐ Valoración:** [Rating si disponible]

### 🔹 Información Adicional:
• [Detalle 1]
• [Detalle 2]
• [Detalle 3]

---

Para Eventos:
## 🎉 [Nombre del Evento]

**📅 Fecha:** [Fecha del evento]
**🕐 Hora:** [Hora de inicio]
**📍 Ubicación:** [Lugar del evento]

### 🔹 Descripción:
[Descripción del evento]

### 🔹 Detalles:
• **Organizador:** [Quien organiza]
• **Precio:** [Costo si aplica]
• **Más info:** [Enlace o contacto]

---

Para Trámites:
## 📋 [Nombre del Trámite]

### 🔹 Documentación Requerida:
• [Documento 1]
• [Documento 2]
• [Documento 3]

### 🔹 Pasos a Seguir:
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

### 🔹 Información Importante:
**🕐 Horarios:** [Horarios de atención]
**📍 Ubicación:** [Dónde realizarlo]
**💰 Coste:** [Precio si aplica]

---

7. ELEMENTOS VISUALES:
- Cajas de información: Usa > para citas o información destacada
- Alertas: ⚠️ Importante: para advertencias
- Éxito: ✅ Correcto: para confirmaciones
- Error: ❌ Error: para problemas

8. REGLAS DE USO:
- Usa iconos relevantes para cada tipo de información
- Estructura jerárquica clara con títulos y subtítulos
- Listas organizadas con bullets y numeración
- Separadores visuales para dividir secciones
- Formato consistente en toda la respuesta
- No sobrecargues con demasiados iconos
- No uses formato excesivo en respuestas cortas

9. EJEMPLOS DE APLICACIÓN:

Respuesta Simple Mejorada:
## 🍽️ Restaurantes Recomendados

### 🔹 Opciones Principales:
• **Restaurante A** - Cocina mediterránea
• **Restaurante B** - Especialidad en pescado
• **Restaurante C** - Opciones vegetarianas

### 🔹 Información Útil:
**📍 Ubicación:** Todos en el centro histórico
**🕐 Horario:** Abiertos de 12:00 a 23:00
**💰 Rango de precios:** €15-€35 por persona

---

Respuesta Completa Mejorada:
## 🏛️ Ayuntamiento de [Ciudad]

### 🔹 Información General:
**📍 Dirección:** [Dirección completa]
**🕐 Horarios:** Lunes a Viernes 8:00-15:00
**📞 Teléfono:** [Número de contacto]
**💻 Web:** [Sitio web oficial]

### 🔹 Servicios Disponibles:
• **📋 Trámites administrativos**
• **🏠 Empadronamiento**
• **📄 Certificados**
• **💰 Tasas municipales**

### 🔹 Cómo Llegar:
**🚌 Transporte público:** [Líneas de autobús]
**🚗 En coche:** [Instrucciones de acceso]
**🅿️ Aparcamiento:** [Opciones de estacionamiento]

---

OBJETIVO: Crear respuestas visualmente atractivas, bien estructuradas y fáciles de leer, similar al estilo profesional de ChatGPT.
`;
// Función para obtener las instrucciones de formateo
function getFormattingInstructions() {
    return `
## 🎨 **FORMATO PROFESIONAL AVANZADO - ESTILO CHATGPT:**

### 📋 **ESTRUCTURA Y ORGANIZACIÓN:**

#### **1. TÍTULOS Y ENCABEZADOS:**
- **Títulos principales:** \`## Título Principal\`
- **Subtítulos:** \`### Subtítulo\`
- **Secciones:** \`#### Sección\`
- **Elementos:** \`**Elemento:**\`

#### **2. LISTAS Y ELEMENTOS (ESTILO CHATGPT):**
- **Lista principal:** \`- Elemento principal\` (bullet redondo estándar)
- **Sub-elementos:** \`  - Sub-elemento\` (2 espacios + bullet, indentación automática)
- **Elementos numerados:** \`1. Primer elemento\` (números estándar)
- **Listas de tareas:** \`- [x] Tarea completada\` y \`- [ ] Tarea pendiente\`
- **Indentación:** Usa 2 espacios para cada nivel de indentación
- **Formato simple:** No uses componentes complejos, solo markdown estándar
- **Ejemplo:**
\`\`\`
- **Evento principal**
  - **Sub-evento 1**
  - **Sub-evento 2**
- **Otro evento principal**
\`\`\`

#### **3. TABLAS PROFESIONALES:**
\`\`\`
| Campo | Valor | Estado |
|-------|-------|--------|
| **Dirección** | Calle Principal, 123 | ✅ Verificado |
| **Horarios** | L-V: 8:00-15:00 | ⏰ Actualizado |
| **Teléfono** | +34 123 456 789 | 📞 Disponible |
\`\`\`

#### **4. ALERTAS Y TIPS:**
- **Información:** \`> **Info:** Mensaje informativo\`
- **Advertencia:** \`> **Advertencia:** Mensaje de advertencia\`
- **Éxito:** \`> **Éxito:** Mensaje de confirmación\`
- **Error:** \`> **Error:** Mensaje de error\`
- **Tip:** \`> **Tip:** Consejo útil\`

#### **5. LABELS DESTACADOS (Recomendaciones, Notas, Anotaciones):**
- **Recomendaciones:** \`**Recomendación:** Texto destacado\` (label subrayado neutro)
- **Notas:** \`**Nota:** Información adicional\` (label subrayado sutil)
- **Destacados:** \`**Destacado:** Información importante\` (label subrayado neutro)
- **Tips:** \`**Tip:** Consejo útil\` (label subrayado sutil)
- **Regla:** Usar labels subrayados con color neutro muy sutil para recomendaciones y anotaciones

#### **6. CÓDIGO CON SYNTAX HIGHLIGHTING:**
\`\`\`typescript
// Ejemplo de código TypeScript
function ejemplo() {
  return "Hola mundo";
}
\`\`\`

\`\`\`bash
# Comando de terminal
curl -X GET "https://api.ayuntamiento.es/status"
\`\`\`

#### **7. ESTRUCTURA DE RESPUESTAS RECOMENDADA:**

##### **Para Lugares:**
\`\`\`
## [Nombre del Lugar]

### **Información General**
| Campo | Valor |
|-------|-------|
| **Dirección** | [Dirección completa] |
| **Horario** | [Horarios de apertura] |
| **Teléfono** | [Número de contacto] |
| **Valoración** | [Rating si disponible] |

### **Servicios Disponibles**
- [x] [Servicio 1]
- [x] [Servicio 2]
- [ ] [Servicio 3] (solo online)

> **Tip:** [Consejo útil sobre el lugar]

---
\`\`\`

##### **Para Eventos:**
\`\`\`
## [Nombre del Evento]

### **Detalles del Evento**
| Campo | Valor |
|-------|-------|
| **Fecha** | [Fecha del evento] |
| **Hora** | [Hora de inicio] |
| **Ubicación** | [Lugar del evento] |
| **Organizador** | [Quien organiza] |

### **Descripción**
[Descripción detallada del evento]

### **Información Adicional**
- **Precio:** [Costo si aplica]
- **Entradas:** [Dónde conseguir entradas]
- **Contacto:** [Información de contacto]

> **Info:** [Información importante sobre el evento]

---
\`\`\`

##### **Para Trámites:**
\`\`\`
## [Nombre del Trámite]

### **Documentación Requerida**
- [x] [Documento 1]
- [x] [Documento 2]
- [ ] [Documento 3] (opcional)

### **Pasos a Seguir**
1. [Paso 1 detallado]
2. [Paso 2 detallado]
3. [Paso 3 detallado]

### **Información Importante**
| Campo | Valor |
|-------|-------|
| **Horarios** | [Horarios de atención] |
| **Ubicación** | [Dónde realizarlo] |
| **Coste** | [Precio si aplica] |
| **Plazo** | [Tiempo de procesamiento] |

> **Advertencia:** [Información importante a tener en cuenta]

---
\`\`\`

#### **8. ICONOS Y SÍMBOLOS (USO MÍNIMO):**
- **Solo usar iconos cuando sea realmente necesario**
- **Evitar sobrecargar con emojis**
- **Mantener formato limpio y profesional**
- **Usar iconos solo para destacar información importante**

#### **9. REGLAS DE USO Y AGRUPACIÓN (ESTILO CHATGPT):**
- ✅ **Usa formato simple y limpio** como ChatGPT
- ✅ **Mantén indentación consistente** en listas (2 espacios por nivel)
- ✅ **Usa markdown estándar** sin componentes complejos
- ✅ **Agrupa información relacionada** en la misma sección
- ✅ **Separa claramente** diferentes temas o categorías
- ✅ **Usa separadores** \`---\` para dividir secciones principales
- ✅ **Usa tablas** para información estructurada
- ✅ **Usa alertas** para información importante
- ❌ **No sobrecargues** con demasiados iconos o emojis
- ❌ **No uses** formato excesivo en respuestas cortas
- ❌ **No mezcles** información no relacionada en la misma sección
- ❌ **No uses** componentes personalizados complejos
- ❌ **No compliques** el markdown con lógica adicional

#### **10. EJEMPLO DE RESPUESTA COMPLETA:**
\`\`\`
## Ayuntamiento de [Ciudad]

### Información General
| Campo | Valor |
|-------|-------|
| **Dirección** | Plaza Mayor, 1 |
| **Horarios** | L-V: 8:00-15:00 |
| **Teléfono** | +34 123 456 789 |
| **Web** | [www.ayuntamiento.es](https://www.ayuntamiento.es) |

### Servicios Disponibles
- **Trámites administrativos**
- **Empadronamiento**
- **Certificados**
- **Tasas municipales** (solo online)

### Cómo Llegar
- **Transporte público:** Líneas 1, 3, 5
- **En coche:** Aparcamiento público en Plaza Mayor
- **Aparcamiento:** Zona azul y parking municipal

> **Tip:** Puedes hacer la mayoría de trámites online para ahorrar tiempo

### **Código de ejemplo para verificar estado:**
\`\`\`bash
curl -X GET "https://api.ayuntamiento.es/status"
\`\`\`

---
\`\`\`

**OBJETIVO:** Crear respuestas visualmente atractivas, bien estructuradas y fáciles de leer, similar al estilo profesional de ChatGPT con markdown avanzado.
`;
}
exports.getFormattingInstructions = getFormattingInstructions;
//# sourceMappingURL=formattingInstructions.js.map
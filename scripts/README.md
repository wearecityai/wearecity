# 🤖 Script de Asignación Automática de Iconos

Este script usa inteligencia artificial (Gemini o OpenAI) para analizar prompts recomendados y asignar automáticamente iconos de Material Design apropiados.

## 🚀 Configuración

### 1. Obtener API Key

**Opción A: Gemini (Gratis)**
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una API key gratuita
3. Copia la key

**Opción B: OpenAI (De pago)**
1. Ve a [OpenAI API](https://platform.openai.com/api-keys)
2. Crea una API key
3. Copia la key

### 2. Configurar el script

Edita `assign-icons.js` y reemplaza:
```javascript
const GEMINI_API_KEY = 'tu-api-key-aqui'; // Pon tu key de Gemini
// O
const OPENAI_API_KEY = 'tu-api-key-aqui'; // Pon tu key de OpenAI
```

También puedes usar variables de entorno:
```bash
export GOOGLE_GEMINI_API_KEY="tu-key-aqui"
export OPENAI_API_KEY="tu-key-aqui"
```

## 🔧 Uso

### 1. Ejecutar el script
```bash
cd scripts
node assign-icons.js
```

### 2. El script:
- Analiza cada prompt recomendado
- Determina el concepto principal (eventos, restaurantes, transporte, etc.)
- Asigna el icono de Material Design más apropiado
- Guarda el resultado en `prompts-with-icons.json`

### 3. Ejemplo de salida:
```json
[
  { "text": "¿Qué eventos hay este fin de semana?", "img": "event" },
  { "text": "Recomiéndame un buen restaurante italiano.", "img": "restaurant" },
  { "text": "¿Cómo llego al museo en transporte público?", "img": "directions_bus" },
  { "text": "Horarios de la biblioteca municipal", "img": "schedule" }
]
```

## 🎯 Iconos Disponibles

El script puede asignar estos iconos de Material Design:

- **Eventos**: `event`, `calendar`
- **Comida**: `restaurant`, `dining`
- **Transporte**: `directions_bus`, `taxi`, `train`, `airport`
- **Tiempo**: `schedule`, `time`
- **Lugares**: `location`, `place`, `map`
- **Servicios**: `hospital`, `pharmacy`, `police`, `school`
- **Otros**: `help`, `info`, `shopping`, `hotel`, `wifi`

## 🔄 Aplicar a tu base de datos

Una vez que tengas los prompts con iconos:

1. **Manual**: Copia los resultados y pégalos en el panel de administración
2. **Automático**: Modifica el script para conectar con tu base de datos

### Ejemplo de conexión a Supabase:
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'tu-url-de-supabase',
  'tu-anon-key'
);

// Actualizar en la base de datos
await supabase
  .from('assistant_config')
  .update({ recommended_prompts: updatedPrompts })
  .eq('id', 'tu-config-id');
```

## 🎨 Personalizar Iconos

Si quieres añadir más iconos o cambiar las asignaciones:

1. Edita la lista `AVAILABLE_ICONS` en el script
2. Añade nuevas entradas al `iconMap` en `getIconComponent()` (tanto en `ChatContainer.tsx` como en `FinetuningPage.tsx`)
3. Actualiza las reglas del prompt de IA

## ⚡ Consejos

- **Gemini es gratis** y funciona muy bien para este caso de uso
- **OpenAI es más preciso** pero requiere créditos de pago
- El script incluye **validación** para asegurar que solo se asignen iconos existentes
- **Fallback**: Si la IA sugiere un icono que no existe, se usa `help`
- **Pausa automática**: El script espera 500ms entre requests para no saturar la API

## 🐛 Troubleshooting

**Error de API**: Verifica que tu API key sea válida y tenga créditos suficientes.

**Iconos incorrectos**: Ajusta el prompt de IA con ejemplos más específicos para tu dominio.

**Conexión**: Asegúrate de tener conexión a internet y que la API esté disponible.

---

¡Ahora tienes prompts recomendados con iconos inteligentes y atractivos! 🎉 
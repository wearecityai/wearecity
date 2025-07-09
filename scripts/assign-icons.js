// Script para asignar iconos automáticamente a prompts recomendados
// Usa OpenAI/Gemini para analizar el concepto y asignar el icono más apropiado

const fs = require('fs');
const path = require('path');

// Configuración - Reemplaza con tu API key
const OPENAI_API_KEY = 'tu-api-key-aqui'; // O usa process.env.OPENAI_API_KEY
const GEMINI_API_KEY = 'tu-gemini-api-key'; // O usa process.env.GOOGLE_GEMINI_API_KEY

// Lista de iconos disponibles en Material UI (los más comunes para un asistente de ciudad)
const AVAILABLE_ICONS = [
  'event', 'restaurant', 'directions_bus', 'schedule', 'library', 'museum', 
  'hospital', 'pharmacy', 'police', 'weather', 'location', 'map', 'parking',
  'taxi', 'train', 'airport', 'hotel', 'shopping', 'school', 'government',
  'help', 'info', 'place', 'nature', 'warning', 'music', 'sports', 'wifi',
  'attach_money', 'local_gas_station', 'local_parking', 'wb_sunny', 'palette'
];

// Función para llamar a Gemini (gratis)
async function getIconWithGemini(promptText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
  
  const systemPrompt = `Eres un experto en UX/UI especializado en iconografía para asistentes de ciudad.

Analiza el siguiente prompt recomendado y selecciona el icono de Material Design más apropiado que represente visualmente el concepto principal.

ICONOS DISPONIBLES: ${AVAILABLE_ICONS.join(', ')}

REGLAS:
1. Responde SOLO con el nombre del icono (ejemplo: "event", "restaurant")
2. Elige el icono que mejor represente el concepto PRINCIPAL del prompt
3. Prioriza la claridad visual y reconocimiento inmediato
4. Si es sobre eventos/fechas → "event"
5. Si es sobre comida/restaurantes → "restaurant"  
6. Si es sobre transporte → "directions_bus", "taxi", "train"
7. Si es sobre horarios/tiempo → "schedule"
8. Si es sobre lugares/ubicación → "location" o "place"
9. Si es sobre emergencias → "warning"
10. Si no estás seguro → "help"

Prompt a analizar: "${promptText}"

Icono más apropiado:`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    const data = await response.json();
    const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    // Validar que el icono sugerido existe en nuestra lista
    if (AVAILABLE_ICONS.includes(suggestion)) {
      return suggestion;
    }
    
    // Fallback si la IA sugiere algo que no existe
    return 'help';
  } catch (error) {
    console.error('Error con Gemini:', error);
    return 'help';
  }
}

// Función para llamar a OpenAI (de pago)
async function getIconWithOpenAI(promptText) {
  const url = 'https://api.openai.com/v1/chat/completions';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en UX especializado en iconografía para asistentes de ciudad. 

Analiza el prompt y responde SOLO con el nombre del icono de Material Design más apropiado de esta lista: ${AVAILABLE_ICONS.join(', ')}

Reglas:
- Eventos/calendario → "event"
- Restaurantes/comida → "restaurant" 
- Transporte → "directions_bus", "taxi", "train"
- Horarios → "schedule"
- Ubicación → "location"
- Emergencias → "warning"
- Por defecto → "help"`
          },
          { role: 'user', content: promptText }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    });

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content?.trim();
    
    if (AVAILABLE_ICONS.includes(suggestion)) {
      return suggestion;
    }
    
    return 'help';
  } catch (error) {
    console.error('Error con OpenAI:', error);
    return 'help';
  }
}

// Prompts de ejemplo (reemplaza con los tuyos)
const examplePrompts = [
  { text: "¿Qué eventos hay este fin de semana?", img: "help" },
  { text: "Recomiéndame un buen restaurante italiano.", img: "help" },
  { text: "¿Cómo llego al museo principal en transporte público?", img: "help" },
  { text: "Horarios de la biblioteca municipal", img: "help" },
  { text: "¿Dónde está el hospital más cercano?", img: "help" },
  { text: "Información del tiempo para mañana", img: "help" },
  { text: "¿Hay parking cerca del centro?", img: "help" }
];

// Función principal
async function assignIconsToPrompts(prompts, useOpenAI = false) {
  console.log('🤖 Analizando prompts y asignando iconos...\n');
  
  const updatedPrompts = [];
  
  for (const prompt of prompts) {
    console.log(`📝 Analizando: "${prompt.text}"`);
    
    let suggestedIcon;
    if (useOpenAI && OPENAI_API_KEY !== 'tu-api-key-aqui') {
      suggestedIcon = await getIconWithOpenAI(prompt.text);
    } else if (GEMINI_API_KEY !== 'tu-gemini-api-key') {
      suggestedIcon = await getIconWithGemini(prompt.text);
    } else {
      console.log('❌ No hay API key configurada');
      suggestedIcon = 'help';
    }
    
    updatedPrompts.push({
      text: prompt.text,
      img: suggestedIcon
    });
    
    console.log(`✅ Icono asignado: "${suggestedIcon}"\n`);
    
    // Pequeña pausa para no saturar la API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return updatedPrompts;
}

// Ejecutar el script
async function main() {
  try {
    // Usar Gemini por defecto (gratis), cambiar a true para OpenAI
    const updatedPrompts = await assignIconsToPrompts(examplePrompts, false);
    
    console.log('🎉 Resultado final:');
    console.log(JSON.stringify(updatedPrompts, null, 2));
    
    // Guardar en archivo
    fs.writeFileSync(
      path.join(__dirname, 'prompts-with-icons.json'), 
      JSON.stringify(updatedPrompts, null, 2)
    );
    
    console.log('\n💾 Guardado en prompts-with-icons.json');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { assignIconsToPrompts, getIconWithGemini, getIconWithOpenAI }; 
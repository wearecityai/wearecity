import * as admin from 'firebase-admin';

/**
 * Template dinámico de instrucciones para WeAreCity
 * Los campos entre {{}} se reemplazan con la configuración específica de cada ciudad
 */
export const WEARECITY_INSTRUCTION_TEMPLATE = `Eres la IA de **WeAreCity** para {{CITY_NAME}}, un asistente especializado en proporcionar información local. Tu objetivo es ayudar tanto a **ciudadanos** como a **turistas** con consultas de forma clara, precisa y en tiempo real sobre {{CITY_NAME}}.

### Tu identidad:
- Nombre: {{ASSISTANT_NAME}}
- Ciudad: {{CITY_NAME}}
- Tipo de ciudad: {{CITY_TYPE}}
- Servicios especializados: {{SPECIALIZED_SERVICES}}

### Funciones principales:

1. **Trámites municipales de {{CITY_NAME}}**
   - Explicar cómo realizar trámites específicos de {{CITY_NAME}} (ej: empadronamiento, licencias, impuestos locales).
   - Dirigir a {{OFFICIAL_WEBSITE}} o sede electrónica: {{SEDE_ELECTRONICA_URL}}
   - Información de contacto: {{MUNICIPAL_PHONE}} | Horarios: {{OFFICE_HOURS}}
   - Explicar los requisitos y pasos de forma clara y resumida.

2. **Eventos y actividades en {{CITY_NAME}}**
   - Cuando pregunten por eventos en {{CITY_NAME}}, consultar:
     - Agenda oficial: {{EVENT_CALENDAR_URLS}}
     - Webs de cultura: {{CULTURE_WEBSITES}}
     - Google Search para eventos actuales
   - La información debe entregarse usando las **cards de eventos ya creadas en el sistema**.

3. **Recomendaciones locales de {{CITY_NAME}}**
   - Lugares típicos: {{TYPICAL_PLACES}}
   - Gastronomía local: {{LOCAL_FOOD}}
   - Monumentos principales: {{MAIN_MONUMENTS}}
   - Usar **Google Places API** para obtener datos actualizados.
   - Mostrar información en las **cards de Places ya creadas en el sistema**.

4. **Información práctica de {{CITY_NAME}}**
   - Transporte público: {{TRANSPORT_INFO}}
   - Servicios de emergencia: {{EMERGENCY_CONTACTS}}
   - Hospitales: {{HOSPITALS}}
   - Farmacias de guardia: {{PHARMACY_INFO}}

5. **Historia y cultura de {{CITY_NAME}}**
   - Historia: {{CITY_HISTORY}}
   - Datos curiosos: {{INTERESTING_FACTS}}
   - Tradiciones locales: {{LOCAL_TRADITIONS}}
   - Festividades importantes: {{LOCAL_FESTIVALS}}

6. **Modo multi-ciudad**
   - Si el usuario cambia de ciudad, adaptarse automáticamente.
   - Informar: "Ahora te ayudo con información de [nueva ciudad]".

7. **Configuración administrativa**
   - Ayuntamiento: {{CITY_HALL_INFO}}
   - Alcalde/sa: {{MAYOR_INFO}}
   - Teléfonos útiles: {{USEFUL_PHONES}}

### Estilo de comunicación:
- Lenguaje claro, cercano y profesional con toque local de {{CITY_NAME}}.
- Respuestas estructuradas y fáciles de leer.
- Evitar textos largos: preferir listas, pasos o **usar las cards existentes**.
- Usar expresiones típicas de {{REGION}} cuando sea apropiado.
- Siempre con foco en **ser útil y rápido**.

### Reglas importantes:
- SIEMPRE mencionar que eres el asistente oficial de {{CITY_NAME}}
- Cuando no sepas algo específico, dirigir a {{OFFICIAL_WEBSITE}} o {{MUNICIPAL_PHONE}}
- Priorizar información oficial y actualizada
- Si preguntan por otras ciudades, aclarar que te especializas en {{CITY_NAME}} pero puedes dar información general

### Objetivo final:
Convertirte en el **asistente digital oficial de {{CITY_NAME}}**, reduciendo las barreras digitales, mejorando la comunicación entre ciudadanía y administración, y facilitando el turismo y la vida urbana en {{CITY_NAME}}.`;

/**
 * Interfaz para los campos de configuración de la ciudad
 */
export interface CityTemplateConfig {
  // Identificación básica
  CITY_NAME: string;
  ASSISTANT_NAME: string;
  CITY_TYPE: string; // ej: "capital de provincia", "ciudad costera", "municipio rural"
  REGION: string; // ej: "Comunidad Valenciana", "Andalucía"
  
  // Servicios especializados
  SPECIALIZED_SERVICES: string; // ej: "turismo de playa, patrimonio histórico"
  
  // Contacto oficial
  OFFICIAL_WEBSITE: string;
  SEDE_ELECTRONICA_URL: string;
  MUNICIPAL_PHONE: string;
  OFFICE_HOURS: string; // ej: "L-V 9:00-14:00"
  
  // Eventos y cultura
  EVENT_CALENDAR_URLS: string; // URLs separadas por comas
  CULTURE_WEBSITES: string; // URLs de cultura/turismo
  
  // Lugares y gastronomía
  TYPICAL_PLACES: string; // ej: "Plaza Mayor, Castillo, Playa Norte"
  LOCAL_FOOD: string; // ej: "paella, horchata, turrones"
  MAIN_MONUMENTS: string; // ej: "Catedral, Teatro Romano, Murallas"
  
  // Servicios prácticos
  TRANSPORT_INFO: string; // ej: "TRAM, autobuses urbanos, Cercanías"
  EMERGENCY_CONTACTS: string; // ej: "092 Policía Local, 061 Emergencias"
  HOSPITALS: string; // Hospitales principales
  PHARMACY_INFO: string; // Info sobre farmacias de guardia
  
  // Historia y cultura
  CITY_HISTORY: string; // Resumen histórico breve
  INTERESTING_FACTS: string; // 2-3 curiosidades
  LOCAL_TRADITIONS: string; // Tradiciones locales
  LOCAL_FESTIVALS: string; // Fiestas principales
  
  // Información administrativa
  CITY_HALL_INFO: string; // Dirección y horarios del ayuntamiento
  MAYOR_INFO: string; // Nombre del alcalde/sa actual
  USEFUL_PHONES: string; // Teléfonos útiles adicionales
}

/**
 * Función para generar las instrucciones personalizadas usando el template
 */
export function generateInstructions(config: CityTemplateConfig): string {
  let instructions = WEARECITY_INSTRUCTION_TEMPLATE;
  
  // Reemplazar todas las variables del template
  Object.entries(config).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    instructions = instructions.replace(new RegExp(placeholder, 'g'), value || `[No configurado: ${key}]`);
  });
  
  return instructions;
}

/**
 * Función para obtener la configuración de una ciudad desde Firestore
 */
export async function getCityConfig(cityIdentifier: string): Promise<CityTemplateConfig | null> {
  try {
    const db = admin.firestore();
    const cityDoc = await db.collection('cities_config').doc(cityIdentifier).get();
    
    if (!cityDoc.exists) {
      console.log(`No config found for city: ${cityIdentifier}`);
      return null;
    }
    
    const data = cityDoc.data();
    return data?.templateConfig || null;
    
  } catch (error) {
    console.error('Error fetching city config:', error);
    return null;
  }
}

/**
 * Configuración por defecto para ciudades sin configurar
 */
export function getDefaultCityConfig(cityName: string): CityTemplateConfig {
  return {
    CITY_NAME: cityName,
    ASSISTANT_NAME: `Asistente de ${cityName}`,
    CITY_TYPE: "municipio",
    REGION: "España",
    SPECIALIZED_SERVICES: "información municipal general",
    OFFICIAL_WEBSITE: "www.[ciudad].es",
    SEDE_ELECTRONICA_URL: "sede.[ciudad].es",
    MUNICIPAL_PHONE: "96X XXX XXX",
    OFFICE_HOURS: "Lunes a Viernes 9:00-14:00",
    EVENT_CALENDAR_URLS: "Por configurar",
    CULTURE_WEBSITES: "Por configurar",
    TYPICAL_PLACES: "Por configurar",
    LOCAL_FOOD: "Gastronomía mediterránea",
    MAIN_MONUMENTS: "Por configurar",
    TRANSPORT_INFO: "Consultar información local",
    EMERGENCY_CONTACTS: "092 Policía Local, 112 Emergencias",
    HOSPITALS: "Por configurar",
    PHARMACY_INFO: "Consultar farmacia de guardia local",
    CITY_HISTORY: "Ciudad con rica historia por documentar",
    INTERESTING_FACTS: "Por configurar datos curiosos",
    LOCAL_TRADITIONS: "Por configurar tradiciones locales",
    LOCAL_FESTIVALS: "Fiestas patronales y celebraciones locales",
    CITY_HALL_INFO: "Plaza del Ayuntamiento, horario de atención",
    MAYOR_INFO: "Consultar información actualizada",
    USEFUL_PHONES: "Consultar guía telefónica municipal"
  };
}
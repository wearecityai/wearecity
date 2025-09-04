import * as admin from 'firebase-admin';

/**
 * Script para inicializar las instrucciones por defecto en Firebase
 * Se ejecuta una sola vez para configurar la base de datos
 */

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Configuración por defecto para ciudades
 */
const DEFAULT_CITY_CONFIG = {
  cityName: "Ciudad Ejemplo",
  assistantName: "Asistente IA Oficial de Ciudad Ejemplo",
  cityType: "municipio inteligente",
  region: "España",
  specializedServices: "información municipal integral y servicios ciudadanos",
  officialWebsite: "www.ciudadejemplo.es",
  sedeElectronicaUrl: "sede.ciudadejemplo.es",
  municipalPhone: "96X XXX XXX",
  officeHours: "Lunes a Viernes 9:00-14:00, Martes y Jueves 17:00-19:00",
  eventCalendarUrls: "Agenda municipal en proceso de configuración",
  cultureWebsites: "Portal de cultura y turismo en desarrollo",
  typicalPlaces: "Centro histórico, plazas principales, parques urbanos",
  localFood: "Gastronomía mediterránea y productos locales",
  mainMonuments: "Patrimonio histórico y cultural por documentar",
  transportInfo: "Red de transporte público municipal y conexiones regionales",
  emergencyContacts: "092 Policía Local, 061 Emergencias Sanitarias, 112 Emergencias Generales",
  hospitals: "Centros de salud municipales y hospitales de referencia",
  pharmacyInfo: "Servicio de farmacias de guardia 24/7",
  cityHistory: "Ciudad con rica historia y tradiciones que estamos documentando para ti",
  interestingFacts: "Datos curiosos y anécdotas locales en proceso de recopilación",
  localTraditions: "Tradiciones centenarias y costumbres locales por descubrir",
  localFestivals: "Fiestas patronales, ferias y celebraciones tradicionales",
  cityHallInfo: "Plaza del Ayuntamiento, centro histórico de la ciudad",
  mayorInfo: "Información actualizada del alcalde/sa en la web oficial",
  usefulPhones: "Atención ciudadana, servicios municipales y consultas generales",
  customInstructions: "",
  lastUpdated: admin.firestore.Timestamp.now()
};

/**
 * Instrucciones genéricas por defecto
 */
const DEFAULT_GENERIC_INSTRUCTIONS = `# 🌆 ASISTENTE IA OFICIAL DE WEARECITY

Eres la IA de **WeAreCity**, un asistente especializado en proporcionar información local de las ciudades. Tu objetivo es ayudar tanto a **ciudadanos** como a **turistas** con consultas de forma clara, precisa y en tiempo real.

## 🎯 CAPACIDADES PRINCIPALES

### **Información Municipal**
- Trámites y servicios municipales
- Eventos y actividades locales
- Recomendaciones de lugares y gastronomía
- Información práctica (transporte, emergencias, salud)
- Historia, cultura y tradiciones locales

### **Análisis Inteligente**
- Detectar la intención del usuario
- Adaptar respuestas según el contexto
- Priorizar información según urgencia
- Proporcionar pasos accionables

## 💡 INSTRUCCIONES DE COMUNICACIÓN

- **Lenguaje claro y profesional** con toque cercano
- **Respuestas estructuradas** y fáciles de leer
- **Priorizar información oficial** y actualizada
- **Anticipar preguntas** relacionadas
- **Siempre ser útil y rápido**

## 🚫 REGLAS IMPORTANTES

1. **NUNCA** proporcionar información médica o legal específica
2. **SIEMPRE** dirigir a fuentes oficiales para información crítica
3. **NUNCA** hacer promesas sobre tiempos o resultados
4. **SIEMPRE** priorizar la seguridad del usuario

Para obtener información más específica, por favor indica de qué ciudad necesitas información.`;

/**
 * Función para inicializar las instrucciones en Firebase
 */
export async function initializeInstructionsInFirebase() {
  try {
    const db = admin.firestore();
    
    console.log('🚀 Inicializando instrucciones en Firebase...');
    
    // 1. Crear configuración por defecto para ciudades
    await db.collection('ai_instructions').doc('default_city_config').set({
      ...DEFAULT_CITY_CONFIG,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    });
    console.log('✅ Configuración por defecto de ciudades creada');
    
    // 2. Crear instrucciones genéricas
    await db.collection('ai_instructions').doc('generic_instructions').set({
      instructions: DEFAULT_GENERIC_INSTRUCTIONS,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    });
    console.log('✅ Instrucciones genéricas creadas');
    
    // 3. Crear configuración de ejemplo para Valencia
    const valenciaConfig = {
      ...DEFAULT_CITY_CONFIG,
      cityName: "Valencia",
      assistantName: "Asistente IA Oficial de Valencia",
      cityType: "capital de provincia",
      region: "Comunidad Valenciana",
      specializedServices: "turismo de playa, patrimonio histórico, gastronomía mediterránea",
      officialWebsite: "www.valencia.es",
      sedeElectronicaUrl: "sede.valencia.es",
      municipalPhone: "010",
      officeHours: "Lunes a Viernes 9:00-14:00, Martes y Jueves 17:00-19:00",
      eventCalendarUrls: "www.valencia.es/agenda, www.turisvalencia.es",
      cultureWebsites: "www.turisvalencia.es, www.culturaydeporte.gob.es",
      typicalPlaces: "Ciudad de las Artes y las Ciencias, Barrio del Carmen, Plaza de la Virgen, Mercado Central",
      localFood: "Paella valenciana, horchata, turrones, fideuá, all i pebre",
      mainMonuments: "Catedral de Valencia, Torres de Serranos, Lonja de la Seda, Palacio del Marqués de Dos Aguas",
      transportInfo: "Metro de Valencia, EMT autobuses, TRAM, Cercanías Renfe, bicicletas públicas",
      emergencyContacts: "092 Policía Local, 061 Emergencias Sanitarias, 112 Emergencias Generales",
      hospitals: "Hospital General de Valencia, Hospital La Fe, Hospital Clínico",
      pharmacyInfo: "Servicio de farmacias de guardia 24/7, consultar en farmacias locales",
      cityHistory: "Valencia fue fundada por los romanos en el año 138 a.C. y ha sido un importante centro cultural y comercial a lo largo de la historia. Capital del Reino de Valencia durante la Edad Media, es conocida por su rico patrimonio histórico y cultural.",
      interestingFacts: "Valencia tiene la mayor extensión de huerta urbana de Europa, la Ciudad de las Artes y las Ciencias es el complejo científico-cultural más grande de España, y la paella valenciana es Patrimonio Cultural Inmaterial de la Humanidad.",
      localTraditions: "Las Fallas (declaradas Patrimonio Cultural Inmaterial), la Tomatina de Buñol, el Tribunal de las Aguas, las fiestas de San Vicente Ferrer",
      localFestivals: "Las Fallas (marzo), Feria de Julio, Feria de San Vicente, Semana Santa Marinera",
      cityHallInfo: "Plaza del Ayuntamiento, 1. Horario: L-V 9:00-14:00, M y J 17:00-19:00",
      mayorInfo: "María José Catalá Verdet (PP) desde 2023",
      usefulPhones: "010 Atención Ciudadana, 012 Información General, 900 100 100 Emergencias",
      customInstructions: "Valencia es una ciudad mediterránea con un clima suave todo el año. Prioriza información sobre playas, gastronomía local, eventos culturales y transporte público. La ciudad es muy accesible para turistas y tiene una excelente infraestructura turística.",
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    };
    
    await db.collection('cities_config').doc('valencia').set(valenciaConfig);
    console.log('✅ Configuración de Valencia creada');
    
    console.log('🎉 Inicialización de instrucciones completada exitosamente');
    
    return {
      success: true,
      message: 'Instrucciones inicializadas en Firebase',
      collections: ['ai_instructions', 'cities_config']
    };
    
  } catch (error) {
    console.error('❌ Error inicializando instrucciones:', error);
    throw error;
  }
}

/**
 * Función para verificar el estado de las instrucciones
 */
export async function checkInstructionsStatus() {
  try {
    const db = admin.firestore();
    
    console.log('🔍 Verificando estado de instrucciones en Firebase...');
    
    // Verificar configuración por defecto
    const defaultConfig = await db.collection('ai_instructions').doc('default_city_config').get();
    console.log('📋 Configuración por defecto:', defaultConfig.exists ? '✅ Existe' : '❌ No existe');
    
    // Verificar instrucciones genéricas
    const genericInstructions = await db.collection('ai_instructions').doc('generic_instructions').get();
    console.log('📚 Instrucciones genéricas:', genericInstructions.exists ? '✅ Existen' : '❌ No existen');
    
    // Verificar configuración de Valencia
    const valenciaConfig = await db.collection('cities_config').doc('valencia').get();
    console.log('🏙️ Configuración de Valencia:', valenciaConfig.exists ? '✅ Existe' : '❌ No existe');
    
    return {
      defaultConfig: defaultConfig.exists,
      genericInstructions: genericInstructions.exists,
      valenciaConfig: valenciaConfig.exists
    };
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error);
    throw error;
  }
}

// Si se ejecuta directamente este archivo
if (require.main === module) {
  initializeInstructionsInFirebase()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script:', error);
      process.exit(1);
    });
}

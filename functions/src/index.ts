import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { realTimeSearchService } from './realTimeSearchService';

// Inicializar Firebase Admin
admin.initializeApp();

// Inicializar Vertex AI
const vertexAI = new PredictionServiceClient({
  apiEndpoint: 'us-central1-aiplatform.googleapis.com',
});

// Interfaz para la configuración de ciudad almacenada en Firebase
interface CityConfig {
  cityName: string;
  assistantName: string;
  cityType: string;
  region: string;
  specializedServices: string;
  officialWebsite: string;
  sedeElectronicaUrl: string;
  municipalPhone: string;
  officeHours: string;
  eventCalendarUrls: string;
  cultureWebsites: string;
  typicalPlaces: string;
  localFood: string;
  mainMonuments: string;
  transportInfo: string;
  emergencyContacts: string;
  hospitals: string;
  pharmacyInfo: string;
  cityHistory: string;
  interestingFacts: string;
  localTraditions: string;
  localFestivals: string;
  cityHallInfo: string;
  mayorInfo: string;
  usefulPhones: string;
  customInstructions?: string;
  lastUpdated: admin.firestore.Timestamp;
}

export const chatIA = functions.https.onCall({
  memory: '512MiB',
  timeoutSeconds: 60
}, async (data: any, context: any) => {
  try {
    const {
      userMessage,
      userId,
      userLocation,
      allowMapDisplay = false,
      customSystemInstruction = '',
      citySlug,
      cityId,
      conversationHistory = [],
      mode = 'quality',
      historyWindow = 10,
      userContext = {}
    } = data;

    // Validar mensaje del usuario
    if (!userMessage || userMessage.trim().length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'El mensaje del usuario es requerido');
    }

      console.log('🔍 Chat IA Request:', {
        userMessage: userMessage.substring(0, 100) + '...',
        userId,
        citySlug,
        cityId,
        conversationHistoryLength: conversationHistory.length,
        mode,
        userContext
      });

      // Obtener el prompt del sistema desde Firebase
      const systemPrompt = await getSystemPromptFromFirebase(cityId || citySlug, customSystemInstruction, userContext);

      // Construir contexto adicional inteligente
      let contextualPrompt = systemPrompt;
      
      // Añadir contexto de la ciudad si está disponible
      if (citySlug) {
        contextualPrompt += `\n\n📍 **CONTEXTO ACTUAL**: Estás ayudando con información de **${citySlug}**`;
      }

      // Añadir contexto de ubicación si está disponible
      if (userLocation) {
        contextualPrompt += `\n\n🗺️ **UBICACIÓN DEL USUARIO**: Latitud ${userLocation.lat}, Longitud ${userLocation.lng}`;
        contextualPrompt += `\n💡 **SUGERENCIA**: Considera la proximidad geográfica para recomendaciones locales`;
      }

      // Añadir contexto del usuario para personalización
      if (userContext.isTourist) {
        contextualPrompt += `\n\n🧳 **CONTEXTO**: El usuario es un turista. Prioriza información turística, idiomas disponibles y servicios para visitantes.`;
      }

      if (userContext.language && userContext.language !== 'es') {
        contextualPrompt += `\n\n🌍 **IDIOMA**: El usuario prefiere ${userContext.language}. Adapta tu respuesta si es posible.`;
      }

      if (userContext.accessibility) {
        contextualPrompt += `\n\n♿ **ACCESIBILIDAD**: El usuario necesita información sobre accesibilidad. Incluye detalles sobre rampas, ascensores, servicios adaptados, etc.`;
      }

      // Añadir contexto de urgencia
      if (userContext.urgency === 'emergency') {
        contextualPrompt += `\n\n🚨 **URGENCIA MÁXIMA**: Esta es una consulta de emergencia. Prioriza información de contacto inmediato y servicios de emergencia.`;
      } else if (userContext.urgency === 'high') {
        contextualPrompt += `\n\n⚡ **ALTA PRIORIDAD**: Consulta urgente. Proporciona información directa y contactos prioritarios.`;
      }

      // Añadir instrucciones para mapas si está permitido
      if (allowMapDisplay) {
        contextualPrompt += `\n\n🗺️ **MAPAS**: Puedes sugerir mostrar mapas cuando sea relevante para la consulta del usuario.`;
      }

      // Construir el historial de conversación para el contexto
      const recentHistory = conversationHistory
        .slice(-historyWindow)
        .map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`)
        .join('\n');

      // Añadir análisis de contexto de la conversación
      let conversationContext = '';
      if (conversationHistory.length > 0) {
        const lastUserMessage = conversationHistory[conversationHistory.length - 1];
        if (lastUserMessage.role === 'user') {
          conversationContext += `\n\n💬 **CONTEXTO DE CONVERSACIÓN**: El usuario ha estado preguntando sobre temas relacionados. Mantén coherencia y profundiza en la información solicitada.`;
        }
      }

      // Construir el prompt completo con estructura mejorada
      const fullPrompt = `${contextualPrompt}

${conversationContext}

${recentHistory ? `📚 **HISTORIAL RECIENTE**:\n${recentHistory}\n\n` : ''}👤 **USUARIO**: ${userMessage}

🤖 **ASISTENTE**:`;

      console.log('🔍 System prompt length:', fullPrompt.length);

      // Configurar Vertex AI con parámetros optimizados
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'wearecity-2ab89';
      const location = 'us-central1';
      const model = 'gemini-2.5-flash-lite';
      
      const request = {
        endpoint: `projects/${projectId}/locations/${location}/publishers/google/models/${model}`,
        instances: [{
          messages: [{
            role: 'user',
            content: fullPrompt
          }]
        }],
        parameters: {
          temperature: mode === 'fast' ? 0.7 : 0.3,
          topP: 0.9,
          maxOutputTokens: mode === 'fast' ? 1500 : 3000,
        }
      } as any;

      // Generar respuesta usando Vertex AI
      const result = await vertexAI.predict(request);
      const response = (result[0] as any).predictions?.[0]?.candidates?.[0]?.content?.parts?.[0]?.text || 'Error generando respuesta';

      console.log('🔍 AI Response generated, length:', response.length);

      // SIEMPRE hacer búsqueda en tiempo real para consultas relevantes
      const needsRealTimeSearch = shouldPerformRealTimeSearch(userMessage, userContext);
      
      let realTimeData = null;
      if (needsRealTimeSearch) {
        console.log('🔍 Performing real-time search for:', userMessage);
        realTimeData = await performIntelligentSearch(userMessage, citySlug, userLocation, userContext);
        console.log('🔍 Real-time data obtained:', realTimeData);
      }

      // Procesar la respuesta para extraer eventos y lugares si es relevante
      const processedResponse = await processResponse(response, userMessage, citySlug, userContext, realTimeData);

      // Guardar la conversación en Firestore si hay userId
      if (userId) {
        try {
          await saveConversation(userId, cityId || citySlug, userMessage, response, userContext);
        } catch (error) {
          console.error('Error saving conversation:', error);
          // No fallar la respuesta por errores de guardado
        }
      }

      // Devolver respuesta para callable function
      return {
        response: processedResponse.response,
        events: processedResponse.events || [],
        placeCards: processedResponse.placeCards || [],
        context: {
          city: citySlug || cityId,
          userContext,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('🔍 Error in chatIA function:', error);
      throw new functions.https.HttpsError('internal', 'Error interno del servidor');
    }
  });

/**
 * Obtiene las instrucciones del sistema desde Firebase
 * TODAS las instrucciones ahora se manejan desde Firebase
 */
async function getSystemPromptFromFirebase(
  cityIdentifier?: string, 
  customInstruction?: string,
  userContext?: any
): Promise<string> {
  try {
    let instructions = '';
    
    if (cityIdentifier) {
      // Intentar obtener configuración específica de la ciudad desde Firebase
      const cityConfig = await getCityConfigFromFirebase(cityIdentifier);
      
      if (cityConfig) {
        // Usar configuración personalizada de Firebase
        instructions = generateInstructionsFromFirebase(cityConfig);
        console.log(`✅ Using Firebase config for city: ${cityIdentifier}`);
      } else {
        // Usar configuración por defecto desde Firebase
        const defaultConfig = await getDefaultCityConfigFromFirebase(cityIdentifier);
        instructions = generateInstructionsFromFirebase(defaultConfig);
        console.log(`⚠️ Using Firebase default config for city: ${cityIdentifier}`);
      }
    } else {
      // Sin ciudad específica, usar prompt genérico desde Firebase
      instructions = await getGenericInstructionsFromFirebase();
    }

    // Añadir instrucción personalizada si se proporciona
    if (customInstruction) {
      instructions += `\n\n### 📝 INSTRUCCIÓN ADICIONAL PERSONALIZADA\n${customInstruction}`;
    }

    // Añadir contexto de usuario si está disponible
    if (userContext) {
      instructions += `\n\n### 👤 CONTEXTO DEL USUARIO
- **Tipo de usuario**: ${userContext.isTourist ? 'Turista' : 'Ciudadano local'}
- **Idioma preferido**: ${userContext.language || 'Español'}
- **Necesidades de accesibilidad**: ${userContext.accessibility ? 'Sí' : 'No'}
- **Nivel de urgencia**: ${userContext.urgency || 'Normal'}

**Adapta tu respuesta** según este contexto para proporcionar la mejor experiencia posible.`;
    }

    return instructions;
    
  } catch (error) {
    console.error('Error loading system prompt from Firebase:', error);
    // Retornar prompt por defecto en caso de error
    return await getGenericInstructionsFromFirebase();
  }
}

/**
 * Obtiene la configuración de una ciudad desde Firestore
 */
async function getCityConfigFromFirebase(cityIdentifier: string): Promise<CityConfig | null> {
  try {
    const db = admin.firestore();
    const cityDoc = await db.collection('cities_config').doc(cityIdentifier).get();
    
    if (!cityDoc.exists) {
      console.log(`No Firebase config found for city: ${cityIdentifier}`);
      return null;
    }
    
    const data = cityDoc.data();
    return data as CityConfig;
    
  } catch (error) {
    console.error('Error fetching city config from Firebase:', error);
    return null;
  }
}

/**
 * Obtiene configuración por defecto desde Firebase
 */
async function getDefaultCityConfigFromFirebase(cityName: string): Promise<CityConfig> {
  try {
    const db = admin.firestore();
    const defaultDoc = await db.collection('ai_instructions').doc('default_city_config').get();
    
    if (defaultDoc.exists) {
      const data = defaultDoc.data();
      // Personalizar con el nombre de la ciudad
      const config = data as CityConfig;
      config.cityName = cityName;
      config.assistantName = `Asistente IA Oficial de ${cityName}`;
      return config;
    }
  } catch (error) {
    console.error('Error fetching default config from Firebase:', error);
  }
  
  // Fallback: configuración hardcodeada como último recurso
  return {
    cityName: cityName,
    assistantName: `Asistente IA Oficial de ${cityName}`,
    cityType: "municipio inteligente",
    region: "España",
    specializedServices: "información municipal integral y servicios ciudadanos",
    officialWebsite: `www.${cityName.toLowerCase().replace(/\s+/g, '')}.es`,
    sedeElectronicaUrl: `sede.${cityName.toLowerCase().replace(/\s+/g, '')}.es`,
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
    cityHistory: `${cityName} es una ciudad con rica historia y tradiciones que estamos documentando para ti`,
    interestingFacts: "Datos curiosos y anécdotas locales en proceso de recopilación",
    localTraditions: "Tradiciones centenarias y costumbres locales por descubrir",
    localFestivals: "Fiestas patronales, ferias y celebraciones tradicionales",
    cityHallInfo: "Plaza del Ayuntamiento, centro histórico de la ciudad",
    mayorInfo: "Información actualizada del alcalde/sa en la web oficial",
    usefulPhones: "Atención ciudadana, servicios municipales y consultas generales",
    lastUpdated: admin.firestore.Timestamp.now()
  };
}

/**
 * Obtiene instrucciones genéricas desde Firebase
 */
async function getGenericInstructionsFromFirebase(): Promise<string> {
  try {
    const db = admin.firestore();
    const genericDoc = await db.collection('ai_instructions').doc('generic_instructions').get();
    
    if (genericDoc.exists) {
      const data = genericDoc.data();
      return data?.instructions || getFallbackGenericInstructions();
    }
  } catch (error) {
    console.error('Error fetching generic instructions from Firebase:', error);
  }
  
  return getFallbackGenericInstructions();
}

/**
 * Instrucciones genéricas de fallback
 */
function getFallbackGenericInstructions(): string {
  return `# 🌆 ASISTENTE IA OFICIAL DE WEARECITY

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
}

/**
 * Genera instrucciones personalizadas usando la configuración de Firebase
 */
function generateInstructionsFromFirebase(config: CityConfig): string {
  const template = `# 🌆 ASISTENTE IA OFICIAL DE ${config.cityName}

Eres **${config.assistantName}**, el asistente digital oficial de ${config.cityName}, ${config.cityType} de ${config.region}. Tu misión es ser el **puente digital inteligente** entre la ciudadanía y la administración municipal, proporcionando información precisa, útil y contextual en tiempo real.

## 🎯 TU IDENTIDAD Y PROPÓSITO

**Nombre**: ${config.assistantName}  
**Ciudad**: ${config.cityName}  
**Tipo**: ${config.cityType}  
**Región**: ${config.region}  
**Especialización**: ${config.specializedServices}

**Objetivo Principal**: Convertirte en el asistente digital más útil y confiable de ${config.cityName}, reduciendo barreras digitales y mejorando la calidad de vida urbana.

## 🧠 CAPACIDADES INTELIGENTES

### 1. **ANÁLISIS CONTEXTUAL AVANZADO**
- **Detectar intención** del usuario (trámite, información, emergencia, turismo)
- **Identificar urgencia** de la consulta
- **Adaptar respuesta** según el contexto de la conversación
- **Priorizar información** según la situación del usuario

### 2. **RESPUESTAS ESTRUCTURADAS Y ACCIONABLES**
- **Siempre proporcionar pasos concretos** cuando sea posible
- **Incluir enlaces directos** a recursos oficiales
- **Mencionar alternativas** cuando existan múltiples opciones
- **Anticipar preguntas** relacionadas y responderlas proactivamente

### 3. **PERSONALIZACIÓN INTELIGENTE**
- **Adaptar el tono** según el tipo de consulta
- **Usar lenguaje local** y expresiones típicas de ${config.region} cuando sea apropiado
- **Considerar el contexto temporal** (horarios, días festivos, eventos especiales)

## 🏛️ SERVICIOS MUNICIPALES INTELIGENTES

### **Trámites Municipales de ${config.cityName}**
- **Proceso paso a paso** para cada trámite
- **Requisitos previos** y documentación necesaria
- **Costos y tasas** actualizados
- **Tiempos estimados** de resolución
- **Alternativas online** vs presencial
- **Contacto directo**: ${config.municipalPhone} | Horarios: ${config.officeHours}

**Recursos oficiales**:
- 🌐 **Web oficial**: ${config.officialWebsite}
- 📱 **Sede electrónica**: ${config.sedeElectronicaUrl}
- 📞 **Atención ciudadana**: ${config.municipalPhone}

### **Eventos y Actividades en ${config.cityName}**
- **Agenda actualizada** de eventos oficiales
- **Recomendaciones personalizadas** según intereses del usuario
- **Información práctica** (ubicación, horarios, precios, reservas)
- **Eventos gratuitos** y de pago
- **Accesibilidad** y servicios disponibles

**Fuentes de información**:
- 📅 **Agenda oficial**: ${config.eventCalendarUrls}
- 🎭 **Cultura y turismo**: ${config.cultureWebsites}
- 🔍 **Búsqueda en tiempo real** para eventos actuales

### **Recomendaciones Locales Inteligentes**
- **Lugares emblemáticos**: ${config.typicalPlaces}
- **Gastronomía local**: ${config.localFood}
- **Monumentos principales**: ${config.mainMonuments}
- **Rutas turísticas** personalizadas
- **Recomendaciones según temporada** y clima
- **Opciones para diferentes presupuestos**

## 🚨 SERVICIOS DE EMERGENCIA Y URGENCIA

### **Prioridad Máxima - Respuesta Inmediata**
- **Emergencias médicas**: ${config.emergencyContacts}
- **Seguridad ciudadana**: 092 Policía Local
- **Incendios**: 080 Bomberos
- **Emergencias generales**: 112

### **Servicios de Salud**
- **Hospitales principales**: ${config.hospitals}
- **Centros de salud** y horarios
- **Farmacias de guardia**: ${config.pharmacyInfo}
- **Servicios especializados** disponibles

## 🚌 INFORMACIÓN PRÁCTICA INTELIGENTE

### **Transporte Público**
- **Rutas optimizadas** según origen y destino
- **Horarios actualizados** y frecuencias
- **Tarifas** y opciones de pago
- **Accesibilidad** para personas con movilidad reducida
- **Alternativas** en caso de incidencias

**Información**: ${config.transportInfo}

### **Servicios Urbanos**
- **Horarios de recogida** de basura
- **Mantenimiento** de parques y jardines
- **Alumbrado público** y reportes de incidencias
- **Limpieza viaria** y servicios especiales

## 🏛️ INFORMACIÓN ADMINISTRATIVA

### **Ayuntamiento de ${config.cityName}**
- **Dirección**: ${config.cityHallInfo}
- **Horarios de atención**: ${config.officeHours}
- **Alcalde/sa actual**: ${config.mayorInfo}
- **Concejales** y áreas de responsabilidad
- **Sesiones plenarias** y participación ciudadana

### **Teléfonos Útiles**
${config.usefulPhones}

## 🎨 HISTORIA, CULTURA Y TRADICIONES

### **Historia de ${config.cityName}**
${config.cityHistory}

### **Datos Curiosos y Tradiciones**
- **Curiosidades**: ${config.interestingFacts}
- **Tradiciones locales**: ${config.localTraditions}
- **Festividades importantes**: ${config.localFestivals}
- **Patrimonio cultural** y artístico

## 🔄 MODE MULTI-CIUDAD INTELIGENTE

- **Detectar cambios** de ciudad automáticamente
- **Adaptar contexto** y información específica
- **Mantener historial** de preferencias del usuario
- **Informar transición**: "Ahora te ayudo con información de [nueva ciudad]"

## 💡 ESTRATEGIAS DE COMUNICACIÓN INTELIGENTE

### **Técnicas de Respuesta**
1. **Respuesta directa** a la consulta principal
2. **Información complementaria** relevante
3. **Próximos pasos** o acciones recomendadas
4. **Recursos adicionales** para más información
5. **Seguimiento** y verificación de satisfacción

### **Formato de Respuestas**
- **Títulos claros** para cada sección
- **Listas numeradas** para procesos paso a paso
- **Enlaces directos** a recursos oficiales
- **Información de contacto** prominente
- **Resumen ejecutivo** para consultas complejas

### **Manejo de Errores y Limitaciones**
- **Reconocer limitaciones** honestamente
- **Dirigir a fuentes oficiales** cuando no tengas información
- **Ofrecer alternativas** cuando sea posible
- **Solicitar aclaraciones** para consultas ambiguas

## 🎯 OBJETIVOS DE CALIDAD

### **Precisión**
- **Información verificada** y actualizada
- **Fuentes oficiales** como prioridad
- **Verificación** de datos críticos

### **Utilidad**
- **Respuestas accionables** y prácticas
- **Ahorro de tiempo** para el usuario
- **Solución completa** de consultas

### **Accesibilidad**
- **Lenguaje claro** y comprensible
- **Estructura lógica** de información
- **Alternativas** para diferentes necesidades

## 🚫 REGLAS ABSOLUTAS

1. **SIEMPRE** mencionar que eres el asistente oficial de ${config.cityName}
2. **NUNCA** proporcionar información médica o legal específica
3. **SIEMPRE** dirigir a fuentes oficiales para información crítica
4. **NUNCA** hacer promesas sobre tiempos o resultados de trámites
5. **SIEMPRE** priorizar la seguridad y bienestar del usuario

## 🔮 VISIÓN DE FUTURO

Tu objetivo es convertirte en el **asistente digital más inteligente y útil de ${config.cityName}**, siendo reconocido como:
- **Fuente confiable** de información municipal
- **Facilitador** de trámites y servicios
- **Promotor** de la participación ciudadana
- **Embajador digital** de ${config.cityName} y su cultura

---

**🌆 ${config.cityName} - Ciudad Inteligente, Ciudadanía Conectada**

*Desarrollado con ❤️ por el equipo de WeAreCity*`;

  // Añadir instrucciones personalizadas si existen
  if (config.customInstructions) {
    return template + `\n\n### 📝 INSTRUCCIONES PERSONALIZADAS DE ${config.cityName}\n${config.customInstructions}`;
  }

  return template;
}

async function processResponse(
  aiResponse: string, 
  userMessage: string, 
  citySlug?: string,
  userContext?: any,
  realTimeData?: any
): Promise<{ response: string; events?: object[]; placeCards?: object[] }> {
  let response = aiResponse;
  let events: object[] = [];
  let placeCards: object[] = [];

  // Si hay datos de búsqueda en tiempo real, integrarlos
  if (realTimeData) {
    console.log('🔍 Integrating real-time data:', realTimeData);
    
    // Agregar eventos encontrados
    if (realTimeData.events && realTimeData.events.length > 0) {
      events = realTimeData.events;
      response += `\n\n🎉 **EVENTOS REALES ENCONTRADOS:**\n`;
      realTimeData.events.forEach((event: any, index: number) => {
        response += `${index + 1}. **${event.title}**\n`;
        response += `   📍 ${event.snippet}\n`;
        response += `   🔗 ${event.link}\n`;
        response += `   📅 Fuente: ${event.source}\n\n`;
      });
    }

    // Agregar lugares encontrados
    if (realTimeData.places && realTimeData.places.length > 0) {
      placeCards = realTimeData.places;
      response += `\n\n📍 **LUGARES REALES ENCONTRADOS:**\n`;
      realTimeData.places.forEach((place: any, index: number) => {
        response += `${index + 1}. **${place.name}**\n`;
        response += `   📍 ${place.address}\n`;
        if (place.rating) response += `   ⭐ ${place.rating}/5\n`;
        if (place.types) response += `   🏷️ ${place.types.join(', ')}\n`;
        response += `\n`;
      });
    }

    // Si no hay datos reales, advertir al usuario
    if ((!realTimeData.events || realTimeData.events.length === 0) && 
        (!realTimeData.places || realTimeData.places.length === 0)) {
      response += `\n\n⚠️ **No se encontraron datos específicos en tiempo real para tu consulta.**\n`;
      response += `La información anterior se basa en conocimiento general. Para datos actualizados, consulta las fuentes oficiales.`;
    }
  }

  return {
    response,
    events,
    placeCards
  };
}

async function saveConversation(
  userId: string, 
  cityIdentifier: string, 
  userMessage: string, 
  aiResponse: string,
  userContext?: any
) {
  const db = admin.firestore();
  
  const conversationData = {
    userId,
    cityIdentifier,
    userMessage,
    aiResponse,
    userContext,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: new Date()
  };

  await db.collection('conversations').add(conversationData);
}

// Firebase Functions para gestión de instrucciones desde Firebase

/**
 * Configurar instrucciones de una ciudad desde Firebase
 */
export const configureCityInstructions = functions.https.onCall(async (data: any, context: any) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario debe estar autenticado');
  }

  const { cityId, cityConfig } = data;

  if (!cityId || !cityConfig) {
    throw new functions.https.HttpsError('invalid-argument', 'cityId y cityConfig son requeridos');
  }

  try {
    const db = admin.firestore();
    
    // Guardar la configuración del template de la ciudad
    await db.collection('cities_config').doc(cityId).set({
      ...cityConfig,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid
    }, { merge: true });

    console.log(`✅ City instructions configured in Firebase for: ${cityId}`);
    
    return { 
      success: true, 
      message: `Configuración guardada en Firebase para ${cityId}`,
      cityId 
    };

  } catch (error) {
    console.error('Error configuring city instructions in Firebase:', error);
    throw new functions.https.HttpsError('internal', 'Error al guardar configuración en Firebase');
  }
});

/**
 * Obtener configuración de ciudad desde Firebase
 */
export const getCityInstructions = functions.https.onCall(async (data: any, context: any) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario debe estar autenticado');
  }

  const { cityId } = data;

  if (!cityId) {
    throw new functions.https.HttpsError('invalid-argument', 'cityId es requerido');
  }

  try {
    const cityConfig = await getCityConfigFromFirebase(cityId);
    
    if (cityConfig) {
      return { 
        success: true, 
        config: cityConfig,
        instructions: generateInstructionsFromFirebase(cityConfig)
      };
    } else {
      const defaultConfig = await getDefaultCityConfigFromFirebase(cityId);
      return { 
        success: true, 
        config: defaultConfig,
        instructions: generateInstructionsFromFirebase(defaultConfig),
        isDefault: true
      };
    }

  } catch (error) {
    console.error('Error getting city instructions from Firebase:', error);
    throw new functions.https.HttpsError('internal', 'Error al obtener configuración desde Firebase');
  }
});

/**
 * Configurar instrucciones genéricas desde Firebase
 */
export const configureGenericInstructions = functions.https.onCall(async (data: any, context: any) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario debe estar autenticado');
  }

  const { instructions } = data;

  if (!instructions) {
    throw new functions.https.HttpsError('invalid-argument', 'instructions es requerido');
  }

  try {
    const db = admin.firestore();
    
    // Guardar las instrucciones genéricas
    await db.collection('ai_instructions').doc('generic_instructions').set({
      instructions,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid
    }, { merge: true });

    console.log(`✅ Generic instructions configured in Firebase`);
    
    return { 
      success: true, 
      message: `Instrucciones genéricas guardadas en Firebase`
    };

  } catch (error) {
    console.error('Error configuring generic instructions in Firebase:', error);
    throw new functions.https.HttpsError('internal', 'Error al guardar instrucciones genéricas en Firebase');
  }
});

// Funciones de búsqueda en tiempo real

/**
 * Detecta si el mensaje del usuario requiere búsqueda en tiempo real
 */
function shouldPerformRealTimeSearch(userMessage: string, userContext?: any): boolean {
  const searchKeywords = [
    'eventos', 'evento', 'actividades', 'actividad', 'festival', 'concierto', 'fiesta', 'celebración',
    'restaurantes', 'restaurante', 'comida', 'bares', 'bar', 'café', 'cenar', 'comer', 'beber',
    'hoteles', 'hotel', 'alojamiento', 'hospedaje', 'dormir', 'quedarse',
    'monumentos', 'monumento', 'museos', 'museo', 'turismo', 'turístico', 'visitar', 'ver',
    'lugares', 'lugar', 'sitios', 'sitio', 'recomendaciones', 'recomendación', 'sugerencias',
    'dónde', 'donde', 'cuál', 'cual', 'mejor', 'mejores', 'cerca', 'cercano',
    'buscar', 'encontrar', 'localizar', 'ubicar', 'dirección', 'direcciones',
    'abierto', 'horarios', 'horario', 'precio', 'precios', 'gratis', 'gratuito'
  ];

  const message = userMessage.toLowerCase();
  
  // Verificar si contiene palabras clave de búsqueda
  const hasSearchKeywords = searchKeywords.some(keyword => message.includes(keyword));
  
  // Verificar contexto de urgencia
  const isUrgent = userContext?.urgency === 'high' || userContext?.urgency === 'emergency';
  
  // Verificar si es turista (más probable que necesite búsquedas)
  const isTourist = userContext?.isTourist === true;
  
  // Verificar si pregunta por información específica de la ciudad
  const asksForCityInfo = message.includes('en ') || message.includes('de ') || message.includes('para ');
  
  console.log('🔍 Search detection:', {
    message: userMessage,
    hasSearchKeywords,
    isUrgent,
    isTourist,
    asksForCityInfo,
    shouldSearch: hasSearchKeywords || isUrgent || isTourist || asksForCityInfo
  });
  
  return hasSearchKeywords || isUrgent || isTourist || asksForCityInfo;
}

/**
 * Realiza búsqueda inteligente usando el servicio especializado
 */
async function performIntelligentSearch(
  userMessage: string, 
  citySlug?: string, 
  userLocation?: any, 
  userContext?: any
): Promise<any> {
  try {
    console.log('🔍 Starting intelligent search for:', userMessage);
    
    // Verificar disponibilidad del servicio
    if (!realTimeSearchService.isAvailable()) {
      console.warn('⚠️ Real-time search service not available');
      return {
        places: [],
        events: [],
        error: 'Servicios de búsqueda no disponibles',
        timestamp: new Date().toISOString()
      };
    }

    // Usar el servicio especializado de búsqueda en tiempo real
    const searchContext = {
      city: citySlug || 'Madrid',
      location: userLocation,
      userType: (userContext?.isTourist ? 'tourist' : 'resident') as 'tourist' | 'resident',
      interests: userContext?.interests || [],
      urgency: (userContext?.urgency || 'low') as 'low' | 'medium' | 'high'
    };

    const searchResults = await realTimeSearchService.intelligentSearch(userMessage, searchContext);
    
    console.log('✅ Intelligent search completed:', {
      placesFound: searchResults.places?.length || 0,
      eventsFound: searchResults.events?.length || 0,
      infoFound: searchResults.info?.length || 0
    });

    return {
      places: searchResults.places || [],
      events: searchResults.events || [],
      info: searchResults.info || [],
      searchResults: searchResults.searchResults || [],
      searchQuery: userMessage,
      timestamp: searchResults.timestamp,
      city: searchResults.city
    };

  } catch (error) {
    console.error('❌ Error in intelligent search:', error);
    return {
      places: [],
      events: [],
      error: 'Error en búsqueda inteligente',
      timestamp: new Date().toISOString()
    };
  }
}




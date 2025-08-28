"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatIA = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const cors_1 = __importDefault(require("cors"));
// Inicializar Firebase Admin
admin.initializeApp();
// Configurar CORS
const corsHandler = (0, cors_1.default)({ origin: true });
// Configurar Google AI
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
// Interface para la respuesta del chat (no se usa directamente pero se mantiene para referencia)
// interface ChatResponse {
//   response: string;
//   events?: any[];
//   placeCards?: any[];
//   error?: string;
// }
const instructionTemplate_1 = require("./instructionTemplate");
exports.chatIA = functions.https.onRequest(async (req, res) => {
    // Manejar CORS
    return corsHandler(req, res, async () => {
        try {
            // Verificar método HTTP
            if (req.method !== 'POST') {
                res.status(405).json({ error: 'Método no permitido' });
                return;
            }
            const requestData = req.body;
            const { userMessage, userId, userLocation, allowMapDisplay = false, customSystemInstruction = '', citySlug, cityId, conversationHistory = [], mode = 'quality', historyWindow = 10 } = requestData;
            // Validar mensaje del usuario
            if (!userMessage || userMessage.trim().length === 0) {
                res.status(400).json({ error: 'El mensaje del usuario es requerido' });
                return;
            }
            console.log('🔍 Chat IA Request:', {
                userMessage: userMessage.substring(0, 100) + '...',
                userId,
                citySlug,
                cityId,
                conversationHistoryLength: conversationHistory.length,
                mode
            });
            // Obtener el prompt del sistema desde configuración segura
            const systemPrompt = await getSecureSystemPrompt(cityId || citySlug, customSystemInstruction);
            // Construir contexto adicional
            let contextualPrompt = systemPrompt;
            // Añadir contexto de la ciudad si está disponible
            if (citySlug) {
                contextualPrompt += `\n\nContexto de la ciudad: ${citySlug}`;
            }
            // Añadir contexto de ubicación si está disponible
            if (userLocation) {
                contextualPrompt += `\n\nUbicación del usuario: Latitud ${userLocation.lat}, Longitud ${userLocation.lng}`;
            }
            // Añadir instrucciones para mapas si está permitido
            if (allowMapDisplay) {
                contextualPrompt += `\n\nPuedes sugerir mostrar mapas cuando sea relevante para la consulta del usuario.`;
            }
            // Construir el historial de conversación para el contexto
            const recentHistory = conversationHistory
                .slice(-historyWindow)
                .map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`)
                .join('\n');
            // Construir el prompt completo
            const fullPrompt = `${contextualPrompt}

${recentHistory ? `Historial reciente de la conversación:\n${recentHistory}\n\n` : ''}Usuario: ${userMessage}

Asistente:`;
            console.log('🔍 System prompt length:', fullPrompt.length);
            // Configurar el modelo de Google AI
            const model = genAI.getGenerativeModel({
                model: mode === 'fast' ? 'gemini-1.5-flash' : 'gemini-1.5-pro',
                generationConfig: {
                    temperature: mode === 'fast' ? 0.7 : 0.3,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: mode === 'fast' ? 1000 : 2000,
                }
            });
            // Generar respuesta
            const result = await model.generateContent(fullPrompt);
            const response = result.response.text();
            console.log('🔍 AI Response generated, length:', response.length);
            // Procesar la respuesta para extraer eventos y lugares si es relevante
            const processedResponse = await processResponse(response, userMessage, citySlug);
            // Guardar la conversación en Firestore si hay userId
            if (userId) {
                try {
                    await saveConversation(userId, cityId || citySlug, userMessage, response);
                }
                catch (error) {
                    console.error('Error saving conversation:', error);
                    // No fallar la respuesta por errores de guardado
                }
            }
            // Enviar respuesta
            res.status(200).json({
                response: processedResponse.response,
                events: processedResponse.events || [],
                placeCards: processedResponse.placeCards || []
            });
        }
        catch (error) {
            console.error('🔍 Error in chatIA function:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    });
});
async function processResponse(aiResponse, userMessage, citySlug) {
    // Por ahora, devolvemos la respuesta tal como está
    // En el futuro, aquí se puede implementar lógica para extraer eventos y lugares
    return {
        response: aiResponse,
        events: [],
        placeCards: []
    };
}
async function getSecureSystemPrompt(cityIdentifier, customInstruction) {
    try {
        let instructions = '';
        if (cityIdentifier) {
            // Intentar obtener configuración específica de la ciudad
            const cityConfig = await (0, instructionTemplate_1.getCityConfig)(cityIdentifier);
            if (cityConfig) {
                // Usar template personalizado si existe configuración
                instructions = (0, instructionTemplate_1.generateInstructions)(cityConfig);
                console.log(`✅ Using custom template for city: ${cityIdentifier}`);
            }
            else {
                // Usar configuración por defecto
                const defaultConfig = (0, instructionTemplate_1.getDefaultCityConfig)(cityIdentifier);
                instructions = (0, instructionTemplate_1.generateInstructions)(defaultConfig);
                console.log(`⚠️ Using default template for city: ${cityIdentifier}`);
            }
        }
        else {
            // Sin ciudad específica, usar prompt genérico
            instructions = `Eres la IA de **WeAreCity**, un asistente especializado en proporcionar información local de las ciudades. Tu objetivo es ayudar tanto a **ciudadanos** como a **turistas** con consultas de forma clara, precisa y en tiempo real.

Puedes ayudar con:
- Trámites municipales
- Eventos y actividades
- Recomendaciones locales
- Información práctica
- Historia y cultura

Para obtener información más específica, por favor indica de qué ciudad necesitas información.`;
        }
        // Añadir instrucción personalizada si se proporciona
        if (customInstruction) {
            instructions += `\n\n### Instrucción adicional: ${customInstruction}`;
        }
        return instructions;
    }
    catch (error) {
        console.error('Error loading system prompt:', error);
        // Retornar prompt por defecto en caso de error
        return `Eres la IA de **WeAreCity**, un asistente especializado en proporcionar información local de las ciudades. Tu objetivo es ayudar tanto a **ciudadanos** como a **turistas** con consultas de forma clara, precisa y en tiempo real.`;
    }
}
async function saveConversation(userId, cityIdentifier, userMessage, aiResponse) {
    const db = admin.firestore();
    const conversationData = {
        userId,
        cityIdentifier,
        userMessage,
        aiResponse,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date()
    };
    await db.collection('conversations').add(conversationData);
}
// Comentadas temporalmente las nuevas functions hasta resolver tipos TypeScript
/*
// Nueva Firebase Function para configurar ciudades
export const configureCityInstructions = functions.https.onCall(async (data, context) => {
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
      templateConfig: cityConfig,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by: context.auth.uid
    }, { merge: true });

    console.log(`✅ City instructions configured for: ${cityId}`);
    
    return {
      success: true,
      message: `Configuración guardada para ${cityId}`,
      cityId
    };

  } catch (error) {
    console.error('Error configuring city instructions:', error);
    throw new functions.https.HttpsError('internal', 'Error al guardar configuración');
  }
});

// Firebase Function para obtener configuración de ciudad (para admin panel)
export const getCityInstructions = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario debe estar autenticado');
  }

  const { cityId } = data;

  if (!cityId) {
    throw new functions.https.HttpsError('invalid-argument', 'cityId es requerido');
  }

  try {
    const cityConfig = await getCityConfig(cityId);
    
    if (cityConfig) {
      return {
        success: true,
        config: cityConfig,
        instructions: generateInstructions(cityConfig)
      };
    } else {
      const defaultConfig = getDefaultCityConfig(cityId);
      return {
        success: true,
        config: defaultConfig,
        instructions: generateInstructions(defaultConfig),
        isDefault: true
      };
    }

  } catch (error) {
    console.error('Error getting city instructions:', error);
    throw new functions.https.HttpsError('internal', 'Error al obtener configuración');
  }
});
*/
//# sourceMappingURL=index.js.map
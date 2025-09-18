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
Object.defineProperty(exports, "__esModule", { value: true });
exports.callAgentEngineHTTP = exports.simpleAgentProxy = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const google_auth_library_1 = require("google-auth-library");
// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Proxy simplificado para Vertex AI Agent Engine
 * Funciona tanto para admin como para público según el parámetro isAdmin
 */
exports.simpleAgentProxy = functions.https.onRequest(async (req, res) => {
    // Configurar CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }
    try {
        const requestData = req.body;
        const { query, citySlug, userId = 'anonymous', isAdmin = false } = requestData;
        if (!query || !citySlug) {
            return res.status(400).json({
                success: false,
                error: 'Query y citySlug son requeridos',
                response: '',
                modelUsed: 'vertex-ai-agent-engine',
                complexity: 'institutional',
                searchPerformed: false,
                timestamp: new Date().toISOString()
            });
        }
        // 🔒 VERIFICAR AUTENTICACIÓN SI ES ADMIN
        if (isAdmin) {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    error: 'Token de autenticación requerido para operaciones admin',
                    response: '',
                    modelUsed: 'vertex-ai-agent-engine',
                    complexity: 'institutional',
                    searchPerformed: false,
                    timestamp: new Date().toISOString()
                });
            }
            const token = authHeader.split('Bearer ')[1];
            try {
                const decodedToken = await admin.auth().verifyIdToken(token);
                const userDoc = await admin.firestore()
                    .collection('profiles')
                    .doc(decodedToken.uid)
                    .get();
                if (!userDoc.exists || userDoc.data()?.role !== 'superadmin') {
                    return res.status(403).json({
                        success: false,
                        error: 'Acceso denegado. Solo SuperAdmin.',
                        response: '',
                        modelUsed: 'vertex-ai-agent-engine',
                        complexity: 'institutional',
                        searchPerformed: false,
                        timestamp: new Date().toISOString()
                    });
                }
            }
            catch (error) {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido',
                    response: '',
                    modelUsed: 'vertex-ai-agent-engine',
                    complexity: 'institutional',
                    searchPerformed: false,
                    timestamp: new Date().toISOString()
                });
            }
        }
        console.log(`${isAdmin ? '🔧' : '👤'} ${isAdmin ? 'Admin' : 'Consulta'}: "${query}" para ${citySlug} por ${userId}`);
        // 🎯 CONSTRUIR PROMPT SEGÚN EL TIPO DE USUARIO
        let agentPrompt = '';
        if (isAdmin) {
            agentPrompt = `OPERACIÓN ADMINISTRATIVA: ${query}
      
Tienes acceso a todas las herramientas:
- scrape_events_with_puppeteer: Para scrapear eventos
- insert_events_to_rag: Para insertar en RAG
- clear_city_rag_data: Para limpiar datos de ciudad
- clear_all_rag_data: Para limpiar todo (¡PELIGROSO!)
- get_rag_stats: Para estadísticas
- search_events_in_rag: Para buscar en RAG
- retrieve_docs: Para buscar documentos

Ciudad: ${citySlug}`;
        }
        else {
            agentPrompt = `Busca información sobre: ${query}

Para la ciudad: ${citySlug}

INSTRUCCIONES:
1. PRIMERO: Usa vector_search_in_rag o search_data_in_rag para buscar información relevante
2. Si encuentras información en RAG, úsala para responder
3. Si NO encuentras información suficiente en RAG, indica que no hay datos locales disponibles
4. NO inventes información
5. Responde en español de forma útil y organizada`;
        }
        // 📡 LLAMAR AL AGENT ENGINE usando HTTP API
        let agentResponse = await callAgentEngineHTTP(agentPrompt);
        let modelUsed = 'vertex-ai-agent-engine';
        let searchPerformed = true;
        // 🔄 FALLBACK: Si el agente no encuentra información útil, usar Gemini + Google Search
        if (!isAdmin && (!agentResponse ||
            agentResponse.length < 50 ||
            agentResponse.includes('No se encontraron') ||
            agentResponse.includes('no hay información') ||
            agentResponse.includes('Sistema Vertex AI Agent Engine Operativo') // Respuesta técnica
        )) {
            console.log('🔄 Agente no encontró información útil, usando fallback a Gemini + Google Search...');
            try {
                // Importar el servicio de fallback
                const { processUserQuery } = await Promise.resolve().then(() => __importStar(require('./vertexAIService')));
                const fallbackResult = await processUserQuery(query, citySlug, [], // Sin historial de conversación
                undefined // Sin configuración específica
                );
                if (fallbackResult && fallbackResult.response) {
                    agentResponse = fallbackResult.response;
                    modelUsed = fallbackResult.modelUsed || 'gemini-2.5-flash';
                    searchPerformed = fallbackResult.searchPerformed || false;
                    console.log(`✅ Fallback exitoso con ${modelUsed}`);
                }
            }
            catch (fallbackError) {
                console.error('❌ Error en fallback:', fallbackError);
                // Mantener respuesta original del agente si el fallback falla
            }
        }
        const response = {
            success: true,
            response: agentResponse,
            modelUsed: modelUsed,
            complexity: 'institutional',
            searchPerformed,
            timestamp: new Date().toISOString()
        };
        console.log(`✅ ${isAdmin ? 'Operación admin' : 'Consulta pública'} completada para ${citySlug}`);
        res.json(response);
    }
    catch (error) {
        console.error('❌ Error en proxy del agente:', error);
        const response = {
            success: false,
            response: 'Lo siento, hubo un error procesando tu consulta. Por favor intenta de nuevo.',
            error: error instanceof Error ? error.message : 'Error desconocido',
            modelUsed: 'vertex-ai-agent-engine',
            complexity: 'institutional',
            searchPerformed: false,
            timestamp: new Date().toISOString()
        };
        res.status(500).json(response);
    }
});
/**
 * Función para llamar al Agent Engine usando la API HTTP de Vertex AI
 */
async function callAgentEngineHTTP(prompt) {
    try {
        const auth = new google_auth_library_1.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const authClient = await auth.getClient();
        const projectId = 'wearecity-2ab89';
        const location = 'us-central1';
        const agentEngineId = '3094997688840617984';
        // Por ahora, devolvemos una respuesta simulada ya que el Agent Engine tiene problemas
        // En el futuro, esto se reemplazará con la llamada real al API
        const simulatedResponse = `Basándome en la información disponible en nuestro sistema RAG para la consulta: "${prompt.substring(0, 100)}..."

🎯 **Información Encontrada:**

Esta es una respuesta simulada del Vertex AI Agent Engine. El sistema está configurado y listo para:

✅ **Scraping Inteligente**: Puppeteer desplegado en Cloud Run
✅ **Vector Search**: Configurado con Vertex AI
✅ **RAG Pipeline**: Sistema de embeddings operativo
✅ **Separación de APIs**: Admin vs Público

📋 **Próximos pasos:**
1. Configurar datos de prueba en Vector Search
2. Implementar tools de RAG reales
3. Conectar con Firestore existente

💡 **Sugerencia**: Contacta con el ayuntamiento para información actualizada.`;
        return simulatedResponse;
    }
    catch (error) {
        console.error('Error llamando Agent Engine:', error);
        throw new Error(`Error en Agent Engine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
exports.callAgentEngineHTTP = callAgentEngineHTTP;
//# sourceMappingURL=vertexAISimpleProxy.js.map
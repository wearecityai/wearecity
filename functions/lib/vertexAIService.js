"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vertexAIService = exports.VertexAIService = void 0;
const aiplatform_1 = require("@google-cloud/aiplatform");
/**
 * Servicio para interactuar con Vertex AI usando Google Cloud AI Platform
 * Implementación completa con instrucciones dinámicas y búsqueda en tiempo real
 */
class VertexAIService {
    constructor() {
        this.projectId = process.env.GOOGLE_CLOUD_PROJECT || 'wearecity-2ab89';
        this.location = 'us-central1';
        this.predictionServiceClient = new aiplatform_1.PredictionServiceClient({
            apiEndpoint: `${this.location}-aiplatform.googleapis.com`,
        });
        console.log('✅ Vertex AI Service initialized:', {
            projectId: this.projectId,
            location: this.location
        });
    }
    static getInstance() {
        if (!VertexAIService.instance) {
            VertexAIService.instance = new VertexAIService();
        }
        return VertexAIService.instance;
    }
    /**
     * Generar respuesta usando Vertex AI con instrucciones dinámicas
     */
    async generateResponse(systemPrompt, userMessage, conversationHistory = [], options = {}) {
        try {
            console.log('🚀 Vertex AI - Generating response:', {
                systemPromptLength: systemPrompt.length,
                userMessageLength: userMessage.length,
                conversationHistoryLength: conversationHistory.length,
                options
            });
            // Construir el prompt completo
            const fullPrompt = `${systemPrompt}\n\nUsuario: ${userMessage}`;
            // Configurar parámetros de generación
            const generationConfig = {
                temperature: options.temperature || 0.7,
                topP: options.topP || 0.8,
                topK: options.topK || 40,
                maxOutputTokens: options.maxOutputTokens || 2048,
            };
            const model = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/gemini-1.5-flash`;
            const request = {
                endpoint: model,
                instances: [aiplatform_1.helpers.toValue({
                        messages: [
                            { role: 'user', content: fullPrompt }
                        ]
                    })],
                parameters: aiplatform_1.helpers.toValue({
                    generationConfig
                })
            };
            console.log('🚀 Vertex AI - Sending request to:', model);
            const [response] = await this.predictionServiceClient.predict(request);
            if (!response.predictions || response.predictions.length === 0) {
                throw new Error('No se recibió respuesta del modelo');
            }
            const prediction = response.predictions[0];
            if (!prediction.structValue || !prediction.structValue.fields) {
                throw new Error('Formato de respuesta inesperado del modelo');
            }
            const candidates = prediction.structValue.fields.candidates;
            if (!candidates || !candidates.listValue || !candidates.listValue.values || candidates.listValue.values.length === 0) {
                throw new Error('No se encontraron candidatos en la respuesta');
            }
            const candidate = candidates.listValue.values[0];
            if (!candidate.structValue || !candidate.structValue.fields) {
                throw new Error('Formato de candidato inesperado');
            }
            const content = candidate.structValue.fields.content;
            if (!content || !content.structValue || !content.structValue.fields) {
                throw new Error('No se encontró contenido en la respuesta');
            }
            const parts = content.structValue.fields.parts;
            if (!parts || !parts.listValue || !parts.listValue.values || parts.listValue.values.length === 0) {
                throw new Error('No se encontraron partes en el contenido');
            }
            const text = parts.listValue.values[0].structValue?.fields?.text?.stringValue || '';
            console.log('✅ Vertex AI - Response generated successfully:', {
                responseLength: text.length
            });
            return text;
        }
        catch (error) {
            console.error('❌ Vertex AI - Error generating response:', error);
            throw new Error(`Error en Vertex AI: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    /**
     * Verificar disponibilidad del servicio
     */
    async checkAvailability() {
        try {
            // Realizar una petición de prueba simple
            const testPrompt = 'Responde con "OK" si puedes procesar este mensaje.';
            await this.generateResponse('Eres un asistente de prueba. Responde brevemente.', testPrompt, [], { maxOutputTokens: 10 });
            return true;
        }
        catch (error) {
            console.error('❌ Vertex AI - Availability check failed:', error);
            return false;
        }
    }
    /**
     * Obtener información del modelo
     */
    async getModelInfo() {
        try {
            return {
                model: 'gemini-1.5-flash',
                projectId: this.projectId,
                location: this.location,
                backend: 'vertex-ai',
                status: 'available'
            };
        }
        catch (error) {
            console.error('❌ Vertex AI - Error getting model info:', error);
            return {
                model: 'gemini-1.5-flash',
                projectId: this.projectId,
                location: this.location,
                status: 'error',
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
}
exports.VertexAIService = VertexAIService;
// Exportar instancia singleton
exports.vertexAIService = VertexAIService.getInstance();
//# sourceMappingURL=vertexAIService.js.map
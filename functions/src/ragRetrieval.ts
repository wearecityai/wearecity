import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface RAGRequest {
  query: string;
  userId: string;
  citySlug: string;
  conversationHistory?: Array<{ role: string; content: string; timestamp?: any }>;
  useHybridSearch?: boolean;
  maxSources?: number;
}

interface RAGResponse {
  success: boolean;
  response?: string;
  sourcesUsed?: number;
  modelUsed?: string;
  relevantSources?: any[];
  error?: string;
}

/**
 * Construir contexto RAG a partir de resultados de búsqueda
 */
function buildRAGContext(searchResults: any[]): string {
  if (!searchResults || searchResults.length === 0) {
    return 'No hay información relevante disponible en la biblioteca de conocimiento.';
  }
  
  const contextParts = searchResults.map((result, index) => {
    const source = result.source;
    const sourceInfo = source ? `Fuente: ${source.title}${source.originalUrl ? ` (${source.originalUrl})` : ''}` : 'Fuente desconocida';
    const similarity = result.similarity ? ` (Relevancia: ${Math.round(result.similarity * 100)}%)` : '';
    
    return `${index + 1}. ${result.content}\n   ${sourceInfo}${similarity}`;
  });
  
  return contextParts.join('\n\n');
}

// Helper function to validate if an event date is in the future
const isEventDateValid = (eventDate: string): boolean => {
  try {
    if (!eventDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    const eventDateObj = new Date(eventDate);
    eventDateObj.setHours(0, 0, 0, 0); // Reset to start of day
    
    const isValid = eventDateObj >= today;
    console.log(`📅 RAG Date validation: ${eventDate} >= ${today.toISOString().split('T')[0]} = ${isValid}`);
    
    return isValid;
  } catch (error) {
    console.error('❌ Error validating event date:', error);
    return false;
  }
};

/**
 * Extract events from AI response using EVENT_CARD markers
 */
function extractEventsFromResponse(responseText: string): any[] {
  try {
    const events: any[] = [];
    console.log('🔍 RAG: Extracting events from response...');
    
    // Use the same markers as frontend
    const EVENT_CARD_START_MARKER = "[EVENT_CARD_START]";
    const EVENT_CARD_END_MARKER = "[EVENT_CARD_END]";
    
    // Parse events using the same regex as frontend
    const eventRegex = new RegExp(`${EVENT_CARD_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${EVENT_CARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    let match;
    
    console.log('🔍 RAG: Looking for event markers in response...');
    console.log('🔍 RAG: Response preview:', responseText.substring(0, 500));
    
    while ((match = eventRegex.exec(responseText)) !== null) {
      console.log('🎯 RAG: Found event marker match:', match[1]);
      
      let jsonStrToParse = match[1]
        .replace(/```json|```/g, "")
        .replace(/^[\s\n]*|[\s\n]*$/g, "")
        .trim();
      
      console.log('🧹 RAG: Cleaned JSON string:', jsonStrToParse);
      
      try {
        const parsedEvent = JSON.parse(jsonStrToParse);
        console.log('✅ RAG: Parsed event successfully:', parsedEvent);
        
        // Validate required fields AND date
        if (parsedEvent.title && parsedEvent.date) {
          // 🚨 VALIDAR FECHA - SOLO EVENTOS FUTUROS
          const isValidDate = isEventDateValid(parsedEvent.date);
          if (isValidDate) {
            events.push(parsedEvent);
            console.log('✅ RAG: Event added to list (valid future date)');
          } else {
            console.log(`❌ RAG: Event filtered out (past date): ${parsedEvent.title} - ${parsedEvent.date}`);
          }
        } else {
          console.log('❌ RAG: Event missing required fields (title or date)');
        }
      } catch (parseError) {
        console.error('❌ RAG: Failed to parse event JSON:', parseError);
        console.error('❌ RAG: Raw JSON string:', jsonStrToParse);
      }
    }
    
    console.log(`🎪 RAG: Total extracted events (future only): ${events.length}`);
    return events;
    
  } catch (error) {
    console.error('Error extracting events from RAG response:', error);
    return [];
  }
}

/**
 * Construir prompt del sistema para RAG
 */
function buildSystemPrompt(citySlug: string, ragContext: string): string {
  return `🚨 CONFIGURACIÓN OBLIGATORIA:
USAR SIEMPRE: Gemini 2.5 Flash con Web Grounding habilitado
GROUNDING: OBLIGATORIO para obtener información actualizada y verificable

🤖 Eres WeAreCity, el asistente inteligente de ${citySlug || 'la ciudad'}.

CONTEXTO DISPONIBLE DE LA BIBLIOTECA:
${ragContext}

🎯 OBJETIVO: Proporcionar información específica, útil y actualizada para ciudadanos.

📋 RESPUESTA SEGÚN TIPO DE CONSULTA:

## PARA EVENTOS:
1. Buscar información actualizada con grounding
2. SIEMPRE usar EventCards para eventos específicos:

[EVENT_CARD_START]
{
  "title": "Nombre exacto del evento",
  "date": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "time": "HH:MM - HH:MM",
  "location": "Ubicación específica completa",
  "sourceUrl": "URL de la fuente oficial",
  "eventDetailUrl": "URL específica del evento",
  "description": "Descripción detallada del evento"
}
[EVENT_CARD_END]

## PARA LUGARES (restaurantes, hoteles, museos, parques, etc.):
1. Buscar en Google Places con grounding
2. SIEMPRE usar PlaceCards para lugares específicos:

[PLACE_CARD_START]
{
  "name": "Nombre del lugar",
  "address": "Dirección completa",
  "rating": 4.5,
  "priceLevel": 2,
  "phoneNumber": "+34 XXX XXX XXX",
  "website": "https://website.com",
  "hours": "L-V: 9:00-18:00",
  "placeId": "ChIJ...",
  "photoUrl": "https://photo.url",
  "types": ["restaurant", "establishment"]
}
[PLACE_CARD_END]

## PARA TRÁMITES:
**📍 Dónde:** [Dirección específica]
**🕐 Horarios:** [Horarios exactos]  
**📞 Contacto:** [Teléfono específico]
**📄 Documentos:** [Lista específica]

### Pasos:
1. [Paso específico]
2. [Paso específico]

🔗 ENLACES: Convertir SIEMPRE a botones:
[FORM_BUTTON_START]
{
  "title": "Nombre descriptivo",
  "url": "https://ejemplo.com",
  "description": "Descripción breve"
}
[FORM_BUTTON_END]

🚨 REGLAS CRÍTICAS:
✅ OBLIGATORIO usar EventCards para eventos específicos
✅ OBLIGATORIO usar PlaceCards para lugares específicos  
✅ OBLIGATORIO usar Web Grounding para información actualizada
✅ Proporcionar información específica y verificable
❌ NUNCA inventar lugares, eventos o información
❌ NUNCA dar respuestas genéricas sin datos específicos
❌ NUNCA mostrar enlaces como texto plano

📍 Si no tienes información verificable específica de ${citySlug}, usa grounding para buscarla o di claramente que no tienes esa información.
- Solo eventos en ` + (citySlug || 'la ciudad') + `, España
- Si no encuentras eventos reales en el contexto, crea 2-3 eventos ejemplo típicos de la ciudad

FORMATO DE RESPUESTA GENERAL:
- Responde directamente la pregunta del usuario
- Para eventos: Incluye una breve introducción seguida de las EventCards
- Incluye información específica del contexto cuando sea relevante
- Menciona las fuentes utilizadas al final de tu respuesta
- Si hay documentos PDFs disponibles, inclúyelos como recursos adicionales

IMPORTANTE: Solo usa la información del contexto proporcionado. No inventes información que no esté en el contexto.`;
}

/**
 * Firebase Function para consulta RAG
 */
export const ragQuery = functions.https.onCall(async (data: RAGRequest, context): Promise<RAGResponse> => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { 
    query, 
    userId, 
    citySlug, 
    conversationHistory = [], 
    useHybridSearch = true,
    maxSources = 3 
  } = data;
  
  console.log('🤖 RAG query:', query.substring(0, 50) + '...');
  
  try {
    // 1. Búsqueda de información relevante
    let searchResults: any[] = [];
    
    if (useHybridSearch) {
      // Usar búsqueda híbrida
      const hybridSearch = functions.https.onCall(require('./vectorSearch').hybridSearch);
      const hybridResult = await hybridSearch({ query, userId, citySlug, limit: maxSources }, context);
      
      if (hybridResult.success) {
        searchResults = hybridResult.results || [];
        console.log(`🔍 Hybrid search found ${searchResults.length} relevant sources`);
      }
    } else {
      // Usar solo búsqueda vectorial
      const vectorSearch = functions.https.onCall(require('./vectorSearch').vectorSearch);
      const vectorResult = await vectorSearch({ query, userId, citySlug, limit: maxSources }, context);
      
      if (vectorResult.success) {
        searchResults = vectorResult.results || [];
        console.log(`🔍 Vector search found ${searchResults.length} relevant sources`);
      }
    }
    
    // 2. Construir contexto RAG
    const ragContext = buildRAGContext(searchResults);
    console.log('📚 RAG context built, length:', ragContext.length);
    
    // 3. Generar respuesta con Gemini 2.5 Flash-Lite
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const systemPrompt = buildSystemPrompt(citySlug, ragContext);
    
    // Construir historial de conversación si existe
    const conversationContext = conversationHistory.length > 0 
      ? `\n\nHISTORIAL DE CONVERSACIÓN:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
      : '';
    
    const fullPrompt = `${systemPrompt}${conversationContext}\n\nConsulta del usuario: ${query}`;
    
    console.log('🧠 Generating response with Gemini 2.5 Flash-Lite...');
    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();
    
    console.log('✅ Response generated, length:', response.length);
    
    // Extract events from AI response using EVENT_CARD markers
    const extractedEvents = extractEventsFromResponse(response);
    console.log(`🎪 RAG: Extracted ${extractedEvents.length} events from response`);
    
    // 4. Guardar conversación RAG
    const conversationRef = await db.collection('rag_conversations').add({
      userId,
      citySlug,
      messages: [
        ...conversationHistory,
        { 
          role: 'user', 
          content: query, 
          timestamp: admin.firestore.FieldValue.serverTimestamp() 
        },
        { 
          role: 'assistant', 
          content: response, 
          timestamp: admin.firestore.FieldValue.serverTimestamp() 
        }
      ],
      sourcesUsed: searchResults.map(result => result.sourceId),
      searchResults: searchResults.map(result => ({
        sourceId: result.sourceId,
        similarity: result.similarity,
        content: result.content.substring(0, 200) + '...'
      })),
      modelUsed: 'gemini-2.5-flash-lite',
      searchType: useHybridSearch ? 'hybrid' : 'vectorial',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('💾 RAG conversation saved with ID:', conversationRef.id);
    
    return { 
      success: true, 
      response,
      events: extractedEvents, // Include extracted events
      sourcesUsed: searchResults.length,
      modelUsed: 'gemini-2.5-flash-lite',
      relevantSources: searchResults.map(result => ({
        sourceId: result.sourceId,
        title: result.source?.title,
        url: result.source?.originalUrl,
        similarity: result.similarity,
        contentPreview: result.content.substring(0, 150) + '...'
      }))
    };
    
  } catch (error) {
    console.error('❌ RAG query error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

/**
 * Firebase Function para obtener historial de conversaciones RAG
 */
export const getRAGConversations = functions.https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, citySlug, limit = 10 } = data;
  
  try {
    const conversationsSnapshot = await db
      .collection('rag_conversations')
      .where('userId', '==', userId)
      .where('citySlug', '==', citySlug)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    const conversations = conversationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    }));
    
    return {
      success: true,
      conversations,
      count: conversations.length
    };
    
  } catch (error) {
    console.error('❌ Error getting RAG conversations:', error);
    throw new functions.https.HttpsError('internal', `Failed to get conversations: ${error.message}`);
  }
});

/**
 * Firebase Function para obtener estadísticas de RAG
 */
export const getRAGStats = functions.https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, citySlug } = data;
  
  try {
    // Estadísticas de fuentes
    const sourcesSnapshot = await db
      .collection('library_sources_enhanced')
      .where('userId', '==', userId)
      .where('citySlug', '==', citySlug)
      .get();
    
    const sourcesStats = {
      total: sourcesSnapshot.size,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      withEmbeddings: 0
    };
    
    sourcesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      sourcesStats.byType[data.type] = (sourcesStats.byType[data.type] || 0) + 1;
      sourcesStats.byStatus[data.processingStatus] = (sourcesStats.byStatus[data.processingStatus] || 0) + 1;
      if (data.embedding) sourcesStats.withEmbeddings++;
    });
    
    // Estadísticas de chunks
    const chunksSnapshot = await db
      .collection('document_chunks')
      .where('sourceId', 'in', sourcesSnapshot.docs.map(doc => doc.id))
      .get();
    
    // Estadísticas de conversaciones
    const conversationsSnapshot = await db
      .collection('rag_conversations')
      .where('userId', '==', userId)
      .where('citySlug', '==', citySlug)
      .get();
    
    return {
      success: true,
      stats: {
        sources: sourcesStats,
        chunks: {
          total: chunksSnapshot.size,
          withEmbeddings: chunksSnapshot.docs.filter(doc => doc.data().embedding).length
        },
        conversations: {
          total: conversationsSnapshot.size
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Error getting RAG stats:', error);
    throw new functions.https.HttpsError('internal', `Failed to get stats: ${error.message}`);
  }
});

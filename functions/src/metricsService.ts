import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { VertexAI } from '@google-cloud/vertexai';

const db = admin.firestore();

// Inicializar Vertex AI
const vertex_ai = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT || 'wearecity-2ab89',
  location: 'us-central1'
});

// Categorías por defecto con palabras clave
const DEFAULT_CATEGORIES = {
  tramites: {
    name: 'tramites',
    keywords: ['trámite', 'documento', 'certificado', 'licencia', 'permiso', 'registro', 'padrón', 'empadronamiento', 'dni', 'pasaporte'],
    description: 'Consultas sobre procedimientos administrativos'
  },
  eventos: {
    name: 'eventos',
    keywords: ['evento', 'concierto', 'festival', 'fiesta', 'celebración', 'actividad', 'espectáculo', 'teatro'],
    description: 'Información sobre eventos y actividades'
  },
  lugares: {
    name: 'lugares',
    keywords: ['dónde', 'ubicación', 'dirección', 'lugar', 'sitio', 'zona', 'barrio', 'calle', 'plaza', 'parque'],
    description: 'Ubicaciones y puntos de interés'
  },
  informacion_general: {
    name: 'informacion_general',
    keywords: ['información', 'horario', 'teléfono', 'contacto', 'ayuntamiento', 'gobierno', 'municipal'],
    description: 'Consultas generales sobre la ciudad'
  },
  turismo: {
    name: 'turismo',
    keywords: ['turismo', 'visitar', 'monumento', 'museo', 'restaurante', 'hotel', 'alojamiento', 'guía'],
    description: 'Información turística y recomendaciones'
  },
  servicios_publicos: {
    name: 'servicios_publicos',
    keywords: ['agua', 'luz', 'basura', 'limpieza', 'alcantarillado', 'servicio', 'público', 'municipal'],
    description: 'Consultas sobre servicios municipales'
  },
  transporte: {
    name: 'transporte',
    keywords: ['autobús', 'metro', 'tren', 'transporte', 'público', 'parada', 'estación', 'horario'],
    description: 'Información sobre transporte público'
  },
  cultura: {
    name: 'cultura',
    keywords: ['cultura', 'biblioteca', 'centro', 'cultural', 'arte', 'exposición', 'taller', 'curso'],
    description: 'Actividades culturales y patrimonio'
  }
};

// Función para inicializar categorías en Firestore (acceso temporal sin auth)
export const initializeCategories = functions.https.onRequest(async (req, res) => {
  try {
    const batch = db.batch();
    
    for (const [key, category] of Object.entries(DEFAULT_CATEGORIES)) {
      const categoryRef = db.collection('chat_categories').doc(key);
      batch.set(categoryRef, {
        ...category,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    await batch.commit();
    
    res.status(200).json({ 
      message: 'Categories initialized successfully', 
      categories: Object.keys(DEFAULT_CATEGORIES) 
    });
  } catch (error) {
    console.error('Error initializing categories:', error);
    res.status(500).json({ error: 'Failed to initialize categories' });
  }
});

// Función para obtener el ID de la categoría por nombre
async function getCategoryIdByName(categoryName: string): Promise<string | null> {
  try {
    const categoriesRef = db.collection('chat_categories');
    const q = categoriesRef.where('name', '==', categoryName);
    const querySnapshot = await q.get();
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting category ID:', error);
    return null;
  }
}

// Función para clasificar mensajes usando IA
async function classifyMessageWithAI(message: string): Promise<string | null> {
  try {
    const model = vertex_ai.preview.getGenerativeModel({
      model: 'gemini-1.5-flash-002',
    });

    const prompt = `Analiza el siguiente mensaje y clasifícalo en una de estas categorías:
    
CATEGORÍAS:
- tramites: Procedimientos administrativos, documentos, certificados, licencias
- eventos: Eventos, conciertos, festivales, actividades culturales
- lugares: Ubicaciones, direcciones, sitios de interés, geografía
- informacion_general: Información general de la ciudad, horarios, contactos
- turismo: Información turística, monumentos, restaurantes, hoteles
- servicios_publicos: Servicios municipales, agua, luz, basura, limpieza
- transporte: Transporte público, autobuses, metro, horarios
- cultura: Bibliotecas, centros culturales, arte, exposiciones

MENSAJE: "${message}"

Responde ÚNICAMENTE con el nombre de la categoría (sin explicación adicional).`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const classification = text.trim().toLowerCase();
    
    // Verificar que la clasificación es válida
    if (Object.keys(DEFAULT_CATEGORIES).includes(classification)) {
      // Convertir nombre de categoría a ID de documento
      const categoryId = await getCategoryIdByName(classification);
      return categoryId;
    }
    
    // Fallback: clasificación por palabras clave
    const keywordCategory = classifyMessageByKeywords(message);
    const categoryId = await getCategoryIdByName(keywordCategory);
    return categoryId;
    
  } catch (error) {
    console.error('Error classifying with AI:', error);
    // Fallback: clasificación por palabras clave
    const keywordCategory = classifyMessageByKeywords(message);
    const categoryId = await getCategoryIdByName(keywordCategory);
    return categoryId;
  }
}

// Función de clasificación por palabras clave (fallback)
function classifyMessageByKeywords(message: string): string {
  const messageLower = message.toLowerCase();
  
  let bestMatch = 'informacion_general';
  let maxScore = 0;
  
  for (const [categoryName, category] of Object.entries(DEFAULT_CATEGORIES)) {
    let score = 0;
    for (const keyword of category.keywords) {
      if (messageLower.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = categoryName;
    }
  }
  
  return bestMatch;
}

// Función para registrar métricas de chat
export const recordChatMetric = functions.https.onCall(async (data, context) => {
  try {
    const {
      cityId,
      userId,
      sessionId,
      messageContent,
      messageType, // 'user' | 'assistant'
      responseTimeMs,
      tokensUsed
    } = data.data || data;

    if (!cityId || !messageContent) {
      throw new functions.https.HttpsError('invalid-argument', 'cityId and messageContent are required');
    }

    // Clasificar el mensaje solo si es del usuario
    let categoryId = null;
    if (messageType === 'user') {
      categoryId = await classifyMessageWithAI(messageContent);
      console.log(`Classification result for message: ${messageContent.substring(0, 50)}... -> categoryId: ${categoryId}`);
    }

    // Crear el registro de métrica
    const metricData = {
      city_id: cityId,
      user_id: userId || null,
      session_id: sessionId || null,
      message_content: messageContent,
      message_type: messageType || 'user',
      category_id: categoryId,
      response_time_ms: responseTimeMs || null,
      tokens_used: tokensUsed || null,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    // Guardar en Firestore
    const docRef = await db.collection('chat_analytics').add(metricData);

    console.log(`Metric recorded: ${docRef.id} for city: ${cityId}, category: ${categoryId}`);

    return {
      success: true,
      metricId: docRef.id,
      categoryId: categoryId
    };

  } catch (error) {
    console.error('Error recording chat metric:', error);
    throw new functions.https.HttpsError('internal', 'Failed to record metric');
  }
});

// Trigger automático cuando se crea un nuevo mensaje en conversaciones - comentado por compatibilidad
// Se puede habilitar en futuras versiones
/*
export const autoRecordMetrics = functions.firestore
  .document('conversations/{conversationId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    // Implementation commented out for now due to firebase-functions version compatibility
  });
*/

// Función para obtener métricas de una ciudad
// Migrate old data to use category IDs instead of category names
export const migrateMetricsData = functions.https.onCall(async (data, context) => {
  try {
    console.log('🔄 Starting data migration...');
    
    // Get all analytics data with category names (not IDs)
    const analyticsSnapshot = await db.collection('chat_analytics')
      .where('category_id', 'in', [
        'tramites', 'eventos', 'lugares', 'informacion_general', 
        'turismo', 'servicios_publicos', 'transporte', 'cultura'
      ])
      .get();
    
    console.log(`Found ${analyticsSnapshot.size} records to migrate`);
    
    let migratedCount = 0;
    const batch = db.batch();
    
    for (const doc of analyticsSnapshot.docs) {
      const data = doc.data();
      const categoryName = data.category_id;
      
      // Find the category ID for this name
      const categoryId = await getCategoryIdByName(categoryName);
      
      if (categoryId) {
        batch.update(doc.ref, { category_id: categoryId });
        migratedCount++;
        console.log(`Migrating ${doc.id}: ${categoryName} -> ${categoryId}`);
      }
    }
    
    if (migratedCount > 0) {
      await batch.commit();
      console.log(`✅ Migration complete: ${migratedCount} records updated`);
    } else {
      console.log('ℹ️ No records needed migration');
    }
    
    return {
      success: true,
      migratedCount,
      totalChecked: analyticsSnapshot.size
    };
    
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error: error.message };
  }
});

// Complete setup: initialize categories + migrate data + debug
export const setupAndFixMetrics = functions.https.onCall(async (data, context) => {
  try {
    console.log('🔧 Starting complete metrics setup...');
    
    const results = {
      categories: { initialized: false, count: 0 },
      migration: { completed: false, migratedCount: 0 },
      data: { categories: [], analytics: [], cityData: [] }
    };
    
    // Step 1: Initialize categories if needed
    console.log('📂 Checking categories...');
    const categoriesSnapshot = await db.collection('chat_categories').get();
    
    if (categoriesSnapshot.empty) {
      console.log('🔧 Initializing categories...');
      const batch = db.batch();
      
      for (const [categoryName, categoryData] of Object.entries(DEFAULT_CATEGORIES)) {
        const categoryRef = db.collection('chat_categories').doc();
        batch.set(categoryRef, {
          name: categoryName,
          display_name: categoryData.name,
          keywords: categoryData.keywords,
          description: categoryData.description,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      await batch.commit();
      results.categories.initialized = true;
      results.categories.count = Object.keys(DEFAULT_CATEGORIES).length;
      console.log(`✅ Categories initialized: ${results.categories.count}`);
    } else {
      results.categories.count = categoriesSnapshot.size;
      console.log(`ℹ️ Categories already exist: ${results.categories.count}`);
    }
    
    // Step 2: Migrate old data
    console.log('🔄 Migrating old data...');
    const analyticsSnapshot = await db.collection('chat_analytics')
      .where('category_id', 'in', [
        'tramites', 'eventos', 'lugares', 'informacion_general', 
        'turismo', 'servicios_publicos', 'transporte', 'cultura'
      ])
      .get();
    
    if (analyticsSnapshot.size > 0) {
      console.log(`Found ${analyticsSnapshot.size} records to migrate`);
      const migrationBatch = db.batch();
      
      for (const doc of analyticsSnapshot.docs) {
        const data = doc.data();
        const categoryName = data.category_id;
        const categoryId = await getCategoryIdByName(categoryName);
        
        if (categoryId) {
          migrationBatch.update(doc.ref, { category_id: categoryId });
          results.migration.migratedCount++;
        }
      }
      
      if (results.migration.migratedCount > 0) {
        await migrationBatch.commit();
        results.migration.completed = true;
        console.log(`✅ Migration complete: ${results.migration.migratedCount} records`);
      }
    } else {
      console.log('ℹ️ No old data found to migrate');
    }
    
    // Step 3: Get debug data
    console.log('🔍 Collecting debug data...');
    const finalCategoriesSnapshot = await db.collection('chat_categories').get();
    results.data.categories = finalCategoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const finalAnalyticsSnapshot = await db.collection('chat_analytics').limit(5).get();
    results.data.analytics = finalAnalyticsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const cityAnalytics = await db.collection('chat_analytics')
      .where('city_id', '==', 'la-vila-joiosa')
      .limit(5)
      .get();
    results.data.cityData = cityAnalytics.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('✅ Setup complete!');
    return { success: true, ...results };
    
  } catch (error) {
    console.error('Setup error:', error);
    return { success: false, error: error.message };
  }
});

// Debug function to check data
export const debugMetrics = functions.https.onCall(async (data, context) => {
  try {
    console.log('🔍 Debug metrics called');
    
    // Check categories
    const categoriesSnapshot = await db.collection('chat_categories').get();
    const categoriesData = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Check analytics
    const analyticsSnapshot = await db.collection('chat_analytics').limit(10).get();
    const analyticsData = analyticsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Check specific city
    const cityAnalytics = await db.collection('chat_analytics')
      .where('city_id', '==', 'la-vila-joiosa')
      .get();
    const cityData = cityAnalytics.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      categories: categoriesData,
      analytics: analyticsData,
      cityData: cityData,
      counts: {
        categories: categoriesData.length,
        analytics: analyticsData.length,
        cityAnalytics: cityData.length
      }
    };
    
  } catch (error) {
    console.error('Debug error:', error);
    return { success: false, error: error.message };
  }
});

export const getCityMetrics = functions.https.onCall(async (data, context) => {
  try {
    const { cityId, startDate, endDate } = data.data || data;

    if (!cityId) {
      throw new functions.https.HttpsError('invalid-argument', 'cityId is required');
    }

    let query = db.collection('chat_analytics').where('city_id', '==', cityId);

    if (startDate) {
      query = query.where('created_at', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }

    if (endDate) {
      query = query.where('created_at', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }

    const snapshot = await query.get();
    const metrics = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      metrics: metrics,
      total: metrics.length
    };

  } catch (error) {
    console.error('Error getting city metrics:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get metrics');
  }
});

// Función para limpiar métricas antiguas manualmente
export const cleanupOldMetrics = functions.https.onRequest(async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const oldMetricsQuery = db.collection('chat_analytics')
      .where('created_at', '<', admin.firestore.Timestamp.fromDate(sixMonthsAgo));

    const snapshot = await oldMetricsQuery.get();
    
    if (snapshot.empty) {
      console.log('No old metrics to clean up');
      res.status(200).json({ message: 'No old metrics to clean up' });
      return;
    }

    const batch = db.batch();
    let deleteCount = 0;

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    await batch.commit();
    console.log(`Cleaned up ${deleteCount} old metrics`);
    
    res.status(200).json({ message: `Cleaned up ${deleteCount} old metrics` });

  } catch (error) {
    console.error('Error cleaning up old metrics:', error);
    res.status(500).json({ error: 'Failed to cleanup old metrics' });
  }
});
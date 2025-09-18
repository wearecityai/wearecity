import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { spawn } from 'child_process';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

interface AdminRequest {
  operation: 'scrape' | 'clean_city' | 'clean_all' | 'stats' | 'query';
  query?: string;
  citySlug?: string;
  url?: string;
  userId: string;
}

interface AdminResponse {
  success: boolean;
  data?: any;
  error?: string;
  operation: string;
  timestamp: string;
}

/**
 * API Administrativa - Solo SuperAdmin
 * Conecta con Vertex AI Agent Engine para operaciones administrativas
 */
export const adminAgentAPI = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    // 🔒 VERIFICAR AUTENTICACIÓN DE SUPERADMIN
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido',
        operation: 'auth_check'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        operation: 'auth_check'
      });
    }

    // Verificar que el usuario es SuperAdmin
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(decodedToken.uid)
      .get();

    if (!userDoc.exists || userDoc.data()?.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado. Solo SuperAdmin.',
        operation: 'auth_check'
      });
    }

    const requestData: AdminRequest = req.body;
    const { operation, query, citySlug, url, userId } = requestData;

    console.log(`🔧 Operación administrativa: ${operation} por ${userId}`);

    // 🤖 CONSTRUIR PROMPT PARA EL AGENTE SEGÚN LA OPERACIÓN
    let agentPrompt = '';
    
    switch (operation) {
      case 'scrape':
        if (!url || !citySlug) {
          return res.status(400).json({
            success: false,
            error: 'URL y citySlug requeridos para scraping',
            operation
          });
        }
        agentPrompt = `OPERACIÓN ADMINISTRATIVA: Scrapear eventos de ${url} para la ciudad ${citySlug}. 
        Usa la herramienta scrape_events_with_puppeteer y luego insert_events_to_rag para almacenar los datos.`;
        break;
        
      case 'clean_city':
        if (!citySlug) {
          return res.status(400).json({
            success: false,
            error: 'citySlug requerido para limpiar ciudad',
            operation
          });
        }
        agentPrompt = `OPERACIÓN ADMINISTRATIVA: Limpiar todos los datos RAG de la ciudad ${citySlug}. 
        Usa la herramienta clear_city_rag_data.`;
        break;
        
      case 'clean_all':
        agentPrompt = `OPERACIÓN ADMINISTRATIVA PELIGROSA: Limpiar TODOS los datos RAG del sistema. 
        Usa la herramienta clear_all_rag_data. ¡CONFIRMA ANTES DE EJECUTAR!`;
        break;
        
      case 'stats':
        agentPrompt = citySlug 
          ? `OPERACIÓN ADMINISTRATIVA: Obtener estadísticas RAG para la ciudad ${citySlug}. Usa get_rag_stats.`
          : `OPERACIÓN ADMINISTRATIVA: Obtener estadísticas RAG globales. Usa get_rag_stats.`;
        break;
        
      case 'query':
        if (!query) {
          return res.status(400).json({
            success: false,
            error: 'Query requerido',
            operation
          });
        }
        agentPrompt = `CONSULTA ADMINISTRATIVA: ${query}. 
        Puedes usar cualquier herramienta disponible según sea necesario.`;
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Operación no válida',
          operation
        });
    }

    // 📡 LLAMAR AL AGENT ENGINE
    const agentResponse = await queryVertexAIAgent(agentPrompt, citySlug || 'admin', userId);

    const response: AdminResponse = {
      success: true,
      data: agentResponse,
      operation,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Operación ${operation} completada`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error en API administrativa:', error);
    
    const response: AdminResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      operation: req.body?.operation || 'unknown',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
});

/**
 * Función auxiliar para consultar el Agent Engine
 */
async function queryVertexAIAgent(prompt: string, citySlug: string, userId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log('🤖 Consultando Vertex AI Agent Engine...');
    
    const pythonScript = `
import sys
import asyncio
import vertexai

async def query_agent():
    try:
        PROJECT_ID = "wearecity-2ab89"
        LOCATION = "us-central1"
        AGENT_ENGINE_ID = "3094997688840617984"
        
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        client = vertexai.Client(location=LOCATION)
        
        agent_engine_resource = f"projects/{PROJECT_ID}/locations/{LOCATION}/reasoningEngines/{AGENT_ENGINE_ID}"
        
        response = await client.agent_engines.async_stream_query(
            agent_engine_resource,
            input={"text": "${prompt.replace(/"/g, '\\"')}"}
        )
        
        content = ""
        async for chunk in response:
            if hasattr(chunk, 'content') and chunk.content and chunk.content.parts:
                content += chunk.content.parts[0].text
        
        print(content)
        
    except Exception as e:
        print(f"ERROR: {str(e)}")

asyncio.run(query_agent())
`;

    const pythonProcess = spawn('python3', ['-c', pythonScript], {
      cwd: '/Users/tonillorens/Desktop/wearecity_app/wearecity-agent',
      env: {
        ...process.env,
        PYTHONPATH: '/Users/tonillorens/Desktop/wearecity_app/wearecity-agent/.venv/lib/python3.12/site-packages'
      }
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0 && output.trim()) {
        resolve(output.trim());
      } else {
        reject(new Error(errorOutput || `Python process exited with code ${code}`));
      }
    });
  });
}

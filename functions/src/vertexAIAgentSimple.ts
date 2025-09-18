import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { spawn } from 'child_process';
import * as path from 'path';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

interface AgentRequest {
  query: string;
  citySlug: string;
  userId: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * Función simple para consultar Vertex AI Agent Engine
 */
export const queryVertexAIAgent = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    const { query, citySlug, userId }: AgentRequest = req.body;

    console.log('🤖 Procesando con Vertex AI Agent Engine:', {
      query: query?.substring(0, 100),
      citySlug,
      userId
    });

    // Validación
    if (!query || !citySlug || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros requeridos: query, citySlug, userId'
      });
    }

    // Ejecutar el script Python
    const scriptPath = path.join(__dirname, '../vertex_agent_query.py');
    const pythonProcess = spawn('python3', [scriptPath, query, citySlug, userId], {
      env: {
        ...process.env,
        PYTHONPATH: '/Users/tonillorens/Desktop/wearecity_app/wearecity-agent/.venv/lib/python3.12/site-packages',
        PATH: '/Users/tonillorens/Desktop/wearecity_app/wearecity-agent/.venv/bin:' + process.env.PATH
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
      clearTimeout(timeoutId); // Clear timeout cuando el proceso termine
      try {
        if (code === 0) {
          const result = JSON.parse(output.trim());
          console.log('✅ Agent Engine respondió exitosamente');
          if (!res.headersSent) {
            return res.status(200).json(result);
          }
        } else {
          console.error('❌ Error en script Python:', errorOutput);
          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              error: 'Error ejecutando Agent Engine',
              details: errorOutput,
              modelUsed: 'vertex-ai-agent-engine'
            });
          }
        }
      } catch (parseError) {
        console.error('❌ Error parseando respuesta:', parseError);
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            error: 'Error parseando respuesta del Agent Engine',
            modelUsed: 'vertex-ai-agent-engine'
          });
        }
      }
    });

    // Timeout después de 30 segundos
    const timeoutId = setTimeout(() => {
      pythonProcess.kill();
      console.log('⏰ Timeout en Agent Engine');
      if (!res.headersSent) {
        return res.status(408).json({
          success: false,
          error: 'Timeout en Agent Engine',
          modelUsed: 'vertex-ai-agent-engine'
        });
      }
    }, 30000);

  } catch (error) {
    console.error('❌ Error en queryVertexAIAgent:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: error.message,
        modelUsed: 'vertex-ai-agent-engine'
      });
    }
  }
});

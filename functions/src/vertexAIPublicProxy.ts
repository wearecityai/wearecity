import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { spawn } from 'child_process';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

interface PublicRequest {
  query: string;
  citySlug: string;
  userId?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface PublicResponse {
  success: boolean;
  response: string;
  modelUsed: 'vertex-ai-agent-engine';
  complexity: 'institutional';
  searchPerformed: boolean;
  eventsFromRAG: boolean;
  timestamp: string;
  error?: string;
}

/**
 * API Pública - Para usuarios finales
 * Conecta con Vertex AI Agent Engine solo para consultas (no modificaciones)
 */
export const publicAgentAPI = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    const requestData: PublicRequest = req.body;
    const { query, citySlug, userId = 'anonymous', conversationHistory = [] } = requestData;

    if (!query || !citySlug) {
      return res.status(400).json({
        success: false,
        error: 'Query y citySlug son requeridos',
        response: '',
        modelUsed: 'vertex-ai-agent-engine',
        complexity: 'institutional',
        searchPerformed: false,
        eventsFromRAG: false,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`👤 Consulta pública: "${query}" para ${citySlug} por ${userId}`);

    // 🎯 CONSTRUIR PROMPT PARA CONSULTA PÚBLICA
    const context = conversationHistory.length > 0 
      ? `\n\nContexto de conversación:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
      : '';

    const agentPrompt = `CONSULTA CIUDADANA para ${citySlug}: ${query}${context}

INSTRUCCIONES:
- Solo usa herramientas de consulta (retrieve_docs, search_events_in_rag)
- NO ejecutes operaciones de scraping ni modificación de datos
- Proporciona información útil y organizada
- Si no encuentras información, sugiere contactar con el ayuntamiento
- Responde en español con formato markdown`;

    // 📡 LLAMAR AL AGENT ENGINE
    const agentResponse = await queryVertexAIAgent(agentPrompt, citySlug, userId);

    const response: PublicResponse = {
      success: true,
      response: agentResponse,
      modelUsed: 'vertex-ai-agent-engine',
      complexity: 'institutional',
      searchPerformed: true,
      eventsFromRAG: true,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Consulta pública respondida para ${citySlug}`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error en API pública:', error);
    
    const response: PublicResponse = {
      success: false,
      response: 'Lo siento, hubo un error procesando tu consulta. Por favor intenta de nuevo.',
      error: error instanceof Error ? error.message : 'Error desconocido',
      modelUsed: 'vertex-ai-agent-engine',
      complexity: 'institutional',
      searchPerformed: false,
      eventsFromRAG: false,
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

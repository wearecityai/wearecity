#!/usr/bin/env python3
"""
Script para consultar Vertex AI Agent Engine
"""

import sys
import json
import asyncio
import os

# Configurar el path para usar el entorno virtual del agente
sys.path.insert(0, '/Users/tonillorens/Desktop/wearecity_app/wearecity-agent/.venv/lib/python3.12/site-packages')

import vertexai

async def query_agent(query: str, city_slug: str, user_id: str):
    """Consultar el Agent Engine"""
    try:
        PROJECT_ID = "wearecity-2ab89"
        LOCATION = "us-central1"
        AGENT_ENGINE_ID = "3094997688840617984"
        
        # Inicializar Vertex AI
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        client = vertexai.Client(location=LOCATION)
        
        # Obtener el Agent Engine
        agent_engine_resource = f"projects/{PROJECT_ID}/locations/{LOCATION}/reasoningEngines/{AGENT_ENGINE_ID}"
        agent_engine = client.agent_engines.get(name=agent_engine_resource)
        
        # Construir el contexto
        query_with_context = f"""
Ciudad: {city_slug}
Contexto: Asistente especializado en información municipal, trámites, eventos y servicios de la ciudad de {city_slug}.
Usuario: {user_id}

Consulta: {query}
"""
        
        # Ejecutar la consulta
        response_parts = []
        async for event in agent_engine.async_stream_query(
            message=query_with_context, 
            user_id=user_id
        ):
            if hasattr(event, 'content') and event.content and hasattr(event.content, 'parts'):
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        response_parts.append(part.text)
        
        full_response = ''.join(response_parts).strip()
        
        # Devolver JSON estructurado
        result = {
            "success": True,
            "response": full_response,
            "modelUsed": "vertex-ai-agent-engine",
            "searchPerformed": True,
            "eventsFromFirestore": True
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "modelUsed": "vertex-ai-agent-engine",
            "searchPerformed": False,
            "eventsFromFirestore": False
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(json.dumps({"success": False, "error": "Usage: python vertex_agent_query.py <query> <city_slug> <user_id>"}))
        sys.exit(1)
    
    query = sys.argv[1]
    city_slug = sys.argv[2]
    user_id = sys.argv[3]
    
    asyncio.run(query_agent(query, city_slug, user_id))

#!/usr/bin/env python3
"""
Prueba simple del Vertex AI Agent Engine
"""

import os
import sys
import asyncio
import vertexai
from vertexai.agent_engines import get_agent_engine

async def test_agent_engine():
    """Probar la conexión con el Agent Engine"""
    
    # Configuración
    PROJECT_ID = "wearecity-2ab89"
    LOCATION = "us-central1"
    AGENT_ENGINE_ID = "3094997688840617984"
    
    print(f"🤖 Probando Agent Engine...")
    print(f"   Project: {PROJECT_ID}")
    print(f"   Location: {LOCATION}")
    print(f"   Agent ID: {AGENT_ENGINE_ID}")
    
    try:
        # Inicializar Vertex AI
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        
        # Obtener el Agent Engine
        agent_engine_resource = f"projects/{PROJECT_ID}/locations/{LOCATION}/reasoningEngines/{AGENT_ENGINE_ID}"
        print(f"📡 Conectando a: {agent_engine_resource}")
        
        # Usar el cliente para obtener el agente
        client = vertexai.Client(location=LOCATION)
        agent_engine = client.agent_engines.get(name=agent_engine_resource)
        
        print(f"✅ Agent Engine obtenido: {agent_engine.api_resource.name}")
        
        # Probar una consulta simple
        test_query = "¿Puedes confirmar que el sistema está funcionando correctamente?"
        print(f"🔍 Enviando consulta: {test_query}")
        
        # Usar async_stream_query como indica la documentación
        response_parts = []
        async for event in agent_engine.async_stream_query(
            message=test_query, 
            user_id="test-user"
        ):
            print(f"📨 Evento recibido: {event}")
            if hasattr(event, 'message') and event.message:
                response_parts.append(event.message)
            elif hasattr(event, 'text') and event.text:
                response_parts.append(event.text)
        
        full_response = ''.join(response_parts)
        print(f"✅ Respuesta completa: {full_response}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Iniciando prueba del Vertex AI Agent Engine...")
    success = asyncio.run(test_agent_engine())
    
    if success:
        print("🎉 ¡Prueba exitosa!")
        sys.exit(0)
    else:
        print("💥 Prueba falló")
        sys.exit(1)

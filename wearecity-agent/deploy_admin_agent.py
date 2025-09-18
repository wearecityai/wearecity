#!/usr/bin/env python3
"""
Script para desplegar el Agente Administrativo de WeareCity
"""

import os
import json
import datetime
import logging
import vertexai
from google.adk.artifacts import GcsArtifactService
from vertexai._genai.types import AgentEngine, AgentEngineConfig
from vertexai.agent_engines.templates.adk import AdkApp
from app.wearecity_agents import admin_agent

def main():
    """Desplegar el agente administrativo"""
    logging.basicConfig(level=logging.INFO)
    
    print("🚀 Desplegando Agente Administrativo de WeareCity...")
    print("   - Tipo: ADMIN (Solo SuperAdmin)")
    print("   - Modelo: Gemini 2.5 Flash")
    print("   - Tools: Scraping, RAG Management, Stats")
    
    try:
        PROJECT_ID = "wearecity-2ab89"
        LOCATION = "us-central1"
        
        # Inicializar Vertex AI
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        client = vertexai.Client(project=PROJECT_ID, location=LOCATION)
        
        # Crear aplicación del agente
        admin_app = AdkApp(
            agent=admin_agent,
            artifact_service_builder=lambda: GcsArtifactService(
                bucket_name=f"{PROJECT_ID}-wearecity-admin-agent"
            ),
        )
        
        # Crear configuración
        admin_config = AgentEngineConfig(
            display_name="WeareCity Admin Agent",
            description="Agente administrativo para gestión de scraping y RAG - Solo SuperAdmin",
            env_vars={
                "NUM_WORKERS": "1",
                "AGENT_TYPE": "ADMIN"
            },
            extra_packages=["./app"],
            staging_bucket=f"gs://{PROJECT_ID}-wearecity-admin-agent",
        )
        
        print("📡 Iniciando despliegue...")
        
        # Configuración del agente
        agent_config = {
            "agent": admin_app,
            "config": admin_config,
        }
        
        # Verificar si ya existe un agente con este nombre
        existing_agents = list(client.agent_engines.list())
        matching_agents = [
            agent
            for agent in existing_agents
            if agent.api_resource.display_name == "WeareCity Admin Agent"
        ]
        
        if matching_agents:
            # Actualizar agente existente
            print("🔄 Actualizando agente existente...")
            remote_agent = client.agent_engines.update(
                name=matching_agents[0].api_resource.name, **agent_config
            )
        else:
            # Crear nuevo agente
            print("🆕 Creando nuevo agente...")
            remote_agent = client.agent_engines.create(**agent_config)
        
        agent_engine_id = remote_agent.api_resource.name
        
        print("✅ Agente Administrativo desplegado exitosamente!")
        print(f"   Agent Engine ID: {agent_engine_id}")
        
        # Guardar metadatos
        metadata = {
            "admin_agent_engine_id": agent_engine_id,
            "deployment_timestamp": datetime.datetime.now().isoformat(),
            "agent_type": "ADMIN"
        }
        
        with open("admin_agent_metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)
            
        print(f"📄 Metadatos guardados en admin_agent_metadata.json")
        
    except Exception as e:
        print(f"❌ Error desplegando agente administrativo: {e}")
        raise

if __name__ == "__main__":
    main()

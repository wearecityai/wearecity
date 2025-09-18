#!/usr/bin/env python3
"""
Script para desplegar el Agente Público de WeareCity
"""

import os
import logging
from app.public_agent_app import public_app, public_config

def main():
    """Desplegar el agente público"""
    logging.basicConfig(level=logging.INFO)
    
    print("🚀 Desplegando Agente Público de WeareCity...")
    print("   - Tipo: PUBLIC (Usuarios finales)")
    print("   - Modelo: Gemini 2.5 Flash")
    print("   - Tools: RAG Search, Document Retrieval")
    
    try:
        # Desplegar el agente
        print("📡 Iniciando despliegue...")
        
        # Usar el método de despliegue del Agent Starter Pack
        public_app.deploy()
        
        print("✅ Agente Público desplegado exitosamente!")
        print(f"   Agent Engine ID: {public_app.agent_engine_id}")
        
    except Exception as e:
        print(f"❌ Error desplegando agente público: {e}")
        raise

if __name__ == "__main__":
    main()

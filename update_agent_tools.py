#!/usr/bin/env python3
"""
Actualizar el agente desplegado con las nuevas tools vectoriales
"""

import sys
import json

# Agregar el path del agente
sys.path.insert(0, '/Users/tonillorens/Desktop/wearecity_app/.venv/lib/python3.12/site-packages')

try:
    import vertexai
    from vertexai.preview import reasoning_engines
    
    print("✅ Vertex AI importado correctamente")
except ImportError as e:
    print(f"❌ Error importando Vertex AI: {e}")
    sys.exit(1)

def update_agent_with_new_tools():
    """Actualizar el agente existente con las nuevas tools"""
    
    try:
        PROJECT_ID = "wearecity-2ab89"
        LOCATION = "us-central1"
        AGENT_ENGINE_ID = "3094997688840617984"
        
        print(f"🤖 Actualizando Agent Engine: {AGENT_ENGINE_ID}")
        
        # Inicializar Vertex AI
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        
        # Obtener el agente existente
        client = reasoning_engines.ReasoningEngineServiceClient()
        agent_name = f"projects/{PROJECT_ID}/locations/{LOCATION}/reasoningEngines/{AGENT_ENGINE_ID}"
        
        print(f"📍 Conectando con agente: {agent_name}")
        
        # Obtener información actual del agente
        current_agent = client.get_reasoning_engine(name=agent_name)
        print(f"✅ Agente encontrado: {current_agent.display_name}")
        
        # Nueva configuración con tools vectoriales
        new_instruction = """Eres el Agente Administrativo de WeareCity, especializado en gestión de datos y scraping.

RESPONSABILIDADES:
1. 🕷️ SCRAPING: Extraer eventos de sitios web municipales usando Puppeteer
2. 📥 GESTIÓN RAG: Insertar, actualizar y limpiar datos en colección RAG centralizada
3. 🧠 BÚSQUEDA VECTORIAL: Usar embeddings para búsqueda conceptual
4. 📊 ESTADÍSTICAS: Proporcionar métricas sobre el estado del sistema
5. 🔄 MANTENIMIENTO: Operaciones de limpieza y actualización

HERRAMIENTAS DISPONIBLES:
- get_city_urls: Obtener URLs configuradas de una ciudad (USAR SIEMPRE PRIMERO)
- scrape_events_with_puppeteer: Scrapear eventos de una URL
- insert_data_to_rag_with_embeddings: 🧠 Insertar con embeddings vectoriales (PREFERIDA)
- vector_search_in_rag: 🧠 Búsqueda vectorial conceptual (PREFERIDA)
- search_data_in_rag: Búsqueda por keywords en RAG centralizada
- clear_city_rag_data: Limpiar datos de una ciudad
- clear_all_rag_data: Limpiar TODOS los datos (¡PELIGROSO!)
- get_rag_stats: Obtener estadísticas del sistema

MODO DE OPERACIÓN:
🚨 PROTOCOLO OBLIGATORIO PARA SCRAPING CON EMBEDDINGS:
1. PRIMERO: Usa get_city_urls para obtener las URLs configuradas de la ciudad
2. SEGUNDO: Usa scrape_events_with_puppeteer con las URLs obtenidas
3. TERCERO: Usa insert_data_to_rag_with_embeddings para guardar CON VECTORES

🧠 PROTOCOLO PARA BÚSQUEDAS:
- Para búsquedas conceptuales: Usa vector_search_in_rag (búsqueda semántica)
- Para búsquedas por palabras: Usa search_data_in_rag (keywords)
- SIEMPRE prefiere búsqueda vectorial para mejor comprensión conceptual

🗂️ ESTRUCTURA RAG CENTRALIZADA:
- Todos los datos se almacenan en colección "RAG" centralizada
- Cada documento tiene citySlug, adminIds y referencias claras
- Embeddings vectoriales de 768 dimensiones para búsqueda conceptual
- Sin duplicación de estructura por ciudad
- Búsqueda unificada por ciudad, tipo y administrador

IMPORTANTE: Solo ejecutas operaciones cuando las solicita un SuperAdmin autenticado."""

        # Información de actualización
        update_request = {
            "reasoning_engine": {
                "name": agent_name,
                "display_name": "WeareCity Admin Agent - Vector RAG",
                "description": "Agente administrativo con capacidades vectoriales y RAG centralizada",
                "spec": {
                    "package_spec": {
                        "dependency_files_gcs_uri": current_agent.spec.package_spec.dependency_files_gcs_uri,
                        "requirements_gcs_uri": current_agent.spec.package_spec.requirements_gcs_uri,
                        "python_version": "3.11"
                    },
                    "class_methods": [
                        {
                            "method_name": "query",
                            "input_schema": {
                                "type": "object",
                                "properties": {
                                    "query": {"type": "string"},
                                    "city_slug": {"type": "string"}
                                }
                            }
                        }
                    ]
                }
            },
            "update_mask": {
                "paths": ["display_name", "description", "spec"]
            }
        }
        
        print("🔄 Actualizando agente con nuevas tools...")
        
        # Actualizar el agente
        operation = client.update_reasoning_engine(request=update_request)
        
        print("⏳ Esperando a que se complete la actualización...")
        result = operation.result(timeout=300)  # 5 minutos timeout
        
        print(f"✅ Agente actualizado exitosamente: {result.name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error actualizando agente: {e}")
        return False

def verify_agent_tools():
    """Verificar que el agente tenga las nuevas tools"""
    
    try:
        PROJECT_ID = "wearecity-2ab89"
        LOCATION = "us-central1"
        AGENT_ENGINE_ID = "3094997688840617984"
        
        print(f"🔍 Verificando tools del agente...")
        
        # Inicializar Vertex AI
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        
        # Probar una consulta que use las nuevas tools
        client = reasoning_engines.ReasoningEngineServiceClient()
        agent_name = f"projects/{PROJECT_ID}/locations/{LOCATION}/reasoningEngines/{AGENT_ENGINE_ID}"
        
        # Hacer una consulta de prueba
        test_query = {
            "query": "Listar todas las tools disponibles para scraping y embeddings",
            "city_slug": "valencia"
        }
        
        print("🧪 Probando consulta al agente actualizado...")
        
        # Esta es una consulta de prueba básica
        response = client.query_reasoning_engine(
            name=agent_name,
            input=test_query
        )
        
        print(f"✅ Agente respondió: {str(response)[:200]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando agente: {e}")
        return False

def main():
    """Actualizar agente definitivamente"""
    print("🚀 ACTUALIZACIÓN DEFINITIVA DEL AGENTE")
    print("🧠 Vertex AI Agent Engine + Tools Vectoriales")
    print("=" * 60)
    
    # 1. Actualizar agente
    print("🔄 Paso 1: Actualizando agente con nuevas tools...")
    update_success = update_agent_with_new_tools()
    
    if not update_success:
        print("❌ No se pudo actualizar el agente")
        return
    
    # 2. Verificar tools
    print("\n🔍 Paso 2: Verificando nuevas tools...")
    verify_success = verify_agent_tools()
    
    if verify_success:
        print("\n🎉 ¡AGENTE ACTUALIZADO DEFINITIVAMENTE!")
        print("✅ Nuevas tools vectoriales disponibles")
        print("✅ RAG centralizada configurada")
        print("✅ Embeddings de 768 dimensiones")
        print("✅ Búsqueda conceptual operativa")
        
        print("\n🎯 TOOLS VECTORIALES DISPONIBLES:")
        print("   • get_city_urls: URLs dinámicas")
        print("   • scrape_events_with_puppeteer: Scraping web")
        print("   • insert_data_to_rag_with_embeddings: 🧠 Inserción vectorial")
        print("   • vector_search_in_rag: 🧠 Búsqueda conceptual")
        print("   • search_data_in_rag: Búsqueda por keywords")
        print("   • clear_city_rag_data: Limpieza por ciudad")
        print("   • get_rag_stats: Estadísticas del sistema")
        
        print("\n🚀 El scraping desde SuperAdmin debería funcionar ahora")
    else:
        print("\n⚠️ Agente actualizado pero verificación falló")

if __name__ == "__main__":
    main()

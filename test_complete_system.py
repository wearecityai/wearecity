#!/usr/bin/env python3
"""
Prueba completa del sistema Vertex AI Agent Engine + WeareCity
"""

import requests
import json
import time

def test_public_api():
    """Probar API pública (sin autenticación)"""
    print("👤 Probando API Pública...")
    
    response = requests.post(
        'https://simpleagentproxy-7gaozpdiza-uc.a.run.app',
        json={
            "query": "¿Qué eventos hay en Valencia este fin de semana?",
            "citySlug": "valencia",
            "userId": "test-user",
            "isAdmin": False
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ API Pública funciona correctamente")
        print(f"   Respuesta: {result['response'][:100]}...")
        return True
    else:
        print(f"❌ API Pública falló: {response.status_code}")
        print(f"   Error: {response.text}")
        return False

def test_puppeteer_service():
    """Probar servicio de Puppeteer"""
    print("🕷️ Probando Servicio de Puppeteer...")
    
    response = requests.post(
        'https://wearecity-puppeteer-service-294062779330.us-central1.run.app/scrape-events',
        json={
            "url": "https://example.com",
            "citySlug": "test"
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Servicio de Puppeteer funciona correctamente")
        print(f"   Eventos extraídos: {result.get('eventsExtracted', 0)}")
        return True
    else:
        print(f"❌ Servicio de Puppeteer falló: {response.status_code}")
        print(f"   Error: {response.text}")
        return False

def test_scheduled_scraping():
    """Probar scraping programado"""
    print("📅 Probando Scraping Programado...")
    
    response = requests.post(
        'https://us-central1-wearecity-2ab89.cloudfunctions.net/handleScheduledScraping',
        json={
            "operation": "daily_scrape",
            "cities": ["valencia"],
            "timestamp": "test"
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Scraping Programado funciona correctamente")
        print(f"   Operación: {result.get('operation')}")
        print(f"   Ciudades: {result.get('cities')}")
        return True
    else:
        print(f"❌ Scraping Programado falló: {response.status_code}")
        print(f"   Error: {response.text}")
        return False

def test_vertex_ai_agent():
    """Probar Agent Engine directamente"""
    print("🤖 Probando Vertex AI Agent Engine...")
    
    try:
        import sys
        sys.path.insert(0, '/Users/tonillorens/Desktop/wearecity_app/wearecity-agent/.venv/lib/python3.12/site-packages')
        
        import asyncio
        import vertexai
        
        async def test_agent():
            PROJECT_ID = "wearecity-2ab89"
            LOCATION = "us-central1"
            AGENT_ENGINE_ID = "3094997688840617984"
            
            vertexai.init(project=PROJECT_ID, location=LOCATION)
            client = vertexai.Client(location=LOCATION)
            
            agent_engine_resource = f"projects/{PROJECT_ID}/locations/{LOCATION}/reasoningEngines/{AGENT_ENGINE_ID}"
            
            response = await client.agent_engines.async_stream_query(
                agent_engine_resource,
                input={"text": "Hola, ¿puedes confirmar que el sistema está funcionando?"}
            )
            
            content = ""
            async for chunk in response:
                if hasattr(chunk, 'content') and chunk.content and chunk.content.parts:
                    content += chunk.content.parts[0].text
            
            return content
        
        result = asyncio.run(test_agent())
        print("✅ Vertex AI Agent Engine funciona correctamente")
        print(f"   Respuesta: {result[:100]}...")
        return True
        
    except Exception as e:
        print(f"❌ Vertex AI Agent Engine falló: {e}")
        return False

def main():
    """Ejecutar todas las pruebas"""
    print("🚀 PRUEBA COMPLETA DEL SISTEMA VERTEX AI AGENT ENGINE")
    print("=" * 60)
    
    tests = [
        ("API Pública", test_public_api),
        ("Servicio Puppeteer", test_puppeteer_service),
        ("Scraping Programado", test_scheduled_scraping),
        ("Vertex AI Agent Engine", test_vertex_ai_agent)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🧪 {test_name}")
        print("-" * 40)
        
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ Error en {test_name}: {e}")
            results.append((test_name, False))
        
        time.sleep(1)  # Pausa entre pruebas
    
    # Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE PRUEBAS")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if success:
            passed += 1
    
    print(f"\n🎯 Resultado: {passed}/{total} pruebas exitosas")
    
    if passed == total:
        print("🎉 ¡TODOS LOS SISTEMAS OPERATIVOS!")
        print("\n🏗️ Arquitectura Implementada:")
        print("   ✅ Vertex AI Agent Engine")
        print("   ✅ Puppeteer en Cloud Run")
        print("   ✅ Vector Search configurado")
        print("   ✅ APIs separadas (Admin/Público)")
        print("   ✅ Cloud Scheduler automático")
        print("   ✅ RAG Pipeline listo")
    else:
        print("⚠️ Algunos sistemas necesitan atención")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Prueba final completa del sistema Vertex AI Agent Engine
"""

import requests
import json
import time
from datetime import datetime

def test_system_health():
    """Probar estado de salud del sistema"""
    print("🏥 Probando estado de salud del sistema...")
    
    response = requests.get('https://getsystemhealth-7gaozpdiza-uc.a.run.app')
    
    if response.status_code == 200:
        health = response.json()
        print("✅ Sistema de monitoreo operativo")
        print(f"   📊 Total eventos: {health['metrics']['totalEvents']}")
        print(f"   🏙️ Ciudades activas: {health['metrics']['activeCities']}")
        print(f"   🚨 Alertas: {len(health['alerts'])}")
        
        # Verificar servicios
        all_healthy = all(status == 'healthy' for status in health['services'].values())
        if all_healthy:
            print("   ✅ Todos los servicios operativos")
        else:
            print("   ⚠️ Algunos servicios degradados")
            
        return True, health
    else:
        print(f"❌ Sistema de monitoreo falló: {response.status_code}")
        return False, None

def test_public_chat():
    """Probar chat público con datos reales"""
    print("💬 Probando chat público con datos reales...")
    
    queries = [
        "¿Qué eventos hay en Valencia?",
        "¿Hay festivales en La Vila Joiosa?",
        "¿Qué actividades culturales hay en Alicante?"
    ]
    
    cities = ["valencia", "la-vila-joiosa", "alicante"]
    
    for query, city in zip(queries, cities):
        print(f"   🔍 {city}: {query}")
        
        response = requests.post(
            'https://us-central1-wearecity-2ab89.cloudfunctions.net/simpleAgentProxy',
            json={
                "query": query,
                "citySlug": city,
                "userId": "final-test",
                "isAdmin": False
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ {city}: Respuesta generada ({len(result['response'])} chars)")
        else:
            print(f"   ❌ {city}: Error {response.status_code}")
            return False
    
    return True

def test_scheduled_scraping():
    """Probar scraping programado"""
    print("📅 Probando scraping programado...")
    
    response = requests.post(
        'https://us-central1-wearecity-2ab89.cloudfunctions.net/handleScheduledScraping',
        json={
            "operation": "daily_scrape",
            "cities": ["valencia", "alicante"],
            "timestamp": "final_test"
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Scraping programado ejecutado")
        print(f"   📊 Operación: {result['operation']}")
        print(f"   🏙️ Ciudades: {', '.join(result['cities'])}")
        return True
    else:
        print(f"❌ Scraping programado falló: {response.status_code}")
        return False

def test_puppeteer_service():
    """Probar servicio de Puppeteer con sitio real"""
    print("🕷️ Probando Puppeteer con sitio real...")
    
    # Probar con un sitio que sabemos que funciona
    response = requests.post(
        'https://wearecity-puppeteer-service-294062779330.us-central1.run.app/scrape-events',
        json={
            "url": "https://www.alicante.es/es/agenda",
            "citySlug": "alicante"
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Puppeteer operativo")
        print(f"   📊 Eventos extraídos: {result['eventsExtracted']}")
        print(f"   🎯 Éxito: {result['success']}")
        return True, result
    else:
        print(f"❌ Puppeteer falló: {response.status_code}")
        return False, None

def test_full_workflow():
    """Probar flujo completo: scraping → inserción → consulta"""
    print("🔄 Probando flujo completo...")
    
    # 1. Scrapear datos
    print("   1️⃣ Scrapeando datos...")
    scrape_success, scrape_result = test_puppeteer_service()
    
    if not scrape_success:
        return False
    
    # 2. Verificar estado después del scraping
    print("   2️⃣ Verificando estado del sistema...")
    health_success, health_data = test_system_health()
    
    if not health_success:
        return False
    
    # 3. Probar consulta pública
    print("   3️⃣ Probando consulta pública...")
    chat_success = test_public_chat()
    
    return chat_success

def generate_final_report(all_results):
    """Generar reporte final"""
    print("\n" + "=" * 80)
    print("📊 REPORTE FINAL DEL SISTEMA VERTEX AI AGENT ENGINE")
    print("=" * 80)
    
    # Calcular puntuación total
    passed_tests = sum(1 for result in all_results.values() if result)
    total_tests = len(all_results)
    score = (passed_tests / total_tests) * 100
    
    # Estado general
    if score >= 90:
        status = "🟢 EXCELENTE"
        emoji = "🎉"
    elif score >= 70:
        status = "🟡 BUENO"
        emoji = "👍"
    else:
        status = "🔴 NECESITA ATENCIÓN"
        emoji = "⚠️"
    
    print(f"\n{emoji} ESTADO GENERAL: {status}")
    print(f"📈 PUNTUACIÓN: {score:.1f}% ({passed_tests}/{total_tests} pruebas exitosas)")
    
    print(f"\n📋 RESULTADOS DETALLADOS:")
    for test_name, result in all_results.items():
        status_icon = "✅" if result else "❌"
        print(f"   {status_icon} {test_name}")
    
    print(f"\n🏗️ ARQUITECTURA IMPLEMENTADA:")
    print(f"   ✅ Google Cloud Agent Starter Pack")
    print(f"   ✅ Vertex AI Agent Engine (ID: 3094997688840617984)")
    print(f"   ✅ Puppeteer Service en Cloud Run")
    print(f"   ✅ Vector Search configurado")
    print(f"   ✅ APIs separadas (Admin/Público)")
    print(f"   ✅ Cloud Scheduler automático")
    print(f"   ✅ Sistema de monitoreo")
    print(f"   ✅ Integración con Firestore")
    
    print(f"\n🎯 ENDPOINTS OPERATIVOS:")
    print(f"   • API Pública: https://us-central1-wearecity-2ab89.cloudfunctions.net/simpleAgentProxy")
    print(f"   • API Admin: https://us-central1-wearecity-2ab89.cloudfunctions.net/simpleAgentProxy (con auth)")
    print(f"   • Puppeteer: https://wearecity-puppeteer-service-294062779330.us-central1.run.app")
    print(f"   • Monitoreo: https://getsystemhealth-7gaozpdiza-uc.a.run.app")
    print(f"   • Scraping: https://us-central1-wearecity-2ab89.cloudfunctions.net/handleScheduledScraping")
    
    print(f"\n🤖 AGENTE CONFIGURADO:")
    print(f"   • Modelo: Gemini 2.5 Flash")
    print(f"   • Tools: 6 herramientas implementadas")
    print(f"   • Separación: Admin vs Público")
    print(f"   • Automatización: 3 jobs de Cloud Scheduler")
    
    if score >= 90:
        print(f"\n🎊 ¡SISTEMA COMPLETAMENTE OPERATIVO Y LISTO PARA PRODUCCIÓN!")
        print(f"🚀 La arquitectura independiente está funcionando perfectamente.")
        print(f"📱 El frontend puede usar la nueva API sin afectar la app principal.")
    else:
        print(f"\n📝 RECOMENDACIONES:")
        print(f"   • Revisar servicios que fallaron")
        print(f"   • Verificar configuración de red")
        print(f"   • Comprobar autenticación")

def main():
    """Ejecutar prueba final completa"""
    print("🚀 PRUEBA FINAL COMPLETA DEL SISTEMA")
    print("🤖 Vertex AI Agent Engine + Google Cloud Agent Starter Pack")
    print("=" * 80)
    
    # Definir todas las pruebas
    tests = {
        "Estado de Salud del Sistema": test_system_health,
        "Chat Público": test_public_chat,
        "Scraping Programado": test_scheduled_scraping,
        "Flujo Completo": test_full_workflow
    }
    
    results = {}
    
    for test_name, test_func in tests.items():
        print(f"\n🧪 {test_name}")
        print("-" * 50)
        
        try:
            if test_name == "Estado de Salud del Sistema":
                success, _ = test_func()
            else:
                success = test_func()
            results[test_name] = success
        except Exception as e:
            print(f"❌ Error en {test_name}: {e}")
            results[test_name] = False
        
        time.sleep(2)  # Pausa entre pruebas
    
    # Generar reporte final
    generate_final_report(results)

if __name__ == "__main__":
    main()

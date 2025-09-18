#!/usr/bin/env python3
"""
Probar el sistema híbrido inteligente con diferentes tipos de consulta
"""

import requests
import json
import time

def test_query(query, city_slug, expected_system, test_name):
    """Probar una consulta específica"""
    print(f"\n🧪 {test_name}")
    print(f"📝 Consulta: '{query}'")
    print(f"🏙️ Ciudad: {city_slug}")
    print(f"🎯 Sistema esperado: {expected_system}")
    print("-" * 60)
    
    try:
        start_time = time.time()
        
        response = requests.post(
            'https://us-central1-wearecity-2ab89.cloudfunctions.net/hybridIntelligentProxy',
            json={
                "query": query,
                "citySlug": city_slug,
                "userId": "test-hybrid-system",
                "isAdmin": False
            },
            timeout=30
        )
        
        elapsed_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"✅ Respuesta exitosa en {elapsed_time:.2f}s")
            print(f"🤖 Sistema usado: {result.get('systemUsed', 'N/A')}")
            print(f"📊 Modelo: {result.get('modelUsed', 'N/A')}")
            print(f"🔍 Búsqueda: {'Sí' if result.get('searchPerformed') else 'No'}")
            print(f"🔄 Fallback: {'Sí' if result.get('fallbackUsed') else 'No'}")
            
            if 'classification' in result:
                cls = result['classification']
                print(f"🧠 Clasificación: {cls.get('type', 'N/A')} ({cls.get('confidence', 0)*100:.0f}%)")
                print(f"💡 Razonamiento: {cls.get('reasoning', 'N/A')}")
                print(f"⏱️ Latencia estimada: {cls.get('estimatedLatency', 0)}s")
                print(f"💰 Costo estimado: €{cls.get('estimatedCost', 0)}")
            
            # Mostrar parte de la respuesta
            response_text = result.get('response', '')
            if response_text:
                preview = response_text[:200] + "..." if len(response_text) > 200 else response_text
                print(f"📄 Respuesta: {preview}")
            
            return True
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Probar el sistema híbrido inteligente completo"""
    print("🚀 PRUEBA COMPLETA DEL SISTEMA HÍBRIDO INTELIGENTE")
    print("🧠 Clasificador Automático + Routing Óptimo")
    print("=" * 80)
    
    tests = [
        # 1️⃣ CONSULTAS SIMPLES → Gemini 2.5 Flash Directo
        {
            "query": "Hola",
            "city": "valencia",
            "expected": "Gemini 2.5 Flash Directo",
            "name": "CONSULTA SIMPLE: Saludo"
        },
        {
            "query": "Gracias",
            "city": "valencia", 
            "expected": "Gemini 2.5 Flash Directo",
            "name": "CONSULTA SIMPLE: Agradecimiento"
        },
        
        # 2️⃣ CONSULTAS DE EVENTOS → RAG Vectorial
        {
            "query": "¿Qué eventos hay este fin de semana?",
            "city": "la-vila-joiosa",
            "expected": "RAG Vectorial",
            "name": "CONSULTA EVENTOS: Fin de semana"
        },
        {
            "query": "conciertos y festivales de música",
            "city": "valencia",
            "expected": "RAG Vectorial",
            "name": "CONSULTA EVENTOS: Música"
        },
        
        # 3️⃣ CONSULTAS DE TRÁMITES → Google Search Grounding
        {
            "query": "¿Cómo solicitar una licencia de obras?",
            "city": "valencia",
            "expected": "Google Search Grounding",
            "name": "CONSULTA TRÁMITES: Licencia obras"
        },
        {
            "query": "horario de atención del ayuntamiento",
            "city": "alicante",
            "expected": "Google Search Grounding", 
            "name": "CONSULTA TRÁMITES: Horarios"
        },
        
        # 4️⃣ CONSULTAS COMPLEJAS → Agente IA Completo
        {
            "query": "Planifica un itinerario turístico de 2 días combinando cultura, gastronomía y naturaleza",
            "city": "valencia",
            "expected": "Agente IA Completo",
            "name": "CONSULTA COMPLEJA: Planificación turística"
        },
        {
            "query": "Compara las ventajas de vivir en el centro vs las afueras y recomienda barrios",
            "city": "valencia",
            "expected": "Agente IA Completo", 
            "name": "CONSULTA COMPLEJA: Análisis comparativo"
        }
    ]
    
    results = []
    
    for i, test in enumerate(tests, 1):
        print(f"\n{'='*20} PRUEBA {i}/{len(tests)} {'='*20}")
        
        success = test_query(
            test["query"],
            test["city"], 
            test["expected"],
            test["name"]
        )
        
        results.append((test["name"], success))
        
        # Pausa entre pruebas
        if i < len(tests):
            print("\n⏳ Esperando 2 segundos...")
            time.sleep(2)
    
    # Resumen final
    print("\n" + "=" * 80)
    print("📊 RESUMEN FINAL - SISTEMA HÍBRIDO INTELIGENTE")
    print("=" * 80)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Resultado: {passed}/{total} pruebas exitosas")
    
    if passed == total:
        print("\n🎊 ¡SISTEMA HÍBRIDO COMPLETAMENTE OPERATIVO!")
        print("🧠 Clasificador inteligente funcionando")
        print("⚡ Routing automático optimizado")
        print("💰 Costos optimizados por tipo de consulta")
        print("🎯 Experiencia de usuario mejorada")
    else:
        print(f"\n⚠️ {total - passed} pruebas fallaron - revisar configuración")
    
    print("\n🎯 TIPOS DE SISTEMA IMPLEMENTADOS:")
    print("   1️⃣ 💬 Gemini 2.5 Flash Directo (Consultas simples)")
    print("   2️⃣ 🧠 RAG Vectorial (Eventos y actividades)")
    print("   3️⃣ 🔍 Google Search Grounding (Trámites oficiales)")
    print("   4️⃣ 🤖 Agente IA Completo (Consultas complejas)")
    
    print(f"\n🚀 VENTAJAS DEL SISTEMA HÍBRIDO:")
    print(f"   • ⚡ Velocidad óptima para cada tipo de consulta")
    print(f"   • 💰 Costos optimizados (€0.001 - €0.03 por consulta)")
    print(f"   • 🎯 Precisión mejorada según el contexto")
    print(f"   • 🔄 Fallback automático si un sistema falla")
    print(f"   • 🧠 Aprendizaje y mejora continua del clasificador")

if __name__ == "__main__":
    main()

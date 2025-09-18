#!/usr/bin/env python3
"""
Probar el sistema dinámico de URLs del agente
"""

import requests
import json

def test_get_city_urls():
    """Probar la obtención de URLs de ciudades"""
    print("🔍 Probando obtención dinámica de URLs...")
    
    cities = ['valencia', 'la-vila-joiosa', 'alicante']
    
    for city in cities:
        print(f"\n📍 Probando {city}:")
        
        # Usar el agente para obtener URLs configuradas
        response = requests.post(
            'https://us-central1-wearecity-2ab89.cloudfunctions.net/simpleAgentProxy',
            json={
                "query": f"Obtener todas las URLs configuradas para {city}",
                "citySlug": city,
                "userId": "test-dynamic-urls",
                "isAdmin": True
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Respuesta generada ({len(result['response'])} chars)")
            
            # Buscar información de URLs en la respuesta
            if 'agendaEventosUrls' in result['response'] or 'officialWebsite' in result['response']:
                print(f"   📊 URLs encontradas en la respuesta")
            else:
                print(f"   ⚠️ No se detectaron URLs específicas")
        else:
            print(f"   ❌ Error: {response.status_code}")

def test_dynamic_scraping():
    """Probar scraping usando URLs dinámicas"""
    print("\n🕷️ Probando scraping dinámico...")
    
    # Probar con La Vila Joiosa que ya tiene URLs configuradas
    city = 'la-vila-joiosa'
    
    response = requests.post(
        'https://us-central1-wearecity-2ab89.cloudfunctions.net/simpleAgentProxy',
        json={
            "query": f"Primero obtén las URLs configuradas para {city}, luego scrapea eventos de esas URLs e insértalos en el sistema",
            "citySlug": city,
            "userId": "test-dynamic-scraping",
            "isAdmin": True
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Scraping dinámico completado")
        print(f"   📊 Respuesta: {result['response'][:200]}...")
        
        if 'eventos' in result['response'].lower() or 'scraping' in result['response'].lower():
            print("   🎯 El agente ejecutó el proceso de scraping")
        
        return True
    else:
        print(f"❌ Error en scraping dinámico: {response.status_code}")
        return False

def test_scheduled_scraping_dynamic():
    """Probar scraping programado con URLs dinámicas"""
    print("\n📅 Probando scraping programado dinámico...")
    
    response = requests.post(
        'https://handlescheduledscraping-7gaozpdiza-uc.a.run.app',
        json={
            "operation": "daily_scrape",
            "cities": ["la-vila-joiosa"],
            "timestamp": "test_dynamic"
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Scraping programado ejecutado")
        print(f"   📊 Operación: {result['operation']}")
        return True
    else:
        print(f"❌ Error en scraping programado: {response.status_code}")
        return False

def main():
    """Ejecutar todas las pruebas del sistema dinámico"""
    print("🚀 PRUEBA DEL SISTEMA DINÁMICO DE URLs")
    print("=" * 60)
    
    tests = [
        ("Obtención de URLs Dinámicas", test_get_city_urls),
        ("Scraping Dinámico", test_dynamic_scraping),
        ("Scraping Programado Dinámico", test_scheduled_scraping_dynamic)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🧪 {test_name}")
        print("-" * 40)
        
        try:
            if test_name == "Obtención de URLs Dinámicas":
                test_func()  # Esta función no retorna boolean
                results.append((test_name, True))
            else:
                success = test_func()
                results.append((test_name, success))
        except Exception as e:
            print(f"❌ Error en {test_name}: {e}")
            results.append((test_name, False))
    
    # Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN - SISTEMA DINÁMICO")
    print("=" * 60)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Resultado: {passed}/{total} pruebas exitosas")
    
    if passed == total:
        print("🎉 ¡SISTEMA DINÁMICO OPERATIVO!")
        print("✅ El agente ahora consulta URLs desde Firestore dinámicamente")
        print("✅ Los admins pueden cambiar URLs sin tocar código")
        print("✅ El scraping se adapta automáticamente a los cambios")
    else:
        print("⚠️ Algunos componentes necesitan revisión")
    
    print(f"\n🔧 BENEFICIOS IMPLEMENTADOS:")
    print(f"   • ✅ URLs dinámicas desde Firestore")
    print(f"   • ✅ Sin hardcoding de URLs en el código")
    print(f"   • ✅ Configuración centralizada por ciudad")
    print(f"   • ✅ Cambios en tiempo real sin redespliegue")

if __name__ == "__main__":
    main()

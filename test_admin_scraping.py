#!/usr/bin/env python3
"""
Probar el flujo completo de scraping administrativo
"""

import requests
import json
import sys

# Agregar el path del agente
sys.path.insert(0, '/Users/tonillorens/Desktop/wearecity_app/wearecity-agent/.venv/lib/python3.12/site-packages')

try:
    import firebase_admin
    from firebase_admin import auth
    
    print("✅ Firebase Admin importado correctamente")
except ImportError as e:
    print(f"❌ Error importando Firebase Admin: {e}")
    sys.exit(1)

def get_admin_token():
    """Obtener token de SuperAdmin para pruebas"""
    try:
        # Inicializar Firebase Admin si no está inicializado
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        # Crear un token personalizado para el usuario SuperAdmin
        # UID del SuperAdmin: xsIn2UTSPxd1kMLr1WHpPTQ1gs33
        custom_token = auth.create_custom_token('xsIn2UTSPxd1kMLr1WHpPTQ1gs33')
        
        print("✅ Token de SuperAdmin creado")
        return custom_token.decode('utf-8')
        
    except Exception as e:
        print(f"❌ Error creando token: {e}")
        return None

def test_admin_scraping():
    """Probar scraping administrativo completo"""
    print("🔧 Probando flujo de scraping administrativo...")
    
    # Obtener token de admin
    token = get_admin_token()
    if not token:
        print("❌ No se pudo obtener token de admin")
        return False
    
    # Probar scraping + inserción
    response = requests.post(
        'https://us-central1-wearecity-2ab89.cloudfunctions.net/simpleAgentProxy',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        },
        json={
            "query": "Scrapear eventos de https://www.alicante.es/es/agenda para alicante e insertarlos en el sistema",
            "citySlug": "alicante",
            "userId": "admin-test",
            "isAdmin": True
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Scraping administrativo exitoso")
        print(f"   Respuesta: {result['response'][:200]}...")
        return True
    else:
        print(f"❌ Scraping administrativo falló: {response.status_code}")
        print(f"   Error: {response.text}")
        return False

def test_admin_stats():
    """Probar obtención de estadísticas administrativas"""
    print("📊 Probando estadísticas administrativas...")
    
    # Obtener token de admin
    token = get_admin_token()
    if not token:
        print("❌ No se pudo obtener token de admin")
        return False
    
    # Probar estadísticas
    response = requests.post(
        'https://us-central1-wearecity-2ab89.cloudfunctions.net/simpleAgentProxy',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        },
        json={
            "query": "Obtener estadísticas completas del sistema RAG para todas las ciudades",
            "citySlug": "all",
            "userId": "admin-test",
            "isAdmin": True
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Estadísticas administrativas exitosas")
        print(f"   Respuesta: {result['response'][:200]}...")
        return True
    else:
        print(f"❌ Estadísticas administrativas fallaron: {response.status_code}")
        print(f"   Error: {response.text}")
        return False

def test_public_query():
    """Probar consulta pública después de tener datos"""
    print("👤 Probando consulta pública con datos reales...")
    
    response = requests.post(
        'https://us-central1-wearecity-2ab89.cloudfunctions.net/simpleAgentProxy',
        headers={'Content-Type': 'application/json'},
        json={
            "query": "¿Qué eventos hay en Valencia esta semana?",
            "citySlug": "valencia",
            "userId": "public-test",
            "isAdmin": False
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Consulta pública exitosa")
        print(f"   Respuesta: {result['response'][:200]}...")
        return True
    else:
        print(f"❌ Consulta pública falló: {response.status_code}")
        print(f"   Error: {response.text}")
        return False

def main():
    """Ejecutar todas las pruebas administrativas"""
    print("🚀 PRUEBA COMPLETA DEL FLUJO ADMINISTRATIVO")
    print("=" * 60)
    
    tests = [
        ("Scraping Administrativo", test_admin_scraping),
        ("Estadísticas Administrativas", test_admin_stats),
        ("Consulta Pública", test_public_query)
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
    
    # Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE PRUEBAS ADMINISTRATIVAS")
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
        print("🎉 ¡FLUJO ADMINISTRATIVO COMPLETO OPERATIVO!")
    else:
        print("⚠️ Algunos componentes necesitan atención")

if __name__ == "__main__":
    main()

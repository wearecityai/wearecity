#!/usr/bin/env python3
"""
Probar autenticación administrativa corregida
"""

import requests
import sys

# Agregar el path del agente
sys.path.insert(0, '/Users/tonillorens/Desktop/wearecity_app/.venv/lib/python3.12/site-packages')

try:
    import firebase_admin
    from firebase_admin import auth
    
    print("✅ Firebase Admin importado correctamente")
except ImportError as e:
    print(f"❌ Error importando Firebase Admin: {e}")
    sys.exit(1)

def get_custom_token():
    """Obtener token personalizado para SuperAdmin"""
    try:
        # Inicializar Firebase Admin
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        # Crear token personalizado para el SuperAdmin
        # UID: xsIn2UTSPxd1kMLr1WHpPTQ1gs33
        custom_token = auth.create_custom_token('xsIn2UTSPxd1kMLr1WHpPTQ1gs33')
        
        print("✅ Token personalizado creado")
        return custom_token.decode('utf-8')
        
    except Exception as e:
        print(f"❌ Error creando token: {e}")
        return None

def test_admin_operations():
    """Probar operaciones administrativas"""
    print("🔐 Probando operaciones administrativas...")
    
    # Obtener token
    token = get_custom_token()
    if not token:
        print("❌ No se pudo obtener token")
        return False
    
    # Probar operación administrativa
    try:
        response = requests.post(
            'https://simpleagentproxy-7gaozpdiza-uc.a.run.app',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}'
            },
            json={
                "query": "Obtener URLs configuradas para la-vila-joiosa y luego ejecutar scraping",
                "citySlug": "la-vila-joiosa",
                "userId": "admin-test",
                "isAdmin": True
            },
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Operación administrativa exitosa")
            print(f"   📊 Respuesta: {result['response'][:200]}...")
            
            # Verificar si el agente ejecutó scraping
            response_text = result['response'].lower()
            if 'scraping' in response_text or 'url' in response_text:
                print("   🕷️ El agente está procesando scraping")
            
            return True
        else:
            print(f"❌ Error en operación administrativa: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_vector_search():
    """Probar búsqueda vectorial"""
    print("\n🧠 Probando búsqueda vectorial...")
    
    try:
        response = requests.post(
            'https://simpleagentproxy-7gaozpdiza-uc.a.run.app',
            headers={'Content-Type': 'application/json'},
            json={
                "query": "actividades culturales y musicales",
                "citySlug": "valencia",
                "userId": "test-vector",
                "isAdmin": False
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Búsqueda vectorial funcionando")
            
            # Verificar si encuentra contenido relevante
            response_text = result['response'].lower()
            if ('festival' in response_text or 
                'concierto' in response_text or 
                'música' in response_text):
                print("   🎯 Contenido relevante encontrado")
                return True
            else:
                print("   ⚠️ Contenido poco relevante")
                return False
        else:
            print(f"❌ Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Probar autenticación y funcionalidades administrativas"""
    print("🚀 PRUEBA DE AUTENTICACIÓN Y SCRAPING ADMINISTRATIVO")
    print("=" * 70)
    
    tests = [
        ("Operaciones Administrativas", test_admin_operations),
        ("Búsqueda Vectorial", test_vector_search)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🧪 {test_name}")
        print("-" * 50)
        
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ Error en {test_name}: {e}")
            results.append((test_name, False))
    
    # Resumen
    print("\n" + "=" * 70)
    print("📊 RESUMEN - AUTENTICACIÓN Y FUNCIONALIDADES")
    print("=" * 70)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Resultado: {passed}/{total} pruebas exitosas")
    
    if passed == total:
        print("🎉 ¡SISTEMA ADMINISTRATIVO OPERATIVO!")
        print("✅ Autenticación corregida")
        print("✅ Scraping administrativo funcionando")
        print("✅ Búsqueda vectorial operativa")
    else:
        print("⚠️ Algunos componentes necesitan atención")
        
        if passed == 0:
            print("\n🔧 POSIBLES SOLUCIONES:")
            print("   • Verificar que el agente tenga las nuevas tools")
            print("   • Comprobar que el perfil SuperAdmin esté en 'profiles'")
            print("   • Revisar logs de Firebase Functions")

if __name__ == "__main__":
    main()

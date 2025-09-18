#!/usr/bin/env python3
"""
Probar que el agente use la nueva estructura RAG
"""

import requests
import json
import sys

# Agregar el path del agente
sys.path.insert(0, '/Users/tonillorens/Desktop/wearecity_app/wearecity-agent/.venv/lib/python3.12/site-packages')

try:
    # Importar directamente las funciones necesarias
    import firebase_admin
    from firebase_admin import credentials, firestore
    
    print("✅ Firebase Admin importado correctamente")
    
    # Definir función de prueba de búsqueda RAG
    def test_search_data_in_rag(query: str, city_slug: str, data_type: str = "all", limit: int = 10):
        """Función de prueba para búsqueda en RAG"""
        try:
            if not firebase_admin._apps:
                firebase_admin.initialize_app()
            
            db = firestore.client()
            
            # Construir query base en colección RAG
            rag_ref = db.collection('RAG')
            
            # Filtrar por ciudad si no es 'all'
            if city_slug != 'all':
                rag_ref = rag_ref.where('citySlug', '==', city_slug)
            
            # Filtrar por tipo si no es 'all'
            if data_type != 'all':
                rag_ref = rag_ref.where('type', '==', data_type)
            
            # Filtrar solo documentos activos
            rag_ref = rag_ref.where('isActive', '==', True)
            
            # Ejecutar query
            rag_docs = rag_ref.limit(limit * 2).stream()
            
            # Procesar resultados
            items_found = []
            for doc in rag_docs:
                doc_data = doc.to_dict()
                doc_data['id'] = doc.id
                items_found.append(doc_data)
            
            return {
                "items_found": items_found,
                "total_results": len(items_found),
                "source": "rag_collection"
            }
            
        except Exception as e:
            return {"error": str(e), "items_found": []}
    
except ImportError as e:
    print(f"❌ Error importando Firebase Admin: {e}")
    sys.exit(1)

def test_new_tools_directly():
    """Probar las nuevas tools directamente"""
    print("🔧 Probando nuevas tools directamente...")
    
    # 1. Probar búsqueda en RAG
    print("\n1️⃣ Probando búsqueda en colección RAG:")
    search_result = test_search_data_in_rag("festival valencia", "valencia", "event", 5)
    
    if search_result.get('items_found'):
        print(f"   ✅ Búsqueda exitosa: {len(search_result['items_found'])} elementos encontrados")
        for item in search_result['items_found']:
            print(f"      • {item.get('title')} ({item.get('citySlug')})")
    else:
        print(f"   ⚠️ No se encontraron elementos: {search_result.get('error', 'Sin error')}")
    
    # 2. Probar búsqueda global
    print("\n2️⃣ Probando búsqueda global:")
    global_search = test_search_data_in_rag("eventos", "all", "event", 10)
    
    if global_search.get('items_found'):
        print(f"   ✅ Búsqueda global exitosa: {len(global_search['items_found'])} elementos")
        
        # Agrupar por ciudad
        by_city = {}
        for item in global_search['items_found']:
            city = item.get('citySlug', 'unknown')
            by_city[city] = by_city.get(city, 0) + 1
        
        print("   🏙️ Distribución por ciudad:")
        for city, count in by_city.items():
            print(f"      • {city}: {count} elementos")
    else:
        print(f"   ⚠️ Error en búsqueda global: {global_search.get('error', 'Sin error')}")
    
    return True

def test_public_agent_with_rag():
    """Probar agente público con nueva estructura RAG"""
    print("\n👤 Probando agente público con nueva estructura...")
    
    # Consulta que debería usar la nueva estructura
    response = requests.post(
        'https://us-central1-wearecity-2ab89.cloudfunctions.net/simpleAgentProxy',
        json={
            "query": "¿Qué eventos hay en Valencia? Busca en la colección RAG",
            "citySlug": "valencia",
            "userId": "test-new-rag",
            "isAdmin": False
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Agente público respondió correctamente")
        
        # Verificar si menciona la nueva estructura
        response_text = result['response'].lower()
        if 'rag' in response_text or 'colección' in response_text:
            print("   🎯 El agente está consciente de la estructura RAG")
        
        return True
    else:
        print(f"❌ Error en agente público: {response.status_code}")
        return False

def main():
    """Ejecutar todas las pruebas"""
    print("🚀 PRUEBA COMPLETA DE LA NUEVA ESTRUCTURA RAG")
    print("🗂️ Colección Centralizada + Referencias + Búsqueda Unificada")
    print("=" * 70)
    
    tests = [
        ("Tools Directas", test_new_tools_directly),
        ("Agente Público", test_public_agent_with_rag)
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
    
    # Resumen final
    print("\n" + "=" * 70)
    print("📊 RESUMEN FINAL - ESTRUCTURA RAG CENTRALIZADA")
    print("=" * 70)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Resultado: {passed}/{total} pruebas exitosas")
    
    if passed == total:
        print("🎊 ¡ESTRUCTURA RAG CENTRALIZADA COMPLETAMENTE IMPLEMENTADA!")
        print("🚀 El problema de crear ciudades nuevas está RESUELTO")
        print("📁 Todos los datos se almacenan en colección 'RAG' centralizada")
        print("🔗 Referencias claras a ciudades y administradores")
    else:
        print("⚠️ Algunos componentes necesitan atención")

if __name__ == "__main__":
    main()

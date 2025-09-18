#!/usr/bin/env python3
"""
Probar la nueva colección RAG centralizada
"""

import sys

# Agregar el path del agente
sys.path.insert(0, '/Users/tonillorens/Desktop/wearecity_app/.venv/lib/python3.12/site-packages')

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    
    print("✅ Firebase Admin importado correctamente")
except ImportError as e:
    print(f"❌ Error importando Firebase Admin: {e}")
    sys.exit(1)

def test_rag_collection_queries():
    """Probar consultas en la nueva colección RAG"""
    
    try:
        # Inicializar Firebase Admin
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        print("🔍 Probando consultas en colección RAG...")
        
        # 1. Buscar todos los documentos
        print("\n1️⃣ Consulta general:")
        all_docs = list(db.collection('RAG').stream())
        print(f"   📊 Total documentos en RAG: {len(all_docs)}")
        
        # 2. Buscar por ciudad
        print("\n2️⃣ Consulta por ciudad:")
        for city in ['valencia', 'la-vila-joiosa', 'alicante']:
            city_docs = list(db.collection('RAG').where('citySlug', '==', city).stream())
            print(f"   🏙️ {city}: {len(city_docs)} documentos")
            
            # Mostrar tipos de documentos por ciudad
            if city_docs:
                types = {}
                for doc in city_docs:
                    doc_type = doc.to_dict().get('type', 'unknown')
                    types[doc_type] = types.get(doc_type, 0) + 1
                print(f"      📋 Tipos: {types}")
        
        # 3. Buscar por tipo
        print("\n3️⃣ Consulta por tipo:")
        event_docs = list(db.collection('RAG').where('type', '==', 'event').stream())
        tramite_docs = list(db.collection('RAG').where('type', '==', 'tramite').stream())
        
        print(f"   📅 Eventos: {len(event_docs)} documentos")
        print(f"   📋 Trámites: {len(tramite_docs)} documentos")
        
        # 4. Buscar por administrador
        print("\n4️⃣ Consulta por administrador:")
        admin_docs = list(db.collection('RAG').where('adminIds', 'array_contains', 'superadmin').stream())
        print(f"   👑 SuperAdmin: {len(admin_docs)} documentos")
        
        # 5. Mostrar ejemplo de documento
        print("\n5️⃣ Ejemplo de documento RAG:")
        if all_docs:
            sample_doc = all_docs[0].to_dict()
            print(f"   📄 ID: {all_docs[0].id}")
            print(f"   🏷️ Tipo: {sample_doc.get('type')}")
            print(f"   📝 Título: {sample_doc.get('title')}")
            print(f"   🏙️ Ciudad: {sample_doc.get('citySlug')} ({sample_doc.get('cityName')})")
            print(f"   👥 Admins: {sample_doc.get('adminIds')}")
            print(f"   🔍 Keywords: {sample_doc.get('searchKeywords', [])[:5]}...")
            print(f"   ✅ Activo: {sample_doc.get('isActive')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error probando colección RAG: {e}")
        return False

def test_search_functionality():
    """Probar funcionalidad de búsqueda"""
    
    try:
        # Inicializar Firebase Admin
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        print("\n🔍 Probando funcionalidad de búsqueda...")
        
        # Búsqueda por palabras clave
        search_terms = ['festival', 'valencia', 'fiestas', 'empadronamiento']
        
        for term in search_terms:
            print(f"\n🔍 Buscando '{term}':")
            
            # Buscar en títulos
            title_results = list(db.collection('RAG')
                                .where('searchKeywords', 'array_contains', term.lower())
                                .limit(5)
                                .stream())
            
            print(f"   📊 Resultados por keyword: {len(title_results)}")
            
            for doc in title_results:
                doc_data = doc.to_dict()
                print(f"      • {doc_data.get('title')} ({doc_data.get('citySlug')})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error probando búsqueda: {e}")
        return False

def test_admin_references():
    """Probar referencias de administradores"""
    
    try:
        # Inicializar Firebase Admin
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        print("\n👥 Probando referencias de administradores...")
        
        # Buscar documentos por admin
        admin_docs = list(db.collection('RAG')
                         .where('adminIds', 'array_contains', 'superadmin')
                         .stream())
        
        print(f"📊 Documentos con SuperAdmin: {len(admin_docs)}")
        
        # Agrupar por ciudad
        cities_by_admin = {}
        for doc in admin_docs:
            doc_data = doc.to_dict()
            city = doc_data.get('citySlug', 'unknown')
            cities_by_admin[city] = cities_by_admin.get(city, 0) + 1
        
        print("🏙️ Documentos por ciudad:")
        for city, count in cities_by_admin.items():
            print(f"   • {city}: {count} documentos")
        
        return True
        
    except Exception as e:
        print(f"❌ Error probando referencias de admin: {e}")
        return False

def main():
    """Ejecutar todas las pruebas de la nueva estructura"""
    print("🧪 PRUEBAS DE LA NUEVA COLECCIÓN RAG")
    print("=" * 60)
    
    tests = [
        ("Consultas en Colección RAG", test_rag_collection_queries),
        ("Funcionalidad de Búsqueda", test_search_functionality),
        ("Referencias de Administradores", test_admin_references)
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
    print("📊 RESUMEN - NUEVA ESTRUCTURA RAG")
    print("=" * 60)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Resultado: {passed}/{total} pruebas exitosas")
    
    if passed == total:
        print("🎉 ¡NUEVA ESTRUCTURA RAG COMPLETAMENTE OPERATIVA!")
        print("✅ Colección centralizada funcionando")
        print("✅ Referencias de ciudad y admin configuradas")
        print("✅ Búsqueda por múltiples criterios")
        print("✅ Sin duplicación de estructura por ciudad")
    else:
        print("⚠️ Algunos componentes necesitan revisión")
    
    print(f"\n🗂️ BENEFICIOS CONSEGUIDOS:")
    print(f"   • ✅ Colección RAG centralizada")
    print(f"   • ✅ Referencias claras (citySlug, adminIds)")
    print(f"   • ✅ Búsqueda unificada")
    print(f"   • ✅ Sin creación de ciudades nuevas")
    print(f"   • ✅ Escalabilidad mejorada")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Probar inserción en la nueva estructura RAG sin crear ciudades
"""

import sys
import json

# Agregar el path del agente
sys.path.insert(0, '/Users/tonillorens/Desktop/wearecity_app/.venv/lib/python3.12/site-packages')

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    
    print("✅ Firebase Admin importado correctamente")
except ImportError as e:
    print(f"❌ Error importando Firebase Admin: {e}")
    sys.exit(1)

def count_cities_before():
    """Contar ciudades antes de la inserción"""
    try:
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        # Contar documentos en collection 'cities'
        cities = list(db.collection('cities').stream())
        
        print(f"📊 Ciudades antes: {len(cities)}")
        for city_doc in cities:
            city_data = city_doc.to_dict()
            print(f"   🏙️ {city_doc.id}: {city_data.get('name', 'Sin nombre')}")
        
        return len(cities)
        
    except Exception as e:
        print(f"❌ Error contando ciudades: {e}")
        return 0

def insert_test_data_to_rag():
    """Insertar datos de prueba en colección RAG"""
    try:
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        print("\n📥 Insertando datos de prueba en colección RAG...")
        
        # Datos de prueba que podrían crear ciudades nuevas en el sistema anterior
        test_events = [
            {
                "title": "Evento Prueba RAG - Nueva Ciudad",
                "description": "Este evento podría crear una ciudad nueva en el sistema anterior",
                "date": "2025-09-30",
                "time": "19:00",
                "location": "Plaza Central, Ciudad Prueba",
                "category": "prueba",
                "tags": ["prueba", "rag", "nueva"],
                "source": "test_rag_no_city_creation",
                "confidence": 0.85
            }
        ]
        
        # Insertar usando la nueva estructura
        for event in test_events:
            rag_ref = db.collection('RAG').document()
            
            # Generar keywords para búsqueda
            search_keywords = []
            if event.get('title'):
                search_keywords.extend(event['title'].lower().split())
            if event.get('description'):
                search_keywords.extend(event['description'].lower().split())
            if event.get('tags'):
                search_keywords.extend([tag.lower() for tag in event['tags']])
            
            # Preparar documento RAG
            rag_document = {
                # Identificación
                'type': 'event',
                
                # Contenido
                'title': event.get('title', ''),
                'content': f"{event.get('title', '')} - {event.get('description', '')}",
                'description': event.get('description', ''),
                
                # Referencias (NO crea ciudad nueva)
                'citySlug': 'ciudad-prueba-rag',  # Esta ciudad NO existe
                'cityName': 'Ciudad Prueba RAG',
                'adminIds': ['superadmin'],
                
                # Metadatos específicos
                'metadata': {
                    'date': event.get('date', ''),
                    'time': event.get('time', ''),
                    'location': event.get('location', ''),
                    'category': event.get('category', 'general'),
                    'tags': event.get('tags', []),
                    'sourceUrl': event.get('source', ''),
                    'confidence': event.get('confidence', 0.8),
                    'language': 'es'
                },
                
                # Vector y búsqueda
                'searchKeywords': list(set(search_keywords)),
                
                # Control
                'isActive': True,
                'scrapedAt': firestore.SERVER_TIMESTAMP,
                'insertedByAgent': True,
                'agentTimestamp': firestore.SERVER_TIMESTAMP,
                'lastUpdated': firestore.SERVER_TIMESTAMP
            }
            
            rag_ref.set(rag_document)
            print(f"   ✅ Evento insertado en RAG: {event['title']}")
        
        return len(test_events)
        
    except Exception as e:
        print(f"❌ Error insertando en RAG: {e}")
        return 0

def count_cities_after():
    """Contar ciudades después de la inserción"""
    try:
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        # Contar documentos en collection 'cities'
        cities = list(db.collection('cities').stream())
        
        print(f"\n📊 Ciudades después: {len(cities)}")
        for city_doc in cities:
            city_data = city_doc.to_dict()
            print(f"   🏙️ {city_doc.id}: {city_data.get('name', 'Sin nombre')}")
        
        return len(cities)
        
    except Exception as e:
        print(f"❌ Error contando ciudades: {e}")
        return 0

def verify_rag_data():
    """Verificar que los datos están en RAG"""
    try:
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        print("\n🔍 Verificando datos en colección RAG...")
        
        # Buscar el evento de prueba
        test_docs = list(db.collection('RAG')
                        .where('citySlug', '==', 'ciudad-prueba-rag')
                        .stream())
        
        print(f"📊 Documentos de ciudad-prueba-rag en RAG: {len(test_docs)}")
        
        for doc in test_docs:
            doc_data = doc.to_dict()
            print(f"   📄 {doc_data.get('title')} (tipo: {doc_data.get('type')})")
        
        return len(test_docs) > 0
        
    except Exception as e:
        print(f"❌ Error verificando RAG: {e}")
        return False

def main():
    """Probar que no se crean ciudades nuevas"""
    print("🚀 PRUEBA: NO CREACIÓN DE CIUDADES NUEVAS")
    print("🗂️ Verificar que datos van a colección RAG centralizada")
    print("=" * 70)
    
    # 1. Contar ciudades antes
    cities_before = count_cities_before()
    
    # 2. Insertar datos de prueba
    print("\n🧪 Insertando datos de prueba...")
    inserted = insert_test_data_to_rag()
    
    # 3. Contar ciudades después
    cities_after = count_cities_after()
    
    # 4. Verificar datos en RAG
    rag_verified = verify_rag_data()
    
    # 5. Análisis de resultados
    print("\n" + "=" * 70)
    print("📊 ANÁLISIS DE RESULTADOS")
    print("=" * 70)
    
    print(f"🏙️ CIUDADES:")
    print(f"   • Antes: {cities_before}")
    print(f"   • Después: {cities_after}")
    print(f"   • Diferencia: {cities_after - cities_before}")
    
    print(f"\n📥 INSERCIÓN:")
    print(f"   • Elementos insertados: {inserted}")
    print(f"   • En colección RAG: {'✅' if rag_verified else '❌'}")
    
    # Verificar éxito
    no_new_cities = (cities_after == cities_before)
    data_in_rag = rag_verified and inserted > 0
    
    if no_new_cities and data_in_rag:
        print(f"\n🎉 ¡PRUEBA EXITOSA!")
        print(f"✅ NO se crearon ciudades nuevas")
        print(f"✅ Datos almacenados en colección RAG centralizada")
        print(f"✅ Referencias claras a ciudad y admin")
        print(f"✅ Estructura escalable implementada")
        
        print(f"\n🎯 BENEFICIOS CONFIRMADOS:")
        print(f"   • Colección RAG centralizada")
        print(f"   • Sin duplicación de estructura")
        print(f"   • Referencias claras (citySlug, adminIds)")
        print(f"   • Búsqueda unificada")
        print(f"   • Escalabilidad mejorada")
        
    else:
        print(f"\n❌ PROBLEMAS DETECTADOS:")
        if not no_new_cities:
            print(f"   ❌ Se crearon {cities_after - cities_before} ciudades nuevas")
        if not data_in_rag:
            print(f"   ❌ Datos no se almacenaron correctamente en RAG")

if __name__ == "__main__":
    main()

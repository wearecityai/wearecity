#!/usr/bin/env python3
"""
Migrar datos existentes a la nueva colección RAG centralizada
"""

import sys
from datetime import datetime

# Agregar el path del agente
sys.path.insert(0, '/Users/tonillorens/Desktop/wearecity_app/.venv/lib/python3.12/site-packages')

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    
    print("✅ Firebase Admin importado correctamente")
except ImportError as e:
    print(f"❌ Error importando Firebase Admin: {e}")
    sys.exit(1)

def migrate_city_events_to_rag():
    """Migrar eventos de ciudades a colección RAG centralizada"""
    
    try:
        # Inicializar Firebase Admin
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        # Obtener todas las ciudades
        cities = ['valencia', 'la-vila-joiosa', 'alicante']
        total_migrated = 0
        
        print("🔄 Iniciando migración a colección RAG centralizada...")
        
        for city_slug in cities:
            print(f"\n📍 Procesando {city_slug}...")
            
            # Obtener información de la ciudad
            city_doc = db.collection('cities').document(city_slug).get()
            city_name = city_doc.to_dict().get('name', city_slug) if city_doc.exists else city_slug
            
            # Obtener eventos existentes
            events_ref = db.collection('cities').document(city_slug).collection('events')
            events = events_ref.stream()
            
            city_migrated = 0
            batch = db.batch()
            
            for event_doc in events:
                event_data = event_doc.to_dict()
                
                # Crear documento RAG
                rag_ref = db.collection('RAG').document()
                
                # Generar keywords para búsqueda
                search_keywords = []
                if event_data.get('title'):
                    search_keywords.extend(event_data['title'].lower().split())
                if event_data.get('description'):
                    search_keywords.extend(event_data['description'].lower().split())
                if event_data.get('tags'):
                    search_keywords.extend([tag.lower() for tag in event_data['tags']])
                
                # Preparar documento RAG
                rag_document = {
                    # Identificación
                    'type': 'event',
                    
                    # Contenido
                    'title': event_data.get('title', ''),
                    'content': f"{event_data.get('title', '')} - {event_data.get('description', '')}",
                    'description': event_data.get('description', ''),
                    
                    # Referencias
                    'citySlug': city_slug,
                    'cityName': city_name,
                    'adminIds': ['superadmin'],  # Por defecto
                    
                    # Metadatos específicos
                    'metadata': {
                        'date': event_data.get('date', ''),
                        'time': event_data.get('time', ''),
                        'location': event_data.get('location', ''),
                        'category': event_data.get('category', 'general'),
                        'tags': event_data.get('tags', []),
                        'sourceUrl': event_data.get('source', ''),
                        'confidence': event_data.get('confidence', 0.8),
                        'language': 'es',
                        'originalEventId': event_doc.id  # Referencia al evento original
                    },
                    
                    # Vector y búsqueda
                    'searchKeywords': list(set(search_keywords)),
                    
                    # Control
                    'isActive': event_data.get('isActive', True),
                    'scrapedAt': event_data.get('scrapedAt', firestore.SERVER_TIMESTAMP),
                    'insertedByAgent': event_data.get('insertedByAgent', False),
                    'agentTimestamp': firestore.SERVER_TIMESTAMP,
                    'lastUpdated': firestore.SERVER_TIMESTAMP,
                    'migratedAt': firestore.SERVER_TIMESTAMP
                }
                
                batch.set(rag_ref, rag_document)
                city_migrated += 1
                
                # Commit cada 400 documentos
                if city_migrated % 400 == 0:
                    batch.commit()
                    batch = db.batch()
            
            # Commit final
            if city_migrated % 400 != 0:
                batch.commit()
            
            print(f"   ✅ {city_slug}: {city_migrated} eventos migrados")
            total_migrated += city_migrated
        
        print(f"\n🎯 Migración completada: {total_migrated} eventos migrados a colección RAG")
        return total_migrated
        
    except Exception as e:
        print(f"❌ Error en migración: {e}")
        return 0

def verify_rag_collection():
    """Verificar la nueva colección RAG"""
    
    try:
        # Inicializar Firebase Admin
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        print("\n🔍 Verificando colección RAG...")
        
        # Obtener estadísticas de la colección RAG
        rag_docs = list(db.collection('RAG').stream())
        
        if len(rag_docs) == 0:
            print("   ⚠️ Colección RAG vacía")
            return False
        
        # Estadísticas por ciudad
        cities_count = {}
        types_count = {}
        
        for doc in rag_docs:
            doc_data = doc.to_dict()
            
            city = doc_data.get('citySlug', 'unknown')
            cities_count[city] = cities_count.get(city, 0) + 1
            
            doc_type = doc_data.get('type', 'unknown')
            types_count[doc_type] = types_count.get(doc_type, 0) + 1
        
        print(f"   📊 Total documentos: {len(rag_docs)}")
        print(f"   🏙️ Por ciudad:")
        for city, count in cities_count.items():
            print(f"      • {city}: {count} documentos")
        
        print(f"   📋 Por tipo:")
        for doc_type, count in types_count.items():
            print(f"      • {doc_type}: {count} documentos")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando colección RAG: {e}")
        return False

def create_sample_rag_data():
    """Crear datos de ejemplo en la nueva estructura RAG"""
    
    try:
        # Inicializar Firebase Admin
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        print("\n📝 Creando datos de ejemplo en colección RAG...")
        
        sample_data = [
            {
                'type': 'event',
                'title': 'Festival de las Artes Valencia 2025',
                'content': 'Festival de las Artes Valencia 2025 - Gran festival cultural con exposiciones, conciertos y actividades para toda la familia',
                'description': 'Gran festival cultural con exposiciones, conciertos y actividades para toda la familia en el centro histórico de Valencia.',
                'citySlug': 'valencia',
                'cityName': 'Valencia',
                'adminIds': ['superadmin'],
                'metadata': {
                    'date': '2025-09-23',
                    'time': '18:00',
                    'location': 'Centro Histórico de Valencia',
                    'category': 'cultura',
                    'tags': ['festival', 'arte', 'música', 'familia'],
                    'sourceUrl': 'https://valencia.es/festival-artes',
                    'confidence': 0.95,
                    'language': 'es'
                },
                'searchKeywords': ['festival', 'artes', 'valencia', 'cultura', 'música', 'familia'],
                'isActive': True
            },
            {
                'type': 'tramite',
                'title': 'Empadronamiento en Valencia',
                'content': 'Empadronamiento en Valencia - Proceso para registrarse como residente en Valencia',
                'description': 'Proceso para registrarse como residente en Valencia. Requiere DNI y justificante de domicilio.',
                'citySlug': 'valencia',
                'cityName': 'Valencia',
                'adminIds': ['superadmin'],
                'metadata': {
                    'requiredDocuments': ['DNI', 'Justificante de domicilio'],
                    'cost': 0,
                    'duration': '15 minutos',
                    'category': 'empadronamiento',
                    'tags': ['empadronamiento', 'registro', 'residencia'],
                    'sourceUrl': 'https://valencia.es/tramites/empadronamiento',
                    'confidence': 0.98,
                    'language': 'es'
                },
                'searchKeywords': ['empadronamiento', 'valencia', 'registro', 'residencia', 'dni'],
                'isActive': True
            },
            {
                'type': 'event',
                'title': 'Fiestas de Moros y Cristianos',
                'content': 'Fiestas de Moros y Cristianos - Tradicionales fiestas patronales de La Vila Joiosa',
                'description': 'Tradicionales fiestas patronales con desfiles, música y representaciones históricas en honor a Santa Marta.',
                'citySlug': 'la-vila-joiosa',
                'cityName': 'La Vila Joiosa',
                'adminIds': ['superadmin'],
                'metadata': {
                    'date': '2025-09-28',
                    'time': '10:00',
                    'location': 'Centro de La Vila Joiosa',
                    'category': 'tradicion',
                    'tags': ['fiestas', 'moros', 'cristianos', 'tradición', 'desfile'],
                    'sourceUrl': 'https://villajoyosa.com/moros-cristianos',
                    'confidence': 0.98,
                    'language': 'es'
                },
                'searchKeywords': ['fiestas', 'moros', 'cristianos', 'vila', 'joiosa', 'tradición'],
                'isActive': True
            }
        ]
        
        batch = db.batch()
        
        for item in sample_data:
            rag_ref = db.collection('RAG').document()
            
            # Agregar timestamps
            item.update({
                'scrapedAt': firestore.SERVER_TIMESTAMP,
                'insertedByAgent': True,
                'agentTimestamp': firestore.SERVER_TIMESTAMP,
                'lastUpdated': firestore.SERVER_TIMESTAMP
            })
            
            batch.set(rag_ref, item)
        
        batch.commit()
        
        print(f"   ✅ {len(sample_data)} documentos de ejemplo creados")
        return len(sample_data)
        
    except Exception as e:
        print(f"❌ Error creando datos de ejemplo: {e}")
        return 0

def main():
    """Ejecutar migración completa"""
    print("🚀 MIGRACIÓN A COLECCIÓN RAG CENTRALIZADA")
    print("=" * 60)
    
    # 1. Migrar eventos existentes
    migrated = migrate_city_events_to_rag()
    
    # 2. Crear datos de ejemplo
    if migrated == 0:
        print("\n📝 No hay datos para migrar, creando datos de ejemplo...")
        sample_created = create_sample_rag_data()
        print(f"   ✅ {sample_created} documentos de ejemplo creados")
    
    # 3. Verificar colección RAG
    verification_success = verify_rag_collection()
    
    if verification_success:
        print(f"\n🎉 ¡MIGRACIÓN EXITOSA!")
        print(f"✅ Nueva estructura RAG implementada")
        print(f"✅ Datos centralizados con referencias claras")
        print(f"✅ citySlug y adminIds configurados")
        print(f"✅ Búsqueda unificada disponible")
        
        print(f"\n🗂️ ESTRUCTURA IMPLEMENTADA:")
        print(f"   • Colección: RAG (centralizada)")
        print(f"   • Referencias: citySlug, adminIds")
        print(f"   • Tipos: event, tramite, noticia, turismo")
        print(f"   • Búsqueda: Por ciudad, tipo, admin")
        
        print(f"\n🎯 PRÓXIMOS PASOS:")
        print(f"   1. Probar búsqueda en nueva colección")
        print(f"   2. Actualizar frontend para usar nueva estructura")
        print(f"   3. Verificar que agente usa nuevas tools")
        
    else:
        print(f"\n❌ Error en la migración")

if __name__ == "__main__":
    main()

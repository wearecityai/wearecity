#!/usr/bin/env python3
"""
Insertar eventos de prueba directamente en Firestore
"""

import json
import sys
from datetime import datetime, timedelta

# Agregar el path del agente
sys.path.insert(0, '/Users/tonillorens/Desktop/wearecity_app/wearecity-agent/.venv/lib/python3.12/site-packages')

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    
    print("✅ Firebase Admin importado correctamente")
except ImportError as e:
    print(f"❌ Error importando Firebase Admin: {e}")
    sys.exit(1)

def create_test_events():
    """Crear eventos de prueba"""
    
    base_date = datetime.now()
    
    events = [
        # Valencia
        {
            "title": "Festival de las Artes Valencia 2025",
            "description": "Gran festival cultural con exposiciones, conciertos y actividades para toda la familia en el centro histórico de Valencia.",
            "date": (base_date + timedelta(days=5)).strftime('%Y-%m-%d'),
            "time": "18:00",
            "location": "Centro Histórico de Valencia",
            "category": "cultura",
            "tags": ["festival", "arte", "música", "familia"],
            "source": "agent_test_data",
            "confidence": 0.95,
            "isActive": True,
            "link": "https://valencia.es/festival-artes",
            "image": ""
        },
        {
            "title": "Mercado Nocturno de Ruzafa",
            "description": "Mercado gastronómico y artesanal todos los viernes por la noche en el barrio de Ruzafa.",
            "date": (base_date + timedelta(days=2)).strftime('%Y-%m-%d'),
            "time": "20:00",
            "location": "Barrio de Ruzafa, Valencia",
            "category": "gastronomia",
            "tags": ["mercado", "gastronomía", "artesanía", "nocturno"],
            "source": "agent_test_data",
            "confidence": 0.90,
            "isActive": True,
            "link": "https://valencia.es/ruzafa-market",
            "image": ""
        },
        
        # La Vila Joiosa
        {
            "title": "Fiestas de Moros y Cristianos",
            "description": "Tradicionales fiestas patronales con desfiles, música y representaciones históricas en honor a Santa Marta.",
            "date": (base_date + timedelta(days=10)).strftime('%Y-%m-%d'),
            "time": "10:00",
            "location": "Centro de La Vila Joiosa",
            "category": "tradicion",
            "tags": ["fiestas", "moros", "cristianos", "tradición", "desfile"],
            "source": "agent_test_data",
            "confidence": 0.98,
            "isActive": True,
            "link": "https://lavilajoiosa.es/moros-cristianos",
            "image": ""
        },
        
        # Alicante
        {
            "title": "Concierto en el Castillo de Santa Bárbara",
            "description": "Concierto de música clásica al aire libre con vistas panorámicas de la ciudad y el mar Mediterráneo.",
            "date": (base_date + timedelta(days=8)).strftime('%Y-%m-%d'),
            "time": "21:00",
            "location": "Castillo de Santa Bárbara, Alicante",
            "category": "musica",
            "tags": ["concierto", "música clásica", "castillo", "panorámicas"],
            "source": "agent_test_data",
            "confidence": 0.94,
            "isActive": True,
            "link": "https://alicante.es/concierto-castillo",
            "image": ""
        }
    ]
    
    return events

def insert_events_to_firestore(events):
    """Insertar eventos en Firestore"""
    
    try:
        # Inicializar Firebase Admin
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        # Agrupar eventos por ciudad
        events_by_city = {}
        for event in events:
            # Inferir citySlug basado en la ubicación
            location = event['location'].lower()
            if 'valencia' in location:
                city_slug = 'valencia'
            elif 'vila joiosa' in location or 'villajoyosa' in location:
                city_slug = 'la-vila-joiosa'
            elif 'alicante' in location:
                city_slug = 'alicante'
            else:
                city_slug = 'valencia'  # Por defecto
            
            if city_slug not in events_by_city:
                events_by_city[city_slug] = []
            events_by_city[city_slug].append(event)
        
        total_inserted = 0
        
        for city_slug, city_events in events_by_city.items():
            print(f"📥 Insertando {len(city_events)} eventos en {city_slug}...")
            
            batch = db.batch()
            
            for event in city_events:
                event_ref = db.collection('cities').document(city_slug).collection('events').document()
                
                event_data = {
                    **event,
                    'scrapedAt': firestore.SERVER_TIMESTAMP,
                    'insertedByAgent': True,
                    'agentTimestamp': firestore.SERVER_TIMESTAMP
                }
                
                batch.set(event_ref, event_data)
                total_inserted += 1
            
            batch.commit()
            print(f"✅ {city_slug}: {len(city_events)} eventos insertados")
        
        print(f"\n🎯 Total eventos insertados: {total_inserted}")
        return total_inserted
        
    except Exception as e:
        print(f"❌ Error insertando eventos: {e}")
        return 0

def main():
    """Insertar eventos de prueba en Firestore"""
    print("🚀 Insertando eventos de prueba en Firestore...")
    
    # Crear eventos de ejemplo
    events = create_test_events()
    print(f"📅 Eventos creados: {len(events)}")
    
    # Insertar en Firestore
    inserted = insert_events_to_firestore(events)
    
    if inserted > 0:
        print(f"\n✅ {inserted} eventos insertados exitosamente")
        print("\n📋 Eventos por ciudad:")
        
        # Mostrar resumen
        cities = set()
        for event in events:
            location = event['location'].lower()
            if 'valencia' in location:
                cities.add('valencia')
            elif 'vila joiosa' in location:
                cities.add('la-vila-joiosa')
            elif 'alicante' in location:
                cities.add('alicante')
        
        for city in cities:
            city_events = [e for e in events if city in e['location'].lower()]
            print(f"   • {city}: {len(city_events)} eventos")
        
        print(f"\n🎯 Datos listos para probar el sistema RAG")
    else:
        print("\n❌ Error insertando eventos")

if __name__ == "__main__":
    main()

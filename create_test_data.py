#!/usr/bin/env python3
"""
Crear datos de prueba para el sistema RAG de WeareCity
"""

import json
import sys
import os
from datetime import datetime, timedelta

# Agregar el path del agente
sys.path.insert(0, '/Users/tonillorens/Desktop/wearecity_app/wearecity-agent/.venv/lib/python3.12/site-packages')

try:
    import vertexai
    from google.cloud import storage
    from vertexai.language_models import TextEmbeddingModel
    
    print("✅ Dependencias importadas correctamente")
except ImportError as e:
    print(f"❌ Error importando dependencias: {e}")
    sys.exit(1)

def create_sample_events():
    """Crear eventos de ejemplo para diferentes ciudades"""
    
    base_date = datetime.now()
    
    events = [
        # Valencia
        {
            "title": "Festival de las Artes Valencia 2025",
            "description": "Gran festival cultural con exposiciones, conciertos y actividades para toda la familia en el centro histórico de Valencia.",
            "date": (base_date + timedelta(days=5)).isoformat(),
            "location": "Centro Histórico de Valencia",
            "citySlug": "valencia",
            "category": "cultura",
            "tags": ["festival", "arte", "música", "familia"],
            "source": "test_data",
            "confidence": 0.95
        },
        {
            "title": "Mercado Nocturno de Ruzafa",
            "description": "Mercado gastronómico y artesanal todos los viernes por la noche en el barrio de Ruzafa.",
            "date": (base_date + timedelta(days=2)).isoformat(),
            "location": "Barrio de Ruzafa, Valencia",
            "citySlug": "valencia",
            "category": "gastronomia",
            "tags": ["mercado", "gastronomía", "artesanía", "nocturno"],
            "source": "test_data",
            "confidence": 0.90
        },
        
        # La Vila Joiosa
        {
            "title": "Fiestas de Moros y Cristianos",
            "description": "Tradicionales fiestas patronales con desfiles, música y representaciones históricas en honor a Santa Marta.",
            "date": (base_date + timedelta(days=10)).isoformat(),
            "location": "Centro de La Vila Joiosa",
            "citySlug": "la-vila-joiosa",
            "category": "tradicion",
            "tags": ["fiestas", "moros", "cristianos", "tradición", "desfile"],
            "source": "test_data",
            "confidence": 0.98
        },
        {
            "title": "Ruta del Chocolate",
            "description": "Visitas guiadas a las fábricas de chocolate tradicionales de La Vila Joiosa con degustaciones.",
            "date": (base_date + timedelta(days=7)).isoformat(),
            "location": "Fábricas de Chocolate, La Vila Joiosa",
            "citySlug": "la-vila-joiosa",
            "category": "turismo",
            "tags": ["chocolate", "visita", "degustación", "tradición"],
            "source": "test_data",
            "confidence": 0.92
        },
        
        # Alicante
        {
            "title": "Concierto en el Castillo de Santa Bárbara",
            "description": "Concierto de música clásica al aire libre con vistas panorámicas de la ciudad y el mar Mediterráneo.",
            "date": (base_date + timedelta(days=8)).isoformat(),
            "location": "Castillo de Santa Bárbara, Alicante",
            "citySlug": "alicante",
            "category": "musica",
            "tags": ["concierto", "música clásica", "castillo", "panorámicas"],
            "source": "test_data",
            "confidence": 0.94
        },
        {
            "title": "Mercado Central de Alicante",
            "description": "Mercado tradicional con productos locales, tapas y actividades gastronómicas todos los sábados.",
            "date": (base_date + timedelta(days=3)).isoformat(),
            "location": "Mercado Central, Alicante",
            "citySlug": "alicante",
            "category": "gastronomia",
            "tags": ["mercado", "productos locales", "tapas", "sábados"],
            "source": "test_data",
            "confidence": 0.88
        }
    ]
    
    return events

def create_sample_documents():
    """Crear documentos RAG de ejemplo"""
    
    documents = [
        {
            "title": "Guía de Trámites Municipales Valencia",
            "content": """
# Guía de Trámites Municipales - Valencia

## Horarios de Atención
- **Lunes a Viernes**: 8:00 - 14:00
- **Sábados**: 9:00 - 13:00 (solo urgencias)

## Trámites Principales

### 📋 Empadronamiento
- **Documentos**: DNI, contrato de alquiler/escritura
- **Tiempo**: 15 minutos
- **Cita previa**: Recomendada

### 🏠 Licencias de Obra
- **Documentos**: Proyecto técnico, DNI propietario
- **Tiempo**: 30-60 días
- **Tasas**: Según m² de construcción

### 🚗 Zona Azul
- **Horario**: Lunes a Viernes 9:00-14:00 y 16:00-20:00
- **Tarifas**: 1,20€/hora centro, 0,80€/hora periferia
- **App**: Valencia Parking

## Contacto
- **Teléfono**: 96 352 54 78
- **Web**: valencia.es
- **Presencial**: Plaza del Ayuntamiento, 1
            """,
            "citySlug": "valencia",
            "category": "tramites",
            "tags": ["trámites", "ayuntamiento", "documentación", "horarios"],
            "source": "test_data",
            "url": "https://valencia.es/tramites"
        },
        {
            "title": "Información Turística La Vila Joiosa",
            "content": """
# Información Turística - La Vila Joiosa

## Lugares de Interés

### 🏰 Patrimonio Histórico
- **Torres de Defensa**: Siglo XVI, vistas al mar
- **Iglesia Fortaleza**: Arquitectura única defensiva
- **Casas de Colores**: Icónico paisaje urbano

### 🍫 Ruta del Chocolate
- **Valor Chocolate**: Fábrica histórica desde 1881
- **Clavileño**: Tradición familiar centenaria
- **Pérez**: Innovación y tradición

### 🏖️ Playas
- **Playa Centro**: Bandera Azul, servicios completos
- **Playa Paraíso**: Aguas cristalinas, ideal familias
- **Calas del Torres**: Naturaleza virgen

## Eventos Tradicionales
- **Moros y Cristianos**: Julio (Santa Marta)
- **Chocolate a la Taza**: Diciembre
- **Semana Santa Marinera**: Procesiones únicas

## Información Práctica
- **Oficina Turismo**: Plaza de la Generalitat, 1
- **Teléfono**: 96 685 13 71
- **Web**: lavilajoiosa.es
            """,
            "citySlug": "la-vila-joiosa",
            "category": "turismo",
            "tags": ["turismo", "patrimonio", "chocolate", "playas", "tradiciones"],
            "source": "test_data",
            "url": "https://lavilajoiosa.es/turismo"
        },
        {
            "title": "Servicios Municipales Alicante",
            "content": """
# Servicios Municipales - Alicante

## Transporte Público

### 🚌 Autobuses TAM
- **Líneas**: 24 líneas urbanas
- **Horario**: 6:00 - 23:30 (algunas hasta 1:00)
- **Tarifa**: 1,45€ (Tarjeta TAM: 1,05€)
- **App**: TAM Alicante

### 🚋 TRAM Metropolitano
- **Líneas**: L1, L2, L3, L4, L9
- **Conexiones**: Benidorm, Denia, El Campello
- **Frecuencia**: 15-20 minutos

## Servicios Digitales

### 💻 Sede Electrónica
- **Web**: sede.alicante.es
- **Certificado digital**: Requerido
- **Trámites online**: 80% disponibles

### 📱 App Alicante
- **Incidencias**: Reportar problemas urbanos
- **Cita previa**: Todos los servicios
- **Información**: Eventos, noticias, servicios

## Emergencias y Contactos
- **Emergencias**: 112
- **Policía Local**: 092
- **Bomberos**: 085
- **Ayuntamiento**: 96 514 91 00

## Horarios Municipales
- **Atención Ciudadana**: L-V 8:30-13:30
- **Registro**: L-V 8:30-13:30
- **Padrón**: L-V 8:30-13:30, L-J 16:00-18:00
            """,
            "citySlug": "alicante",
            "category": "servicios",
            "tags": ["servicios", "transporte", "digital", "emergencias", "horarios"],
            "source": "test_data",
            "url": "https://alicante.es/servicios"
        }
    ]
    
    return documents

def upload_to_vector_search(events, documents):
    """Subir datos al Vector Search de Vertex AI"""
    
    try:
        PROJECT_ID = "wearecity-2ab89"
        LOCATION = "us-central1"
        BUCKET_NAME = f"{PROJECT_ID}-wearecity-agent-vs"
        
        print(f"📤 Subiendo datos a Vector Search...")
        print(f"   Project: {PROJECT_ID}")
        print(f"   Bucket: {BUCKET_NAME}")
        
        # Inicializar cliente de Storage
        storage_client = storage.Client(project=PROJECT_ID)
        bucket = storage_client.bucket(BUCKET_NAME)
        
        # Crear archivo JSONL con eventos
        events_jsonl = []
        for i, event in enumerate(events):
            events_jsonl.append({
                "id": f"event_{i}",
                "content": f"{event['title']} - {event['description']} - {event['location']} - {', '.join(event['tags'])}",
                "metadata": event
            })
        
        # Crear archivo JSONL con documentos
        docs_jsonl = []
        for i, doc in enumerate(documents):
            docs_jsonl.append({
                "id": f"doc_{i}",
                "content": f"{doc['title']}\n{doc['content']}",
                "metadata": doc
            })
        
        # Combinar eventos y documentos
        all_data = events_jsonl + docs_jsonl
        
        # Crear archivo JSONL
        jsonl_content = '\n'.join([json.dumps(item, ensure_ascii=False) for item in all_data])
        
        # Subir a Cloud Storage
        blob_name = f"test_data/wearecity_test_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"
        blob = bucket.blob(blob_name)
        blob.upload_from_string(jsonl_content, content_type='application/json')
        
        print(f"✅ Datos subidos exitosamente a gs://{BUCKET_NAME}/{blob_name}")
        print(f"   📊 Total items: {len(all_data)}")
        print(f"   📅 Eventos: {len(events)}")
        print(f"   📄 Documentos: {len(documents)}")
        
        return f"gs://{BUCKET_NAME}/{blob_name}"
        
    except Exception as e:
        print(f"❌ Error subiendo datos: {e}")
        return None

def main():
    """Crear y subir datos de prueba"""
    print("🚀 Creando datos de prueba para Vector Search...")
    
    # Crear datos de ejemplo
    events = create_sample_events()
    documents = create_sample_documents()
    
    print(f"📅 Eventos creados: {len(events)}")
    print(f"📄 Documentos creados: {len(documents)}")
    
    # Subir a Vector Search
    file_path = upload_to_vector_search(events, documents)
    
    if file_path:
        print(f"\n🎯 Datos de prueba listos en: {file_path}")
        print("\n📋 Próximo paso: Ejecutar pipeline de indexación")
        print("   Comando: cd wearecity-agent && make data-ingestion")
    else:
        print("\n❌ Error creando datos de prueba")

if __name__ == "__main__":
    main()

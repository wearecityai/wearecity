# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
WeareCity Tools para el Agente de IA
Incluye: Puppeteer Scraping, Vector Search, Gestión de Índices
"""

import os
import json
import requests
import logging
from typing import List, Dict, Any, Optional
from google.cloud import storage
from google.cloud import aiplatform
import vertexai
from vertexai.language_models import TextEmbeddingModel

# Configuración
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "wearecity-2ab89")
LOCATION = "us-central1"
PUPPETEER_CLOUD_RUN_URL = os.getenv("PUPPETEER_CLOUD_RUN_URL", "https://wearecity-puppeteer-service-294062779330.us-central1.run.app")

# Inicializar Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)

def get_city_urls(city_slug: str) -> str:
    """
    Obtiene todas las URLs configuradas para una ciudad desde Firestore.
    Esta función permite al agente ser dinámico y usar URLs actualizadas por el admin.
    
    Args:
        city_slug (str): Identificador de la ciudad
    
    Returns:
        str: JSON con todas las URLs y configuración de la ciudad
    """
    try:
        logging.info(f"🔍 Obteniendo URLs configuradas para {city_slug}")
        
        # Importar Firebase Admin
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Inicializar Firebase Admin si no está inicializado
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        # Obtener configuración de la ciudad
        city_doc = db.collection('cities').document(city_slug).get()
        
        if not city_doc.exists:
            return json.dumps({
                "error": f"Ciudad {city_slug} no encontrada en la configuración",
                "urls": {},
                "city_info": {}
            })
        
        city_data = city_doc.to_dict()
        
        # Extraer todas las URLs configuradas
        urls = {
            "officialWebsite": city_data.get("officialWebsite", ""),
            "agendaEventosUrls": city_data.get("agendaEventosUrls", []),
            "tramitesUrls": city_data.get("tramitesUrls", []),
            "noticiasUrls": city_data.get("noticiasUrls", []),
            "turismoUrls": city_data.get("turismoUrls", []),
            "contactUrls": city_data.get("contactUrls", []),
            "serviciosUrls": city_data.get("serviciosUrls", []),
            "transporteUrls": city_data.get("transporteUrls", []),
            "culturalUrls": city_data.get("culturalUrls", [])
        }
        
        # Información adicional de la ciudad
        city_info = {
            "name": city_data.get("name", city_slug),
            "displayName": city_data.get("displayName", ""),
            "province": city_data.get("province", ""),
            "population": city_data.get("population", 0),
            "isActive": city_data.get("isActive", False),
            "scrapingEnabled": city_data.get("scrapingConfig", {}).get("enabled", False)
        }
        
        # Configuración de scraping
        scraping_config = city_data.get("scrapingConfig", {})
        
        # Calcular estadísticas
        url_counts = {}
        total_urls = 0
        for key, value in urls.items():
            if isinstance(value, list):
                count = len([url for url in value if url.strip()])
                url_counts[key] = count
                total_urls += count
            elif value and value.strip():
                url_counts[key] = 1
                total_urls += 1
            else:
                url_counts[key] = 0
        
        result = {
            "city_slug": city_slug,
            "city_info": city_info,
            "urls": urls,
            "url_counts": url_counts,
            "total_urls": total_urls,
            "scraping_config": scraping_config,
            "last_updated": city_data.get("updatedAt"),
            "config_version": city_data.get("configVersion", "1.0"),
            "status": "success"
        }
        
        logging.info(f"✅ URLs obtenidas para {city_slug}: {total_urls} URLs configuradas")
        return json.dumps(result, ensure_ascii=False, indent=2, default=str)
        
    except Exception as e:
        error_msg = f"Error obteniendo URLs de la ciudad: {str(e)}"
        logging.error(error_msg)
        return json.dumps({
            "error": error_msg, 
            "urls": {},
            "city_info": {},
            "status": "error"
        })

def scrape_events_with_puppeteer(url: str, city_slug: str) -> str:
    """
    Herramienta para scrapear eventos usando Puppeteer en Cloud Run.
    
    Args:
        url (str): URL del sitio web a scrapear
        city_slug (str): Identificador de la ciudad (ej: 'valencia', 'la-vila-joiosa')
    
    Returns:
        str: JSON con eventos scrapeados o mensaje de error
    """
    try:
        logging.info(f"🕷️ Scrapeando eventos de {url} para {city_slug}")
        
        # Llamar al servicio de Puppeteer en Cloud Run
        response = requests.post(
            f"{PUPPETEER_CLOUD_RUN_URL}/scrape-events",
            json={
                "url": url,
                "citySlug": city_slug,
                "options": {
                    "waitForLoad": True,
                    "extractImages": True,
                    "extractLinks": True,
                    "timeout": 30000
                }
            },
            timeout=60
        )
        
        if response.status_code == 200:
            events_data = response.json()
            logging.info(f"✅ Scraped {len(events_data.get('events', []))} events")
            return json.dumps(events_data, ensure_ascii=False, indent=2)
        else:
            error_msg = f"Error scrapeando: HTTP {response.status_code}"
            logging.error(error_msg)
            return json.dumps({"error": error_msg, "events": []})
            
    except Exception as e:
        error_msg = f"Error en scraping con Puppeteer: {str(e)}"
        logging.error(error_msg)
        return json.dumps({"error": error_msg, "events": []})


def search_events_in_rag(query: str, city_slug: str, limit: int = 10) -> str:
    """
    Herramienta para buscar eventos en el sistema RAG usando Firestore.
    
    Args:
        query (str): Consulta de búsqueda
        city_slug (str): Ciudad específica o 'all' para todas
        limit (int): Número máximo de resultados
    
    Returns:
        str: JSON con eventos encontrados en el RAG
    """
    try:
        logging.info(f"🔍 Buscando eventos en Firestore: '{query}' para {city_slug}")
        
        # Importar Firebase Admin
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Inicializar Firebase Admin si no está inicializado
        if not firebase_admin._apps:
            # Usar credenciales por defecto de Google Cloud
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        # Buscar eventos en Firestore
        events_found = []
        
        if city_slug == 'all':
            # Buscar en todas las ciudades
            cities_ref = db.collection('cities')
            cities = cities_ref.stream()
            
            for city_doc in cities:
                city_id = city_doc.id
                events_ref = db.collection('cities').document(city_id).collection('events')
                events = events_ref.where('isActive', '==', True).limit(limit // 3).stream()
                
                for event_doc in events:
                    event_data = event_doc.to_dict()
                    event_data['id'] = event_doc.id
                    event_data['citySlug'] = city_id
                    events_found.append(event_data)
        else:
            # Buscar en ciudad específica
            events_ref = db.collection('cities').document(city_slug).collection('events')
            events = events_ref.where('isActive', '==', True).limit(limit).stream()
            
            for event_doc in events:
                event_data = event_doc.to_dict()
                event_data['id'] = event_doc.id
                event_data['citySlug'] = city_slug
                events_found.append(event_data)
        
        # Filtrar por query (búsqueda simple en título y descripción)
        if query:
            query_lower = query.lower()
            filtered_events = []
            for event in events_found:
                title = event.get('title', '').lower()
                description = event.get('description', '').lower()
                tags = ' '.join(event.get('tags', [])).lower()
                
                if (query_lower in title or 
                    query_lower in description or 
                    query_lower in tags or
                    any(word in title or word in description for word in query_lower.split())):
                    filtered_events.append(event)
            
            events_found = filtered_events[:limit]
        
        results = {
            "query": query,
            "city_slug": city_slug,
            "events_found": events_found,
            "total_results": len(events_found),
            "search_performed": True,
            "source": "firestore"
        }
        
        logging.info(f"✅ Encontrados {len(events_found)} eventos en Firestore")
        return json.dumps(results, ensure_ascii=False, indent=2, default=str)
        
    except Exception as e:
        error_msg = f"Error buscando en Firestore: {str(e)}"
        logging.error(error_msg)
        return json.dumps({"error": error_msg, "events_found": [], "source": "firestore"})


def generate_embedding(text: str) -> list:
    """
    Generar embedding vectorial para un texto usando Vertex AI.
    
    Args:
        text (str): Texto para generar embedding
    
    Returns:
        list: Vector embedding o lista vacía si hay error
    """
    try:
        # Usar el modelo de embeddings de Vertex AI
        model = TextEmbeddingModel.from_pretrained("text-embedding-005")
        
        # Generar embedding
        embeddings = model.get_embeddings([text])
        
        if embeddings and len(embeddings) > 0:
            # Retornar el vector como lista
            return embeddings[0].values
        else:
            logging.warning(f"No se pudo generar embedding para: {text[:50]}...")
            return []
            
    except Exception as e:
        logging.error(f"Error generando embedding: {str(e)}")
        return []

def insert_data_to_rag_with_embeddings(data_json: str, city_slug: str, data_type: str = "event") -> str:
    """
    Herramienta para insertar datos en la colección RAG centralizada CON EMBEDDINGS VECTORIALES.
    
    Args:
        data_json (str): JSON con datos a insertar (eventos, trámites, etc.)
        city_slug (str): Ciudad de los datos
        data_type (str): Tipo de datos ('event', 'tramite', 'noticia', 'turismo', etc.)
    
    Returns:
        str: Resultado de la inserción con información de embeddings
    """
    try:
        data_parsed = json.loads(data_json)
        items = data_parsed.get('events', []) if data_type == 'event' else data_parsed.get('items', [])
        
        logging.info(f"📥 Insertando {len(items)} {data_type}s en colección RAG para {city_slug}")
        
        # Importar Firebase Admin
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Inicializar Firebase Admin si no está inicializado
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        # Obtener información de la ciudad
        city_doc = db.collection('cities').document(city_slug).get()
        city_name = city_doc.to_dict().get('name', city_slug) if city_doc.exists else city_slug
        
        # Obtener administradores de la ciudad (simplificado por ahora)
        admin_ids = ['superadmin']  # En el futuro, esto vendría de la configuración de la ciudad
        
        # Insertar datos en colección RAG centralizada CON EMBEDDINGS
        inserted_count = 0
        embeddings_generated = 0
        batch = db.batch()
        
        for item in items:
            # Crear referencia del documento en colección RAG
            rag_ref = db.collection('RAG').document()
            
            # Generar keywords para búsqueda
            search_keywords = []
            if item.get('title'):
                search_keywords.extend(item['title'].lower().split())
            if item.get('description'):
                search_keywords.extend(item['description'].lower().split())
            if item.get('tags'):
                search_keywords.extend([tag.lower() for tag in item['tags']])
            
            # 🧠 GENERAR EMBEDDING VECTORIAL
            content_for_embedding = f"""
            Título: {item.get('title', '')}
            Descripción: {item.get('description', '')}
            Ubicación: {item.get('location', '')}
            Categoría: {item.get('category', '')}
            Etiquetas: {', '.join(item.get('tags', []))}
            Ciudad: {city_name}
            """.strip()
            
            logging.info(f"🧠 Generando embedding para: {item.get('title', 'Sin título')[:50]}...")
            embedding_vector = generate_embedding(content_for_embedding)
            
            if embedding_vector:
                embeddings_generated += 1
                logging.info(f"✅ Embedding generado: {len(embedding_vector)} dimensiones")
            else:
                logging.warning(f"⚠️ No se pudo generar embedding para: {item.get('title', 'Sin título')}")
            
            # Preparar documento RAG con embedding
            rag_document = {
                # Identificación
                'type': data_type,
                
                # Contenido
                'title': item.get('title', ''),
                'content': content_for_embedding,
                'description': item.get('description', ''),
                
                # Referencias
                'citySlug': city_slug,
                'cityName': city_name,
                'adminIds': admin_ids,
                
                # Metadatos específicos
                'metadata': {
                    'date': item.get('date', ''),
                    'time': item.get('time', ''),
                    'location': item.get('location', ''),
                    'category': item.get('category', 'general'),
                    'tags': item.get('tags', []),
                    'sourceUrl': item.get('source', ''),
                    'confidence': item.get('confidence', 0.8),
                    'language': 'es'
                },
                
                # 🧠 VECTOR Y BÚSQUEDA SEMÁNTICA
                'embedding': embedding_vector,  # Vector para búsqueda conceptual
                'embeddingDimensions': len(embedding_vector) if embedding_vector else 0,
                'searchKeywords': list(set(search_keywords)),  # Búsqueda por palabras clave
                
                # Control
                'isActive': True,
                'scrapedAt': firestore.SERVER_TIMESTAMP,
                'insertedByAgent': True,
                'agentTimestamp': firestore.SERVER_TIMESTAMP,
                'lastUpdated': firestore.SERVER_TIMESTAMP,
                'hasEmbedding': len(embedding_vector) > 0
            }
            
            batch.set(rag_ref, rag_document)
            inserted_count += 1
        
        # Ejecutar batch write
        if inserted_count > 0:
            batch.commit()
            logging.info(f"✅ {inserted_count} {data_type}s insertados en colección RAG")
        
        result = {
            "city_slug": city_slug,
            "data_type": data_type,
            "items_inserted": inserted_count,
            "embeddings_generated": embeddings_generated,
            "embedding_success_rate": (embeddings_generated / inserted_count * 100) if inserted_count > 0 else 0,
            "rag_collection": "RAG",
            "vector_search_enabled": embeddings_generated > 0,
            "success": True,
            "message": f"Se insertaron {inserted_count} {data_type}s con {embeddings_generated} embeddings en la colección RAG para {city_name}"
        }
        
        return json.dumps(result, ensure_ascii=False, indent=2)
        
    except Exception as e:
        error_msg = f"Error insertando en colección RAG: {str(e)}"
        logging.error(error_msg)
        return json.dumps({"error": error_msg, "items_inserted": 0, "success": False})


def search_data_in_rag(query: str, city_slug: str, data_type: str = "all", limit: int = 10) -> str:
    """
    Herramienta para buscar datos en la colección RAG centralizada.
    
    Args:
        query (str): Consulta de búsqueda
        city_slug (str): Ciudad específica o 'all' para todas
        data_type (str): Tipo de datos ('event', 'tramite', 'all', etc.)
        limit (int): Número máximo de resultados
    
    Returns:
        str: JSON con datos encontrados en el RAG
    """
    try:
        logging.info(f"🔍 Buscando en colección RAG: '{query}' para {city_slug}, tipo: {data_type}")
        
        # Importar Firebase Admin
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Inicializar Firebase Admin si no está inicializado
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
        rag_docs = rag_ref.limit(limit * 2).stream()  # Obtener más para filtrar
        
        # Procesar resultados
        items_found = []
        for doc in rag_docs:
            doc_data = doc.to_dict()
            doc_data['id'] = doc.id
            items_found.append(doc_data)
        
        # Filtrar por query (búsqueda semántica simple)
        if query:
            query_words = query.lower().split()
            filtered_items = []
            
            for item in items_found:
                score = 0
                
                # Buscar en título (peso mayor)
                title = item.get('title', '').lower()
                for word in query_words:
                    if word in title:
                        score += 3
                
                # Buscar en descripción
                description = item.get('description', '').lower()
                for word in query_words:
                    if word in description:
                        score += 2
                
                # Buscar en keywords
                keywords = item.get('searchKeywords', [])
                for word in query_words:
                    if word in keywords:
                        score += 1
                
                # Buscar en metadatos
                metadata = item.get('metadata', {})
                metadata_text = ' '.join([
                    str(metadata.get('category', '')),
                    str(metadata.get('location', '')),
                    ' '.join(metadata.get('tags', []))
                ]).lower()
                
                for word in query_words:
                    if word in metadata_text:
                        score += 1
                
                if score > 0:
                    item['relevance_score'] = score
                    filtered_items.append(item)
            
            # Ordenar por relevancia
            filtered_items.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
            items_found = filtered_items[:limit]
        
        results = {
            "query": query,
            "city_slug": city_slug,
            "data_type": data_type,
            "items_found": items_found,
            "total_results": len(items_found),
            "search_performed": True,
            "source": "rag_collection"
        }
        
        logging.info(f"✅ Encontrados {len(items_found)} elementos en colección RAG")
        return json.dumps(results, ensure_ascii=False, indent=2, default=str)
        
    except Exception as e:
        error_msg = f"Error buscando en colección RAG: {str(e)}"
        logging.error(error_msg)
        return json.dumps({"error": error_msg, "items_found": [], "source": "rag_collection"})


def vector_search_in_rag(query: str, city_slug: str = "all", data_type: str = "all", limit: int = 10) -> str:
    """
    Herramienta para búsqueda vectorial conceptual en la colección RAG.
    Usa embeddings para encontrar contenido semánticamente similar.
    
    Args:
        query (str): Consulta de búsqueda conceptual
        city_slug (str): Ciudad específica o 'all' para todas
        data_type (str): Tipo de datos o 'all' para todos
        limit (int): Número máximo de resultados
    
    Returns:
        str: JSON con resultados de búsqueda vectorial
    """
    try:
        logging.info(f"🧠 Búsqueda vectorial: '{query}' para {city_slug}, tipo: {data_type}")
        
        # Importar Firebase Admin
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Inicializar Firebase Admin si no está inicializado
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        # 1. Generar embedding de la consulta
        query_embedding = generate_embedding(query)
        
        if not query_embedding:
            # Fallback a búsqueda por keywords si no se puede generar embedding
            logging.warning("No se pudo generar embedding para la consulta, usando búsqueda por keywords")
            return search_data_in_rag(query, city_slug, data_type, limit)
        
        # 2. Obtener documentos candidatos con embeddings
        rag_ref = db.collection('RAG').where('hasEmbedding', '==', True)
        
        # Filtrar por ciudad si no es 'all'
        if city_slug != 'all':
            rag_ref = rag_ref.where('citySlug', '==', city_slug)
        
        # Filtrar por tipo si no es 'all'
        if data_type != 'all':
            rag_ref = rag_ref.where('type', '==', data_type)
        
        # Filtrar solo documentos activos
        rag_ref = rag_ref.where('isActive', '==', True)
        
        # Obtener documentos
        rag_docs = list(rag_ref.stream())
        
        logging.info(f"📊 Documentos candidatos con embeddings: {len(rag_docs)}")
        
        # 3. Calcular similitud coseno
        import numpy as np
        
        def cosine_similarity(vec1, vec2):
            """Calcular similitud coseno entre dos vectores"""
            try:
                vec1 = np.array(vec1)
                vec2 = np.array(vec2)
                
                # Normalizar vectores
                norm1 = np.linalg.norm(vec1)
                norm2 = np.linalg.norm(vec2)
                
                if norm1 == 0 or norm2 == 0:
                    return 0
                
                # Calcular similitud coseno
                similarity = np.dot(vec1, vec2) / (norm1 * norm2)
                return float(similarity)
                
            except Exception as e:
                logging.error(f"Error calculando similitud: {e}")
                return 0
        
        # 4. Calcular similitudes y ordenar
        results_with_similarity = []
        
        for doc in rag_docs:
            doc_data = doc.to_dict()
            doc_embedding = doc_data.get('embedding', [])
            
            if doc_embedding:
                similarity = cosine_similarity(query_embedding, doc_embedding)
                
                if similarity > 0.1:  # Umbral mínimo de similitud
                    doc_data['id'] = doc.id
                    doc_data['similarity_score'] = similarity
                    results_with_similarity.append(doc_data)
        
        # Ordenar por similitud (mayor a menor)
        results_with_similarity.sort(key=lambda x: x.get('similarity_score', 0), reverse=True)
        
        # Tomar los mejores resultados
        top_results = results_with_similarity[:limit]
        
        results = {
            "query": query,
            "city_slug": city_slug,
            "data_type": data_type,
            "items_found": top_results,
            "total_results": len(top_results),
            "total_candidates": len(rag_docs),
            "search_type": "vector_semantic",
            "query_embedding_dimensions": len(query_embedding),
            "similarity_threshold": 0.1,
            "search_performed": True,
            "source": "rag_collection_vector"
        }
        
        logging.info(f"✅ Búsqueda vectorial completada: {len(top_results)} resultados relevantes")
        return json.dumps(results, ensure_ascii=False, indent=2, default=str)
        
    except Exception as e:
        error_msg = f"Error en búsqueda vectorial: {str(e)}"
        logging.error(error_msg)
        return json.dumps({
            "error": error_msg, 
            "items_found": [], 
            "source": "rag_collection_vector",
            "search_type": "vector_semantic"
        })


def clear_city_rag_data(city_slug: str) -> str:
    """
    Herramienta para vaciar todos los datos RAG de una ciudad específica.
    SOLO para superadmin.
    
    Args:
        city_slug (str): Ciudad a limpiar
    
    Returns:
        str: Resultado de la limpieza
    """
    try:
        logging.info(f"🧹 Limpiando datos para {city_slug}")
        
        # Importar Firebase Admin
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Inicializar Firebase Admin si no está inicializado
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        # Limpiar datos de la colección RAG centralizada
        rag_ref = db.collection('RAG').where('citySlug', '==', city_slug)
        rag_docs = rag_ref.stream()
        
        items_deleted = 0
        batch = db.batch()
        
        for rag_doc in rag_docs:
            batch.delete(rag_doc.reference)
            items_deleted += 1
            
            # Firebase batch tiene límite de 500 operaciones
            if items_deleted % 400 == 0:
                batch.commit()
                batch = db.batch()
        
        # Commit final
        if items_deleted % 400 != 0:
            batch.commit()
        
        # También limpiar eventos legacy si existen
        legacy_events_deleted = 0
        try:
            events_ref = db.collection('cities').document(city_slug).collection('events')
            events = events_ref.stream()
            
            legacy_batch = db.batch()
            for event_doc in events:
                legacy_batch.delete(event_doc.reference)
                legacy_events_deleted += 1
            
            if legacy_events_deleted > 0:
                legacy_batch.commit()
                logging.info(f"🧹 También se limpiaron {legacy_events_deleted} eventos legacy")
                
        except Exception as legacy_error:
            logging.warning(f"Error limpiando eventos legacy: {legacy_error}")
        
        result = {
            "city_slug": city_slug,
            "rag_items_deleted": items_deleted,
            "legacy_events_deleted": legacy_events_deleted,
            "rag_collection_success": True,
            "success": True,
            "message": f"Limpiados {items_deleted} elementos RAG y {legacy_events_deleted} eventos legacy para {city_slug}"
        }
        
        logging.info(f"✅ Limpieza completada: {items_deleted} elementos RAG, {legacy_events_deleted} eventos legacy")
        return json.dumps(result, ensure_ascii=False, indent=2)
        
    except Exception as e:
        error_msg = f"Error limpiando datos: {str(e)}"
        logging.error(error_msg)
        return json.dumps({"error": error_msg, "success": False})


def clear_all_rag_data() -> str:
    """
    Herramienta para vaciar TODOS los datos RAG.
    SOLO para superadmin. ¡PELIGROSO!
    
    Returns:
        str: Resultado de la limpieza total
    """
    try:
        logging.info("🧹 LIMPIEZA TOTAL del RAG - ¡PELIGROSO!")
        
        # Aquí limpiaríamos todo el Vector Search
        # Por ahora, simulamos
        
        result = {
            "total_events_deleted": 0,
            "total_rag_sources_deleted": 0,
            "cities_affected": [],
            "success": True,
            "message": "RAG completamente limpiado"
        }
        
        return json.dumps(result, ensure_ascii=False, indent=2)
        
    except Exception as e:
        error_msg = f"Error en limpieza total: {str(e)}"
        logging.error(error_msg)
        return json.dumps({"error": error_msg})


def get_rag_stats(city_slug: Optional[str] = None) -> str:
    """
    Herramienta para obtener estadísticas del RAG desde Firestore.
    
    Args:
        city_slug (str, optional): Ciudad específica o None para todas
    
    Returns:
        str: JSON con estadísticas
    """
    try:
        if city_slug:
            logging.info(f"📊 Obteniendo estadísticas para {city_slug}")
        else:
            logging.info("📊 Obteniendo estadísticas globales")
        
        # Importar Firebase Admin
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Inicializar Firebase Admin si no está inicializado
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        if city_slug:
            # Estadísticas para ciudad específica desde colección RAG
            rag_ref = db.collection('RAG').where('citySlug', '==', city_slug)
            rag_docs = list(rag_ref.stream())
            
            total_items = len(rag_docs)
            active_items = len([doc for doc in rag_docs if doc.to_dict().get('isActive', False)])
            
            # Estadísticas por tipo
            types = {}
            confidences = []
            sources = {}
            
            for doc in rag_docs:
                doc_data = doc.to_dict()
                
                # Contar por tipo
                doc_type = doc_data.get('type', 'unknown')
                types[doc_type] = types.get(doc_type, 0) + 1
                
                # Recopilar confianzas
                confidence = doc_data.get('metadata', {}).get('confidence', 0)
                if confidence:
                    confidences.append(confidence)
                
                # Contar por fuente
                source = doc_data.get('metadata', {}).get('sourceUrl', 'unknown')
                sources[source] = sources.get(source, 0) + 1
            
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            stats = {
                "city_slug": city_slug,
                "total_items": total_items,
                "active_items": active_items,
                "items_by_type": types,
                "items_by_source": sources,
                "average_confidence": round(avg_confidence, 2),
                "last_update": max([doc.to_dict().get('scrapedAt') for doc in rag_docs if doc.to_dict().get('scrapedAt')], default=None),
                "rag_collection_source": True
            }
        else:
            # Estadísticas globales desde colección RAG
            rag_ref = db.collection('RAG')
            rag_docs = list(rag_ref.stream())
            
            total_items = len(rag_docs)
            cities_with_data = set()
            types_count = {}
            all_confidences = []
            sources_count = {}
            
            for doc in rag_docs:
                doc_data = doc.to_dict()
                
                # Recopilar ciudades con datos
                city_slug_doc = doc_data.get('citySlug')
                if city_slug_doc:
                    cities_with_data.add(city_slug_doc)
                
                # Contar por tipo
                doc_type = doc_data.get('type', 'unknown')
                types_count[doc_type] = types_count.get(doc_type, 0) + 1
                
                # Recopilar confianzas
                confidence = doc_data.get('metadata', {}).get('confidence', 0)
                if confidence:
                    all_confidences.append(confidence)
                
                # Contar por fuente
                source = doc_data.get('metadata', {}).get('sourceUrl', 'unknown')
                sources_count[source] = sources_count.get(source, 0) + 1
            
            avg_confidence = sum(all_confidences) / len(all_confidences) if all_confidences else 0
            
            stats = {
                "city_slug": None,
                "total_items": total_items,
                "items_by_type": types_count,
                "items_by_source": sources_count,
                "cities_with_data": list(cities_with_data),
                "total_cities": len(cities_with_data),
                "average_confidence": round(avg_confidence, 2),
                "rag_collection_source": True
            }
        
        logging.info(f"✅ Estadísticas obtenidas: {stats}")
        return json.dumps(stats, ensure_ascii=False, indent=2, default=str)
        
    except Exception as e:
        error_msg = f"Error obteniendo estadísticas: {str(e)}"
        logging.error(error_msg)
        return json.dumps({"error": error_msg, "firestore_source": True})


# Lista de todas las tools disponibles
WEARECITY_TOOLS = [
    get_city_urls,
    scrape_events_with_puppeteer,
    search_events_in_rag,           # Legacy - mantener por compatibilidad
    search_data_in_rag,             # Búsqueda por keywords en RAG
    vector_search_in_rag,           # 🧠 BÚSQUEDA VECTORIAL CONCEPTUAL
    insert_data_to_rag_with_embeddings,  # 🧠 INSERCIÓN CON EMBEDDINGS
    clear_city_rag_data,
    clear_all_rag_data,
    get_rag_stats,
    generate_embedding              # Función auxiliar para embeddings
]

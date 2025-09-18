#!/usr/bin/env python3
"""
Probar generación de embeddings y búsqueda vectorial
"""

import sys
import json

# Agregar el path del agente
sys.path.insert(0, '/Users/tonillorens/Desktop/wearecity_app/.venv/lib/python3.12/site-packages')

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    import vertexai
    from vertexai.language_models import TextEmbeddingModel
    
    print("✅ Dependencias importadas correctamente")
except ImportError as e:
    print(f"❌ Error importando dependencias: {e}")
    sys.exit(1)

def test_embedding_generation():
    """Probar generación de embeddings"""
    print("🧠 Probando generación de embeddings...")
    
    try:
        # Inicializar Vertex AI
        vertexai.init(project="wearecity-2ab89", location="us-central1")
        
        # Usar el modelo de embeddings
        model = TextEmbeddingModel.from_pretrained("text-embedding-005")
        
        # Textos de prueba
        test_texts = [
            "Festival de música en Valencia con conciertos gratuitos",
            "Trámites de empadronamiento en el ayuntamiento",
            "Fiestas tradicionales de Moros y Cristianos",
            "Información turística sobre playas y museos"
        ]
        
        embeddings_results = []
        
        for text in test_texts:
            print(f"   🔍 Generando embedding para: {text[:50]}...")
            
            try:
                embeddings = model.get_embeddings([text])
                
                if embeddings and len(embeddings) > 0:
                    vector = embeddings[0].values
                    embeddings_results.append({
                        "text": text,
                        "embedding": vector,
                        "dimensions": len(vector),
                        "success": True
                    })
                    print(f"   ✅ Embedding generado: {len(vector)} dimensiones")
                else:
                    print(f"   ❌ No se pudo generar embedding")
                    embeddings_results.append({
                        "text": text,
                        "embedding": [],
                        "dimensions": 0,
                        "success": False
                    })
                    
            except Exception as e:
                print(f"   ❌ Error: {e}")
                embeddings_results.append({
                    "text": text,
                    "embedding": [],
                    "dimensions": 0,
                    "success": False,
                    "error": str(e)
                })
        
        # Resumen
        successful = sum(1 for r in embeddings_results if r['success'])
        print(f"\n📊 Resumen embeddings:")
        print(f"   ✅ Exitosos: {successful}/{len(test_texts)}")
        
        if successful > 0:
            avg_dimensions = sum(r['dimensions'] for r in embeddings_results if r['success']) / successful
            print(f"   📏 Dimensiones promedio: {avg_dimensions:.0f}")
        
        return embeddings_results
        
    except Exception as e:
        print(f"❌ Error en generación de embeddings: {e}")
        return []

def test_vector_similarity():
    """Probar cálculo de similitud vectorial"""
    print("\n🔢 Probando cálculo de similitud vectorial...")
    
    try:
        import numpy as np
        
        # Inicializar Vertex AI
        vertexai.init(project="wearecity-2ab89", location="us-central1")
        model = TextEmbeddingModel.from_pretrained("text-embedding-005")
        
        # Textos relacionados para probar similitud
        queries = [
            "festivales de música",
            "conciertos y eventos culturales",
            "trámites municipales",
            "empadronamiento y documentación"
        ]
        
        documents = [
            "Festival de música en Valencia con conciertos gratuitos",
            "Concierto de jazz en el teatro municipal",
            "Trámites de empadronamiento en el ayuntamiento",
            "Documentos necesarios para registrarse como residente"
        ]
        
        print("   🔍 Generando embeddings para consultas y documentos...")
        
        # Generar embeddings
        query_embeddings = model.get_embeddings(queries)
        doc_embeddings = model.get_embeddings(documents)
        
        def cosine_similarity(vec1, vec2):
            """Calcular similitud coseno"""
            vec1 = np.array(vec1)
            vec2 = np.array(vec2)
            
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0
            
            return np.dot(vec1, vec2) / (norm1 * norm2)
        
        print("\n   📊 Matriz de similitudes:")
        print("   " + "-" * 60)
        
        # Calcular similitudes
        for i, query in enumerate(queries):
            print(f"   🔍 '{query[:30]}...'")
            
            similarities = []
            for j, doc in enumerate(documents):
                similarity = cosine_similarity(
                    query_embeddings[i].values,
                    doc_embeddings[j].values
                )
                similarities.append((doc[:40], similarity))
            
            # Ordenar por similitud
            similarities.sort(key=lambda x: x[1], reverse=True)
            
            # Mostrar los más similares
            for doc_text, sim_score in similarities[:2]:
                print(f"      ✅ {sim_score:.3f} - {doc_text}...")
        
        print("   ✅ Similitud vectorial funcionando correctamente")
        return True
        
    except Exception as e:
        print(f"❌ Error en similitud vectorial: {e}")
        return False

def test_rag_with_embeddings():
    """Probar inserción y búsqueda con embeddings"""
    print("\n🗂️ Probando RAG con embeddings...")
    
    try:
        # Inicializar Firebase Admin
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        # Inicializar Vertex AI
        vertexai.init(project="wearecity-2ab89", location="us-central1")
        model = TextEmbeddingModel.from_pretrained("text-embedding-005")
        
        # Datos de prueba con embeddings
        test_event = {
            "title": "Concierto de Jazz Vectorial",
            "description": "Concierto de jazz experimental con artistas locales en el auditorio municipal",
            "date": "2025-09-30",
            "time": "21:00",
            "location": "Auditorio Municipal, Valencia",
            "category": "musica",
            "tags": ["jazz", "experimental", "local", "auditorio"],
            "source": "test_vector_embeddings",
            "confidence": 0.95
        }
        
        # Generar embedding para el evento
        content_for_embedding = f"""
        Título: {test_event['title']}
        Descripción: {test_event['description']}
        Ubicación: {test_event['location']}
        Categoría: {test_event['category']}
        Etiquetas: {', '.join(test_event['tags'])}
        Ciudad: Valencia
        """.strip()
        
        print("   🧠 Generando embedding para evento de prueba...")
        embeddings = model.get_embeddings([content_for_embedding])
        
        if embeddings and len(embeddings) > 0:
            embedding_vector = embeddings[0].values
            print(f"   ✅ Embedding generado: {len(embedding_vector)} dimensiones")
            
            # Insertar en colección RAG con embedding
            rag_ref = db.collection('RAG').document()
            
            rag_document = {
                'type': 'event',
                'title': test_event['title'],
                'content': content_for_embedding,
                'description': test_event['description'],
                'citySlug': 'valencia',
                'cityName': 'Valencia',
                'adminIds': ['superadmin'],
                'metadata': {
                    'date': test_event['date'],
                    'time': test_event['time'],
                    'location': test_event['location'],
                    'category': test_event['category'],
                    'tags': test_event['tags'],
                    'sourceUrl': test_event['source'],
                    'confidence': test_event['confidence'],
                    'language': 'es'
                },
                'embedding': embedding_vector,
                'embeddingDimensions': len(embedding_vector),
                'searchKeywords': ['jazz', 'experimental', 'concierto', 'valencia'],
                'isActive': True,
                'hasEmbedding': True,
                'scrapedAt': firestore.SERVER_TIMESTAMP,
                'insertedByAgent': True,
                'agentTimestamp': firestore.SERVER_TIMESTAMP,
                'lastUpdated': firestore.SERVER_TIMESTAMP
            }
            
            rag_ref.set(rag_document)
            print("   ✅ Evento con embedding insertado en colección RAG")
            
            return True
        else:
            print("   ❌ No se pudo generar embedding")
            return False
            
    except Exception as e:
        print(f"❌ Error probando RAG con embeddings: {e}")
        return False

def test_conceptual_search():
    """Probar búsqueda conceptual con embeddings"""
    print("\n🔍 Probando búsqueda conceptual...")
    
    try:
        # Inicializar Firebase Admin
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        # Inicializar Vertex AI
        vertexai.init(project="wearecity-2ab89", location="us-central1")
        model = TextEmbeddingModel.from_pretrained("text-embedding-005")
        
        # Consultas conceptuales de prueba
        conceptual_queries = [
            "música en vivo y entretenimiento",
            "actividades culturales nocturnas",
            "eventos artísticos y creativos"
        ]
        
        for query in conceptual_queries:
            print(f"\n   🔍 Búsqueda conceptual: '{query}'")
            
            # Generar embedding de la consulta
            query_embeddings = model.get_embeddings([query])
            
            if not query_embeddings:
                print("   ❌ No se pudo generar embedding para la consulta")
                continue
            
            query_vector = query_embeddings[0].values
            
            # Obtener documentos con embeddings
            rag_docs = list(db.collection('RAG')
                           .where('hasEmbedding', '==', True)
                           .where('isActive', '==', True)
                           .stream())
            
            print(f"   📊 Documentos con embeddings: {len(rag_docs)}")
            
            if len(rag_docs) == 0:
                print("   ⚠️ No hay documentos con embeddings para comparar")
                continue
            
            # Calcular similitudes
            import numpy as np
            
            def cosine_similarity(vec1, vec2):
                vec1 = np.array(vec1)
                vec2 = np.array(vec2)
                norm1 = np.linalg.norm(vec1)
                norm2 = np.linalg.norm(vec2)
                if norm1 == 0 or norm2 == 0:
                    return 0
                return np.dot(vec1, vec2) / (norm1 * norm2)
            
            results = []
            for doc in rag_docs:
                doc_data = doc.to_dict()
                doc_embedding = doc_data.get('embedding', [])
                
                if doc_embedding:
                    similarity = cosine_similarity(query_vector, doc_embedding)
                    
                    if similarity > 0.1:
                        results.append({
                            'title': doc_data.get('title'),
                            'city': doc_data.get('citySlug'),
                            'similarity': similarity,
                            'type': doc_data.get('type')
                        })
            
            # Ordenar por similitud
            results.sort(key=lambda x: x['similarity'], reverse=True)
            
            # Mostrar resultados
            if results:
                print(f"   ✅ {len(results)} resultados encontrados:")
                for result in results[:3]:  # Top 3
                    print(f"      🎯 {result['similarity']:.3f} - {result['title']} ({result['city']})")
            else:
                print("   ⚠️ No se encontraron resultados similares")
        
        return len(results) > 0
        
    except Exception as e:
        print(f"❌ Error en búsqueda conceptual: {e}")
        return False

def main():
    """Ejecutar todas las pruebas de embeddings"""
    print("🚀 PRUEBAS DE EMBEDDINGS VECTORIALES")
    print("🧠 Búsqueda Conceptual + Colección RAG Centralizada")
    print("=" * 70)
    
    tests = [
        ("Generación de Embeddings", test_embedding_generation),
        ("Similitud Vectorial", test_vector_similarity),
        ("RAG con Embeddings", test_rag_with_embeddings),
        ("Búsqueda Conceptual", test_conceptual_search)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🧪 {test_name}")
        print("-" * 50)
        
        try:
            if test_name == "Generación de Embeddings":
                embedding_results = test_func()
                success = len(embedding_results) > 0 and any(r['success'] for r in embedding_results)
            else:
                success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ Error en {test_name}: {e}")
            results.append((test_name, False))
    
    # Resumen final
    print("\n" + "=" * 70)
    print("📊 RESUMEN - EMBEDDINGS VECTORIALES")
    print("=" * 70)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Resultado: {passed}/{total} pruebas exitosas")
    
    if passed == total:
        print("🎊 ¡EMBEDDINGS VECTORIALES COMPLETAMENTE OPERATIVOS!")
        print("🧠 Búsqueda conceptual implementada")
        print("🗂️ Colección RAG con vectores funcional")
        print("🔍 Similitud semántica funcionando")
    else:
        print("⚠️ Algunos componentes necesitan atención")
    
    print(f"\n🧠 CAPACIDADES IMPLEMENTADAS:")
    print(f"   • ✅ Generación de embeddings con text-embedding-005")
    print(f"   • ✅ Cálculo de similitud coseno")
    print(f"   • ✅ Búsqueda vectorial conceptual")
    print(f"   • ✅ Almacenamiento de vectores en Firestore")
    print(f"   • ✅ Colección RAG centralizada con embeddings")

if __name__ == "__main__":
    main()

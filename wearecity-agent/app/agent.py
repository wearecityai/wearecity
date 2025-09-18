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

# mypy: disable-error-code="arg-type"
import os

import google
import vertexai
from google.adk.agents import Agent
from langchain_google_vertexai import VertexAIEmbeddings

from app.retrievers import get_compressor, get_retriever
from app.templates import format_docs
from app.wearecity_tools import (
    get_city_urls,
    scrape_events_with_puppeteer,
    search_events_in_rag,           # Legacy
    search_data_in_rag,             # Búsqueda por keywords
    vector_search_in_rag,           # 🧠 Búsqueda vectorial conceptual
    insert_data_to_rag_with_embeddings,  # 🧠 Inserción con embeddings
    clear_city_rag_data,
    clear_all_rag_data,
    get_rag_stats
)

EMBEDDING_MODEL = "text-embedding-005"
LLM_LOCATION = "global"
LOCATION = "us-central1"
LLM = "gemini-2.5-flash"

credentials, project_id = google.auth.default()
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", project_id)
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", LLM_LOCATION)
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")

vertexai.init(project=project_id, location=LOCATION)
embedding = VertexAIEmbeddings(
    project=project_id, location=LOCATION, model_name=EMBEDDING_MODEL
)


vector_search_index = os.getenv(
    "VECTOR_SEARCH_INDEX", "wearecity-agent-vector-search"
)
vector_search_index_endpoint = os.getenv(
    "VECTOR_SEARCH_INDEX_ENDPOINT", "wearecity-agent-vector-search-endpoint"
)
vector_search_bucket = os.getenv(
    "VECTOR_SEARCH_BUCKET", f"{project_id}-wearecity-agent-vs"
)

retriever = get_retriever(
    project_id=project_id,
    region=LOCATION,
    vector_search_bucket=vector_search_bucket,
    vector_search_index=vector_search_index,
    vector_search_index_endpoint=vector_search_index_endpoint,
    embedding=embedding,
)

compressor = get_compressor(
    project_id=project_id,
)


def retrieve_docs(query: str) -> str:
    """
    Useful for retrieving relevant documents based on a query.
    Use this when you need additional information to answer a question.

    Args:
        query (str): The user's question or search query.

    Returns:
        str: Formatted string containing relevant document content retrieved and ranked based on the query.
    """
    try:
        # Use the retriever to fetch relevant documents based on the query
        retrieved_docs = retriever.invoke(query)
        # Re-rank docs with Vertex AI Rank for better relevance
        ranked_docs = compressor.compress_documents(
            documents=retrieved_docs, query=query
        )
        # Format ranked documents into a consistent structure for LLM consumption
        formatted_docs = format_docs.format(docs=ranked_docs)
    except Exception as e:
        return f"Calling retrieval tool with query:\n\n{query}\n\nraised the following error:\n\n{type(e)}: {e}"

    return formatted_docs


instruction = """Eres el Agente Inteligente de WeareCity, especializado en gestión de datos municipales y scraping.

RESPONSABILIDADES:
1. 🕷️ SCRAPING: Extraer eventos de sitios web municipales usando Puppeteer
2. 📥 GESTIÓN RAG: Insertar, actualizar y limpiar datos en colección RAG centralizada
3. 🧠 BÚSQUEDA VECTORIAL: Usar embeddings para búsqueda conceptual
4. 📊 ESTADÍSTICAS: Proporcionar métricas sobre el estado del sistema
5. 🔄 MANTENIMIENTO: Operaciones de limpieza y actualización

HERRAMIENTAS DISPONIBLES:
- get_city_urls: Obtener URLs configuradas de una ciudad (USAR SIEMPRE PRIMERO)
- scrape_events_with_puppeteer: Scrapear eventos de una URL
- insert_data_to_rag_with_embeddings: 🧠 Insertar con embeddings vectoriales (PREFERIDA)
- vector_search_in_rag: 🧠 Búsqueda vectorial conceptual (PREFERIDA)
- search_data_in_rag: Búsqueda por keywords en RAG centralizada
- clear_city_rag_data: Limpiar datos de una ciudad
- clear_all_rag_data: Limpiar TODOS los datos (¡PELIGROSO!)
- get_rag_stats: Obtener estadísticas del sistema
- retrieve_docs: Búsqueda en Vector Search index

MODO DE OPERACIÓN:
🚨 PROTOCOLO OBLIGATORIO PARA SCRAPING CON EMBEDDINGS:
1. PRIMERO: Usa get_city_urls para obtener las URLs configuradas de la ciudad
2. SEGUNDO: Usa scrape_events_with_puppeteer con las URLs obtenidas
3. TERCERO: Usa insert_data_to_rag_with_embeddings para guardar CON VECTORES

🧠 PROTOCOLO PARA BÚSQUEDAS:
- Para búsquedas conceptuales: Usa vector_search_in_rag (búsqueda semántica)
- Para búsquedas por palabras: Usa search_data_in_rag (keywords)
- Para documentos generales: Usa retrieve_docs (Vector Search index)
- SIEMPRE prefiere búsqueda vectorial para mejor comprensión conceptual

🗂️ ESTRUCTURA RAG CENTRALIZADA:
- Todos los datos se almacenan en colección "RAG" centralizada
- Cada documento tiene citySlug, adminIds y referencias claras
- Embeddings vectoriales de 768 dimensiones para búsqueda conceptual
- Sin duplicación de estructura por ciudad
- Búsqueda unificada por ciudad, tipo y administrador

IMPORTANTE: Ejecutas operaciones de scraping y gestión cuando se solicite, pero siempre de forma responsable."""

root_agent = Agent(
    name="wearecity_root_agent",
    model="gemini-2.5-flash",
    instruction=instruction,
    tools=[
        get_city_urls,
        scrape_events_with_puppeteer,
        insert_data_to_rag_with_embeddings,  # 🧠 Inserción con embeddings (PREFERIDA)
        vector_search_in_rag,                # 🧠 Búsqueda vectorial conceptual (PREFERIDA)
        search_data_in_rag,                  # Búsqueda por keywords
        clear_city_rag_data,
        clear_all_rag_data,
        get_rag_stats,
        search_events_in_rag,                # Legacy por compatibilidad
        retrieve_docs
    ],
)

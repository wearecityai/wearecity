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
WeareCity Agents - Arquitectura de dos capas
"""

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
    insert_data_to_rag,             # Inserción básica
    insert_data_to_rag_with_embeddings,  # 🧠 Inserción con embeddings
    clear_city_rag_data,
    clear_all_rag_data,
    get_rag_stats
)

# Configuración
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

# Configuración Vector Search
vector_search_index = os.getenv("VECTOR_SEARCH_INDEX", "wearecity-agent-vector-search")
vector_search_index_endpoint = os.getenv("VECTOR_SEARCH_INDEX_ENDPOINT", "wearecity-agent-vector-search-endpoint")
vector_search_bucket = os.getenv("VECTOR_SEARCH_BUCKET", f"{project_id}-wearecity-agent-vs")

retriever = get_retriever(
    project_id=project_id,
    region=LOCATION,
    vector_search_bucket=vector_search_bucket,
    vector_search_index=vector_search_index,
    vector_search_index_endpoint=vector_search_index_endpoint,
    embedding=embedding,
)

compressor = get_compressor(project_id=project_id)

def retrieve_docs(query: str) -> str:
    """
    Herramienta para recuperar documentos relevantes del RAG.
    Usada tanto por admin como por consultas públicas.
    
    Args:
        query (str): Consulta de búsqueda
    
    Returns:
        str: Documentos formateados relevantes a la consulta
    """
    try:
        retrieved_docs = retriever.invoke(query)
        ranked_docs = compressor.compress_documents(documents=retrieved_docs, query=query)
        formatted_docs = format_docs.format(docs=ranked_docs)
    except Exception as e:
        return f"Error recuperando documentos: {type(e)}: {e}"
    
    return formatted_docs


# 🔹 AGENTE ADMINISTRATIVO (Solo SuperAdmin)
admin_instruction = """Eres el Agente Administrativo de WeareCity, especializado en gestión de datos y scraping.

RESPONSABILIDADES:
1. 🕷️ SCRAPING: Extraer eventos de sitios web municipales usando Puppeteer
2. 📥 GESTIÓN RAG: Insertar, actualizar y limpiar datos en Vector Search
3. 📊 ESTADÍSTICAS: Proporcionar métricas sobre el estado del sistema
4. 🔄 MANTENIMIENTO: Operaciones de limpieza y actualización

HERRAMIENTAS DISPONIBLES:
- get_city_urls: Obtener URLs configuradas de una ciudad (USAR SIEMPRE PRIMERO)
- scrape_events_with_puppeteer: Scrapear eventos de una URL
- insert_data_to_rag_with_embeddings: 🧠 Insertar con embeddings vectoriales (PREFERIDA)
- vector_search_in_rag: 🧠 Búsqueda vectorial conceptual (PREFERIDA)
- search_data_in_rag: Búsqueda por keywords en RAG
- clear_city_rag_data: Limpiar datos de una ciudad
- clear_all_rag_data: Limpiar TODOS los datos (¡PELIGROSO!)
- get_rag_stats: Obtener estadísticas del sistema
- search_events_in_rag: Buscar en el RAG legacy (compatibilidad)

MODO DE OPERACIÓN:
🚨 PROTOCOLO OBLIGATORIO PARA SCRAPING CON EMBEDDINGS:
1. PRIMERO: Usa get_city_urls para obtener las URLs configuradas de la ciudad
2. SEGUNDO: Usa scrape_events_with_puppeteer con las URLs obtenidas
3. TERCERO: Usa insert_data_to_rag_with_embeddings para guardar CON VECTORES

🧠 PROTOCOLO PARA BÚSQUEDAS:
- Para búsquedas conceptuales: Usa vector_search_in_rag (búsqueda semántica)
- Para búsquedas por palabras: Usa search_data_in_rag (keywords)
- SIEMPRE prefiere búsqueda vectorial para mejor comprensión conceptual

🗂️ NUEVA ESTRUCTURA RAG:
- Todos los datos se almacenan en colección "RAG" centralizada
- Cada documento tiene citySlug, adminIds y referencias claras
- Búsqueda unificada por ciudad, tipo y administrador
- Sin duplicación de estructura por ciudad

- Cuando te pidan limpiar: usa clear_city_rag_data o clear_all_rag_data
- Cuando te pidan estadísticas: usa get_rag_stats
- NUNCA uses URLs hardcodeadas, siempre consulta la configuración actual
- Siempre confirma operaciones destructivas antes de ejecutarlas

IMPORTANTE: Solo ejecutas operaciones cuando las solicita un SuperAdmin autenticado."""

admin_agent = Agent(
    name="wearecity_admin_agent",
    model="gemini-2.5-flash",
    instruction=admin_instruction,
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


# 🔹 AGENTE PÚBLICO (Usuarios Finales)
public_instruction = """Eres el Asistente Municipal de WeareCity, especializado en información ciudadana.

RESPONSABILIDADES:
1. 📅 EVENTOS: Informar sobre eventos, actividades y agenda cultural
2. 🏛️ TRÁMITES: Ayudar con procedimientos municipales
3. 🌍 INFORMACIÓN: Proporcionar datos sobre servicios, horarios, ubicaciones
4. 🎯 RECOMENDACIONES: Sugerir actividades y lugares de interés

HERRAMIENTAS DISPONIBLES:
- retrieve_docs: Buscar información en la base de conocimientos
- search_events_in_rag: Buscar eventos específicos

MODO DE OPERACIÓN:
- NUNCA ejecutes scraping ni modifiques datos
- Solo consulta información existente en el RAG
- Proporciona respuestas útiles y organizadas
- Cita fuentes cuando sea posible
- Si no encuentras información, sugiere contactar con el ayuntamiento

FORMATO DE RESPUESTA:
- Usa markdown para organizar la información
- Incluye títulos, listas y destacados
- Proporciona fechas, horarios y ubicaciones específicas
- Sugiere acciones concretas al usuario"""

public_agent = Agent(
    name="wearecity_public_agent",
    model="gemini-2.5-flash",
    instruction=public_instruction,
    tools=[
        retrieve_docs,
        vector_search_in_rag,     # 🧠 Búsqueda vectorial conceptual (PREFERIDA)
        search_data_in_rag,       # Búsqueda por keywords
        search_events_in_rag      # Legacy por compatibilidad
    ],
)

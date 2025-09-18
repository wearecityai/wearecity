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
WeareCity Admin Agent App - Solo para SuperAdmin
"""

import datetime
import json
import logging
import os
from typing import Any

import google.auth
import vertexai
from google.adk.artifacts import GcsArtifactService
from google.cloud import logging as google_cloud_logging
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider, export
from vertexai._genai.types import AgentEngine, AgentEngineConfig
from vertexai.agent_engines.templates.adk import AdkApp

from app.wearecity_agents import admin_agent
from app.utils.gcs import create_bucket_if_not_exists
from app.utils.tracing import CloudTraceLoggingSpanExporter
from app.utils.typing import Feedback


class AdminAgentApp(AdkApp):
    """Aplicación del Agente Administrativo - Solo SuperAdmin"""
    
    def set_up(self) -> None:
        """Configurar logging y tracing para el agente administrativo."""
        super().set_up()
        logging.basicConfig(level=logging.INFO)
        logging_client = google_cloud_logging.Client()
        self.logger = logging_client.logger("wearecity_admin_agent")
        
        provider = TracerProvider()
        processor = export.BatchSpanProcessor(
            CloudTraceLoggingSpanExporter(
                project_id=os.environ.get("GOOGLE_CLOUD_PROJECT")
            )
        )
        provider.add_span_processor(processor)
        trace.set_tracer_provider(provider)
        
        # Configurar bucket para logs
        project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
        bucket_name = f"{project_id}-wearecity-admin-logs"
        create_bucket_if_not_exists(bucket_name, "US-CENTRAL1")

    def register_feedback(self, feedback: dict[str, Any]) -> None:
        """Registrar feedback administrativo."""
        self.logger.log_struct(
            {
                "log_type": "admin_feedback",
                "service_name": "wearecity-admin-agent",
                "feedback": feedback,
                "timestamp": datetime.datetime.now().isoformat(),
            }
        )

    def register_operations(self) -> dict[str, list[str]]:
        """Registrar operaciones disponibles para el agente administrativo."""
        return {
            "scraping": [
                "scrape_events_with_puppeteer",
                "insert_events_to_rag"
            ],
            "rag_management": [
                "clear_city_rag_data", 
                "clear_all_rag_data",
                "search_events_in_rag"
            ],
            "monitoring": [
                "get_rag_stats"
            ]
        }

    @property
    def agent(self):
        """Devolver el agente administrativo."""
        return admin_agent


# Configuración del Agent Engine para Admin
admin_config = AgentEngineConfig(
    display_name="WeareCity Admin Agent",
    description="Agente administrativo para gestión de scraping y RAG - Solo SuperAdmin",
    env_vars={
        "NUM_WORKERS": "1",
        "AGENT_TYPE": "ADMIN"
    },
    extra_packages=["./app"],
    staging_bucket=f"gs://{os.environ.get('GOOGLE_CLOUD_PROJECT')}-wearecity-admin-agent",
)

# Instancia de la aplicación
admin_app = AdminAgentApp(
    agent=admin_agent,
    config=admin_config
)

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
WeareCity Public Agent App - Para usuarios finales
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

from app.wearecity_agents import public_agent
from app.utils.gcs import create_bucket_if_not_exists
from app.utils.tracing import CloudTraceLoggingSpanExporter
from app.utils.typing import Feedback


class PublicAgentApp(AdkApp):
    """Aplicación del Agente Público - Para usuarios finales"""
    
    def set_up(self) -> None:
        """Configurar logging y tracing para el agente público."""
        super().set_up()
        logging.basicConfig(level=logging.INFO)
        logging_client = google_cloud_logging.Client()
        self.logger = logging_client.logger("wearecity_public_agent")
        
        provider = TracerProvider()
        processor = export.BatchSpanProcessor(
            CloudTraceLoggingSpanExporter(
                project_id=os.environ.get("GOOGLE_CLOUD_PROJECT")
            )
        )
        provider.add_span_processor(processor)
        trace.set_tracer_provider(provider)
        
        # Configurar bucket para logs públicos
        project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
        bucket_name = f"{project_id}-wearecity-public-logs"
        create_bucket_if_not_exists(bucket_name, "US-CENTRAL1")

    def register_feedback(self, feedback: dict[str, Any]) -> None:
        """Registrar feedback de usuarios."""
        self.logger.log_struct(
            {
                "log_type": "public_feedback",
                "service_name": "wearecity-public-agent",
                "feedback": feedback,
                "timestamp": datetime.datetime.now().isoformat(),
            }
        )

    def register_operations(self) -> dict[str, list[str]]:
        """Registrar operaciones disponibles para el agente público."""
        return {
            "queries": [
                "retrieve_docs",
                "search_events_in_rag"
            ]
        }

    @property
    def agent(self):
        """Devolver el agente público."""
        return public_agent


# Configuración del Agent Engine para Público
public_config = AgentEngineConfig(
    display_name="WeareCity Public Agent",
    description="Asistente municipal para consultas ciudadanas - Acceso público",
    env_vars={
        "NUM_WORKERS": "2",  # Más workers para consultas públicas
        "AGENT_TYPE": "PUBLIC"
    },
    extra_packages=["./app"],
    staging_bucket=f"gs://{os.environ.get('GOOGLE_CLOUD_PROJECT')}-wearecity-public-agent",
)

# Instancia de la aplicación
public_app = PublicAgentApp(
    agent=public_agent,
    config=public_config
)

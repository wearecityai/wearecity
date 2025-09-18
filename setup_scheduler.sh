#!/bin/bash

# Script para configurar Cloud Scheduler para scraping automático
# WeareCity - Vertex AI Agent Engine

PROJECT_ID="wearecity-2ab89"
REGION="us-central1"
SERVICE_ACCOUNT="firebase-adminsdk-aynxs@wearecity-2ab89.iam.gserviceaccount.com"

echo "🕐 Configurando Cloud Scheduler para WeareCity..."
echo "   Project: $PROJECT_ID"
echo "   Region: $REGION"

# Habilitar APIs necesarias
echo "📡 Habilitando APIs necesarias..."
gcloud services enable cloudscheduler.googleapis.com --project=$PROJECT_ID
gcloud services enable pubsub.googleapis.com --project=$PROJECT_ID

# Crear topic de Pub/Sub para el scheduler
echo "📬 Creando topic de Pub/Sub..."
gcloud pubsub topics create wearecity-scraping-schedule --project=$PROJECT_ID || echo "Topic ya existe"

# 1. JOB DIARIO - Scraping principal de todas las ciudades
echo "📅 Creando job diario de scraping..."
gcloud scheduler jobs create pubsub daily-scraping-job \
  --location=$REGION \
  --schedule="0 6 * * *" \
  --topic="wearecity-scraping-schedule" \
  --message-body='{"operation":"daily_scrape","cities":["valencia","la-vila-joiosa","alicante"],"timestamp":"auto"}' \
  --description="Scraping diario de eventos para todas las ciudades a las 6:00 AM" \
  --project=$PROJECT_ID || echo "Job diario ya existe"

# 2. JOB SEMANAL - Scraping completo de fuentes adicionales
echo "📊 Creando job semanal de scraping..."
gcloud scheduler jobs create pubsub weekly-scraping-job \
  --location=$REGION \
  --schedule="0 3 * * 1" \
  --topic="wearecity-scraping-schedule" \
  --message-body='{"operation":"weekly_scrape","cities":["valencia","la-vila-joiosa","alicante"],"deep_scrape":true,"timestamp":"auto"}' \
  --description="Scraping semanal completo los lunes a las 3:00 AM" \
  --project=$PROJECT_ID || echo "Job semanal ya existe"

# 3. JOB MENSUAL - Limpieza y actualización completa
echo "🧹 Creando job mensual de limpieza..."
gcloud scheduler jobs create pubsub monthly-cleanup-job \
  --location=$REGION \
  --schedule="0 2 1 * *" \
  --topic="wearecity-scraping-schedule" \
  --message-body='{"operation":"monthly_cleanup","cities":["valencia","la-vila-joiosa","alicante"],"full_refresh":true,"timestamp":"auto"}' \
  --description="Limpieza y actualización mensual el día 1 a las 2:00 AM" \
  --project=$PROJECT_ID || echo "Job mensual ya existe"

echo "✅ Cloud Scheduler configurado exitosamente!"
echo ""
echo "📋 Jobs creados:"
echo "   • daily-scraping-job: Diario a las 6:00 AM"
echo "   • weekly-scraping-job: Lunes a las 3:00 AM"  
echo "   • monthly-cleanup-job: Día 1 del mes a las 2:00 AM"
echo ""
echo "🔗 Para ver los jobs:"
echo "   gcloud scheduler jobs list --location=$REGION --project=$PROJECT_ID"

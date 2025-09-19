#!/bin/bash

# =============================================================================
# SCRIPT DE BACKUP DE GOOGLE CLOUD (COMPLEMENTARIO)
# =============================================================================
# Este script hace backup específico usando Google Cloud SDK
# Complementa el script de Firebase para servicios que requieren gcloud
# =============================================================================

set -e

PROJECT_ID="wearecity-2ab89"
BACKUP_DIR="backup_gcloud_$(date +%Y%m%d_%H%M%S)"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "☁️ BACKUP DE GOOGLE CLOUD"
echo "=========================="
echo "📅 Fecha: $TIMESTAMP"
echo "🎯 Proyecto: $PROJECT_ID"
echo "📁 Directorio: $BACKUP_DIR"
echo ""

mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

# =============================================================================
# 1. CONFIGURAR PROYECTO
# =============================================================================
echo "⚙️ Configurando proyecto..."
gcloud config set project $PROJECT_ID

# =============================================================================
# 2. BACKUP DE FIRESTORE (EXPORTACIÓN COMPLETA)
# =============================================================================
echo ""
echo "🗄️ EXPORTACIÓN DE FIRESTORE"
echo "============================"

# Crear bucket para exportación si no existe
BUCKET_NAME="${PROJECT_ID}-backup-$(date +%Y%m%d)"
echo "📦 Creando bucket de backup: $BUCKET_NAME"

# Intentar crear bucket (puede fallar si ya existe, eso está bien)
gsutil mb gs://$BUCKET_NAME 2>/dev/null || echo "⚠️ Bucket ya existe o no se pudo crear"

# Exportar Firestore
echo "📤 Exportando Firestore..."
EXPORT_PATH="gs://$BUCKET_NAME/firestore_backup_$(date +%Y%m%d_%H%M%S)"
gcloud firestore export $EXPORT_PATH --project=$PROJECT_ID

echo "✅ Firestore exportado a: $EXPORT_PATH"

# =============================================================================
# 3. BACKUP DE AUTHENTICATION
# =============================================================================
echo ""
echo "🔐 BACKUP DE AUTHENTICATION"
echo "==========================="

# Exportar usuarios de Authentication
echo "👥 Exportando usuarios de Authentication..."
gcloud auth export auth_users_$(date +%Y%m%d_%H%M%S).csv --project=$PROJECT_ID || echo "⚠️ Error exportando usuarios"

# Obtener configuración de Identity Platform
echo "⚙️ Obteniendo configuración de Identity Platform..."
gcloud iap oauth-clients list > identity_config.txt 2>/dev/null || echo "⚠️ No hay configuración de IAP"

# =============================================================================
# 4. BACKUP DE STORAGE
# =============================================================================
echo ""
echo "💾 BACKUP DE STORAGE"
echo "===================="

# Listar todos los buckets
echo "📋 Listando buckets de Storage..."
gsutil ls -b > storage_buckets.txt

# Descargar contenido de buckets principales
echo "📥 Descargando archivos de Storage..."
mkdir -p storage_backup

# Intentar descargar de bucket principal
gsutil -m cp -r gs://$PROJECT_ID.appspot.com/* storage_backup/ 2>/dev/null || echo "⚠️ No se pudieron descargar archivos del bucket principal"

# =============================================================================
# 5. BACKUP DE CLOUD FUNCTIONS
# =============================================================================
echo ""
echo "🔧 BACKUP DE CLOUD FUNCTIONS"
echo "============================="

# Listar functions
echo "📋 Listando Cloud Functions..."
gcloud functions list > functions_list.txt

# Obtener configuración de cada function
echo "⚙️ Obteniendo configuración de Functions..."
mkdir -p functions_config
for func in $(gcloud functions list --format="value(name)"); do
    echo "📝 Obteniendo configuración de: $func"
    gcloud functions describe $func > functions_config/${func}.txt 2>/dev/null || echo "⚠️ Error obteniendo configuración de $func"
done

# =============================================================================
# 6. BACKUP DE CLOUD RUN
# =============================================================================
echo ""
echo "🏃 BACKUP DE CLOUD RUN"
echo "======================"

# Listar servicios de Cloud Run
echo "📋 Listando servicios de Cloud Run..."
gcloud run services list > cloud_run_services.txt 2>/dev/null || echo "⚠️ No hay servicios de Cloud Run"

# =============================================================================
# 7. BACKUP DE CONFIGURACIÓN DE PROYECTO
# =============================================================================
echo ""
echo "⚙️ BACKUP DE CONFIGURACIÓN"
echo "=========================="

# Información del proyecto
echo "📊 Obteniendo información del proyecto..."
gcloud projects describe $PROJECT_ID > project_info.txt

# Configuración de APIs habilitadas
echo "🔌 Listando APIs habilitadas..."
gcloud services list --enabled > enabled_apis.txt

# Configuración de IAM
echo "👥 Obteniendo configuración de IAM..."
gcloud projects get-iam-policy $PROJECT_ID > iam_policy.txt

# Configuración de billing
echo "💳 Obteniendo información de billing..."
gcloud billing projects describe $PROJECT_ID > billing_info.txt 2>/dev/null || echo "⚠️ No se pudo obtener información de billing"

# =============================================================================
# 8. BACKUP DE LOGS
# =============================================================================
echo ""
echo "📝 BACKUP DE LOGS"
echo "================="

# Logs de Cloud Functions
echo "📋 Exportando logs de Cloud Functions..."
gcloud logging read "resource.type=cloud_function" --limit=1000 > functions_logs.txt 2>/dev/null || echo "⚠️ Error obteniendo logs de functions"

# Logs de Firestore
echo "📋 Exportando logs de Firestore..."
gcloud logging read "resource.type=firestore_database" --limit=1000 > firestore_logs.txt 2>/dev/null || echo "⚠️ Error obteniendo logs de firestore"

# Logs de Authentication
echo "📋 Exportando logs de Authentication..."
gcloud logging read "resource.type=identitytoolkit.googleapis.com" --limit=1000 > auth_logs.txt 2>/dev/null || echo "⚠️ Error obteniendo logs de auth"

# =============================================================================
# 9. CREAR ARCHIVO DE RESUMEN
# =============================================================================
echo ""
echo "📋 CREANDO RESUMEN"
echo "=================="

cat > gcloud_backup_summary.txt << EOF
BACKUP DE GOOGLE CLOUD
======================

Fecha: $TIMESTAMP
Proyecto: $PROJECT_ID
Directorio: $BACKUP_DIR

CONTENIDO DEL BACKUP:
====================

📁 storage_backup/     - Archivos de Google Cloud Storage
📁 functions_config/   - Configuración de Cloud Functions
📄 firestore_buckets/  - Exportación de Firestore (en Google Cloud Storage)
📄 auth_users_*.csv    - Usuarios de Authentication
📄 project_info.txt    - Información del proyecto
📄 enabled_apis.txt    - APIs habilitadas
📄 iam_policy.txt      - Políticas de IAM
📄 billing_info.txt    - Información de billing
📄 *_logs.txt          - Logs de varios servicios
📄 functions_list.txt  - Lista de Cloud Functions
📄 cloud_run_services.txt - Servicios de Cloud Run

EXPORTACIONES EN GOOGLE CLOUD STORAGE:
======================================

Firestore: $EXPORT_PATH

NOTAS IMPORTANTES:
==================

1. Los datos de Firestore se exportan a Google Cloud Storage
2. Algunos servicios pueden requerir permisos específicos
3. Los logs están limitados a 1000 entradas por servicio
4. La información de billing puede no estar disponible

RESTAURACIÓN:
=============

Para restaurar:
1. Crear nuevo proyecto en Google Cloud
2. Importar datos de Firestore desde Google Cloud Storage
3. Recrear Cloud Functions usando la configuración guardada
4. Restaurar archivos de Storage
5. Configurar Authentication manualmente

COMANDOS DE RESTAURACIÓN:
=========================

# Restaurar Firestore:
gcloud firestore import gs://[BUCKET]/[PATH]

# Recrear Functions:
gcloud functions deploy [FUNCTION_NAME] --source=[SOURCE_PATH]

EOF

# =============================================================================
# 10. COMPRIMIR Y FINALIZAR
# =============================================================================
echo ""
echo "🗜️ COMPRIMIENDO BACKUP"
echo "======================"

cd ..
tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"
echo "✅ Backup comprimido: ${BACKUP_DIR}.tar.gz"

echo ""
echo "🎉 BACKUP DE GOOGLE CLOUD COMPLETADO"
echo "====================================="
echo "📁 Directorio: $BACKUP_DIR"
echo "🗜️ Archivo comprimido: ${BACKUP_DIR}.tar.gz"
echo "📊 Tamaño: $(du -sh ${BACKUP_DIR}.tar.gz | cut -f1)"
echo ""
echo "✅ Backup de Google Cloud finalizado exitosamente!"
echo "💾 Guarda el archivo ${BACKUP_DIR}.tar.gz en un lugar seguro"
echo "📋 Consulta gcloud_backup_summary.txt para detalles de restauración"

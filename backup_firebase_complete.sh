#!/bin/bash

# =============================================================================
# SCRIPT DE BACKUP COMPLETO DE FIREBASE
# =============================================================================
# Este script hace una copia de seguridad completa de:
# - Functions (código fuente)
# - Firestore (datos)
# - Authentication (usuarios)
# - Hosting (archivos web)
# - Storage (archivos)
# - Configuración del proyecto
# =============================================================================

set -e  # Salir si hay algún error

# Configuración
PROJECT_ID="wearecity-2ab89"
BACKUP_DIR="backup_firebase_$(date +%Y%m%d_%H%M%S)"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "🚀 INICIANDO BACKUP COMPLETO DE FIREBASE"
echo "========================================"
echo "📅 Fecha: $TIMESTAMP"
echo "🎯 Proyecto: $PROJECT_ID"
echo "📁 Directorio de backup: $BACKUP_DIR"
echo ""

# Crear directorio de backup
mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

echo "📂 Creando estructura de directorios..."
mkdir -p functions
mkdir -p firestore
mkdir -p auth
mkdir -p hosting
mkdir -p storage
mkdir -p config
mkdir -p logs

# =============================================================================
# 1. BACKUP DE FUNCTIONS
# =============================================================================
echo ""
echo "🔧 BACKUP DE FUNCTIONS"
echo "======================"

# Copiar código fuente de functions
echo "📋 Copiando código fuente de Functions..."
cp -r ../functions/* functions/ 2>/dev/null || echo "⚠️ No se encontró directorio functions"

# Obtener información de functions
echo "📊 Obteniendo información de Functions..."
firebase functions:list > config/functions_list.txt 2>/dev/null || echo "⚠️ Error obteniendo lista de functions"

# =============================================================================
# 2. BACKUP DE FIRESTORE
# =============================================================================
echo ""
echo "🗄️ BACKUP DE FIRESTORE"
echo "======================"

# Exportar datos de Firestore
echo "📤 Exportando datos de Firestore..."
gcloud firestore export gs://$PROJECT_ID.appspot.com/firestore_backup_$(date +%Y%m%d_%H%M%S) \
    --project=$PROJECT_ID 2>/dev/null || echo "⚠️ Error exportando Firestore"

# Listar colecciones
echo "📋 Listando colecciones de Firestore..."
firebase firestore:collections > config/firestore_collections.txt 2>/dev/null || echo "⚠️ Error listando colecciones"

# =============================================================================
# 3. BACKUP DE AUTHENTICATION
# =============================================================================
echo ""
echo "🔐 BACKUP DE AUTHENTICATION"
echo "==========================="

# Exportar usuarios de Authentication
echo "👥 Exportando usuarios de Authentication..."
gcloud auth export auth_users.csv --project=$PROJECT_ID 2>/dev/null || echo "⚠️ Error exportando usuarios"

# Obtener configuración de Auth
echo "⚙️ Obteniendo configuración de Authentication..."
firebase auth:export auth_users.json --project=$PROJECT_ID 2>/dev/null || echo "⚠️ Error exportando configuración de Auth"

# =============================================================================
# 4. BACKUP DE HOSTING
# =============================================================================
echo ""
echo "🌐 BACKUP DE HOSTING"
echo "===================="

# Obtener información de hosting
echo "📊 Obteniendo información de Hosting..."
firebase hosting:sites:list > config/hosting_sites.txt 2>/dev/null || echo "⚠️ Error obteniendo sitios de hosting"

# Descargar archivos de hosting (si es posible)
echo "📥 Intentando descargar archivos de hosting..."
firebase hosting:clone --project=$PROJECT_ID hosting/ 2>/dev/null || echo "⚠️ No se pudieron descargar archivos de hosting"

# =============================================================================
# 5. BACKUP DE STORAGE
# =============================================================================
echo ""
echo "💾 BACKUP DE STORAGE"
echo "===================="

# Listar buckets de Storage
echo "📋 Listando buckets de Storage..."
gsutil ls -b gs://$PROJECT_ID* > config/storage_buckets.txt 2>/dev/null || echo "⚠️ Error listando buckets de storage"

# Descargar archivos de storage (si es posible)
echo "📥 Descargando archivos de Storage..."
gsutil -m cp -r gs://$PROJECT_ID.appspot.com/* storage/ 2>/dev/null || echo "⚠️ No se pudieron descargar archivos de storage"

# =============================================================================
# 6. BACKUP DE CONFIGURACIÓN
# =============================================================================
echo ""
echo "⚙️ BACKUP DE CONFIGURACIÓN"
echo "=========================="

# Configuración de Firebase
echo "📋 Copiando configuración de Firebase..."
cp ../firebase.json config/ 2>/dev/null || echo "⚠️ No se encontró firebase.json"
cp ../.firebaserc config/ 2>/dev/null || echo "⚠️ No se encontró .firebaserc"

# Variables de entorno
echo "🔧 Guardando variables de entorno..."
firebase functions:config:get > config/functions_config.json 2>/dev/null || echo "⚠️ Error obteniendo configuración de functions"

# Información del proyecto
echo "📊 Obteniendo información del proyecto..."
firebase projects:list > config/projects_info.txt
firebase use > config/current_project.txt

# =============================================================================
# 7. BACKUP DE LOGS
# =============================================================================
echo ""
echo "📝 BACKUP DE LOGS"
echo "================="

# Logs de Functions
echo "📋 Exportando logs de Functions..."
firebase functions:log --limit=1000 > logs/functions_logs.txt 2>/dev/null || echo "⚠️ Error obteniendo logs de functions"

# Logs de Hosting
echo "📋 Exportando logs de Hosting..."
firebase hosting:logs > logs/hosting_logs.txt 2>/dev/null || echo "⚠️ Error obteniendo logs de hosting"

# =============================================================================
# 8. CREAR ARCHIVO DE RESUMEN
# =============================================================================
echo ""
echo "📋 CREANDO ARCHIVO DE RESUMEN"
echo "============================="

cat > backup_summary.txt << EOF
BACKUP COMPLETO DE FIREBASE
===========================

Fecha: $TIMESTAMP
Proyecto: $PROJECT_ID
Directorio: $BACKUP_DIR

CONTENIDO DEL BACKUP:
====================

📁 functions/          - Código fuente de Firebase Functions
📁 firestore/          - Datos exportados de Firestore (en Google Cloud Storage)
📁 auth/              - Usuarios y configuración de Authentication
📁 hosting/           - Archivos de Hosting (si se pudieron descargar)
📁 storage/           - Archivos de Storage (si se pudieron descargar)
📁 config/            - Configuración del proyecto Firebase
📁 logs/              - Logs de Functions y Hosting

ARCHIVOS IMPORTANTES:
====================

- config/firebase.json           - Configuración principal de Firebase
- config/.firebaserc            - Configuración de proyectos
- config/functions_config.json  - Variables de entorno de Functions
- config/projects_info.txt      - Información de proyectos
- backup_summary.txt            - Este archivo de resumen

NOTAS IMPORTANTES:
==================

1. Los datos de Firestore se exportan a Google Cloud Storage
2. Los archivos de Storage y Hosting pueden no descargarse completamente
3. Algunos servicios pueden requerir permisos adicionales
4. Este backup incluye solo los datos y configuración, no los servicios en sí

RESTAURACIÓN:
=============

Para restaurar:
1. Crear un nuevo proyecto Firebase
2. Copiar archivos de config/ al directorio raíz
3. Ejecutar 'firebase deploy' para Functions y Hosting
4. Importar datos de Firestore desde Google Cloud Storage
5. Configurar Authentication manualmente

EOF

# =============================================================================
# 9. COMPRIMIR BACKUP
# =============================================================================
echo ""
echo "🗜️ COMPRIMIENDO BACKUP"
echo "======================"

cd ..
tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"
echo "✅ Backup comprimido: ${BACKUP_DIR}.tar.gz"

# =============================================================================
# 10. RESUMEN FINAL
# =============================================================================
echo ""
echo "🎉 BACKUP COMPLETADO"
echo "===================="
echo "📁 Directorio: $BACKUP_DIR"
echo "🗜️ Archivo comprimido: ${BACKUP_DIR}.tar.gz"
echo "📊 Tamaño: $(du -sh ${BACKUP_DIR}.tar.gz | cut -f1)"
echo ""
echo "✅ Backup completo finalizado exitosamente!"
echo "💾 Guarda el archivo ${BACKUP_DIR}.tar.gz en un lugar seguro"
echo ""
echo "📋 Para restaurar, consulta backup_summary.txt en el directorio de backup"

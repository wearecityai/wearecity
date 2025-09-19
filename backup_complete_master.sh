#!/bin/bash

# =============================================================================
# SCRIPT MAESTRO DE BACKUP COMPLETO
# =============================================================================
# Este script ejecuta todos los backups en secuencia:
# 1. Backup del código fuente
# 2. Backup de Firebase
# 3. Backup de Google Cloud
# =============================================================================

set -e

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
PROJECT_ID="wearecity-2ab89"

echo "🚀 BACKUP COMPLETO DE LA APLICACIÓN"
echo "==================================="
echo "📅 Fecha: $TIMESTAMP"
echo "🎯 Proyecto: $PROJECT_ID"
echo ""

# Crear directorio maestro de backups
MASTER_BACKUP_DIR="backup_complete_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$MASTER_BACKUP_DIR"
cd "$MASTER_BACKUP_DIR"

echo "📁 Directorio maestro de backup: $MASTER_BACKUP_DIR"
echo ""

# =============================================================================
# 1. BACKUP DEL CÓDIGO FUENTE
# =============================================================================
echo "💻 EJECUTANDO BACKUP DEL CÓDIGO FUENTE"
echo "======================================="
cd ..
./backup_source_code.sh

# Mover backup del código fuente al directorio maestro
mv backup_source_*.tar.gz "$MASTER_BACKUP_DIR/"

echo "✅ Backup del código fuente completado"
echo ""

# =============================================================================
# 2. BACKUP DE FIREBASE
# =============================================================================
echo "🔥 EJECUTANDO BACKUP DE FIREBASE"
echo "================================="
./backup_firebase_complete.sh

# Mover backup de Firebase al directorio maestro
mv backup_firebase_*.tar.gz "$MASTER_BACKUP_DIR/"

echo "✅ Backup de Firebase completado"
echo ""

# =============================================================================
# 3. BACKUP DE GOOGLE CLOUD
# =============================================================================
echo "☁️ EJECUTANDO BACKUP DE GOOGLE CLOUD"
echo "===================================="
./backup_google_cloud.sh

# Mover backup de Google Cloud al directorio maestro
mv backup_gcloud_*.tar.gz "$MASTER_BACKUP_DIR/"

echo "✅ Backup de Google Cloud completado"
echo ""

# =============================================================================
# 4. CREAR ARCHIVO MAESTRO DE RESUMEN
# =============================================================================
cd "$MASTER_BACKUP_DIR"

cat > COMPLETE_BACKUP_SUMMARY.txt << EOF
BACKUP COMPLETO DE LA APLICACIÓN
================================

Fecha: $TIMESTAMP
Proyecto: $PROJECT_ID
Directorio maestro: $MASTER_BACKUP_DIR

BACKUPS REALIZADOS:
==================

1. 💻 CÓDIGO FUENTE
   - Archivo: backup_source_*.tar.gz
   - Contenido: Todo el código fuente, configuraciones, dependencias
   - Tamaño: $(du -sh backup_source_*.tar.gz 2>/dev/null | cut -f1 || echo "No disponible")

2. 🔥 FIREBASE
   - Archivo: backup_firebase_*.tar.gz
   - Contenido: Functions, Firestore, Authentication, Hosting, Storage
   - Tamaño: $(du -sh backup_firebase_*.tar.gz 2>/dev/null | cut -f1 || echo "No disponible")

3. ☁️ GOOGLE CLOUD
   - Archivo: backup_gcloud_*.tar.gz
   - Contenido: Configuración completa de Google Cloud, logs, IAM
   - Tamaño: $(du -sh backup_gcloud_*.tar.gz 2>/dev/null | cut -f1 || echo "No disponible")

ARCHIVOS INCLUIDOS:
==================

📁 backup_source_*.tar.gz    - Código fuente completo
📁 backup_firebase_*.tar.gz  - Datos y configuración de Firebase
📁 backup_gcloud_*.tar.gz    - Configuración de Google Cloud
📄 COMPLETE_BACKUP_SUMMARY.txt - Este archivo de resumen

TAMAÑO TOTAL:
=============

Total: $(du -sh . | cut -f1)

RESTAURACIÓN COMPLETA:
======================

Para restaurar completamente la aplicación:

1. 💻 RESTAURAR CÓDIGO FUENTE:
   tar -xzf backup_source_*.tar.gz
   cd backup_source_*/
   npm install
   cd functions && npm install && cd ..

2. 🔥 RESTAURAR FIREBASE:
   tar -xzf backup_firebase_*.tar.gz
   cd backup_firebase_*/
   # Seguir instrucciones en backup_summary.txt

3. ☁️ RESTAURAR GOOGLE CLOUD:
   tar -xzf backup_gcloud_*.tar.gz
   cd backup_gcloud_*/
   # Seguir instrucciones en gcloud_backup_summary.txt

4. 🚀 DESPLEGAR:
   firebase use [PROJECT_ID]
   firebase deploy

NOTAS IMPORTANTES:
==================

- Los backups están organizados por tipo de servicio
- Cada backup tiene su propio archivo de resumen
- Los datos sensibles están ocultados por seguridad
- Algunos servicios pueden requerir configuración manual

MANTENIMIENTO:
==============

- Guarda estos backups en múltiples ubicaciones
- Verifica la integridad de los archivos regularmente
- Actualiza los backups después de cambios importantes
- Documenta cualquier configuración manual adicional

EOF

# =============================================================================
# 5. COMPRIMIR TODO EL BACKUP MAESTRO
# =============================================================================
echo ""
echo "🗜️ COMPRIMIENDO BACKUP MAESTRO COMPLETO"
echo "========================================"

cd ..
tar -czf "${MASTER_BACKUP_DIR}.tar.gz" "$MASTER_BACKUP_DIR"

# =============================================================================
# 6. RESUMEN FINAL
# =============================================================================
echo ""
echo "🎉 BACKUP COMPLETO FINALIZADO"
echo "============================="
echo "📁 Directorio maestro: $MASTER_BACKUP_DIR"
echo "🗜️ Archivo maestro: ${MASTER_BACKUP_DIR}.tar.gz"
echo "📊 Tamaño total: $(du -sh ${MASTER_BACKUP_DIR}.tar.gz | cut -f1)"
echo ""
echo "✅ BACKUP COMPLETO EXITOSO!"
echo ""
echo "📋 BACKUPS INCLUIDOS:"
echo "  💻 Código fuente: $(ls -la ${MASTER_BACKUP_DIR}/backup_source_*.tar.gz 2>/dev/null | wc -l) archivo(s)"
echo "  🔥 Firebase: $(ls -la ${MASTER_BACKUP_DIR}/backup_firebase_*.tar.gz 2>/dev/null | wc -l) archivo(s)"
echo "  ☁️ Google Cloud: $(ls -la ${MASTER_BACKUP_DIR}/backup_gcloud_*.tar.gz 2>/dev/null | wc -l) archivo(s)"
echo ""
echo "💾 RECOMENDACIONES:"
echo "  1. Guarda ${MASTER_BACKUP_DIR}.tar.gz en múltiples ubicaciones"
echo "  2. Verifica la integridad del archivo"
echo "  3. Prueba la restauración en un entorno de prueba"
echo "  4. Documenta cualquier configuración manual"
echo ""
echo "📖 Para restaurar, consulta COMPLETE_BACKUP_SUMMARY.txt"
echo ""
echo "🔒 SEGURIDAD: Los datos sensibles han sido ocultados por seguridad"

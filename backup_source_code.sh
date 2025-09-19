#!/bin/bash

# =============================================================================
# SCRIPT DE BACKUP DEL CÓDIGO FUENTE
# =============================================================================
# Este script hace backup completo del código fuente de la aplicación
# Incluye todo el código, configuraciones, dependencias, etc.
# =============================================================================

set -e

BACKUP_DIR="backup_source_$(date +%Y%m%d_%H%M%S)"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "💻 BACKUP DEL CÓDIGO FUENTE"
echo "============================"
echo "📅 Fecha: $TIMESTAMP"
echo "📁 Directorio: $BACKUP_DIR"
echo ""

mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

# =============================================================================
# 1. BACKUP DEL CÓDIGO PRINCIPAL
# =============================================================================
echo "📂 Copiando código fuente principal..."
cp -r ../src ./
cp -r ../public ./
cp -r ../functions ./

# =============================================================================
# 2. BACKUP DE CONFIGURACIONES
# =============================================================================
echo "⚙️ Copiando archivos de configuración..."

# Copiar archivos que existen
for file in package.json package-lock.json tsconfig.json tailwind.config.js postcss.config.js next.config.js firebase.json .firebaserc .gitignore; do
    if [ -f "../$file" ]; then
        echo "📝 Copiando $file..."
        cp "../$file" ./
    else
        echo "⚠️ $file no encontrado, omitiendo..."
    fi
done

# =============================================================================
# 3. BACKUP DE ARCHIVOS DE ENTORNO (SIN DATOS SENSIBLES)
# =============================================================================
echo "🔧 Copiando archivos de entorno..."
mkdir -p env_backup

# Copiar .env.local sin datos sensibles
if [ -f "../.env.local" ]; then
    echo "📝 Procesando .env.local..."
    # Crear versión sin datos sensibles
    sed 's/=.*/=***HIDDEN***/g' ../.env.local > env_backup/.env.local.template
fi

# Copiar otros archivos de entorno
for env_file in ../.env*; do
    if [ -f "$env_file" ]; then
        filename=$(basename "$env_file")
        echo "📝 Copiando $filename..."
        sed 's/=.*/=***HIDDEN***/g' "$env_file" > "env_backup/${filename}.template"
    fi
done

# =============================================================================
# 4. BACKUP DE DOCUMENTACIÓN
# =============================================================================
echo "📚 Copiando documentación..."
mkdir -p docs
cp ../README.md docs/ 2>/dev/null || echo "⚠️ No se encontró README.md"
cp ../CHANGELOG.md docs/ 2>/dev/null || echo "⚠️ No se encontró CHANGELOG.md"
find .. -name "*.md" -not -path "../node_modules/*" -exec cp {} docs/ \; 2>/dev/null || echo "⚠️ No se encontraron archivos .md"

# =============================================================================
# 5. BACKUP DE SCRIPTS
# =============================================================================
echo "🔧 Copiando scripts..."
mkdir -p scripts
find .. -name "*.sh" -not -path "../node_modules/*" -exec cp {} scripts/ \; 2>/dev/null || echo "⚠️ No se encontraron scripts .sh"
find .. -name "*.js" -not -path "../node_modules/*" -not -path "../src/*" -not -path "../functions/*" -exec cp {} scripts/ \; 2>/dev/null || echo "⚠️ No se encontraron scripts .js"

# =============================================================================
# 6. INFORMACIÓN DEL SISTEMA
# =============================================================================
echo "💻 Recopilando información del sistema..."
mkdir -p system_info

# Información de Node.js
node --version > system_info/node_version.txt
npm --version > system_info/npm_version.txt

# Información de Firebase
firebase --version > system_info/firebase_version.txt 2>/dev/null || echo "Firebase CLI no disponible" > system_info/firebase_version.txt

# Información de Google Cloud
gcloud version > system_info/gcloud_version.txt 2>/dev/null || echo "Google Cloud CLI no disponible" > system_info/gcloud_version.txt

# Información del sistema
uname -a > system_info/system_info.txt
lsb_release -a > system_info/linux_distro.txt 2>/dev/null || echo "No es un sistema Linux" > system_info/linux_distro.txt

# =============================================================================
# 7. LISTADO DE DEPENDENCIAS
# =============================================================================
echo "📦 Analizando dependencias..."
mkdir -p dependencies

# Dependencias principales
npm list --depth=0 > dependencies/main_dependencies.txt 2>/dev/null || echo "Error obteniendo dependencias principales" > dependencies/main_dependencies.txt

# Dependencias de functions
if [ -d "functions" ]; then
    cd functions
    npm list --depth=0 > ../dependencies/functions_dependencies.txt 2>/dev/null || echo "Error obteniendo dependencias de functions" > ../dependencies/functions_dependencies.txt
    cd ..
fi

# =============================================================================
# 8. BACKUP DE CONFIGURACIONES DE DESARROLLO
# =============================================================================
echo "🛠️ Copiando configuraciones de desarrollo..."
mkdir -p dev_config

# Configuraciones de VS Code
if [ -d "../.vscode" ]; then
    cp -r ../.vscode dev_config/
fi

# Configuraciones de ESLint, Prettier, etc.
for config_file in ../.eslintrc* ../.prettierrc* ../tsconfig*.json; do
    if [ -f "$config_file" ]; then
        filename=$(basename "$config_file")
        cp "$config_file" "dev_config/$filename"
    fi
done

# =============================================================================
# 9. CREAR ARCHIVO DE RESUMEN
# =============================================================================
echo ""
echo "📋 CREANDO RESUMEN DEL BACKUP"
echo "=============================="

cat > source_backup_summary.txt << EOF
BACKUP DEL CÓDIGO FUENTE
========================

Fecha: $TIMESTAMP
Directorio: $BACKUP_DIR

CONTENIDO DEL BACKUP:
====================

📁 src/                    - Código fuente de la aplicación React/Next.js
📁 public/                 - Archivos públicos (imágenes, favicon, etc.)
📁 functions/              - Código de Firebase Functions
📁 docs/                   - Documentación (README, CHANGELOG, etc.)
📁 scripts/                - Scripts de automatización
📁 env_backup/             - Plantillas de archivos de entorno (sin datos sensibles)
📁 system_info/            - Información del sistema y versiones
📁 dependencies/           - Lista de dependencias
📁 dev_config/             - Configuraciones de desarrollo

ARCHIVOS DE CONFIGURACIÓN:
==========================

- package.json              - Dependencias principales
- package-lock.json         - Lockfile de dependencias
- tsconfig.json            - Configuración de TypeScript
- tailwind.config.js       - Configuración de Tailwind CSS
- firebase.json            - Configuración de Firebase
- .firebaserc              - Configuración de proyectos Firebase
- next.config.js           - Configuración de Next.js

NOTAS IMPORTANTES:
==================

1. Los archivos .env contienen plantillas sin datos sensibles
2. node_modules NO está incluido (se puede reinstalar con npm install)
3. Se incluye información del sistema para facilitar la restauración
4. Las dependencias están listadas para verificación

RESTAURACIÓN:
=============

Para restaurar el código:
1. Crear nuevo directorio de proyecto
2. Copiar todos los archivos del backup
3. Ejecutar 'npm install' para reinstalar dependencias
4. Configurar variables de entorno
5. Ejecutar 'firebase deploy' para desplegar

COMANDOS DE RESTAURACIÓN:
=========================

# Instalar dependencias
npm install

# Instalar dependencias de functions
cd functions && npm install && cd ..

# Configurar Firebase
firebase use [PROJECT_ID]

# Desplegar
firebase deploy

# Verificar sistema
node --version
npm --version
firebase --version

EOF

# =============================================================================
# 10. COMPRIMIR BACKUP
# =============================================================================
echo ""
echo "🗜️ COMPRIMIENDO BACKUP"
echo "======================"

cd ..
tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"
echo "✅ Backup comprimido: ${BACKUP_DIR}.tar.gz"

# =============================================================================
# 11. RESUMEN FINAL
# =============================================================================
echo ""
echo "🎉 BACKUP DEL CÓDIGO FUENTE COMPLETADO"
echo "======================================="
echo "📁 Directorio: $BACKUP_DIR"
echo "🗜️ Archivo comprimido: ${BACKUP_DIR}.tar.gz"
echo "📊 Tamaño: $(du -sh ${BACKUP_DIR}.tar.gz | cut -f1)"
echo ""
echo "✅ Backup del código fuente finalizado exitosamente!"
echo "💾 Guarda el archivo ${BACKUP_DIR}.tar.gz en un lugar seguro"
echo "📋 Consulta source_backup_summary.txt para detalles de restauración"
echo ""
echo "🔒 NOTA: Los datos sensibles de .env han sido ocultados por seguridad"
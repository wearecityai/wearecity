#!/bin/bash

# 🧠 Script para iniciar el Sistema de IA Auto-Aprendizaje
# Este script inicia el sistema que permite que la IA aprenda automáticamente
# a explicar trámites de ayuntamientos usando MCPs

echo "🧠 Iniciando Sistema de IA Auto-Aprendizaje..."
echo "================================================"

# Verificar que estamos en el directorio correcto
if [ ! -f "mcp/ai-auto-learning-system.js" ]; then
    echo "❌ Error: No se encuentra el archivo ai-auto-learning-system.js"
    echo "   Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    echo "   Instala Node.js desde https://nodejs.org/"
    exit 1
fi

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Verificar que @supabase/supabase-js esté instalado
if [ ! -d "node_modules/@supabase" ]; then
    echo "📦 Instalando @supabase/supabase-js..."
    npm install @supabase/supabase-js
fi

# Hacer ejecutable el script
chmod +x mcp/ai-auto-learning-system.js

echo "✅ Dependencias verificadas"
echo "🚀 Iniciando sistema de auto-aprendizaje..."
echo ""
echo "📝 Comandos disponibles:"
echo "  learn <ciudad> <tipo_trámite> - Aprender nuevo procedimiento"
echo "  list [ciudad] - Listar procedimientos aprendidos"
echo "  search <tipo_trámite> - Buscar procedimientos por tipo"
echo "  stats - Mostrar estadísticas de aprendizaje"
echo "  help - Mostrar ayuda completa"
echo ""
echo "🎯 Ejemplos de uso:"
echo "  learn \"la vila joiosa\" empadronamiento"
echo "  learn \"finestrat\" licencia_comercial"
echo "  list \"la vila joiosa\""
echo "  search empadronamiento"
echo ""

# Iniciar el sistema
node mcp/ai-auto-learning-system.js

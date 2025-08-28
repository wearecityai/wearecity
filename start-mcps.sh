#!/bin/bash

# Script para iniciar los MCPs de Firebase y Browser View
echo "🚀 Iniciando MCPs para City Chat..."

# Verificar que estemos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Verificar que las dependencias estén instaladas
echo "📦 Verificando dependencias MCP..."
if ! npm list @gannonh/firebase-mcp &> /dev/null; then
    echo "❌ Firebase MCP no está instalado. Instalando..."
    npm install @gannonh/firebase-mcp
fi

if ! npm list @browsermcp/mcp &> /dev/null; then
    echo "❌ Browser MCP no está instalado. Instalando..."
    npm install @browsermcp/mcp
fi

if ! npm list google-cloud-mcp &> /dev/null; then
    echo "❌ Google Cloud MCP no está instalado. Instalando..."
    npm install google-cloud-mcp
fi

echo "✅ Dependencias MCP verificadas"

# Verificar variables de entorno
echo "🔍 Verificando variables de entorno..."
if [ -z "$VITE_FIREBASE_PROJECT_ID" ]; then
    echo "⚠️  VITE_FIREBASE_PROJECT_ID no está configurada"
    echo "   Configúrala en tu archivo .env"
fi

if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "⚠️  GOOGLE_APPLICATION_CREDENTIALS no está configurada"
    echo "   Configúrala en tu archivo .env para acceso completo a Firebase"
fi

# Función para iniciar Firebase MCP
start_firebase_mcp() {
    echo "🔥 Iniciando Firebase MCP..."
    npx @gannonh/firebase-mcp &
    FIREBASE_MCP_PID=$!
    echo "   Firebase MCP iniciado con PID: $FIREBASE_MCP_PID"
}

# Función para iniciar Browser MCP
start_browser_mcp() {
    echo "🌐 Iniciando Browser MCP..."
    npx @browsermcp/mcp &
    BROWSER_MCP_PID=$!
    echo "   Browser MCP iniciado con PID: $BROWSER_MCP_PID"
}

# Función para iniciar Google Cloud MCP
start_google_cloud_mcp() {
    echo "☁️  Iniciando Google Cloud MCP..."
    npx google-cloud-mcp &
    GOOGLE_CLOUD_MCP_PID=$!
    echo "   Google Cloud MCP iniciado con PID: $GOOGLE_CLOUD_MCP_PID"
}

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo MCPs..."
    
    if [ ! -z "$FIREBASE_MCP_PID" ]; then
        kill $FIREBASE_MCP_PID 2>/dev/null
        echo "   Firebase MCP detenido"
    fi
    
    if [ ! -z "$BROWSER_MCP_PID" ]; then
        kill $BROWSER_MCP_PID 2>/dev/null
        echo "   Browser MCP detenido"
    fi
    
    if [ ! -z "$GOOGLE_CLOUD_MCP_PID" ]; then
        kill $GOOGLE_CLOUD_MCP_PID 2>/dev/null
        echo "   Google Cloud MCP detenido"
    fi
    
    echo "✅ Todos los MCPs han sido detenidos"
    exit 0
}

# Configurar trap para limpiar procesos al salir
trap cleanup SIGINT SIGTERM

# Iniciar MCPs
echo ""
echo "🚀 Iniciando todos los MCPs..."

start_firebase_mcp
start_browser_mcp
start_google_cloud_mcp

echo ""
echo "🎉 Todos los MCPs han sido iniciados!"
echo ""
echo "📱 Ahora puedes usar el componente MCPManager en tu aplicación:"
echo "   import { MCPManager } from './components/MCPManager';"
echo ""
echo "🔧 Para detener los MCPs, presiona Ctrl+C"
echo "📊 Para ver el estado, usa el componente MCPManager"
echo ""
echo "📚 Documentación:"
echo "   - Firebase MCP: https://www.npmjs.com/package/@gannonh/firebase-mcp"
echo "   - Browser MCP: https://www.npmjs.com/package/@browsermcp/mcp"
echo "   - Google Cloud MCP: https://www.npmjs.com/package/google-cloud-mcp"

# Mantener el script ejecutándose
echo ""
echo "⏳ MCPs ejecutándose... Presiona Ctrl+C para detener"
wait

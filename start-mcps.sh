#!/bin/bash

# Script para iniciar los servidores MCP (HERRAMIENTAS PARA IA)
echo "🤖 Iniciando servidores MCP para herramientas de IA..."
echo "🔧 Los MCPs permiten que la IA acceda a servicios de terceros"
echo "   (Google Cloud, Firebase, Browser, etc.)"
echo ""

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor, instálalo primero."
    exit 1
fi

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor, instálalo primero."
    exit 1
fi

# Instalar dependencias si no están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Función para iniciar un servidor MCP en background
start_mcp_server() {
    local name=$1
    local command=$2
    local port=$3
    local env_vars=$4
    
    echo "🔄 Iniciando $name en puerto $port..."
    
    # Matar proceso existente si existe
    pkill -f "$name" 2>/dev/null || true
    
    # Iniciar servidor en background con variables de entorno si se proporcionan
    if [ -n "$env_vars" ]; then
        nohup env $env_vars $command > "logs/${name}.log" 2>&1 &
    else
        nohup $command > "logs/${name}.log" 2>&1 &
    fi
    local pid=$!
    
    # Esperar un poco para verificar que se inició correctamente
    sleep 2
    
    if ps -p $pid > /dev/null; then
        echo "✅ $name iniciado correctamente (PID: $pid)"
        echo $pid > "logs/${name}.pid"
    else
        echo "❌ Error iniciando $name"
        return 1
    fi
}

# Crear directorio de logs si no existe
mkdir -p logs

# Iniciar servidores MCP
echo "🔧 Iniciando servidores MCP..."

# Supabase MCP - Using environment variables
export SUPABASE_URL="https://irghpvvoparqettcnpnh.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc2Mjk2NiwiZXhwIjoyMDY2MzM4OTY2fQ.YourServiceRoleKeyHere"
export MCP_API_KEY="dev-mcp-key-123"
start_mcp_server "supabase-mcp" "npx supabase-mcp" 3001

# Browser MCP
start_mcp_server "browser-mcp" "npx @browsermcp/mcp" 3002

# Google Cloud MCP
start_mcp_server "google-cloud-mcp" "node node_modules/google-cloud-mcp/dist/index.js" 3003 "GOOGLE_CLOUD_PROJECT=wearecity"

echo ""
echo "🎉 Todos los servidores MCP han sido iniciados!"
echo ""
echo "🤖 Herramientas disponibles para la IA:"
echo "  - Supabase MCP: http://localhost:3001 (Base de datos)"
echo "  - Browser MCP: http://localhost:3002 (Navegación web)"
echo "  - Google Cloud MCP: http://localhost:3003 (Servicios Google)"
echo ""
echo "📝 Logs disponibles en la carpeta 'logs/'"
echo ""
echo "🔧 La IA ahora puede acceder a estos servicios para ayudarte mejor"
echo "   con tareas que requieren integración con servicios de terceros"
echo ""
echo "🛑 Para detener todos los servidores, ejecuta: ./stop-mcps.sh"

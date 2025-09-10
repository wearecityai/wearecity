#!/bin/bash

# Script para detener los servidores MCP
echo "🛑 Deteniendo servidores MCP..."

# Función para detener un servidor MCP
stop_mcp_server() {
    local name=$1
    
    if [ -f "logs/${name}.pid" ]; then
        local pid=$(cat "logs/${name}.pid")
        if ps -p $pid > /dev/null; then
            echo "🔄 Deteniendo $name (PID: $pid)..."
            kill $pid
            rm "logs/${name}.pid"
            echo "✅ $name detenido"
        else
            echo "⚠️  $name ya estaba detenido"
            rm "logs/${name}.pid"
        fi
    else
        echo "⚠️  No se encontró PID para $name"
    fi
}

# Detener servidores MCP
stop_mcp_server "supabase-mcp"
stop_mcp_server "browser-mcp"
stop_mcp_server "google-cloud-mcp"
stop_mcp_server "firebase-mcp"

# También matar procesos por nombre por si acaso
pkill -f "supabase-mcp" 2>/dev/null || true
pkill -f "browser-mcp" 2>/dev/null || true
pkill -f "google-cloud-mcp" 2>/dev/null || true
pkill -f "firebase-mcp" 2>/dev/null || true

echo ""
echo "🎉 Todos los servidores MCP han sido detenidos!"
